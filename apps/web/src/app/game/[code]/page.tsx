'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { PokerTable } from '@/components/game/poker-table';
import { CardFan } from '@/components/card/card-fan';
import { GameControls } from '@/components/game/game-controls';
import { TurnIndicator } from '@/components/game/turn-indicator';
import { GameLog } from '@/components/game/game-log';
import { Avatar } from '@/components/game/avatar';
import { Confetti } from '@/components/game/confetti';

export default function GamePage() {
  const router = useRouter();
  const {
    clientState,
    selectedCardIds,
    mode,
    startSinglePlayer,
    toggleCard,
    playSelected,
    pass,
    sortMyHand,
    canPlaySelection,
    canPass,
    isMyTurn,
    getSelectedCombination,
  } = useGameStore();

  // Auto-start single player if not already started
  useEffect(() => {
    if (mode === 'idle') {
      startSinglePlayer(4);
    }
  }, [mode, startSinglePlayer]);

  if (!clientState) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-background gap-4">
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-10 h-14 rounded-lg bg-gradient-to-br from-red-800 via-card-back to-red-950 border border-red-600/40 shadow-lg"
              animate={{
                y: [0, -12, 0],
                rotate: [-5 + i * 5, 5 - i * 3, -5 + i * 5],
              }}
              transition={{
                duration: 1,
                delay: i * 0.15,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
        <motion.p
          className="text-sm text-text-muted font-bold font-brush tracking-wide"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Dealing cards...
        </motion.p>
      </div>
    );
  }

  const myPlayer = clientState.players.find(p => p.id === clientState.myPlayerId);
  const currentPlayer = clientState.players[clientState.currentPlayerIndex];

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Header bar */}
      <div className="flex-none h-10 flex items-center justify-between px-4
        bg-gradient-to-r from-amber-950 via-surface to-amber-950
        border-b border-amber-800/40 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="text-text-muted hover:text-foreground transition-colors p-1 -ml-1"
            aria-label="Back to home"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-base font-brush tracking-wide bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Tien Len</h1>
        </div>
        <TurnIndicator
          playerName={currentPlayer?.name ?? ''}
          isMyTurn={isMyTurn()}
        />
      </div>

      {/* Table area */}
      <div className="flex-1 relative flex items-center justify-center p-2 min-h-0">
        <PokerTable
          players={clientState.players}
          currentPlayerId={currentPlayer?.id ?? ''}
          myPlayerId={clientState.myPlayerId}
          currentCombination={clientState.currentCombination}
          lastPlayedBy={clientState.lastPlayedBy}
        />

        {/* Game log overlay (bottom-left) */}
        <div className="absolute bottom-1 left-1 w-48 z-20">
          <GameLog history={clientState.turnHistory} />
        </div>
      </div>

      {/* Hand area */}
      <div className="flex-none bg-gradient-to-t from-amber-950 via-surface/90 to-surface/70
        backdrop-blur-sm border-t border-amber-700/30 pb-1">
        {clientState.phase === 'gameEnd' ? (
          <>
            <Confetti active={clientState.finishOrder[0] === 'human'} />
            <motion.div
              className="flex flex-col items-center py-5 gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <motion.h2
                className="text-2xl font-brush tracking-wide bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {clientState.finishOrder[0] === 'human' ? 'You Won!' : 'Game Over'}
              </motion.h2>
              <div className="flex gap-4">
                {clientState.finishOrder.map((id, i) => {
                  const player = clientState.players.find(p => p.id === id);
                  return (
                    <motion.div
                      key={id}
                      className="text-center flex flex-col items-center gap-1"
                      initial={{ opacity: 0, y: 15, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <div className={`text-xl font-black font-brush ${i === 0 ? 'text-yellow-400' : 'text-text-muted'}`}>
                        {i === 0 ? '\u{1F3C6}' : `#${i + 1}`}
                      </div>
                      <Avatar name={player?.name ?? '?'} size="sm" />
                      <div className="text-xs text-foreground font-bold font-brush">{player?.name}</div>
                    </motion.div>
                  );
                })}
              </div>
              <motion.button
                onClick={() => startSinglePlayer(4)}
                className="btn-primary mt-2 px-10 py-3 text-base font-brush"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                Play Again
              </motion.button>
            </motion.div>
          </>
        ) : (
          <>
            <div className="px-4 pt-2 pb-0.5">
              <CardFan
                cards={clientState.myHand}
                selectedCardIds={selectedCardIds}
                onToggleSelect={toggleCard}
                disabled={!isMyTurn()}
                size="md"
              />
            </div>
            <div className="pt-0.5 pb-1">
              <GameControls
                canPlay={canPlaySelection()}
                canPass={canPass()}
                isMyTurn={isMyTurn()}
                selectedCount={selectedCardIds.size}
                selectedCombination={getSelectedCombination()}
                onPlay={playSelected}
                onPass={pass}
                onSort={sortMyHand}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
