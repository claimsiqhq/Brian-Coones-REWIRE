import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Confetti, CelebrationModal } from "@/components/ui/confetti";
import { useConfetti } from "@/hooks/useConfetti";

interface CelebrationData {
  title: string;
  description: string;
  icon?: ReactNode;
}

interface CelebrationContextType {
  celebrate: (data: CelebrationData) => void;
  triggerConfetti: (count?: number) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const confetti = useConfetti();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  const celebrate = useCallback((data: CelebrationData) => {
    setCelebrationData(data);
    setIsModalOpen(true);
    confetti.trigger(60);
  }, [confetti]);

  const triggerConfetti = useCallback((count?: number) => {
    confetti.trigger(count);
  }, [confetti]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setCelebrationData(null);
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate, triggerConfetti }}>
      {children}
      <Confetti isActive={confetti.isActive} pieces={confetti.pieces} />
      {celebrationData && (
        <CelebrationModal
          isOpen={isModalOpen}
          onClose={handleClose}
          title={celebrationData.title}
          description={celebrationData.description}
          icon={celebrationData.icon}
        />
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebration must be used within a CelebrationProvider");
  }
  return context;
}

// Achievement definitions with celebration info
export const ACHIEVEMENT_CELEBRATIONS: Record<string, { title: string; description: string; emoji: string }> = {
  first_mood: {
    title: "Mood Explorer!",
    description: "You logged your first mood. Keep tracking to understand your emotional patterns!",
    emoji: "😊",
  },
  first_journal: {
    title: "Journal Journey Begins!",
    description: "You wrote your first journal entry. Reflection is the key to growth!",
    emoji: "📝",
  },
  first_habit: {
    title: "Habit Starter!",
    description: "You completed your first habit. Small steps lead to big changes!",
    emoji: "✓",
  },
  streak_3: {
    title: "On Fire!",
    description: "You've maintained a 3-day streak! Your consistency is paying off!",
    emoji: "🔥",
  },
  streak_7: {
    title: "Week Warrior!",
    description: "An entire week of dedication! You're building lasting habits!",
    emoji: "⚡",
  },
  mood_10: {
    title: "Mood Master!",
    description: "10 mood check-ins! You're becoming more in tune with your emotions!",
    emoji: "🎭",
  },
  journal_5: {
    title: "Reflective Soul!",
    description: "5 journal entries written! Your insights are growing deeper!",
    emoji: "📖",
  },
  habits_20: {
    title: "Habit Champion!",
    description: "20 habits completed! You're a true master of consistency!",
    emoji: "🏆",
  },
};
