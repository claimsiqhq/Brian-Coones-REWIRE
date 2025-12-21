import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, Pause, RotateCcw, ChevronLeft, Wind, Heart, Zap, Moon, Leaf, Brain, Flame, Volume2, VolumeX, Mic, Music, Loader2, Scan, Timer } from "lucide-react";
import { useVoiceGuidance } from "@/hooks/useVoiceGuidance";
import { useAmbientSound, type Phase } from "@/hooks/useAmbientSound";
import { usePractice } from "@/lib/api";
import { useLocation } from "wouter";

type AudioMode = "none" | "voice" | "ambient" | "both";

interface BreathingTechnique {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  phases: { phase: Phase; duration: number; label: string }[];
  cycles?: number;
  specialInstructions?: string;
}

const techniques: BreathingTechnique[] = [
  {
    id: "4-7-8",
    name: "4-7-8 Relaxing",
    subtitle: "Classic calm technique",
    description: "Inhale 4s, hold 7s, exhale 8s. Perfect for reducing anxiety and preparing for sleep.",
    icon: <Moon className="w-5 h-5" />,
    color: "from-forest-floor to-deep-pine",
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
    icon: <Brain className="w-5 h-5" />,
    color: "from-sage to-forest-floor",
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
    icon: <Heart className="w-5 h-5" />,
    color: "from-birch/80 to-sage",
    phases: [
      { phase: "inhale", duration: 5000, label: "Inhale" },
      { phase: "exhale", duration: 5000, label: "Exhale" },
    ],
  },
  {
    id: "energizing",
    name: "Fire Breath",
    subtitle: "Bhastrika / Bellows",
    description: "Quick, powerful breaths to boost energy and alertness. Stokes your inner fire.",
    icon: <Zap className="w-5 h-5" />,
    color: "from-birch to-forest-floor",
    phases: [
      { phase: "inhale", duration: 1000, label: "In" },
      { phase: "exhale", duration: 1000, label: "Out" },
    ],
    cycles: 15,
    specialInstructions: "Breathe rapidly through your nose",
  },
  {
    id: "relaxing",
    name: "2-4 Relaxing",
    subtitle: "Extended exhale",
    description: "Short inhale, long exhale activates your parasympathetic nervous system for deep relaxation.",
    icon: <Leaf className="w-5 h-5" />,
    color: "from-sage/80 to-deep-pine",
    phases: [
      { phase: "inhale", duration: 2000, label: "Inhale" },
      { phase: "exhale", duration: 4000, label: "Exhale" },
    ],
  },
  {
    id: "belly",
    name: "Deep Belly",
    subtitle: "Diaphragmatic breathing",
    description: "Slow, deep breaths into your belly. The foundation of grounding work.",
    icon: <Wind className="w-5 h-5" />,
    color: "from-forest-floor to-sage/50",
    phases: [
      { phase: "inhale", duration: 4000, label: "Breathe In" },
      { phase: "hold", duration: 1000, label: "Pause" },
      { phase: "exhale", duration: 6000, label: "Breathe Out" },
    ],
    specialInstructions: "Place hand on belly, feel it rise and fall",
  },
  {
    id: "wimhof",
    name: "Wim Hof Method",
    subtitle: "Cold warrior breathing",
    description: "30 deep breaths followed by breath retention. Increases energy, focus, and stress resilience.",
    icon: <Flame className="w-5 h-5" />,
    color: "from-birch/70 to-deep-pine",
    phases: [
      { phase: "inhale", duration: 1500, label: "Deep In" },
      { phase: "exhale", duration: 1500, label: "Let Go" },
    ],
    cycles: 30,
    specialInstructions: "After 30 breaths, exhale and hold as long as comfortable",
  },
  {
    id: "bodyscan",
    name: "Body Scan",
    subtitle: "Progressive relaxation",
    description: "Systematically scan your body from head to toe. Release tension and cultivate awareness.",
    icon: <Scan className="w-5 h-5" />,
    color: "from-teal to-sage/50",
    phases: [
      { phase: "inhale", duration: 4000, label: "Breathe In" },
      { phase: "hold", duration: 2000, label: "Notice" },
      { phase: "exhale", duration: 6000, label: "Release" },
      { phase: "holdEmpty", duration: 2000, label: "Let Go" },
    ],
    specialInstructions: "Focus on each body part: head, neck, shoulders, arms, chest, belly, hips, legs, feet",
  },
  {
    id: "timer",
    name: "Silent Timer",
    subtitle: "Focused stillness",
    description: "A simple timer for your own meditation practice. Sit in stillness with gentle beginning and ending bells.",
    icon: <Timer className="w-5 h-5" />,
    color: "from-violet to-deep-pine",
    phases: [
      { phase: "inhale", duration: 5000, label: "Settle" },
      { phase: "exhale", duration: 5000, label: "Stillness" },
    ],
    specialInstructions: "Simply be present. Follow your natural breath.",
  },
];

