'use client';

import { motion } from 'framer-motion';

interface PlayingCardProps {
  rank: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  faceUp?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-card-red',
  diamonds: 'text-card-red',
  clubs: 'text-card-black',
  spades: 'text-card-black',
};

const SIZES = {
  sm: { card: 'w-10 h-14', rank: 'text-[10px]', suit: 'text-xs', center: 'text-lg', radius: 'rounded-lg', pad: 'p-1' },
  md: { card: 'w-16 h-[5.5rem]', rank: 'text-xs', suit: 'text-sm', center: 'text-2xl', radius: 'rounded-lg', pad: 'p-1' },
  lg: { card: 'w-20 h-28', rank: 'text-sm', suit: 'text-base', center: 'text-3xl', radius: 'rounded-xl', pad: 'p-1.5' },
  xl: { card: 'w-20 h-[7.5rem]', rank: 'text-sm', suit: 'text-base', center: 'text-4xl', radius: 'rounded-xl', pad: 'p-1.5' },
};

export function PlayingCard({
  rank,
  suit,
  faceUp = true,
  selected = false,
  disabled = false,
  onClick,
  size = 'md',
}: PlayingCardProps) {
  const s = SIZES[size];
  const suitSymbol = SUIT_SYMBOLS[suit];
  const suitColor = SUIT_COLORS[suit];

  return (
    <motion.div
      className={`
        ${s.card} relative ${s.radius} cursor-pointer select-none flex-shrink-0
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${selected
          ? 'ring-2 ring-yellow-400 shadow-[0_0_16px_rgba(255,193,7,0.6),0_0_4px_rgba(255,193,7,0.3)]'
          : 'shadow-[1px_2px_8px_rgba(0,0,0,0.5)]'
        }
      `}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? undefined : {
        y: -5,
        rotate: 1,
        transition: { duration: 0.12 },
      }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      animate={{ y: selected ? -10 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{ perspective: 800 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: faceUp ? 0 : 180 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Front face — crisp white */}
        <div
          className={`
            absolute inset-0 ${s.radius}
            bg-gradient-to-br from-white via-card-white to-gray-50
            border-2 border-gray-200 ${s.pad}
            flex flex-col justify-between
            shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]
            backface-hidden ${suitColor}
          `}
        >
          <div className="flex flex-col items-start leading-none">
            <span className={`${s.rank} font-black`}>{rank}</span>
            <span className={`${s.suit} -mt-0.5`}>{suitSymbol}</span>
          </div>
          <div className={`${s.center} self-center opacity-25`}>
            {suitSymbol}
          </div>
          <div className="flex flex-col items-end leading-none rotate-180">
            <span className={`${s.rank} font-black`}>{rank}</span>
            <span className={`${s.suit} -mt-0.5`}>{suitSymbol}</span>
          </div>
        </div>

        {/* Back face — maroon red */}
        <div
          className={`absolute inset-0 ${s.radius} backface-hidden rotate-y-180
            bg-gradient-to-br from-red-800 via-card-back to-red-950
            border-2 border-red-600/40 overflow-hidden`}
        >
          <div className="absolute inset-0 card-back-pattern" />
          <div
            className="absolute inset-1.5 rounded-sm border border-red-400/20
              flex items-center justify-center"
          >
            <div className="w-5 h-5 rounded-full bg-gold/20 border border-gold/30" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
