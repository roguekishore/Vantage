package com.backend.springapp.common;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/** Runs before {@link GlobalExceptionHandler}, whose catch-all would otherwise turn these into 500. */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ApiAuthAdvice {

    @ExceptionHandler(ApiAuthException.class)
    public ResponseEntity<Map<String, String>> handle(ApiAuthException ex) {
        return ResponseEntity.status(ex.getStatus()).body(Map.of("error", ex.getMessage()));
    }
}
