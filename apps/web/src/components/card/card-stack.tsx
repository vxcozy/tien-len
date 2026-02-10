'use client';

interface CardStackProps {
  count: number;
  maxVisible?: number;
}

export function CardStack({ count, maxVisible = 5 }: CardStackProps) {
  const visible = Math.min(count, maxVisible);
  const remaining = count - visible;

  return (
    <div className="relative" style={{ width: 36, height: 48 }}>
      {Array.from({ length: visible }, (_, i) => {
        const rotation = visible > 1
          ? -3 + (6 / (visible - 1)) * i
          : 0;
        return (
          <div
            key={i}
            className="absolute inset-0 rounded-md
              bg-gradient-to-br from-red-800 via-card-back to-red-950
              border border-red-600/30"
            style={{
              transform: `rotate(${rotation}deg)`,
              zIndex: i,
            }}
          >
            <div className="absolute inset-0 card-back-pattern rounded-md" />
          </div>
        );
      })}
      {remaining > 0 && (
        <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1
          rounded-full bg-red-600 flex items-center justify-center
          shadow-md border border-red-400/30 z-10">
          <span className="text-[9px] font-black text-white">+{remaining}</span>
        </div>
      )}
    </div>
  );
}
