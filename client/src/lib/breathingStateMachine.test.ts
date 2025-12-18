import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBreathingStateMachine,
  BREATHING_TECHNIQUES,
  calculateCycleDuration,
  calculateTotalDuration,
  type BreathingTechnique,
  type BreathingStateMachine,
} from './breathingStateMachine';

describe('Breathing State Machine', () => {
  let machine: BreathingStateMachine;

  beforeEach(() => {
    machine = createBreathingStateMachine();
  });

  describe('Initial State', () => {
    it('should start with inactive state', () => {
      expect(machine.state.isActive).toBe(false);
      expect(machine.state.text).toBe('Ready');
      expect(machine.state.cycleCount).toBe(0);
      expect(machine.state.currentPhaseIndex).toBe(0);
      expect(machine.state.isComplete).toBe(false);
    });

    it('should have no technique initially', () => {
      expect(machine.technique).toBeNull();
    });

    it('should return null for current phase when no technique', () => {
      expect(machine.getCurrentPhase()).toBeNull();
    });
  });

  describe('Starting a Technique', () => {
    const technique = BREATHING_TECHNIQUES.find(t => t.id === '4-7-8')!;

    it('should activate the machine when starting', () => {
      machine.start(technique);
      expect(machine.state.isActive).toBe(true);
    });

    it('should set the technique', () => {
      machine.start(technique);
      expect(machine.technique).toEqual(technique);
    });

    it('should set the initial phase text', () => {
      machine.start(technique);
      expect(machine.state.text).toBe('Inhale');
    });

    it('should reset cycle count to 0', () => {
      machine.start(technique);
      expect(machine.state.cycleCount).toBe(0);
    });

    it('should start at phase index 0', () => {
      machine.start(technique);
      expect(machine.state.currentPhaseIndex).toBe(0);
    });
  });

  describe('Phase Advancement', () => {
    const boxBreathing = BREATHING_TECHNIQUES.find(t => t.id === 'box')!;

    beforeEach(() => {
      machine.start(boxBreathing);
    });

    it('should advance to next phase', () => {
      machine.advancePhase();
      expect(machine.state.currentPhaseIndex).toBe(1);
      expect(machine.state.text).toBe('Hold');
    });

    it('should cycle through all phases', () => {
      // Box breathing has 4 phases: inhale, hold, exhale, holdEmpty
      expect(machine.state.currentPhaseIndex).toBe(0); // inhale
      machine.advancePhase();
      expect(machine.state.currentPhaseIndex).toBe(1); // hold
      machine.advancePhase();
      expect(machine.state.currentPhaseIndex).toBe(2); // exhale
      machine.advancePhase();
      expect(machine.state.currentPhaseIndex).toBe(3); // holdEmpty
    });

    it('should wrap around and increment cycle count', () => {
      // Complete one full cycle (4 phases)
      machine.advancePhase(); // 0 -> 1
      machine.advancePhase(); // 1 -> 2
      machine.advancePhase(); // 2 -> 3
      machine.advancePhase(); // 3 -> 0 (new cycle)

      expect(machine.state.currentPhaseIndex).toBe(0);
      expect(machine.state.cycleCount).toBe(1);
    });

    it('should not advance when not active', () => {
      machine.stop();
      const initialState = { ...machine.state };
      machine.advancePhase();
      expect(machine.state).toEqual(initialState);
    });
  });

  describe('Techniques with Cycle Limits', () => {
    const energizing = BREATHING_TECHNIQUES.find(t => t.id === 'energizing')!;

    it('should complete after reaching cycle limit', () => {
      machine.start(energizing);

      // Energizing has 15 cycles with 2 phases each (inhale, exhale)
      // Need to advance 15 * 2 = 30 times to complete
      for (let i = 0; i < 29; i++) {
        machine.advancePhase();
      }

      expect(machine.state.isComplete).toBe(false);

      // Final advance should complete the exercise
      machine.advancePhase();
      expect(machine.state.isComplete).toBe(true);
      expect(machine.state.isActive).toBe(false);
    });

    it('should track cycle count correctly for limited techniques', () => {
      machine.start(energizing);

      // Complete 3 full cycles (2 phases each)
      for (let i = 0; i < 6; i++) {
        machine.advancePhase();
      }

      expect(machine.state.cycleCount).toBe(3);
    });
  });

  describe('Wim Hof Method Special Case', () => {
    const wimhof = BREATHING_TECHNIQUES.find(t => t.id === 'wimhof')!;

    it('should show "Hold!" text at the end of Wim Hof', () => {
      machine.start(wimhof);

      // Wim Hof has 30 cycles with 2 phases each
      // Advance through 30 cycles
      for (let i = 0; i < 60; i++) {
        machine.advancePhase();
      }

      expect(machine.state.text).toBe('Hold!');
    });

    it('should not auto-complete Wim Hof (ends with hold)', () => {
      machine.start(wimhof);

      // Advance through all cycles
      for (let i = 0; i < 60; i++) {
        machine.advancePhase();
      }

      // Wim Hof should not be marked as complete because
      // the user needs to hold their breath
      expect(machine.state.isComplete).toBe(false);
    });
  });

  describe('Stop and Reset', () => {
    const technique = BREATHING_TECHNIQUES.find(t => t.id === 'resonant')!;

    it('should deactivate on stop', () => {
      machine.start(technique);
      machine.advancePhase();
      machine.stop();

      expect(machine.state.isActive).toBe(false);
      // Other state should be preserved
      expect(machine.state.currentPhaseIndex).toBe(1);
    });

    it('should reset all state on reset', () => {
      machine.start(technique);
      machine.advancePhase();
      machine.advancePhase();
      machine.reset();

      expect(machine.state.isActive).toBe(false);
      expect(machine.state.currentPhaseIndex).toBe(0);
      expect(machine.state.cycleCount).toBe(0);
      expect(machine.state.text).toBe('Ready');
      expect(machine.state.isComplete).toBe(false);
      expect(machine.technique).toBeNull();
    });
  });

  describe('getCurrentPhase', () => {
    const technique = BREATHING_TECHNIQUES.find(t => t.id === '4-7-8')!;

    it('should return current phase when active', () => {
      machine.start(technique);
      const phase = machine.getCurrentPhase();

      expect(phase).not.toBeNull();
      expect(phase?.phase).toBe('inhale');
      expect(phase?.label).toBe('Inhale');
      expect(phase?.duration).toBe(4000);
    });

    it('should return correct phase after advancement', () => {
      machine.start(technique);
      machine.advancePhase();
      const phase = machine.getCurrentPhase();

      expect(phase?.phase).toBe('hold');
      expect(phase?.duration).toBe(7000);
    });
  });

  describe('Animation Calculations', () => {
    const technique = BREATHING_TECHNIQUES.find(t => t.id === '4-7-8')!;

    it('should return 1.5 scale for inhale phase', () => {
      machine.start(technique);
      expect(machine.getAnimationScale()).toBe(1.5);
    });

    it('should return 1.5 scale for hold phase', () => {
      machine.start(technique);
      machine.advancePhase();
      expect(machine.getAnimationScale()).toBe(1.5);
    });

    it('should return 1 scale for exhale phase', () => {
      machine.start(technique);
      machine.advancePhase();
      machine.advancePhase();
      expect(machine.getAnimationScale()).toBe(1);
    });

    it('should return correct animation duration for inhale (4s)', () => {
      machine.start(technique);
      expect(machine.getAnimationDuration()).toBe(4); // 4000ms = 4s
    });

    it('should return 0.3s duration for hold phase', () => {
      machine.start(technique);
      machine.advancePhase();
      expect(machine.getAnimationDuration()).toBe(0.3);
    });

    it('should return correct animation duration for exhale (8s)', () => {
      machine.start(technique);
      machine.advancePhase();
      machine.advancePhase();
      expect(machine.getAnimationDuration()).toBe(8); // 8000ms = 8s
    });

    it('should return default scale when no technique', () => {
      expect(machine.getAnimationScale()).toBe(1.2);
    });

    it('should return default duration when no technique', () => {
      expect(machine.getAnimationDuration()).toBe(0.5);
    });
  });
});

