import OpenAI from "openai";

// Using Replit AI Integrations for OpenAI access
// Note: TTS features require a personal OpenAI API key and are not supported by AI Integrations
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
});

export interface CoachContext {
  recentMoods: { mood: string; date: string; energyLevel?: number; stressLevel?: number }[];
  recentJournals: { title: string; content: string; mood?: string; date: string }[];
  habits: { label: string; completed: boolean }[];
  currentStreak: number;
  moodTrends?: {
    avgMood: number;
    avgEnergy: number;
    avgStress: number;
    moodTrend: 'improving' | 'declining' | 'stable';
    energyTrend: 'improving' | 'declining' | 'stable';
    stressTrend: 'improving' | 'declining' | 'stable';
    totalCheckins: number;
  };
  habitPatterns?: {
    completionRate: number;
    strongHabits: string[];
    strugglingHabits: string[];
    totalCompleted: number;
    totalPossible: number;
  };
  goals?: { goalType: string; isActive: boolean }[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are Coach Brian, a direct and grounded guide for the REWIRE personal transformation platform. Your role is to help men rewire their mindset, break limiting patterns, and achieve meaningful personal growth.

Your personality:
- Direct and honest, no sugarcoating
- Grounded and calm, unhurried in your responses
- Warm without being soft - you name hard truths when needed
- Solution-oriented while honoring the process
- Encourage transformation through consistent action

Voice guidelines:
- Keep responses concise (2-4 sentences usually)
- Use words like: rewire, transform, breakthrough, pattern, anchor, presence, clarity, shift
- Avoid: journey (overused), hustle/grind, guru/master
- Reference their recent ground checks, reflections, or anchors when relevant
- If they're struggling, acknowledge their experience first - don't rush to fix
- Encourage daily practices: breathwork, reflection, movement, focused action

Information gathering approach:
- When the user shares a challenge, ask clarifying questions to understand the full picture
- Explore: What triggered this? How long has this been happening? What have they tried?
- Look for patterns: Is this recurring? Connected to specific situations or relationships?
- Assess readiness: Are they seeking awareness, strategies, or accountability?
- Consider context: Time of day, recent mood patterns, habit consistency, stress levels
- Connect the dots: Link current struggles to past reflections or mood trends when available

Insight generation:
- Synthesize patterns from their ground checks, energy levels, and stress data
- Identify correlations between habits completed and mood improvements
- Notice when external factors (time of day, consistency) affect their state
- Offer observations about what you notice, not just advice
- Help them see blind spots in their own patterns

Core beliefs:
- Real change happens through consistent daily practice
- Men transform in the presence of other men who can witness without judgment
- The goal is becoming the man you're capable of being
- Mindset shifts create lifestyle shifts

Remember: You're not a therapist, you're a coach on this path. Suggest professional help for serious concerns.`;

export function buildContextMessage(context: CoachContext): string {
  const parts: string[] = [];

  // Current time context for personalized responses
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  parts.push(`Current context: ${dayOfWeek} ${timeOfDay} (${hour}:00)`);

  // 14-day mood/energy/stress trends (most important for personalization)
  if (context.moodTrends && context.moodTrends.totalCheckins > 0) {
    const trendArrow = (trend: string) => trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';
    const { avgMood, avgEnergy, avgStress, moodTrend, energyTrend, stressTrend, totalCheckins } = context.moodTrends;
    
    parts.push(`14-day trends (${totalCheckins} check-ins): Mood ${avgMood}/5 ${trendArrow(moodTrend)}, Energy ${avgEnergy}/5 ${trendArrow(energyTrend)}, Stress ${avgStress}/5 ${trendArrow(stressTrend)}`);
    
    // Add specific insights based on trends
    if (moodTrend === 'declining') {
      parts.push("Note: Mood has been declining - explore what's weighing on them");
    } else if (moodTrend === 'improving') {
      parts.push("Note: Mood is improving - acknowledge their progress");
    }
    if (energyTrend === 'declining') {
      parts.push("Note: Energy has been declining - consider recommending energizing practices");
    } else if (energyTrend === 'improving') {
      parts.push("Note: Energy is improving - acknowledge this positive shift");
    }
    if (stressTrend === 'improving') {
      parts.push("Note: Stress levels are improving (going down) - acknowledge this progress");
    } else if (stressTrend === 'declining') {
      parts.push("Note: Stress levels are rising - consider recommending calming or grounding practices");
    }
  }

  // User goals for personalization
  if (context.goals && context.goals.length > 0) {
    const activeGoals = context.goals.filter(g => g.isActive).map(g => g.goalType.replace(/_/g, ' '));
    if (activeGoals.length > 0) {
      parts.push(`Active goals: ${activeGoals.join(", ")}`);
    }
  }

  // 14-day habit patterns
  if (context.habitPatterns && context.habitPatterns.totalPossible > 0) {
    const { completionRate, strongHabits, strugglingHabits } = context.habitPatterns;
    parts.push(`14-day habit completion: ${completionRate}%`);
    
    if (strongHabits.length > 0) {
      parts.push(`Strong habits: ${strongHabits.join(", ")}`);
    }
    if (strugglingHabits.length > 0) {
      parts.push(`Struggling with: ${strugglingHabits.join(", ")}`);
    }
  }

  // Today's habits status
  if (context.habits.length > 0) {
    const completed = context.habits.filter(h => h.completed).length;
    const habitNames = context.habits.map(h => `${h.label} (${h.completed ? '✓' : '○'})`).join(", ");
    parts.push(`Today's habits (${completed}/${context.habits.length}): ${habitNames}`);
  }

