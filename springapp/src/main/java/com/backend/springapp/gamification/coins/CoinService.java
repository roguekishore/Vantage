package com.backend.springapp.gamification.coins;

import com.backend.springapp.gamification.PlayerStats;
import com.backend.springapp.gamification.PlayerStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles all coin credit / debit operations and coin-history queries.
 * <p>
 * Every coin movement is atomically recorded as a {@link CoinTransaction}
 * so there is a complete audit trail. This is the single point of entry
 * for changing a user's coin balance.
 * <p>
 * External callers (e.g. {@link com.backend.springapp.store.StoreService})
 * go through {@link com.backend.springapp.gamification.GamificationService},
 * which acts as a façade and delegates here.
 */
@Service
@RequiredArgsConstructor
public class CoinService {

    private final PlayerStatsRepository statsRepository;
    private final CoinTransactionRepository txRepository;

    /* ═══════════════════════════════════════════════════════════
     * CREDIT / DEBIT
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Adds {@code amount} coins to the user's balance and logs a transaction.
     *
     * @throws IllegalArgumentException if {@code amount ≤ 0}
     */
    @Transactional
    public void creditCoins(Long userId, int amount, TransactionSource source, Long referenceId) {
        if (amount <= 0) throw new IllegalArgumentException("Credit amount must be positive");
        PlayerStats stats = getOrCreateStats(userId);
        stats.setCoins(stats.getCoins() + amount);
        statsRepository.saveAndFlush(stats);
        logTransaction(userId, amount, source, stats.getCoins(), referenceId);
    }

    /**
     * Subtracts {@code amount} coins from the user's balance and logs a transaction.
     *
     * @throws IllegalArgumentException   if {@code amount ≤ 0}
     * @throws InsufficientCoinsException if the user has fewer coins than {@code amount}
     */
    @Transactional
    public void debitCoins(Long userId, int amount, TransactionSource source, Long referenceId) {
        if (amount <= 0) throw new IllegalArgumentException("Debit amount must be positive");
        PlayerStats stats = getOrCreateStats(userId);
        if (stats.getCoins() < amount) {
            throw new InsufficientCoinsException(
                "Insufficient coins: have " + stats.getCoins() + ", need " + amount);
        }
        stats.setCoins(stats.getCoins() - amount);
        statsRepository.saveAndFlush(stats);
        logTransaction(userId, -amount, source, stats.getCoins(), referenceId);
    }

    /* ═══════════════════════════════════════════════════════════
     * HISTORY
     * ═══════════════════════════════════════════════════════════ */

    /**
     * Returns a paginated, most-recent-first list of coin transactions for the user.
     */
    public Page<CoinHistoryDTO> getCoinHistory(Long userId, Pageable pageable) {
        return txRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(tx -> new CoinHistoryDTO(
                    tx.getId(),
                    tx.getAmount(),
                    tx.getSource().name(),
                    tx.getBalanceAfter(),
                    tx.getReferenceId(),
                    tx.getCreatedAt()
                ));
    }

    /* ═══════════════════════════════════════════════════════════
     * INTERNAL HELPERS
     * ═══════════════════════════════════════════════════════════ */

    private void logTransaction(Long userId, int amount, TransactionSource source,
                                int balanceAfter, Long referenceId) {
        CoinTransaction tx = new CoinTransaction();
        tx.setUserId(userId);
        tx.setAmount(amount);
        tx.setSource(source);
        tx.setBalanceAfter(balanceAfter);
        tx.setReferenceId(referenceId);
        txRepository.saveAndFlush(tx);
    }

    /**
     * Returns the player's stats, creating a fresh row if none exists yet.
     * Used internally before reading or modifying the coin balance.
     */
    @Transactional
    public PlayerStats getOrCreateStats(Long userId) {
        return statsRepository.findByUserId(userId).orElseGet(() -> {
            PlayerStats fresh = new PlayerStats();
            fresh.setUserId(userId);
            return statsRepository.saveAndFlush(fresh);
        });
    }
}
