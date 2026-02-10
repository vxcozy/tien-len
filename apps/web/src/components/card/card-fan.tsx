'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard } from './playing-card';
import type { Card } from '@tienlen/shared';

interface CardFanProps {
  cards: Card[];
  selectedCardIds: Set<string>;
  onToggleSelect?: (cardId: string) => void;
  maxFanAngle?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function CardFan({
  cards,
  selectedCardIds,
  onToggleSelect,
  maxFanAngle = 30,
  size = 'md',
  disabled = false,
}: CardFanProps) {
  const n = cards.length;

  return (
    <div
      className="relative flex items-end justify-center"
      style={{ height: size === 'lg' ? 140 : size === 'md' ? 100 : 70 }}
    >
      <AnimatePresence>
        {cards.map((card, i) => {
          const isSelected = selectedCardIds.has(card.id);

          // Fan geometry
          const angleStep = Math.min(maxFanAngle / Math.max(n - 1, 1), 5);
          const totalAngle = angleStep * (n - 1);
          const angle = -totalAngle / 2 + i * angleStep;

          // Card overlap — tighter on mobile to fit more cards
          const overlapOffset = Math.min(
            size === 'lg' ? 44 : size === 'md' ? 28 : 20,
            500 / n,
          );
          const xOffset = (i - (n - 1) / 2) * overlapOffset;

          // Subtle arc
          const normalizedPos = n > 1 ? (i - (n - 1) / 2) / ((n - 1) / 2) : 0;
          const yOffset = normalizedPos * normalizedPos * 15;

          return (
            <motion.div
              key={card.id}
              className="absolute origin-bottom"
              style={{ zIndex: i }}
              initial={{ y: 80, opacity: 0, rotate: 0 }}
              animate={{
                x: xOffset,
                y: isSelected ? yOffset - 16 : yOffset,
                rotate: angle,
                opacity: 1,
              }}
              exit={{ y: 80, opacity: 0, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 28,
                delay: i * 0.02,
              }}
            >
              <PlayingCard
                rank={card.rank}
                suit={card.suit}
                selected={isSelected}
                disabled={disabled}
                onClick={() => onToggleSelect?.(card.id)}
                size={size}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
