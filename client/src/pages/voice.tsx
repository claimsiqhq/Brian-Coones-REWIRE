import { useState, useRef, useEffect, useCallback } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Volume2, VolumeX, Send, Phone, PhoneOff, Mic, Timer, CheckCircle2, Flame, Clock, History } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import coachImage from "@assets/IMG_4394_1764991487260.jpeg";
import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";
import { useTodayMicroSession, useCompleteMicroSession } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ConversationHistory } from "@/components/ai/ConversationHistory";

interface Message {
  id: number;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
  audioUrl?: string;
}

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
type VoiceMode = "off" | "on";
type SessionMode = "free-chat" | "daily-checkin";

const COACH_INSTRUCTIONS = `You are Coach Brian, a warm, empathetic, and supportive life coach for the MindfulCoach app. Your role is to help users with their personal growth, mindfulness, and emotional well-being.

Your personality:
- Warm and caring, like a trusted friend
- Non-judgmental and accepting
- Encouraging but realistic
- Ask thoughtful questions to help users reflect
- Celebrate small wins and progress
- Offer gentle suggestions, not prescriptions

Guidelines:
- Keep responses concise (2-4 sentences usually)
- If they're struggling, validate their feelings first
- Encourage them to use the app's features (journaling, mood tracking, habits)
- Never give medical advice - suggest professional help for serious concerns

Remember: You're not a therapist, you're a supportive coach focused on mindfulness and personal growth.`;

