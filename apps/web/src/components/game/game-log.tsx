'use client';

import { useRef, useEffect } from 'react';
import type { TurnHistoryEntry } from '@tienlen/shared';
import { combinationLabel } from '@tienlen/engine';

const BOMB_TYPES = new Set(['quad', 'threePairBomb', 'fourPairBomb']);

interface GameLogProps {
  history: TurnHistoryEntry[];
}

export function GameLog({ history }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history.length]);

  if (history.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="max-h-24 overflow-y-auto px-2.5 py-1.5 space-y-0.5
        bg-black/70 backdrop-blur-md rounded-xl border border-amber-800/30
        scrollbar-thin scrollbar-thumb-amber-700/50"
    >
      {history.map((entry, i) => {
        const isBomb = entry.combination && BOMB_TYPES.has(entry.combination.type);
        return (
          <p key={i} className="text-[10px] leading-snug font-brush">
            <span className="font-bold text-yellow-300/90">{entry.playerName}</span>
            {' '}
            {entry.action === 'pass' ? (
              <span className="text-text-muted italic">passed</span>
            ) : entry.combination ? (
              <span className={isBomb ? 'text-red-400 font-bold' : 'text-gold'}>
                played {combinationLabel(entry.combination)}
              </span>
            ) : (
              <span className="text-gold">played</span>
            )}
          </p>
        );
      })}
    </div>
  );
}
