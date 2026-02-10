'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const FloatingCardsScene = dynamic(
  () => import('@/components/three/floating-cards-scene').then(m => ({ default: m.FloatingCardsScene })),
  { ssr: false },
);

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-background p-6 overflow-hidden">
      {/* 3D Floating cards background */}
      <FloatingCardsScene />

      {/* Decorative felt circle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[400px] rounded-[50%] felt-texture opacity-30 blur-sm" />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-10 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Title */}
        <div className="text-center">
          <h1 className="text-7xl font-brush tracking-wide bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            Tien Len
          </h1>
          <p className="mt-3 text-sm text-text-muted tracking-wide font-brush">
            Vietnamese Card Game
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <motion.button
            onClick={() => router.push('/game/solo')}
            className="btn-home-solo w-full py-4 text-lg font-brush"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            Solo
          </motion.button>

          <motion.button
            onClick={() => router.push('/lobby')}
            className="btn-home-multi w-full py-4 text-lg font-brush"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            Multiplayer
          </motion.button>
        </div>

        {/* Rules hint */}
        <p className="text-sm text-text-muted text-center max-w-xs leading-relaxed font-brush">
          Play with 2-8 players. First to empty your hand wins.
          Twos are the highest card. Bombs beat twos.
        </p>
      </motion.div>
    </div>
  );
}
