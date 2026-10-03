package com.backend.springapp.experiments;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/** Pure bucketing function: first 8 bytes of SHA-256("key:" + battleId) as an unsigned long, mod 10000. */
public final class ExperimentHasher {

    public static final String FIRST_FINISHER_ENDS = "first-finisher-ends";
    public static final String CONTROL = "control";
    public static final String TREATMENT = "treatment";

    private ExperimentHasher() {
    }

    public static int bucket(String experimentKey, long battleId) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256")
                    .digest((experimentKey + ":" + battleId).getBytes(StandardCharsets.UTF_8));
            long v = 0;
            for (int i = 0; i < 8; i++) {
                v = (v << 8) | (d[i] & 0xFFL);
            }
            return (int) Long.remainderUnsigned(v, 10000L);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public static String variant(String experimentKey, long battleId, int allocationBps) {
        return bucket(experimentKey, battleId) < allocationBps ? TREATMENT : CONTROL;
    }
}