  // Current streak
  if (context.currentStreak > 0) {
    parts.push(`Current streak: ${context.currentStreak} days`);
  }

  // Recent moods with energy/stress details (last 3 for recent context)
  if (context.recentMoods.length > 0) {
    const moodSummary = context.recentMoods
      .slice(0, 3)
      .map(m => {
        let detail = `${m.date}: ${m.mood}`;
        if (m.energyLevel !== undefined || m.stressLevel !== undefined) {
          const extras = [];
          if (m.energyLevel !== undefined) extras.push(`E:${m.energyLevel}`);
          if (m.stressLevel !== undefined) extras.push(`S:${m.stressLevel}`);
          detail += ` (${extras.join(", ")})`;
        }
        return detail;
      })
      .join("; ");
    parts.push(`Recent check-ins: ${moodSummary}`);
  }

  // Recent journal themes
  if (context.recentJournals.length > 0) {
    const journalSummary = context.recentJournals
      .slice(0, 3)
      .map(j => `"${j.title}" (${j.mood || 'no mood'})`)
      .join(", ");
    parts.push(`Recent reflections: ${journalSummary}`);
  }

  if (parts.length === 0) {
    return "This user is new and hasn't logged any data yet. Be welcoming and encourage them to start tracking their ground checks and daily anchors.";
  }

  return parts.join(". ") + ".";
}

export async function getChatResponse(
  userMessage: string,
  context: CoachContext,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const contextMessage = buildContextMessage(context);
  
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `Current user context: ${contextMessage}` },
    ...conversationHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    })),
    { role: "user", content: userMessage }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for faster responses in chat
      messages,
      max_completion_tokens: 300,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content || "I'm here for you. Could you tell me more about what's on your mind?";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get response from coach");
  }
}

export async function textToSpeech(text: string, voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova"): Promise<Buffer> {
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd", // Higher quality TTS model for more natural sound
      voice: voice, // "nova" is warm and natural, good for breathing guidance
      input: text,
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error("OpenAI TTS error:", error);
    throw new Error("Failed to generate speech");
  }
}

const JOURNAL_PROMPTS_SYSTEM = `You are a grounded guide helping men with their reflection practice. Generate personalized journal prompts based on their recent activity and emotional state.

Guidelines:
- Create prompts that encourage deep self-examination and descent into truth
- Use direct, honest language - no spiritual bypassing
- Consider their recent ground checks, anchors, and reflections when relevant
- Vary prompts between: witnessing emotions, exploring wounds, honoring progress, connecting to nature
- Keep prompts concise (1-2 sentences each)
- Use nature metaphors when appropriate (forest, fire, water, earth, roots)
- Frame growth as descent rather than ascent

Return exactly 4 reflection prompts as a JSON array of strings.`;

export async function generateJournalPrompts(context: CoachContext): Promise<string[]> {
  const contextMessage = buildContextMessage(context);
  
  const defaultPrompts = [
    "What weight are you carrying that you haven't named yet?",
    "Where in your body do you feel most grounded right now?",
    "What would the man you're becoming say to the boy you were?",
    "What truth are you avoiding by staying busy?"
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: JOURNAL_PROMPTS_SYSTEM },
        { role: "user", content: `Generate personalized journal prompts based on this user context: ${contextMessage}` }
      ],
      max_completion_tokens: 300,
      temperature: 0.9,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return defaultPrompts;

    const parsed = JSON.parse(content);
    const prompts = parsed.prompts || parsed;
    
    if (Array.isArray(prompts) && prompts.length >= 3) {
      return prompts.slice(0, 4);
    }
    
    return defaultPrompts;
  } catch (error) {
    console.error("Failed to generate journal prompts:", error);
    return defaultPrompts;
  }
}
