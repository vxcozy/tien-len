'use client';

import { motion } from 'framer-motion';
import { Avatar } from './avatar';
import type { PlayerState } from '@tienlen/shared';
import type { SeatPosition } from '@/constants/seat-positions';

interface PlayerSeatProps {
  player: PlayerState;
  position: SeatPosition;
  isCurrentTurn: boolean;
  isSelf: boolean;
}

export function PlayerSeat({ player, position, isCurrentTurn, isSelf }: PlayerSeatProps) {
  const isFinished = player.finishPosition !== null;

  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Turn indicator ring — bright yellow, pulsing */}
      {isCurrentTurn && (
        <motion.div
          className="absolute -inset-3 rounded-full border-[4px] border-yellow-400 animate-pulse-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {/* Crown "FIRST" badge for winner */}
      {isFinished && player.finishPosition === 1 && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
          <span className="text-xl drop-shadow-lg">👑</span>
          <div className="ribbon-banner bg-gradient-to-r from-red-700 via-red-500 to-red-700 px-3 py-0.5 -mt-1">
            <span className="text-[8px] font-black font-brush text-yellow-200 tracking-widest">FIRST</span>
          </div>
        </div>
      )}

      {/* Avatar + badges */}
      <div className="relative">
        <Avatar
          name={player.name}
          size="md"
          className={`
            ${isFinished ? 'opacity-50' : ''}
            ${player.hasPassed && !isFinished ? 'opacity-40' : ''}
          `}
        />

        {/* Card count badge — LARGE red rounded square */}
        {!isFinished && !isSelf && player.handSize > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[32px] h-[32px] px-1.5
            rounded-lg bg-red-600 flex items-center justify-center
            shadow-[0_2px_8px_rgba(220,38,38,0.5)] border-2 border-red-400/30">
            <span className="text-sm font-black text-white leading-none">
              {player.handSize}
            </span>
          </div>
        )}

        {/* Passed overlay */}
        {player.hasPassed && !isFinished && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50">
            <span className="text-red-400 font-black text-xl drop-shadow-md">{'\u2715'}</span>
          </div>
        )}

        {/* Finished badge (non-first) */}
        {isFinished && player.finishPosition !== 1 && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold flex items-center justify-center shadow-lg">
            <span className="text-[11px] font-black text-gray-900">
              #{player.finishPosition}
            </span>
          </div>
        )}

        {/* Locked badge */}
        {player.isLocked && (
          <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
            <span className="text-[10px] text-white font-black">!</span>
          </div>
        )}
      </div>

      {/* Red ribbon name banner */}
      <div className="mt-1 flex flex-col items-center">
        <div className="ribbon-banner bg-gradient-to-r from-red-800 via-red-600 to-red-800
          px-4 py-0.5 min-w-[76px] shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
          <p className="text-[10px] font-black font-brush text-white text-center truncate max-w-[80px] drop-shadow-sm flex items-center justify-center gap-0.5">
            <span className="text-yellow-300 text-[9px]">{'\u{1FA99}'}</span>
            {player.name}
          </p>
        </div>

        {/* Status text below banner */}
        {isFinished ? (
          <p className="text-[10px] text-yellow-300 font-bold font-brush mt-0.5">
            {player.finishPosition === 1 ? '\u{1F3C6} Winner!' : `#${player.finishPosition}`}
          </p>
        ) : player.hasPassed ? (
          <p className="text-[10px] text-red-400 italic font-semibold font-brush mt-0.5">Passed</p>
        ) : !isCurrentTurn && player.handSize > 0 ? (
          /* WAITING... with bouncing dots */
          <div className="flex items-center gap-0.5 mt-0.5">
            <span className="text-[9px] text-amber-300/70 font-bold font-brush tracking-wide">WAITING</span>
            <span className="waiting-dot-1 text-[9px] text-amber-300/70 font-bold">.</span>
            <span className="waiting-dot-2 text-[9px] text-amber-300/70 font-bold">.</span>
            <span className="waiting-dot-3 text-[9px] text-amber-300/70 font-bold">.</span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
