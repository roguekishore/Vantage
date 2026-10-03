package com.backend.springapp.realtime;

import com.backend.springapp.sse.ProgressEvent;
import com.backend.springapp.sse.ProgressEventService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RealtimePublisherFallbackTest {

    @SuppressWarnings("unchecked")
    @Test
    void redisFailureInsideAfterCommitStillDeliversLocally() {
        RealtimeRedisBridge bridge = mock(RealtimeRedisBridge.class);
        doThrow(new RuntimeException("redis down")).when(bridge).publishSse(anyLong(), any());
        ObjectProvider<RealtimeRedisBridge> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(bridge);
        ProgressEventService sse = spy(new ProgressEventService());
        RealtimePublisher publisher = new RealtimePublisher(mock(SimpMessagingTemplate.class), sse, provider);
        ProgressEvent event = new ProgressEvent(1L, "SOLVED", "two-sum", 1);

        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
        try {
            publisher.toUserSse(7L, event);
            List<TransactionSynchronization> syncs =
                    new ArrayList<>(TransactionSynchronizationManager.getSynchronizations());
            assertEquals(1, syncs.size());
            syncs.forEach(TransactionSynchronization::afterCommit); // still "transactional" here, as in real commit
            // delivered now, not deferred into a synchronization that would never fire
            verify(sse).deliverLocalNow(7L, event);
            assertEquals(1, TransactionSynchronizationManager.getSynchronizations().size());
        } finally {
            TransactionSynchronizationManager.setActualTransactionActive(false);
            TransactionSynchronizationManager.clearSynchronization();
        }
    }
}
