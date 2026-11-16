import confetti from 'canvas-confetti';

export function triggerVoteConfetti(element?: HTMLElement | null): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let origin = { x: 0.5, y: 0.6 };
  if (element) {
    const rect = element.getBoundingClientRect();
    origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
  }

  void confetti({
    particleCount: 28,
    spread: 56,
    startVelocity: 24,
    ticks: 110,
    scalar: 0.85,
    origin,
    colors: ['#059669', '#10b981', '#f59e0b', '#fbbf24', '#38bdf8'],
    disableForReducedMotion: true,
  });
}
