package com.backend.springapp.judge.queue;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.DeleteMessageRequest;
import software.amazon.awssdk.services.sqs.model.Message;
import software.amazon.awssdk.services.sqs.model.ReceiveMessageRequest;

import java.util.ArrayList;
import java.util.List;

/**
 * `consumers` long-polling threads. The thread count is the concurrency cap on the judge (D4). Starts only when the
 * queue is enabled, and can be stopped and started again (the IT uses that to simulate a dead consumer).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JudgeQueueConsumer implements SmartLifecycle {

    private final JudgeQueueSettings settings;
    private final SqsClientHolder sqs;
    private final JudgeJobProcessor processor;
    private final ObjectMapper mapper;

    private volatile boolean running;
    private final List<Thread> threads = new ArrayList<>();

    @Override
    public synchronized void start() {
        if (running || !settings.isEnabled()) return;
        running = true;
        for (int i = 0; i < settings.getConsumers(); i++) {
            Thread t = new Thread(this::loop, "judge-consumer-" + i);
            t.setDaemon(true);
            threads.add(t);
            t.start();
        }
        log.info("Judge queue consumers started: {} threads", settings.getConsumers());
    }

    @Override
    public synchronized void stop() {
        running = false;
        threads.forEach(Thread::interrupt);
        for (Thread t : threads) {
            try {
                t.join(25_000); // a long poll may be in flight
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        threads.clear();
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    private void loop() {
        SqsClient client = sqs.get();
        while (running) {
            try {
                List<Message> messages = client.receiveMessage(ReceiveMessageRequest.builder()
                        .queueUrl(settings.getUrl())
                        .maxNumberOfMessages(1)
                        .waitTimeSeconds(20)
                        .visibilityTimeout(settings.getVisibilitySeconds())
                        .build()).messages();
                for (Message m : messages) handle(client, m);
            } catch (Exception e) {
                if (!running) return;
                log.warn("Judge queue poll failed: {}", e.getMessage());
                pause(2000);
            }
        }
    }

    private void handle(SqsClient client, Message m) {
        try {
            JsonNode body = mapper.readTree(m.body());
            if (processor.process(body.path("jobId").asLong())) {
                client.deleteMessage(DeleteMessageRequest.builder()
                        .queueUrl(settings.getUrl()).receiptHandle(m.receiptHandle()).build());
            }
        } catch (Exception e) {
            // Not deleted: SQS redelivers after the visibility timeout; the claim guard makes that safe.
            log.error("Judge message {} failed, will be redelivered: {}", m.messageId(), e.toString());
        }
    }

    private static void pause(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
