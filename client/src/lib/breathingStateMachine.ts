/**
 * Breathing State Machine
 *
 * Handles the state transitions and logic for breathing exercises.
 * Extracted for testability and reuse.
 */

export type Phase = "inhale" | "hold" | "exhale" | "holdEmpty" | "rest";

export interface BreathingPhase {
  phase: Phase;
  duration: number;
  label: string;
}

export interface BreathingTechnique {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  phases: BreathingPhase[];
  cycles?: number;
  specialInstructions?: string;
}

export interface BreathingState {
  isActive: boolean;
  currentPhaseIndex: number;
  cycleCount: number;
  text: string;
  isComplete: boolean;
}

export interface BreathingStateMachine {
  state: BreathingState;
  technique: BreathingTechnique | null;
  start: (technique: BreathingTechnique) => void;
  stop: () => void;
  reset: () => void;
  advancePhase: () => BreathingState;
  getCurrentPhase: () => BreathingPhase | null;
  getAnimationScale: () => number;
  getAnimationDuration: () => number;
}

const INITIAL_STATE: BreathingState = {
  isActive: false,
  currentPhaseIndex: 0,
  cycleCount: 0,
  text: "Ready",
  isComplete: false,
};

/**
 * Create a new breathing state machine
 */
export function createBreathingStateMachine(): BreathingStateMachine {
  let state: BreathingState = { ...INITIAL_STATE };
  let technique: BreathingTechnique | null = null;

  const start = (newTechnique: BreathingTechnique) => {
    technique = newTechnique;
    state = {
      isActive: true,
      currentPhaseIndex: 0,
      cycleCount: 0,
      text: newTechnique.phases[0]?.label || "Ready",
      isComplete: false,
    };
  };

  const stop = () => {
    state = {
      ...state,
      isActive: false,
    };
  };

  const reset = () => {
    state = { ...INITIAL_STATE };
    technique = null;
  };

  const advancePhase = (): BreathingState => {
    if (!technique || !state.isActive) {
      return state;
    }

    const phases = technique.phases;
    const nextIndex = (state.currentPhaseIndex + 1) % phases.length;
    const completedCycle = nextIndex === 0;

    let newCycleCount = state.cycleCount;
    let isComplete = false;
    let text = phases[nextIndex].label;

    if (completedCycle) {
      newCycleCount = state.cycleCount + 1;

      // Check if technique has cycle limit
      if (technique.cycles && newCycleCount >= technique.cycles) {
        // Special case for Wim Hof method
        if (technique.id === "wimhof") {
          text = "Hold!";
          isComplete = false; // Wim Hof ends with a hold, not auto-complete
        } else {
          isComplete = true;
        }
      }
    }

    state = {
      isActive: !isComplete,
      currentPhaseIndex: isComplete ? -1 : nextIndex,
      cycleCount: newCycleCount,
      text,
      isComplete,
    };

    return state;
  };

  const getCurrentPhase = (): BreathingPhase | null => {
    if (!technique || state.currentPhaseIndex < 0) {
      return null;
    }
    return technique.phases[state.currentPhaseIndex] || null;
  };

  const getAnimationScale = (): number => {
    const currentPhase = getCurrentPhase();
    if (!currentPhase) return 1.2;

    switch (currentPhase.phase) {
      case "inhale":
        return 1.5;
      case "hold":
        return 1.5;
      case "exhale":
        return 1;
      case "holdEmpty":
        return 1;
      case "rest":
      default:
        return 1.2;
    }
  };

  const getAnimationDuration = (): number => {
    const currentPhase = getCurrentPhase();
    if (!currentPhase) return 0.5;

    if (currentPhase.phase === "inhale" || currentPhase.phase === "exhale") {
      return currentPhase.duration / 1000;
    }
    return 0.3;
  };

  return {
    get state() { return state; },
    get technique() { return technique; },
    start,
    stop,
    reset,
    advancePhase,
    getCurrentPhase,
    getAnimationScale,
    getAnimationDuration,
  };
}

/**
 * Built-in breathing techniques
 */
export const BREATHING_TECHNIQUES: BreathingTechnique[] = [
  {
    id: "4-7-8",
    name: "4-7-8 Relaxing",
    subtitle: "Classic calm technique",
    description: "Inhale 4s, hold 7s, exhale 8s. Perfect for reducing anxiety and preparing for sleep.",
    phases: [
      { phase: "inhale", duration: 4000, label: "Inhale" },
      { phase: "hold", duration: 7000, label: "Hold" },
      { phase: "exhale", duration: 8000, label: "Exhale" },
    ],
  },
  {
    id: "box",
    name: "Box Breathing",
    subtitle: "Navy SEAL technique",
    description: "Equal 4-second intervals for inhale, hold, exhale, hold. Used by elite performers for focus.",
    phases: [
      { phase: "inhale", duration: 4000, label: "Inhale" },
      { phase: "hold", duration: 4000, label: "Hold" },
      { phase: "exhale", duration: 4000, label: "Exhale" },
      { phase: "holdEmpty", duration: 4000, label: "Hold" },
    ],
  },
  {
    id: "resonant",
    name: "Resonant Breathing",
    subtitle: "Heart coherence",
    description: "5-second inhales and exhales at ~6 breaths per minute. Optimizes heart rate variability.",
    phases: [
      { phase: "inhale", duration: 5000, label: "Inhale" },
      { phase: "exhale", duration: 5000, label: "Exhale" },
    ],
  },
  {
    id: "energizing",
    name: "Energizing Breath",
    subtitle: "Bhastrika / Bellows",
    description: "Quick, powerful breaths to boost energy and alertness. Like a cup of coffee for your nervous system.",
    phases: [
      { phase: "inhale", duration: 1000, label: "In" },
      { phase: "exhale", duration: 1000, label: "Out" },
    ],
    cycles: 15,
    specialInstructions: "Breathe rapidly through your nose",
  },
  {
    id: "wimhof",
    name: "Wim Hof Method",
    subtitle: "Power breathing",
    description: "30 deep breaths followed by breath retention. Increases energy, focus, and stress resilience.",
    phases: [
      { phase: "inhale", duration: 1500, label: "Deep In" },
      { phase: "exhale", duration: 1500, label: "Let Go" },
    ],
    cycles: 30,
    specialInstructions: "After 30 breaths, exhale and hold as long as comfortable",
  },
];

/**
 * Calculate total cycle duration for a technique
 */
export function calculateCycleDuration(technique: BreathingTechnique): number {
  return technique.phases.reduce((sum, phase) => sum + phase.duration, 0);
}

/**
 * Calculate total exercise duration for a technique with cycles
 */
export function calculateTotalDuration(technique: BreathingTechnique): number {
  const cycleDuration = calculateCycleDuration(technique);
  const cycles = technique.cycles || 1;
  return cycleDuration * cycles;
}
