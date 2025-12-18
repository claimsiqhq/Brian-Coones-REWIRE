import { useRef, useCallback, useEffect } from "react";
import { fetchBreathingAudio } from "@/lib/api";

/**
 * Hook for managing voice guidance during breathing exercises.
 * Uses OpenAI TTS with fallback to browser speech synthesis.
 * Includes audio caching for better performance.
 */
export function useVoiceGuidance() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const isLoadingRef = useRef<Set<string>>(new Set());

  // Pre-load common breathing phrases
  const preloadPhrases = useCallback(async () => {
    const phrases = [
      "Inhale",
      "Hold",
      "Exhale",
      "Breathe In",
      "Breathe Out",
      "Let Go",
      "Deep In",
      "Pause",
      "In",
      "Out",
    ];

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    for (const phrase of phrases) {
      if (
        !audioCacheRef.current.has(phrase) &&
        !isLoadingRef.current.has(phrase)
      ) {
        isLoadingRef.current.add(phrase);
        try {
          const arrayBuffer = await fetchBreathingAudio(phrase);
          const audioBuffer =
            await audioContextRef.current!.decodeAudioData(arrayBuffer);
          audioCacheRef.current.set(phrase, audioBuffer);
        } catch (error) {
          console.error(`Failed to preload audio for "${phrase}":`, error);
        } finally {
          isLoadingRef.current.delete(phrase);
        }
      }
    }
  }, []);

  useEffect(() => {
    preloadPhrases();
  }, [preloadPhrases]);

  const speak = useCallback(async (text: string) => {
    try {
      // Stop any currently playing audio
      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop();
        } catch {}
        currentSourceRef.current = null;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      let audioBuffer: AudioBuffer;

      // Check cache first
      if (audioCacheRef.current.has(text)) {
        audioBuffer = audioCacheRef.current.get(text)!;
      } else {
        // Fetch and decode the audio
        const arrayBuffer = await fetchBreathingAudio(text);
        audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        audioCacheRef.current.set(text, audioBuffer);
      }

      // Play the audio
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
      currentSourceRef.current = source;

      source.onended = () => {
        currentSourceRef.current = null;
      };
    } catch (error) {
      console.error("Failed to play breathing audio:", error);
      // Fallback to browser speech synthesis
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 0.9;
        utterance.volume = 0.7;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {}
      currentSourceRef.current = null;
    }
    // Also stop any fallback speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return { speak, stop };
}
