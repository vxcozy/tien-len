'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface BombEffectProps {
  active: boolean;
}

export function BombEffect({ active }: BombEffectProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-red-600/15"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.4, times: [0, 0.15, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
