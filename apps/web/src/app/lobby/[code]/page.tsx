'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useMultiplayerStore } from '@/stores/multiplayer-store';
import { PokerTable } from '@/components/game/poker-table';
import { CardFan } from '@/components/card/card-fan';
import { GameControls } from '@/components/game/game-controls';
import { TurnIndicator } from '@/components/game/turn-indicator';
import { GameLog } from '@/components/game/game-log';
import { Avatar } from '@/components/game/avatar';
import { Confetti } from '@/components/game/confetti';

export default function WaitingRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const {
    roomState,
    roomCode,
    gameState,
    selectedCardIds,
    userId,
    isConnected,
    error,
    connect,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    requestRematch,
    toggleCard,
    playSelected,
    pass,
    isMyTurn,
    canPlaySelection,
    canPass,
    getSelectedCombination,
    clearError,
  } = useMultiplayerStore();

  // Auto-connect and join room if not already in it
  useEffect(() => {
    async function init() {
      if (!isConnected) {
        await connect();
      }
      if (!roomCode || roomCode !== code.toUpperCase()) {
        await joinRoom(code);
      }
    }
    init();
  }, [code, isConnected, roomCode, connect, joinRoom]);

  function handleLeave() {
    leaveRoom();
    router.push('/lobby');
  }

  // Game in progress view
  if (gameState && gameState.phase !== 'gameEnd') {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    return (
      <div className="h-dvh flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <div className="flex-none h-10 flex items-center justify-between px-4
          bg-gradient-to-r from-amber-950 via-surface to-amber-950
          border-b border-amber-800/40 shadow-md">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-brush tracking-wide bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Tien Len</h1>
            <span className="text-[10px] text-text-muted font-mono font-brush">{code}</span>
          </div>
          <TurnIndicator
            playerName={currentPlayer?.name ?? ''}
            isMyTurn={isMyTurn()}
          />
        </div>

        {/* Table */}
        <div className="flex-1 relative flex items-center justify-center p-2 min-h-0">
          <PokerTable
            players={gameState.players}
            currentPlayerId={currentPlayer?.id ?? ''}
            myPlayerId={gameState.myPlayerId}
            currentCombination={gameState.currentCombination}
            lastPlayedBy={gameState.lastPlayedBy}
          />
          <div className="absolute bottom-1 left-1 w-48 z-20">
            <GameLog history={gameState.turnHistory} />
          </div>
        </div>

        {/* Hand */}
        <div className="flex-none bg-gradient-to-t from-amber-950 via-surface/90 to-surface/70
          backdrop-blur-sm border-t border-amber-700/30 pb-1">
          <div className="px-4 pt-2 pb-0.5">
            <CardFan
              cards={gameState.myHand}
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
              onSort={() => {}}
            />
          </div>
        </div>
      </div>
    );
  }

  // Game over view
  if (gameState && gameState.phase === 'gameEnd') {
    const winnerId = gameState.finishOrder[0];
    const isWinner = winnerId === userId;

    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-background p-6">
        <Confetti active={isWinner} />
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-3xl font-brush tracking-wide bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-lg">
            {isWinner ? 'You Won!' : 'Game Over'}
          </h2>
          <div className="flex gap-6">
            {gameState.finishOrder.map((id, i) => {
              const player = gameState.players.find(p => p.id === id);
              return (
                <motion.div
                  key={id}
                  className="text-center flex flex-col items-center gap-1.5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className={`text-2xl font-black font-brush ${i === 0 ? 'text-yellow-400' : 'text-text-muted'}`}>
                    {i === 0 ? '\u{1F3C6}' : `#${i + 1}`}
                  </div>
                  <Avatar name={player?.name ?? '?'} size={i === 0 ? 'lg' : 'md'} />
                  <div className="text-sm text-foreground font-bold font-brush">{player?.name}</div>
                </motion.div>
              );
            })}
          </div>

          {roomState?.hostId === userId && (
            <motion.button
              onClick={requestRematch}
              className="btn-primary px-10 py-3 text-sm font-brush"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              Play Again
            </motion.button>
          )}

          <button
            onClick={handleLeave}
            className="text-xs text-text-muted hover:text-foreground transition-colors font-semibold font-brush"
          >
            Leave Room
          </button>
        </motion.div>
      </div>
    );
  }

  // Waiting room view
  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Subtle decorative felt glow in background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[300px] rounded-[50%] felt-texture opacity-15 blur-md" />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Room code */}
        <div className="text-center">
          <p className="text-xs text-text-muted mb-2 font-bold font-brush">Room Code</p>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-black tracking-[0.3em] bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-mono">
              {code.toUpperCase()}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(code.toUpperCase())}
              className="btn-utility px-3 py-2 font-brush"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2 font-brush">Share this code with friends to join</p>
        </div>

        {/* Player list */}
        <div className="w-full space-y-2">
          <p className="text-xs font-bold font-brush text-text-muted">
            Players ({roomState?.players.length ?? 0}/{roomState?.settings.maxPlayers ?? 8})
          </p>
          <div className="space-y-1.5">
            {roomState?.players.map((player) => (
              <motion.div
                key={player.id}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl
                  ${player.isHost ? 'bg-yellow-500/15 border border-yellow-400/30' : 'bg-surface border border-border'}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={player.name} size="sm" />
                  <div>
                    <p className="text-sm font-bold font-brush text-foreground">
                      {player.name}
                      {player.id === userId && <span className="text-text-muted ml-1">(you)</span>}
                    </p>
                    <p className="text-[10px] text-text-muted font-semibold font-brush">
                      {player.isHost ? '\u{1F451} Host' : player.isReady ? 'Ready' : 'Not Ready'}
                    </p>
                  </div>
                </div>
                {!player.isHost && (
                  <div className={`w-3 h-3 rounded-full ${player.isReady ? 'bg-green-400' : 'bg-gray-600'}`} />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          {roomState?.hostId === userId ? (
            <motion.button
              onClick={startGame}
              disabled={!roomState || roomState.players.length < 2 ||
                roomState.players.some(p => !p.isHost && !p.isReady)}
              className="btn-primary w-full py-3.5 text-sm font-brush"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              Start Game
            </motion.button>
          ) : (
            <motion.button
              onClick={toggleReady}
              className="btn-secondary w-full py-3.5 text-sm font-brush"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              {roomState?.players.find(p => p.id === userId)?.isReady ? 'Not Ready' : 'Ready Up'}
            </motion.button>
          )}

          <button
            onClick={handleLeave}
            className="text-xs text-text-muted hover:text-foreground transition-colors font-semibold font-brush"
          >
            Leave Room
          </button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-400 text-center font-semibold font-brush"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
