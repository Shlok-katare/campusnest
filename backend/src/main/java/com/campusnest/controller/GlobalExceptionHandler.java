package com.campusnest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/** Gives every error the same JSON shape: { status, message, errors }. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    public record ApiError(int status, String message, Map<String, String> errors) {
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> errors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError(400, "Please fix the highlighted fields.", errors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(new ApiError(400, "Malformed request body.", Map.of()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> status(ResponseStatusException ex) {
        int code = ex.getStatusCode().value();
        String message = ex.getReason() != null ? ex.getReason() : "Request failed";
        return ResponseEntity.status(code).body(new ApiError(code, message, Map.of()));
    }
}
