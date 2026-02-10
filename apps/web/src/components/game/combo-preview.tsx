'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { combinationLabel } from '@tienlen/engine';
import type { Combination } from '@tienlen/shared';

interface ComboPreviewProps {
  combination: Combination | null;
}

export function ComboPreview({ combination }: ComboPreviewProps) {
  return (
    <AnimatePresence mode="wait">
      {combination && (
        <motion.p
          key={combination.type + combination.highCard.id}
          className="text-xs font-black font-brush text-yellow-300 text-center tracking-wide"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
        >
          {combinationLabel(combination)}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
