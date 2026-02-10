'use client';

import { Facehash } from 'facehash';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PIXEL_SIZES = {
  sm: 44,
  md: 64,
  lg: 80,
};

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const px = PIXEL_SIZES[size];
  const ringPx = px + 10;

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: ringPx, height: ringPx }}
    >
      {/* Rainbow ring border — thick and colorful */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(#ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #ec4899, #ef4444)',
          padding: 4,
          borderRadius: '50%',
        }}
      >
        {/* White inner border for polished mobile-game look */}
        <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
          <div
            className="w-full h-full rounded-full overflow-hidden bg-surface flex items-center justify-center"
          >
            <Facehash name={name} size={px} showInitial={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getAvatarColor(name: string): string {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];
  return colors[hashName(name) % colors.length];
}
