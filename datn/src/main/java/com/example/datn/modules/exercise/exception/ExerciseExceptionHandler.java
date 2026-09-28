package com.example.datn.modules.exercise.exception;

import com.example.datn.common.exception.ApiErrorResponse;
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

@RestControllerAdvice(basePackages = "com.example.datn.modules.exercise")
public class ExerciseExceptionHandler {
    @ExceptionHandler({ExerciseNotFoundException.class, AttemptNotFoundException.class, ChatSessionNotFoundException.class})
    ResponseEntity<ApiErrorResponse> notFound(RuntimeException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(AttemptConflictException.class)
    ResponseEntity<ApiErrorResponse> conflict(RuntimeException exception) {
        return error(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(AiServiceUnavailableException.class)
    ResponseEntity<ApiErrorResponse> serviceUnavailable(AiServiceUnavailableException exception) {
        return error(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler({InvalidExerciseRequestException.class, HttpMessageNotReadableException.class})
    ResponseEntity<ApiErrorResponse> badRequest(Exception exception) {
        return error(HttpStatus.BAD_REQUEST, exception instanceof InvalidExerciseRequestException
                ? exception.getMessage() : "Request body is not valid");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> invalidBody(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream().findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("Request validation failed");
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, HandlerMethodValidationException.class})
    ResponseEntity<ApiErrorResponse> invalidParameter(Exception exception) {
        String message = exception instanceof HandlerMethodValidationException validation
                ? validation.getAllErrors().stream().findFirst().map(MessageSourceResolvable::getDefaultMessage)
                    .orElse("Request validation failed")
                : "Request parameter has an invalid value";
        return error(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseEntity<ApiErrorResponse> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ApiErrorResponse(Instant.now(), status.value(), message));
    }
}
