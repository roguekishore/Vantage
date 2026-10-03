package com.backend.springapp.judge.queue;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

/** Sends {"v":1,"jobId":N}. Sent after the DB commit, so a consumer can never see a message for a job that is not there yet. */
@Slf4j
@Component
@RequiredArgsConstructor
public class JudgeJobProducer {

    private final SqsClientHolder sqs;
    private final JudgeQueueSettings settings;

    /** Call inside the transaction that inserts the job. A failed send is only logged: the job stays QUEUED and the requeuer retries it. */
    public void sendAfterCommit(long jobId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                send(jobId);
            }
        });
    }

    /** @return true if SQS accepted the message. */
    public boolean send(long jobId) {
        try {
            sqs.get().sendMessage(SendMessageRequest.builder()
                    .queueUrl(settings.getUrl())
                    .messageBody("{\"v\":1,\"jobId\":" + jobId + "}")
                    .build());
            return true;
        } catch (Exception e) {
            log.warn("SQS send failed for judge job {} (stays QUEUED, requeuer will retry): {}", jobId, e.getMessage());
            return false;
        }
    }
}
