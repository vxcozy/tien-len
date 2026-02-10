'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

// Rainbow confetti colors
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#ffd700'];

interface ConfettiProps {
  active: boolean;
  count?: number;
}

export function Confetti({ active, count = 50 }: ConfettiProps) {
  const pieces = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: COLORS[i % COLORS.length],
      rotation: Math.random() * 360,
      drift: -40 + Math.random() * 80,
      size: 5 + Math.random() * 7,
      isCircle: Math.random() > 0.6,
    })),
    [count],
  );

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className={`absolute ${piece.isCircle ? 'rounded-full' : 'rounded-sm'}`}
              style={{
                left: `${piece.x}%`,
                width: piece.isCircle ? piece.size * 0.7 : piece.size,
                height: piece.isCircle ? piece.size * 0.7 : piece.size * 0.5,
                backgroundColor: piece.color,
                rotate: `${piece.rotation}deg`,
              }}
              initial={{ y: '-5%', opacity: 1, x: 0 }}
              animate={{
                y: '110vh',
                x: piece.drift,
                opacity: [1, 1, 1, 1, 0],
                rotate: [piece.rotation, piece.rotation + 720],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'easeIn',
              }}
              exit={{ opacity: 0 }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
