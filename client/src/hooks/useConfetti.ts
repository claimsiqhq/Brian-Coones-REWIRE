import { useState, useCallback } from "react";

export interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
}

const CONFETTI_COLORS = [
  "#7c3aed", // violet
  "#f64ca0", // coral
  "#fbbf24", // amber
  "#34d399", // emerald
  "#60a5fa", // blue
  "#f472b6", // pink
  "#a78bfa", // purple
  "#fb923c", // orange
];

/**
 * Hook for triggering confetti celebrations.
 * Returns state and trigger function for showing confetti animations.
 */
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const trigger = useCallback((count: number = 50) => {
    const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage across screen
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.5,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
    }));

    setPieces(newPieces);
    setIsActive(true);

    // Auto-cleanup after animation
    setTimeout(() => {
      setIsActive(false);
      setPieces([]);
    }, 4000);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setPieces([]);
  }, []);

  return { isActive, pieces, trigger, reset };
}
