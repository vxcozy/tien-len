'use client';

import { PlayerSeat } from './player-seat';
import { PlayArea } from './play-area';
import { SEAT_POSITIONS } from '@/constants/seat-positions';
import type { PlayerState, Combination, Card } from '@tienlen/shared';

interface PokerTableProps {
  players: PlayerState[];
  currentPlayerId: string;
  myPlayerId: string;
  currentCombination: Combination | null;
  lastPlayedBy: string | null;
}

export function PokerTable({
  players,
  currentPlayerId,
  myPlayerId,
  currentCombination,
  lastPlayedBy,
}: PokerTableProps) {
  // Rotate players so "me" is always at position 0 (bottom center)
  const myIndex = players.findIndex(p => p.id === myPlayerId);
  const rotated = myIndex >= 0
    ? [...players.slice(myIndex), ...players.slice(0, myIndex)]
    : players;

  const positions = SEAT_POSITIONS[players.length] ?? SEAT_POSITIONS[4];

  return (
    <div className="relative w-full aspect-[16/10] max-w-5xl mx-auto">
      {/* Table outer rim (wood rail) — rich warm brown */}
      <div
        className="absolute inset-[3%] rounded-[50%]
          bg-gradient-to-b from-amber-800 via-wood to-wood-dark
          shadow-[0_8px_60px_rgba(0,0,0,0.7),inset_0_2px_8px_rgba(255,255,255,0.1),inset_0_-4px_12px_rgba(0,0,0,0.3)]"
      />

      {/* Red inner ring — decorative trim between wood and felt */}
      <div
        className="absolute inset-[4.2%] rounded-[50%]
          bg-gradient-to-b from-red-700 via-red-800 to-red-950
          shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),inset_0_-2px_6px_rgba(0,0,0,0.3)]"
      />

      {/* Gold pinstripe — thin trim at inner edge of red ring */}
      <div
        className="absolute inset-[5.2%] rounded-[50%]
          border-[2px] border-yellow-500/40
          pointer-events-none"
      />

      {/* Table felt surface — bright golden */}
      <div
        className="absolute inset-[5.5%] rounded-[50%] felt-texture
          shadow-[inset_0_4px_30px_rgba(0,0,0,0.3)]"
      />

      {/* Felt diamond pattern overlay */}
      <div
        className="absolute inset-[5.5%] rounded-[50%] felt-diamond pointer-events-none"
      />

      {/* Dark maroon curved arc at bottom of table */}
      <div
        className="absolute bottom-[3%] left-[15%] right-[15%] h-[14%]
          table-bottom-arc opacity-35 pointer-events-none"
      />

      {/* Inner decorative border — yellow-gold dashed */}
      <div
        className="absolute inset-[8%] rounded-[50%]
          border-2 border-dashed border-yellow-500/20
          pointer-events-none"
      />

      {/* Center play area */}
      <PlayArea
        combination={currentCombination}
        lastPlayedBy={lastPlayedBy}
        playerNames={Object.fromEntries(players.map(p => [p.id, p.name]))}
      />

      {/* Player seats (skip index 0 = self, shown separately) */}
      {rotated.map((player, i) => {
        if (i === 0) return null; // Hero is shown in the hand area below
        return (
          <PlayerSeat
            key={player.id}
            player={player}
            position={positions[i]}
            isCurrentTurn={player.id === currentPlayerId}
            isSelf={false}
          />
        );
      })}
    </div>
  );
}
