package com.example.datn.modules.test.exception;

import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;

@RestControllerAdvice(basePackages = "com.example.datn.modules.test")
public class TestExceptionHandler {

    @ExceptionHandler({
            TestNotFoundException.class,
            TestAttemptNotFoundException.class,
            TestPassageNotFoundException.class})
    public ResponseEntity<ApiErrorResponse> handleNotFound(RuntimeException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiErrorResponse(Instant.now(), 404, exception.getMessage()));
    }

    @ExceptionHandler(InvalidTestAnswerException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidAnswer(InvalidTestAnswerException exception) {
        return badRequest(exception.getMessage());
    }

    @ExceptionHandler({
            TestAttemptNotInProgressException.class,
            TestAttemptNotSubmittedException.class,
            TestRetakeNotAllowedException.class,
            ListenLimitReachedException.class})
    public ResponseEntity<ApiErrorResponse> handleConflict(RuntimeException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiErrorResponse(Instant.now(), 409, exception.getMessage()));
    }

    /** The pronunciation service is down or still loading its models: the learner records again later. */
    @ExceptionHandler(PronunciationUnavailableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnavailable(PronunciationUnavailableException exception) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiErrorResponse(Instant.now(), 503, exception.getMessage()));
    }

    /** A body that is not valid JSON or has a value of the wrong type. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableBody(HttpMessageNotReadableException exception) {
        return badRequest("Request body is not valid");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Request validation failed");
        return badRequest(message);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        return badRequest(exception.getName() + ": invalid value '" + exception.getValue() + "'");
    }

    private static ResponseEntity<ApiErrorResponse> badRequest(String message) {
        return ResponseEntity.badRequest().body(new ApiErrorResponse(Instant.now(), 400, message));
    }
}
