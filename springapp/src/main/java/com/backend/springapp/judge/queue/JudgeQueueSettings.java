package com.backend.springapp.judge.queue;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** The frozen vantage.judge.queue.* keys in one place. Read at runtime (not build time), so native images can flip the flag. */
@Component
@Getter
public class JudgeQueueSettings {

    @Value("${vantage.judge.queue.enabled:false}") private boolean enabled;
    @Value("${vantage.judge.queue.url:}") private String url;
    @Value("${vantage.judge.queue.endpoint:}") private String endpoint;
    @Value("${vantage.judge.queue.region:ap-south-1}") private String region;
    @Value("${vantage.judge.queue.consumers:4}") private int consumers;
    @Value("${vantage.judge.queue.visibility-seconds:180}") private int visibilitySeconds;
    @Value("${vantage.judge.queue.max-attempts:3}") private int maxAttempts;
    @Value("${vantage.judge.queue.lease-seconds:170}") private int leaseSeconds;
}
