package com.backend.springapp.experiments;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/experiments")
public class ExperimentController {

    private final ExperimentService service;
    @Value("${vantage.admin.token:}")
    private String adminToken = "";

    public ExperimentController(ExperimentService service) {
        this.service = service;
    }

    /** Fails closed: a blank configured token or a missing/wrong header is a 403. */
    @GetMapping("/first-finisher-ends/report")
    public ResponseEntity<ExperimentReportDTO> report(
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (adminToken == null || adminToken.isBlank() || token == null
                || !MessageDigest.isEqual(adminToken.getBytes(StandardCharsets.UTF_8),
                token.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(service.report());
    }
}
