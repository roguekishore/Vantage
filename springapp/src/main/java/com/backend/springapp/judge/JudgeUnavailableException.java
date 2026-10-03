package com.backend.springapp.judge;

import org.springframework.web.client.RestClientException;

/**
 * The judge (or the catalog it needs) could not be reached or answered with a server error: timeout, connection
 * failure, 5xx or an empty body. This is an infrastructure problem, never a verdict, so callers must not record it
 * as a RUNTIME_ERROR. It extends RestClientException so existing callers that catch that keep working.
 */
public class JudgeUnavailableException extends RestClientException {
    public JudgeUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
