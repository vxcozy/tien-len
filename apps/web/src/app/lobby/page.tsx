'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '@/stores/multiplayer-store';

export default function LobbyPage() {
  const router = useRouter();
  const { connect, createRoom, joinRoom, isConnected, error, clearError } = useMultiplayerStore();
  const [joinCode, setJoinCode] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate() {
    setIsLoading(true);
    clearError();
    try {
      if (!isConnected) await connect(name || undefined);
      const code = await createRoom();
      if (code) {
        router.push(`/lobby/${code}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoin() {
    if (joinCode.length !== 6) return;
    setIsLoading(true);
    clearError();
    try {
      if (!isConnected) await connect(name || undefined);
      const success = await joinRoom(joinCode);
      if (success) {
        router.push(`/lobby/${joinCode.toUpperCase()}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        className="flex flex-col items-center gap-8 max-w-sm w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-brush tracking-wide bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            Multiplayer
          </h1>
          <p className="mt-1 text-sm text-text-muted font-brush">Create or join a game room</p>
        </div>

        {/* Name input */}
        <div className="w-full">
          <label className="text-xs font-bold font-brush text-text-muted block mb-1.5">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full px-4 py-3 rounded-2xl bg-surface/80 border border-border
              text-foreground text-sm placeholder:text-text-muted/40
              focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50
              focus:bg-surface transition-colors"
          />
        </div>

        {/* Create Room */}
        <div className="w-full">
          <motion.button
            onClick={handleCreate}
            disabled={isLoading}
            className="btn-primary w-full py-3.5 text-sm font-brush"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            {isLoading ? 'Creating...' : 'Create Room'}
          </motion.button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted font-bold font-brush">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Join Room */}
        <div className="w-full space-y-3">
          <div>
            <label className="text-xs font-bold font-brush text-text-muted block mb-1.5">Room Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="w-full px-4 py-3 rounded-2xl bg-surface/80 border border-border
                text-foreground text-lg font-mono tracking-[0.3em] text-center uppercase
                placeholder:text-text-muted/40 placeholder:font-sans placeholder:tracking-normal placeholder:text-sm
                focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50
                focus:bg-surface transition-colors"
            />
          </div>
          <motion.button
            onClick={handleJoin}
            disabled={isLoading || joinCode.length !== 6}
            className="btn-ghost w-full py-3.5 text-sm font-brush"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </motion.button>
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-400 text-center font-semibold font-brush"
          >
            {error}
          </motion.p>
        )}

        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="text-xs text-text-muted hover:text-foreground transition-colors font-semibold font-brush"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}