export default function Voice() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("off");
  const [sessionMode, setSessionMode] = useState<SessionMode>("free-chat");
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes = 300 seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm Coach Brian, your personal mindfulness companion. Click the phone button to start a voice conversation with me, or type a message below.",
      sender: "agent",
      timestamp: new Date(Date.now() - 60000),
    },
  ]);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processedHistoryRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const { data: microSessionData, refetch: refetchMicroSession } = useTodayMicroSession();
  const completeMicroSessionMutation = useCompleteMicroSession();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Timer countdown effect
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            // Timer complete - mark session as done
            handleMicroSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the micro session timer
  const startMicroSession = useCallback(() => {
    setSessionMode("daily-checkin");
    setTimerSeconds(300); // 5 minutes
    setIsTimerRunning(true);
    setSessionStartTime(Date.now());
    addMessage("Starting your 5-minute daily check-in. How are you feeling today? What's on your mind?", "agent");
  }, []);

  // Complete the micro session
  const handleMicroSessionComplete = useCallback(() => {
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 300;

    completeMicroSessionMutation.mutate(duration, {
      onSuccess: (data) => {
        toast({
          title: "Daily Check-in Complete!",
          description: `Great job! You're on a ${data.streak.current} day streak.`,
        });
        refetchMicroSession();
        addMessage("Great session! You've completed your daily check-in. Remember, small consistent steps lead to big changes. See you tomorrow!", "agent");
      }
    });

    setSessionMode("free-chat");
    setTimerSeconds(300);
    setSessionStartTime(null);
  }, [sessionStartTime, completeMicroSessionMutation, toast, refetchMicroSession]);

  // End micro session early
  const endMicroSessionEarly = useCallback(() => {
    const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;

    if (duration >= 60) { // At least 1 minute counts
      handleMicroSessionComplete();
    } else {
      setIsTimerRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setSessionMode("free-chat");
      setTimerSeconds(300);
      setSessionStartTime(null);
      toast({
        title: "Session ended",
        description: "Complete at least 1 minute for it to count toward your streak.",
      });
    }
  }, [sessionStartTime, handleMicroSessionComplete, toast]);

  const addMessage = useCallback((text: string, sender: "user" | "agent") => {
    const newMessage: Message = {
      id: Date.now() + Math.random(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const startVoiceSession = useCallback(async () => {
    if (connectionState === "connecting" || connectionState === "connected") return;
    
    setConnectionState("connecting");
    processedHistoryRef.current.clear();

    try {
      const response = await fetch('/api/coach/realtime-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to get session key');
      }

      const { ephemeralKey } = await response.json();
      
      if (!ephemeralKey) {
        throw new Error('No ephemeral key received');
      }

      const agent = new RealtimeAgent({
        name: 'Coach Brian',
        instructions: COACH_INSTRUCTIONS,
      });
      agentRef.current = agent;

      const session = new RealtimeSession(agent, {
        model: 'gpt-realtime',
      });
      sessionRef.current = session;

      session.on('error', () => {
        setConnectionState("error");
      });

      session.on('audio_start', () => {
        setIsAgentSpeaking(true);
      });

      session.on('audio_stopped', () => {
        setIsAgentSpeaking(false);
      });

      session.on('audio_interrupted', () => {
        setIsAgentSpeaking(false);
      });

      session.on('history_updated', (history) => {
        if (history && history.length > 0) {
          const lastItem = history[history.length - 1];
          // Check if lastItem is a message type (has role and content properties)
          if (lastItem && 'role' in lastItem && 'content' in lastItem) {
            const itemRole = lastItem.role as string;
            const itemContent = lastItem.content as unknown;
            const content = Array.isArray(itemContent) 
              ? (itemContent as { text?: string; transcript?: string }[]).map((c) => c.text || c.transcript || '').join('')
              : typeof itemContent === 'string' ? itemContent : '';
            
            if (content.trim()) {
              const sender = itemRole === 'user' ? 'user' : 'agent';
              const messageKey = `${sender}:${content.trim()}`;
              if (!processedHistoryRef.current.has(messageKey)) {
                processedHistoryRef.current.add(messageKey);
                addMessage(content.trim(), sender);
              }
            }
          }
        }
      });

      await session.connect({ apiKey: ephemeralKey });
      setConnectionState("connected");
      
      addMessage("Voice call connected! I can hear you now - go ahead and speak.", "agent");

    } catch {
      setConnectionState("error");
      addMessage("Voice calls are not available right now. Your OpenAI account may need Realtime API access enabled. Please use text chat below - I'm here to help!", "agent");
    }
  }, [connectionState, addMessage]);

  const stopVoiceSession = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {
        // Session may already be closed
      }
      sessionRef.current = null;
    }
    agentRef.current = null;
    setConnectionState("disconnected");
    setIsAgentSpeaking(false);
    setIsMuted(false);
    addMessage("Voice call ended. Feel free to start another call or continue with text.", "agent");
  }, [addMessage]);

  const toggleMute = useCallback(() => {
    if (sessionRef.current) {
      const newMutedState = !isMuted;
      sessionRef.current.mute(newMutedState);
      setIsMuted(newMutedState);
    }
  }, [isMuted]);

  const interruptAgent = useCallback(() => {
    if (sessionRef.current && isAgentSpeaking) {
      sessionRef.current.interrupt();
      setIsAgentSpeaking(false);
    }
  }, [isAgentSpeaking]);

  const playTTS = useCallback(async (text: string) => {
    try {
      setIsPlayingAudio(true);
      const response = await fetch('/api/coach/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch {
      setIsPlayingAudio(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
    }
  }, []);

  const voiceModeRef = useRef<VoiceMode>("off");
  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    addMessage(text.trim(), "user");
    setIsProcessing(true);

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text.trim(),
          conversationHistory: messages.slice(1).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      addMessage(data.response, "agent");
      
      if (voiceModeRef.current === "on") {
        playTTS(data.response);
      }
    } catch {
      addMessage("I'm having a moment of reflection. Could you try again?", "agent");
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, messages, playTTS]);

  const handleTextSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    
    const messageText = textInput.trim();
    setTextInput("");
    sendTextMessage(messageText);
  }, [textInput, isProcessing, sendTextMessage]);

  const toggleCall = useCallback(() => {
    if (connectionState === "connected" || connectionState === "connecting") {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  }, [connectionState, startVoiceSession, stopVoiceSession]);

  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        try {
          sessionRef.current.close();
        } catch {
          // Session may already be closed during cleanup
        }
      }
    };
  }, []);

  const getStatusText = () => {
    if (isProcessing) return "Thinking...";
    if (isPlayingAudio) return "Speaking...";
    if (connectionState === "connecting") return "Connecting...";
    if (connectionState === "connected") {
      if (isAgentSpeaking) return "Speaking...";
      if (isMuted) return "Muted";
      return "Listening...";
    }
    if (connectionState === "error") return "Connection failed";
    return voiceMode === "on" ? "Voice replies on" : "Ready to chat";
  };

  const isCallActive = connectionState === "connected" || connectionState === "connecting";

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-background">
        <div className="relative w-full shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-deep-pine via-deep-pine to-night-forest" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,197,160,0.1),transparent_50%)]" />
          
          <div className="relative p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white/30 shadow-lg" data-testid="avatar-coach">
                  <AvatarImage src={coachImage} className="object-cover" />
                  <AvatarFallback className="text-sm bg-forest-floor text-birch">CB</AvatarFallback>
                </Avatar>
                {connectionState === "connected" && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
              <div>
                <h1 className="text-birch text-lg font-display font-bold drop-shadow-sm">Coach Brian</h1>
                <p className="text-sage text-xs" data-testid="text-status">
                  {getStatusText()}
                </p>
              </div>
            </div>
            {/* Timer display for daily check-in */}
            {isTimerRunning && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <Timer className="w-4 h-4 text-white" />
                <span className="text-white font-mono font-bold text-sm">{formatTime(timerSeconds)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {/* Conversation History Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/20"
                    data-testid="button-history"
                    aria-label="View conversation history"
                  >
                    <History className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-night-forest border-forest-floor w-80">
                  <SheetHeader>
                    <SheetTitle className="text-birch">Conversation History</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 h-[calc(100%-60px)]">
                    <ConversationHistory />
                  </div>
                </SheetContent>
              </Sheet>
              {isPlayingAudio && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={stopAudio}
                  data-testid="button-stop-audio"
                  aria-label="Stop audio playback"
                >
                  <VolumeX className="w-5 h-5" />
                </Button>
              )}
              {connectionState !== "connected" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 hover:bg-white/20 ${voiceMode === "on" ? "text-green-300" : "text-white/80 hover:text-white"}`}
                  onClick={() => setVoiceMode(voiceMode === "on" ? "off" : "on")}
                  data-testid="button-toggle-voice-mode"
                  aria-label={voiceMode === "on" ? "Disable voice replies" : "Enable voice replies"}
                  aria-pressed={voiceMode === "on"}
                >
                  {voiceMode === "on" ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </Button>
              )}
              {connectionState === "connected" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={toggleMute}
                  data-testid="button-toggle-mute"
                  aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                  aria-pressed={isMuted}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-3" role="log" aria-label="Conversation with Coach Brian" aria-live="polite">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.id}`}
              >
                <Card
                  className={`max-w-[80%] px-4 py-3 shadow-sm ${
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-birch to-birch/80 text-night-forest border-none rounded-2xl rounded-br-md"
                      : "bg-deep-pine border-forest-floor/50 rounded-2xl rounded-bl-md"
                  }`}
                >
                  <p className={`text-sm leading-relaxed ${msg.sender === "user" ? "text-night-forest" : "text-birch"}`}>
                    {msg.text}
                  </p>
                  <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </Card>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <Card className="bg-white border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 bg-background shrink-0">
          {/* Daily Check-in Banner */}
          {!isTimerRunning && !microSessionData?.session?.completed && connectionState === "disconnected" && (
            <div className="mb-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">5-Min Daily Check-in</p>
                    <p className="text-xs text-amber-600">Start your mindful moment</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={startMicroSession}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white shadow-md"
                  data-testid="button-start-micro-session"
                >
                  Start
                </Button>
              </div>
            </div>
          )}

          {/* Completed Banner */}
          {microSessionData?.session?.completed && !isTimerRunning && (
            <div className="mb-3">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-800">Daily Check-in Complete!</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <Flame className="w-3 h-3" />
                    <span>{microSessionData.streak.current} day streak</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timer Running Controls */}
          {isTimerRunning && (
            <div className="mb-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md animate-pulse">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Session in Progress</p>
                    <p className="text-xs text-blue-600">{formatTime(timerSeconds)} remaining</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={endMicroSessionEarly}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  data-testid="button-end-micro-session"
                >
                  End Session
                </Button>
              </div>
            </div>
          )}

          {connectionState === "connected" && (
            <div className="mb-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isAgentSpeaking ? 'bg-blue-500' : 'bg-green-500'} animate-pulse`} />
                <span className="text-sm text-green-700 font-medium">
                  {isAgentSpeaking ? "Brian is speaking..." : isMuted ? "Microphone muted" : "Listening - speak anytime"}
                </span>
              </div>
              {isAgentSpeaking && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={interruptAgent}
                  className="text-xs"
                  data-testid="button-interrupt"
                >
                  Interrupt
                </Button>
              )}
            </div>
          )}
          
          <form onSubmit={handleTextSubmit} className="flex gap-2 items-center" role="search" aria-label="Send message to Coach Brian">
            <Button
              type="button"
              size="icon"
              className={`h-12 w-12 shrink-0 rounded-full transition-all shadow-lg ${
                isCallActive
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-br from-green-500 to-green-600 hover:opacity-90"
              }`}
              onClick={toggleCall}
              disabled={isProcessing}
              data-testid="button-toggle-call"
              aria-label={isCallActive ? "End voice call" : "Start voice call"}
            >
              {connectionState === "connecting" ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" aria-hidden="true" />
              ) : isCallActive ? (
                <PhoneOff className="w-5 h-5 text-white" aria-hidden="true" />
              ) : (
                <Phone className="w-5 h-5 text-white" aria-hidden="true" />
              )}
            </Button>
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={connectionState === "connected" ? "Voice active - or type here..." : "Type your message..."}
              className="flex-1 bg-white border-border/50 focus:border-primary h-11"
              disabled={isProcessing || connectionState === "connected"}
              data-testid="input-text-message"
              aria-label="Message to Coach Brian"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0 bg-gradient-to-br from-primary to-secondary hover:opacity-90 rounded-full shadow-md"
              disabled={!textInput.trim() || isProcessing || connectionState === "connected"}
              data-testid="button-send-message"
              aria-label="Send message"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-5 h-5" aria-hidden="true" />
              )}
            </Button>
          </form>
          {connectionState === "error" && (
            <p className="text-center text-red-500 text-xs mt-2">
              Voice connection failed. Please try again or use text chat.
            </p>
          )}
          {connectionState === "disconnected" && (
            <p className="text-center text-muted-foreground text-xs mt-2">
              Tap the green phone button to start a voice conversation
            </p>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
