'use client';

import { motion } from 'framer-motion';
import { combinationLabel } from '@tienlen/engine';
import type { Combination } from '@tienlen/shared';

interface GameControlsProps {
  canPlay: boolean;
  canPass: boolean;
  isMyTurn: boolean;
  selectedCount: number;
  selectedCombination: Combination | null;
  onPlay: () => void;
  onPass: () => void;
  onSort: () => void;
}

export function GameControls({
  canPlay,
  canPass,
  isMyTurn,
  selectedCount,
  selectedCombination,
  onPlay,
  onPass,
  onSort,
}: GameControlsProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4">
      {/* Combo preview */}
      {selectedCombination && (
        <motion.p
          className="text-xs font-black font-brush text-yellow-300 tracking-wide"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          key={selectedCombination.type + selectedCombination.highCard.id}
        >
          {combinationLabel(selectedCombination)}
        </motion.p>
      )}

      <div className="flex items-center justify-center gap-2.5">
        {/* Sort button */}
        <button
          onClick={onSort}
          className="btn-utility px-3.5 py-2 min-h-[44px] min-w-[44px] font-brush"
        >
          Sort
        </button>

        {/* Pass button */}
        <motion.button
          onClick={onPass}
          disabled={!isMyTurn || !canPass}
          className="btn-ghost px-6 py-2 text-sm min-h-[44px] font-brush"
          whileTap={isMyTurn && canPass ? { scale: 0.96 } : undefined}
        >
          Pass
        </motion.button>

        {/* Play button — primary action */}
        <motion.button
          onClick={onPlay}
          disabled={!isMyTurn || !canPlay}
          className="btn-primary px-8 py-2 text-sm min-h-[44px] font-brush"
          whileTap={isMyTurn && canPlay ? { scale: 0.96 } : undefined}
        >
          {selectedCount > 0 ? `Play ${selectedCount}` : 'Play'}
        </motion.button>
      </div>
    </div>
  );
}
