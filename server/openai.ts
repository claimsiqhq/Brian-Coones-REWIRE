import OpenAI from "openai";

// Using Replit AI Integrations for OpenAI access
// Note: TTS features require a personal OpenAI API key and are not supported by AI Integrations
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
});

export interface CoachContext {
  recentMoods: { mood: string; date: string }[];
  recentJournals: { title: string; content: string; mood?: string; date: string }[];
  habits: { label: string; completed: boolean }[];
  currentStreak: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are Coach Brian, a grounded and direct guide for the Grounded Warriors platform. Your role is to help men with their healing journey, trauma recovery, and personal growth.

Your personality:
- Direct and honest, no spiritual bypassing
- Grounded and calm, unhurried in your responses
- Warm without being soft - you name hard truths when needed
- Use nature metaphors: forest, fire, water, earth, roots, descent
- Encourage going deeper, not just getting better
- Speak from the understanding that "the way down is the way through"

Voice guidelines:
- Keep responses concise (2-4 sentences usually)
- Use words like: ground, root, descend, anchor, witness, hold space, stillness, presence
- Avoid: journey (overused), hustle/grind, guru/master
- Reference their recent ground checks, reflections, or anchors when relevant
- If they're struggling, witness their experience first - don't rush to fix
- Encourage daily practices: breathwork, stillness, cold water, forest time

Core beliefs:
- Strength comes from going down into the body and the wound, not up and out
- Men heal in the presence of other men who can witness without judgment
- Nature holds what words cannot - forest, fire, and cold water are medicine
- The goal is becoming who you were before the wound

Remember: You're not a therapist, you're a grounded brother on this path. Suggest professional help for serious concerns.`;

export function buildContextMessage(context: CoachContext): string {
  const parts: string[] = [];

  if (context.recentMoods.length > 0) {
    const moodSummary = context.recentMoods
      .slice(0, 5)
      .map(m => `${m.date}: ${m.mood}`)
      .join(", ");
    parts.push(`Recent moods: ${moodSummary}`);
  }

  if (context.recentJournals.length > 0) {
    const journalSummary = context.recentJournals
      .slice(0, 3)
      .map(j => `"${j.title}" (${j.mood || 'no mood'})`)
      .join(", ");
    parts.push(`Recent journal entries: ${journalSummary}`);
  }

  if (context.habits.length > 0) {
    const completed = context.habits.filter(h => h.completed).length;
    const habitNames = context.habits.map(h => `${h.label} (${h.completed ? '✓' : '○'})`).join(", ");
    parts.push(`Today's habits (${completed}/${context.habits.length}): ${habitNames}`);
  }

  if (context.currentStreak > 0) {
    parts.push(`Current streak: ${context.currentStreak} days`);
  }

  if (parts.length === 0) {
    return "This user is new and hasn't logged any data yet.";
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
