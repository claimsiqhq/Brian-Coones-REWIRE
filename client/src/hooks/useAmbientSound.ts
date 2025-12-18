import { useRef, useCallback, useEffect } from "react";

export type Phase = "inhale" | "hold" | "exhale" | "holdEmpty" | "rest";

/**
 * Hook for managing ambient background sounds during breathing exercises.
 * Uses Web Audio API to generate soothing Solfeggio frequencies.
 */
export function useAmbientSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);

  const start = useCallback(async () => {
    if (isPlayingRef.current) return;

    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 2);
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Solfeggio frequencies for relaxation
      // 174 Hz - Foundation/grounding
      // 285 Hz - Healing/regeneration
      // 396 Hz - Liberation/releasing fear
      const frequencies = [174, 285, 396];
      frequencies.forEach((freq) => {
        const osc = audioContext.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);

        const oscGain = audioContext.createGain();
        oscGain.gain.setValueAtTime(0.35, audioContext.currentTime);

        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start();
        oscillatorsRef.current.push(osc);
      });

      isPlayingRef.current = true;
    } catch (e) {
      console.error("Failed to start ambient sound:", e);
    }
  }, []);

  const stop = useCallback(() => {
    if (!isPlayingRef.current) return;

    try {
      if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.linearRampToValueAtTime(
          0,
          audioContextRef.current.currentTime + 0.5
        );
      }

      setTimeout(() => {
        oscillatorsRef.current.forEach((osc) => {
          try {
            osc.stop();
          } catch {}
        });
        oscillatorsRef.current = [];

        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        gainNodeRef.current = null;
        isPlayingRef.current = false;
      }, 600);
    } catch (e) {
      console.error("Failed to stop ambient sound:", e);
    }
  }, []);

  /**
   * Pulse the ambient sound volume based on the current breathing phase.
   * Increases volume during inhale, decreases during exhale.
   */
  const pulse = useCallback((phase: Phase) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    const baseGain = 0.4;
    const time = audioContextRef.current.currentTime;

    if (phase === "inhale") {
      gainNodeRef.current.gain.linearRampToValueAtTime(
        baseGain * 1.4,
        time + 0.5
      );
    } else if (phase === "exhale") {
      gainNodeRef.current.gain.linearRampToValueAtTime(
        baseGain * 0.6,
        time + 0.5
      );
    } else {
      gainNodeRef.current.gain.linearRampToValueAtTime(baseGain, time + 0.3);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { start, stop, pulse, isPlaying: isPlayingRef.current };
}