// Helper to convert database practice to BreathingTechnique format
function convertPracticeToTechnique(practice: any): BreathingTechnique | null {
  if (!practice || !practice.phases) return null;

  const iconMap: Record<string, React.ReactNode> = {
    moon: <Moon className="w-5 h-5" />,
    brain: <Brain className="w-5 h-5" />,
    heart: <Heart className="w-5 h-5" />,
    zap: <Zap className="w-5 h-5" />,
    leaf: <Leaf className="w-5 h-5" />,
    wind: <Wind className="w-5 h-5" />,
    flame: <Flame className="w-5 h-5" />,
    scan: <Scan className="w-5 h-5" />,
    timer: <Timer className="w-5 h-5" />,
  };

  return {
    id: practice.id,
    name: practice.name,
    subtitle: practice.subtitle || practice.category,
    description: practice.description || "",
    icon: iconMap[practice.iconName] || <Wind className="w-5 h-5" />,
    color: practice.colorGradient || "from-forest-floor to-deep-pine",
    phases: practice.phases,
    cycles: practice.cycles,
    specialInstructions: practice.specialInstructions,
  };
}

export default function Focus() {
  const [, setLocation] = useLocation();
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [text, setText] = useState("Ready");
  const [audioMode, setAudioMode] = useState<AudioMode>("none");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);

  const { speak, stop: stopVoice } = useVoiceGuidance();
  const { start: startAmbient, stop: stopAmbient, pulse: pulseAmbient } = useAmbientSound();

  // Parse practiceId from URL query parameters
  const practiceId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("practiceId");
  }, []);

  // Fetch practice from database if ID is provided
  const { data: fetchedPractice, isLoading: practiceLoading } = usePractice(practiceId || "");

  // Auto-select fetched practice when loaded
  useEffect(() => {
    if (fetchedPractice && !selectedTechnique) {
      const technique = convertPracticeToTechnique(fetchedPractice);
      if (technique) {
        setSelectedTechnique(technique);
      }
    }
  }, [fetchedPractice, selectedTechnique]);

  const clearCurrentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const audioModeRef = useRef<AudioMode>("none");
  
  useEffect(() => {
    audioModeRef.current = audioMode;
  }, [audioMode]);

  const runPhase = useCallback((technique: BreathingTechnique, phaseIndex: number, currentCycle: number) => {
    if (!isActiveRef.current) return;

    const phases = technique.phases;
    const currentPhase = phases[phaseIndex];
    
    setCurrentPhaseIndex(phaseIndex);
    setText(currentPhase.label);

    // Handle audio based on mode
    if (audioModeRef.current === "voice" || audioModeRef.current === "both") {
      speak(currentPhase.label);
    }
    if (audioModeRef.current === "ambient" || audioModeRef.current === "both") {
      pulseAmbient(currentPhase.phase);
    }

    timeoutRef.current = setTimeout(() => {
      if (!isActiveRef.current) return;

      const nextIndex = (phaseIndex + 1) % phases.length;
      const completedCycle = nextIndex === 0;
      
      if (completedCycle) {
        const newCycleCount = currentCycle + 1;
        setCycleCount(newCycleCount);
        
        if (technique.cycles && newCycleCount >= technique.cycles) {
          if (technique.id === "wimhof") {
            setText("Hold!");
            setCurrentPhaseIndex(-1);
            if (audioModeRef.current === "voice") {
              speak("Hold");
            }
            return;
          }
          handleReset();
          return;
        }
      }
      
      runPhase(technique, nextIndex, completedCycle ? currentCycle + 1 : currentCycle);
    }, currentPhase.duration);
  }, [speak, pulseAmbient]);

  const handleReset = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    clearCurrentTimeout();
    setCurrentPhaseIndex(0);
    setCycleCount(0);
    setText("Ready");
    stopVoice();
    stopAmbient();
  }, [clearCurrentTimeout, stopVoice, stopAmbient]);

  useEffect(() => {
    isActiveRef.current = isActive;
    
    if (isActive && selectedTechnique) {
      setCycleCount(0);
      if (audioMode === "ambient" || audioMode === "both") {
        startAmbient();
      }
      runPhase(selectedTechnique, 0, 0);
    } else {
      clearCurrentTimeout();
      stopVoice();
      stopAmbient();
    }

    return () => {
      clearCurrentTimeout();
    };
  }, [isActive, selectedTechnique, runPhase, clearCurrentTimeout, audioMode, startAmbient, stopVoice, stopAmbient]);

  const handleBack = () => {
    handleReset();
    setSelectedTechnique(null);
    // If we came from library with practiceId, navigate back to library
    if (practiceId) {
      setLocation("/library");
    }
  };

  const getCurrentPhase = (): Phase => {
    if (!selectedTechnique || currentPhaseIndex < 0) return "rest";
    return selectedTechnique.phases[currentPhaseIndex]?.phase || "rest";
  };

  const getAnimationScale = () => {
    const phase = getCurrentPhase();
    if (phase === "inhale") return 1.5;
    if (phase === "hold") return 1.5;
    if (phase === "exhale") return 1;
    if (phase === "holdEmpty") return 1;
    return 1.2;
  };

  const getAnimationDuration = () => {
    if (!selectedTechnique || currentPhaseIndex < 0) return 0.5;
    const phase = getCurrentPhase();
    const phaseData = selectedTechnique.phases[currentPhaseIndex];
    if (!phaseData) return 0.5;
    
    if (phase === "inhale" || phase === "exhale") {
      return phaseData.duration / 1000;
    }
    return 0.3;
  };

  // Show loading state when fetching a practice from library
  if (practiceId && practiceLoading) {
    return (
      <MobileLayout>
        <div className="flex flex-col h-full bg-night-forest items-center justify-center">
          <Loader2 className="w-10 h-10 text-sage animate-spin" />
          <p className="text-sage/80 mt-4">Loading practice...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!selectedTechnique) {
    return (
      <MobileLayout>
        <div className="flex flex-col h-full bg-night-forest">
          <div className="bg-gradient-to-br from-deep-pine via-forest-floor/80 to-night-forest px-6 pt-6 pb-4 rounded-b-2xl">
            <h1 className="text-2xl font-display font-bold text-birch" data-testid="text-focus-title">Grounding Practice</h1>
            <p className="text-sage/80 mt-1">Anchor yourself through breath</p>
          </div>

          <ScrollArea className="flex-1 px-4 pt-4">
            <div className="grid gap-3 pb-6">
              {techniques.map((technique) => (
                <Card
                  key={technique.id}
                  className="cursor-pointer hover:shadow-lg transition-all border-forest-floor bg-deep-pine overflow-hidden"
                  onClick={() => setSelectedTechnique(technique)}
                  data-testid={`card-technique-${technique.id}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${technique.name} breathing technique. ${technique.description}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedTechnique(technique);
                    }
                  }}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 flex-shrink-0 bg-gradient-to-br ${technique.color} flex items-center justify-center text-white`}>
                        {technique.icon}
                      </div>
                      <div className="flex-1 py-3 pr-4">
                        <h3 className="font-semibold text-birch">{technique.name}</h3>
                        <p className="text-xs text-sage">{technique.subtitle}</p>
                        <p className="text-xs text-sage/60 mt-1 line-clamp-2">{technique.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col h-full items-center justify-center relative overflow-hidden bg-night-forest">
        <div className={`absolute inset-0 bg-gradient-to-b ${selectedTechnique.color} opacity-5 z-0`} />
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 z-20 text-sage hover:text-birch hover:bg-forest-floor/30"
          onClick={handleBack}
          data-testid="button-back"
          aria-label="Go back to technique selection"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-20 text-sage hover:text-birch hover:bg-forest-floor/30"
              data-testid="button-audio-toggle"
              aria-label="Audio settings"
            >
              {audioMode === "none" && <VolumeX className="w-5 h-5" />}
              {audioMode === "voice" && <Mic className="w-5 h-5" />}
              {audioMode === "ambient" && <Volume2 className="w-5 h-5" />}
              {audioMode === "both" && <Music className="w-5 h-5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setAudioMode("none")}
              data-testid="menu-audio-none"
            >
              <VolumeX className="w-4 h-4 mr-2" />
              No Audio
              {audioMode === "none" && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setAudioMode("voice")}
              data-testid="menu-audio-voice"
            >
              <Mic className="w-4 h-4 mr-2" />
              Voice Guidance
              {audioMode === "voice" && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setAudioMode("ambient")}
              data-testid="menu-audio-ambient"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Ambient Sounds
              {audioMode === "ambient" && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setAudioMode("both")}
              data-testid="menu-audio-both"
            >
              <Music className="w-4 h-4 mr-2" />
              Voice + Ambient
              {audioMode === "both" && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="z-10 flex flex-col items-center gap-8 w-full px-8">
          <div className="text-center space-y-1 mt-8">
            <h1 className="text-2xl font-display font-bold text-birch" data-testid="text-technique-name">
              {selectedTechnique.name}
            </h1>
            <p className="text-sage text-sm">{selectedTechnique.subtitle}</p>
            {selectedTechnique.cycles && (
              <p className="text-birch font-medium text-sm" data-testid="text-cycle-count">
                {isActive ? `${cycleCount} / ${selectedTechnique.cycles} breaths` : `${selectedTechnique.cycles} breaths`}
              </p>
            )}
          </div>

          <div className="relative flex items-center justify-center w-64 h-64">
            <motion.div
              animate={{
                scale: isActive ? getAnimationScale() * 1.1 : 1,
                opacity: isActive ? 0.3 : 0.1,
              }}
              transition={{ duration: getAnimationDuration(), ease: "easeInOut" }}
              className={`absolute w-40 h-40 rounded-full bg-gradient-to-br ${selectedTechnique.color} blur-xl`}
            />
            <motion.div
              animate={{
                scale: isActive ? getAnimationScale() : 1,
                opacity: isActive ? 0.4 : 0.2,
              }}
              transition={{ duration: getAnimationDuration(), ease: "easeInOut" }}
              className={`absolute w-40 h-40 rounded-full bg-gradient-to-br ${selectedTechnique.color} blur-lg`}
            />

            <motion.div
              animate={{
                scale: isActive ? getAnimationScale() : 1,
              }}
              transition={{ duration: getAnimationDuration(), ease: "easeInOut" }}
              className={`w-40 h-40 rounded-full shadow-xl flex items-center justify-center relative z-20 border-4 border-white/50 bg-gradient-to-br ${selectedTechnique.color}`}
              role="status"
              aria-live="polite"
              aria-label={`Breathing phase: ${isActive ? text : "Ready"}`}
            >
              <motion.span
                className="text-xl font-display font-bold text-white text-center px-4"
                data-testid="text-phase"
              >
                {isActive ? text : "Ready"}
              </motion.span>
            </motion.div>
          </div>

          {selectedTechnique.specialInstructions && (
            <p className="text-center text-sm text-sage italic px-4" data-testid="text-instructions">
              {selectedTechnique.specialInstructions}
            </p>
          )}

          <div className="flex gap-6" role="group" aria-label="Exercise controls">
            <Button
              size="lg"
              className={`h-16 w-16 rounded-full shadow-lg transition-all bg-gradient-to-br ${selectedTechnique.color} text-white hover:opacity-90`}
              onClick={() => setIsActive(!isActive)}
              data-testid="button-play-pause"
              aria-label={isActive ? "Pause breathing exercise" : "Start breathing exercise"}
              aria-pressed={isActive}
            >
              {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-16 w-16 rounded-full border-2"
              onClick={handleReset}
              data-testid="button-reset"
              aria-label="Reset breathing exercise"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
