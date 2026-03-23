package com.backend.springapp.sse;

import com.backend.springapp.common.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * SSE streaming endpoint for live progress updates.
 *
 * The React client opens:
 *   new EventSource("https://<api-host>/api/progress/stream")
 *
 * Events pushed:
 *   name: "connected"        - initial heartbeat
 *   name: "progress-update"  - { pid, status, slug, attemptCount }
 */
@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressEventController {

    private final ProgressEventService progressEventService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> stream(
            @RequestParam(required = false) Long userId,
            HttpServletRequest request
    ) {
        Long resolvedUserId = userId != null ? userId : CurrentUser.resolve(request);
        if (resolvedUserId == null) {
            return ResponseEntity.status(401).build();
        }

        SseEmitter emitter = progressEventService.subscribe(resolvedUserId);

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-transform");
        headers.add(HttpHeaders.PRAGMA, "no-cache");
        headers.add("X-Accel-Buffering", "no");

        return ResponseEntity.ok()
                .headers(headers)
                .body(emitter);
    }
}
