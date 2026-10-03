package com.example.datn.modules.vocabulary.exception;

import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;

@RestControllerAdvice(basePackages = "com.example.datn.modules.vocabulary")
public class VocabularyExceptionHandler {

    @ExceptionHandler({
            TopicNotFoundException.class,
            VocabularyNotFoundException.class,
            ListNotFoundException.class,
            GameNotFoundException.class})
    public ResponseEntity<ApiErrorResponse> handleNotFound(RuntimeException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiErrorResponse(Instant.now(), 404, exception.getMessage()));
    }

    @ExceptionHandler({
            InvalidSessionRequestException.class,
            InvalidListWordsException.class,
            InvalidPlayTokenException.class,
            InvalidGameAnswerException.class})
    public ResponseEntity<ApiErrorResponse> handleInvalidRequest(RuntimeException exception) {
        return badRequest(exception.getMessage());
    }

    @ExceptionHandler({ConcurrentReviewException.class, WordAlreadyInListException.class, DuplicateListNameException.class})
    public ResponseEntity<ApiErrorResponse> handleConflict(RuntimeException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiErrorResponse(Instant.now(), 409, exception.getMessage()));
    }

    /** A body that is not valid JSON or has a value of the wrong type, such as {@code "result": "MAYBE"}. */
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

    /** A query parameter that cannot be converted, such as {@code level=Z9} or {@code page=abc}. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        return badRequest(exception.getName() + ": invalid value '" + exception.getValue() + "'");
    }

    /** A query parameter outside its constraints, such as {@code size=500}. */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleParameterValidation(HandlerMethodValidationException exception) {
        String message = exception.getAllErrors().stream()
                .findFirst()
                .map(MessageSourceResolvable::getDefaultMessage)
                .orElse("Request validation failed");
        return badRequest(message);
    }

    private static ResponseEntity<ApiErrorResponse> badRequest(String message) {
        return ResponseEntity.badRequest().body(new ApiErrorResponse(Instant.now(), 400, message));
    }
}
