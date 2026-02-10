'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface TurnIndicatorProps {
  playerName: string;
  isMyTurn: boolean;
}

export function TurnIndicator({ playerName, isMyTurn }: TurnIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isMyTurn ? 'my-turn' : playerName}
        className={`
          inline-flex items-center gap-2 px-4 py-1.5 rounded-full
          ${isMyTurn
            ? 'bg-yellow-500/25 border-2 border-yellow-400/60 shadow-[0_0_12px_rgba(255,193,7,0.3)]'
            : 'bg-white/8 border border-white/15'
          }
        `}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isMyTurn ? 'bg-yellow-400 animate-bounce-gentle' : 'bg-white/40'
          }`}
        />
        <span
          className={`text-xs font-black font-brush tracking-wide ${
            isMyTurn ? 'text-yellow-300 drop-shadow-[0_0_4px_rgba(255,193,7,0.4)]' : 'text-text-muted'
          }`}
        >
          {isMyTurn ? 'Your Turn!' : playerName}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
