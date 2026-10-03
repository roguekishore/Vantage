package com.backend.springapp.experiments;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExperimentHasherTest {

	private static final String K = ExperimentHasher.FIRST_FINISHER_ENDS;

	/** Vectors computed once with Python hashlib (independent of this code). */
	@Test
	void frozenVectors() {
		assertEquals(8314, ExperimentHasher.bucket(K, 1L));
		assertEquals(2444, ExperimentHasher.bucket(K, 2L));
		assertEquals(1932, ExperimentHasher.bucket(K, 42L));
		assertEquals(4295, ExperimentHasher.bucket(K, 1000L));
		assertEquals(6912, ExperimentHasher.bucket(K, 987654321L));
	}

	@Test
	void variantThreshold() {
		assertEquals("treatment", ExperimentHasher.variant(K, 2L, 5000));
		assertEquals("control", ExperimentHasher.variant(K, 1L, 5000));
		assertEquals("control", ExperimentHasher.variant(K, 2L, 2444)); // bucket < bps is strict
		assertEquals("treatment", ExperimentHasher.variant(K, 2L, 2445));
	}

	@Test
	void splitIsAboutHalfOver10000Ids() {
		int treatment = 0;
		for (long id = 1; id <= 10_000; id++) {
			if (ExperimentHasher.variant(K, id, 5000).equals("treatment")) treatment++;
		}
		assertEquals(5054, treatment); // matches the independent Python count
		assertTrue(Math.abs(treatment - 5000) <= 200);
	}
}
