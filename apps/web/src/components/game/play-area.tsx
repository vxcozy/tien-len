'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard } from '../card/playing-card';
import type { Combination } from '@tienlen/shared';

interface PlayAreaProps {
  combination: Combination | null;
  lastPlayedBy: string | null;
  playerNames: Record<string, string>;
}

const BOMB_TYPES = new Set(['quad', 'threePairBomb', 'fourPairBomb']);

export function PlayArea({ combination, lastPlayedBy, playerNames }: PlayAreaProps) {
  const isBomb = combination ? BOMB_TYPES.has(combination.type) : false;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      {/* Bright yellow spotlight behind cards */}
      {combination && (
        <div className="absolute inset-0 -m-8 rounded-full bg-yellow-400/[0.06] blur-xl pointer-events-none" />
      )}

      <AnimatePresence mode="wait">
        {combination ? (
          <motion.div
            key={combination.highCard.id}
            className={`flex items-center gap-1 ${isBomb ? 'animate-bomb-shake' : ''}`}
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {combination.cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ y: 40, opacity: 0, rotate: -5 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  rotate: (i - (combination.cards.length - 1) / 2) * 3,
                }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
              >
                <PlayingCard rank={card.rank} suit={card.suit} size="xl" />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="w-28 h-20 rounded-xl border-2 border-dashed border-yellow-400/20
              flex flex-col items-center justify-center gap-1 bg-yellow-400/[0.03]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-8 h-11 rounded-md border border-yellow-400/20" />
            <span className="text-[10px] text-yellow-300/40 font-bold font-brush tracking-wide">Your Lead!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last played by label */}
      {lastPlayedBy && (
        <motion.p
          className="text-center text-[10px] text-yellow-200/70 mt-1 font-bold font-brush"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {playerNames[lastPlayedBy] ?? lastPlayedBy}
        </motion.p>
      )}
    </div>
  );
}
