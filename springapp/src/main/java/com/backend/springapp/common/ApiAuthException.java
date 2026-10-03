package com.backend.springapp.common;

import org.springframework.http.HttpStatus;

/** Thrown by {@link CurrentUser} and {@link AdminTokenGuard}; rendered as 401/403 by {@link ApiAuthAdvice}. */
public class ApiAuthException extends RuntimeException {

    private final HttpStatus status;

    public ApiAuthException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
