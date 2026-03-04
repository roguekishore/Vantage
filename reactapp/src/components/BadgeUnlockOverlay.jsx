import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";

/**
 * Full-screen overlay that announces a newly unlocked badge.
 *
 * Props:
 *  - badge    : { name, description, iconUrl, coinReward, xpReward } | null
 *  - onDismiss: () => void
 *
 * Shows when `badge` is truthy; auto-dismisses after 4s or on click.
 */
export default function BadgeUnlockOverlay({ badge, onDismiss }) {
  useEffect(() => {
    if (!badge) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [badge, onDismiss]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          key="badge-overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <motion.div
            className="relative flex flex-col items-center text-center px-6"
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
          >
            {/* Glow ring */}
            <motion.div
              className="absolute w-40 h-40 rounded-full bg-[#5542FF]/20 blur-3xl"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1.2] }}
              transition={{ duration: 0.8, times: [0, 0.6, 1] }}
            />

            {/* Particle burst (decorative dots) */}
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * 360;
              const rad = (angle * Math.PI) / 180;
              return (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-[#B28EF2]"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(rad) * 100,
                    y: Math.sin(rad) * 100,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                />
              );
            })}

            {/* Badge icon */}
            <motion.div
              className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[#5542FF]/20 to-[#B28EF2]/10 border border-[#5542FF]/30 flex items-center justify-center text-5xl shadow-2xl shadow-[#5542FF]/20"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
            >
              <span role="img" aria-label={badge.name}>
                {badge.iconUrl}
              </span>
            </motion.div>

            {/* Title */}
            <motion.p
              className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-[#B28EF2]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              Badge Unlocked!
            </motion.p>

            <motion.h2
              className="mt-2 text-2xl sm:text-3xl font-bold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              {badge.name}
            </motion.h2>

            <motion.p
              className="mt-1.5 text-sm text-gray-400 max-w-xs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              {badge.description}
            </motion.p>

            {/* Reward chips */}
            <motion.div
              className="flex items-center gap-3 mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              {badge.coinReward > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400">
                  <Coins size={14} />
                  +{badge.coinReward}
                </span>
              )}
              {badge.xpReward > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#5542FF]/15 border border-[#5542FF]/25 text-[#B28EF2]">
                  <Sparkles size={14} />
                  +{badge.xpReward} XP
                </span>
              )}
            </motion.div>

            {/* Tap to dismiss hint */}
            <motion.p
              className="mt-6 text-[10px] text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Tap anywhere to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
