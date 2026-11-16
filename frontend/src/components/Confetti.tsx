import { useMemo } from 'react';

interface ConfettiProps {
  active: boolean;
}

const COLORS = ['#f97316', '#ec4899', '#22c55e', '#3b82f6', '#eab308', '#a855f7'];

export function Confetti({ active }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 0.2,
        color: COLORS[index % COLORS.length],
        rotate: Math.random() * 360,
      })),
    [active],
  );

  if (!active) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece absolute top-0 h-2 w-2 rounded-sm"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