describe('Utility Functions', () => {
  describe('calculateCycleDuration', () => {
    it('should calculate total duration for 4-7-8 technique', () => {
      const technique = BREATHING_TECHNIQUES.find(t => t.id === '4-7-8')!;
      // 4000 + 7000 + 8000 = 19000ms
      expect(calculateCycleDuration(technique)).toBe(19000);
    });

    it('should calculate total duration for box breathing', () => {
      const technique = BREATHING_TECHNIQUES.find(t => t.id === 'box')!;
      // 4000 + 4000 + 4000 + 4000 = 16000ms
      expect(calculateCycleDuration(technique)).toBe(16000);
    });

    it('should calculate total duration for resonant breathing', () => {
      const technique = BREATHING_TECHNIQUES.find(t => t.id === 'resonant')!;
      // 5000 + 5000 = 10000ms
      expect(calculateCycleDuration(technique)).toBe(10000);
    });
  });

  describe('calculateTotalDuration', () => {
    it('should calculate total duration for technique without cycles', () => {
      const technique = BREATHING_TECHNIQUES.find(t => t.id === '4-7-8')!;
      // No cycles specified = 1 cycle
      expect(calculateTotalDuration(technique)).toBe(19000);
    });

    it('should calculate total duration for energizing (15 cycles)', () => {
      const technique = BREATHING_TECHNIQUES.find(t => t.id === 'energizing')!;
      // 2000ms per cycle * 15 cycles = 30000ms
      expect(calculateTotalDuration(technique)).toBe(30000);
    });

    it('should calculate total duration for Wim Hof (30 cycles)', () => {
      const technique = BREATHING_TECHNIQUES.find(t => t.id === 'wimhof')!;
      // 3000ms per cycle * 30 cycles = 90000ms (1.5 min)
      expect(calculateTotalDuration(technique)).toBe(90000);
    });
  });
});

describe('BREATHING_TECHNIQUES', () => {
  it('should have all expected techniques', () => {
    const techniqueIds = BREATHING_TECHNIQUES.map(t => t.id);
    expect(techniqueIds).toContain('4-7-8');
    expect(techniqueIds).toContain('box');
    expect(techniqueIds).toContain('resonant');
    expect(techniqueIds).toContain('energizing');
    expect(techniqueIds).toContain('wimhof');
  });

  it('should have valid phases for each technique', () => {
    for (const technique of BREATHING_TECHNIQUES) {
      expect(technique.phases.length).toBeGreaterThan(0);

      for (const phase of technique.phases) {
        expect(phase.duration).toBeGreaterThan(0);
        expect(phase.label.length).toBeGreaterThan(0);
        expect(['inhale', 'hold', 'exhale', 'holdEmpty', 'rest']).toContain(phase.phase);
      }
    }
  });

  it('should have required metadata for each technique', () => {
    for (const technique of BREATHING_TECHNIQUES) {
      expect(technique.id).toBeDefined();
      expect(technique.name).toBeDefined();
      expect(technique.subtitle).toBeDefined();
      expect(technique.description).toBeDefined();
    }
  });
});
