package com.backend.springapp.judge.queue;

import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.SqsClientBuilder;

import java.net.URI;

/**
 * Builds the SQS client on first use, and only when the queue is enabled, so a disabled app never touches SQS
 * (no client, no credentials lookup). Lazy rather than @ConditionalOnProperty so the flag is read at runtime even in
 * a native image, where conditions are frozen at build time.
 */
@Component
public class SqsClientHolder implements AutoCloseable {

    private final JudgeQueueSettings settings;
    private volatile SqsClient client;

    public SqsClientHolder(JudgeQueueSettings settings) {
        this.settings = settings;
    }

    public SqsClient get() {
        SqsClient c = client;
        if (c == null) {
            synchronized (this) {
                if (client == null) client = build();
                c = client;
            }
        }
        return c;
    }

    private SqsClient build() {
        SqsClientBuilder b = SqsClient.builder()
                .region(Region.of(settings.getRegion()))
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .credentialsProvider(DefaultCredentialsProvider.builder().build());
        if (settings.getEndpoint() != null && !settings.getEndpoint().isBlank()) {
            b.endpointOverride(URI.create(settings.getEndpoint()));
        }
        return b.build();
    }

    @Override
    public void close() {
        if (client != null) client.close();
    }
}
