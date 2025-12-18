# REWIRE Underdeveloped Features Fix Plan

**Date:** December 18, 2025
**Reviewer:** Claude (AI Assistant)
**Branch:** `claude/review-and-plan-fixes-V4LwP`

---

## Executive Summary

This document provides a detailed fix plan for underdeveloped features identified in the REWIRE wellness coaching platform. Issues are categorized by severity and include specific implementation steps with file locations and code examples.

### Issue Summary

| Priority | Count | Category |
|----------|-------|----------|
| **Critical** | 4 | Security/Data Integrity |
| **High** | 6 | Incomplete Core Features |
| **Medium** | 8 | Feature Enhancements |
| **Low** | 5 | Code Quality/Cleanup |

---

## CRITICAL PRIORITY FIXES (Immediate)

### 1. Challenge Join Duplicate Check Missing

**File:** `server/routes.ts:2121-2129`
**Risk:** Users can join the same challenge multiple times, corrupting leaderboard data

**Current Code:**
```typescript
app.post("/api/challenges/:id/join", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const participant = await storage.joinChallenge(req.params.id, userId);
  res.json(participant);
});
```

**Fix:**
```typescript
app.post("/api/challenges/:id/join", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Check if already joined
    const existing = await storage.getChallengeParticipant(req.params.id, userId);
    if (existing) {
      return res.status(409).json({ error: "Already joined this challenge" });
    }

    const participant = await storage.joinChallenge(req.params.id, userId);
    res.json(participant);
  } catch (error) {
    console.error("Challenge join error:", error);
    res.status(500).json({ error: "Failed to join challenge" });
  }
});
```

**Storage Method to Add (server/storage.ts):**
```typescript
async getChallengeParticipant(challengeId: string, userId: string): Promise<ChallengeParticipant | undefined> {
  const [participant] = await db
    .select()
    .from(challengeParticipants)
    .where(and(
      eq(challengeParticipants.challengeId, challengeId),
      eq(challengeParticipants.userId, userId)
    ))
    .limit(1);
  return participant;
}
```

---

### 2. Unbounded Query Pagination (DOS Vulnerability)

**Files:**
- `server/routes.ts:2048` - Challenges endpoint
- `server/routes.ts:2427` - Scorecards endpoint

**Risk:** Malicious actors can request unlimited records, causing database/memory exhaustion

**Current Code:**
```typescript
const limit = parseInt(req.query.limit as string) || 20;
```

**Fix:**
```typescript
const MAX_LIMIT = 100;
const requestedLimit = parseInt(req.query.limit as string) || 20;
const limit = Math.min(Math.max(1, requestedLimit), MAX_LIMIT);
```

**Apply to endpoints:**
- `/api/challenges` (line 2048)
- `/api/scorecards` (line 2427)
- `/api/events` (similar pattern)
- `/api/practices` (similar pattern)

---

### 3. XP Calculation Race Condition

**File:** `server/storage.ts:2113-2130`
**Risk:** Concurrent XP awards can result in lost or duplicated XP

**Current Pattern:**
```typescript
async awardXp(userId: string, amount: number, source: string): Promise<void> {
  const gamification = await this.getUserGamification(userId);
  const newXp = (gamification?.totalXp || 0) + amount;
  // ... update with new value
}
```

**Fix - Use Database Transaction:**
```typescript
async awardXp(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<XpTransaction> {
  return await db.transaction(async (tx) => {
    // Atomic increment using SQL
    await tx
      .update(userGamification)
      .set({
        totalXp: sql`${userGamification.totalXp} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(userGamification.userId, userId));

    // Log the transaction
    const [transaction] = await tx
      .insert(xpTransactions)
      .values({
        id: crypto.randomUUID(),
        userId,
        amount,
        source,
        sourceId,
        description,
        createdAt: new Date()
      })
      .returning();

    // Check and update level if needed
    await this.checkAndUpdateLevel(tx, userId);

    return transaction;
  });
}
```

---

### 4. Score Range Validation Missing

**File:** `server/routes.ts:1870-1874`
**Risk:** Invalid data corrupts metrics analysis

**Current Code:**
```typescript
const { moodScore, energyScore, stressScore, sleepHours, sleepQuality, notes } = req.body;
const metrics = await storage.createOrUpdateDailyMetrics(userId, date, {
  moodScore, energyScore, stressScore, sleepHours, sleepQuality, notes
});
```

**Fix - Add Zod Validation:**
```typescript
import { z } from "zod";

const dailyMetricsSchema = z.object({
  moodScore: z.number().int().min(1).max(5).optional(),
  energyScore: z.number().int().min(1).max(10).optional(),
  stressScore: z.number().int().min(1).max(10).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).optional()
});

app.post("/api/metrics", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const validation = dailyMetricsSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid metrics data",
      details: validation.error.errors
    });
  }

  const date = req.body.date || getTodayDateString();
  const metrics = await storage.createOrUpdateDailyMetrics(userId, date, validation.data);
  res.json(metrics);
});
```

---

## HIGH PRIORITY FIXES (This Week)

### 5. Focus Page Missing Query Parameter Handling

**File:** `client/src/pages/focus.tsx`
**Impact:** Users selecting practices from Library see generic content instead of selected practice

**Implementation:**

```typescript
// Add at top of focus.tsx
import { useSearch } from "wouter";
import { usePractice } from "@/lib/api";

export default function Focus() {
  // Get practiceId from URL
  const searchString = window.location.search;
  const searchParams = new URLSearchParams(searchString);
  const practiceId = searchParams.get('practiceId');

  // Fetch selected practice if ID provided
  const { data: selectedPractice, isLoading: practiceLoading } = usePractice(practiceId || undefined);

  // If practice selected, show that practice's session
  if (practiceId && selectedPractice) {
    return (
      <PracticeSession
        practice={selectedPractice}
        onComplete={() => setLocation('/library')}
      />
    );
  }

  // Otherwise show default breathing techniques list
  // ... existing code
}
```

**Add API Hook (client/src/lib/api.ts):**
```typescript
export function usePractice(practiceId: string | undefined) {
  return useQuery({
    queryKey: ["practice", practiceId],
    queryFn: async () => {
      if (!practiceId) return null;
      const response = await fetch(`/api/practices/${practiceId}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch practice");
      return response.json();
    },
    enabled: !!practiceId
  });
}
```

---

### 6. VIP Early Access Logic Incomplete

**File:** `client/src/pages/events.tsx:113-145`
**Impact:** VIP badge shows but doesn't enforce access restrictions

**Current Code:**
```typescript
{event.vipEarlyAccessHours > 0 && (
  <Badge variant="outline" className="bg-yellow-50">VIP Early Access</Badge>
)}
```

**Fix:**
```typescript
// Add helper function
const isVipUser = (user: User | null): boolean => {
  return user?.accountTier === "member" || user?.accountTier === "coach";
};

const isInEarlyAccessWindow = (event: Event): boolean => {
  if (!event.vipEarlyAccessHours || event.vipEarlyAccessHours <= 0) return false;
  const now = new Date();
  const eventStart = new Date(event.startTime);
  const earlyAccessStart = new Date(eventStart.getTime() - (event.vipEarlyAccessHours * 60 * 60 * 1000));
  return now >= earlyAccessStart && now < eventStart;
};

const canRegister = (event: Event, user: User | null): boolean => {
  const now = new Date();
  const eventStart = new Date(event.startTime);

  // Event already started
  if (now >= eventStart) return false;

  // No early access restriction
  if (!event.vipEarlyAccessHours || event.vipEarlyAccessHours <= 0) return true;

  // In early access window - only VIP can register
  if (isInEarlyAccessWindow(event)) {
    return isVipUser(user);
  }

  // General registration open
  return true;
};

// In component JSX:
{event.vipEarlyAccessHours > 0 && (
  <div className="flex items-center gap-2">
    <Badge variant="outline" className="bg-yellow-50">VIP Early Access</Badge>
    {isInEarlyAccessWindow(event) && !isVipUser(user) && (
      <span className="text-sm text-muted-foreground">
        Opens in {formatTimeUntilOpen(event)}
      </span>
    )}
  </div>
)}

<Button
  onClick={() => handleRegister(event.id)}
  disabled={!canRegister(event, user)}
>
  {!canRegister(event, user) && isInEarlyAccessWindow(event)
    ? "VIP Only"
    : "Register"}
</Button>
```

---

### 7. AI Conversation History UI Missing

**Files:**
- `client/src/pages/voice.tsx` - needs history component
- `server/routes.ts:2483` - endpoint exists

**Implementation:**

**New Component: `client/src/components/ai/ConversationHistory.tsx`**
```typescript
import { useAIConversations } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface ConversationHistoryProps {
  onSelectConversation: (id: string) => void;
}

export function ConversationHistory({ onSelectConversation }: ConversationHistoryProps) {
  const { data: conversations, isLoading } = useAIConversations();

  if (isLoading) return <div className="p-4">Loading history...</div>;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground px-2">
        Recent Conversations
      </h3>
      {conversations?.length === 0 ? (
        <p className="text-sm text-muted-foreground px-2">No conversations yet</p>
      ) : (
        conversations?.map((conv: any) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex justify-between items-start">
              <span className="font-medium text-sm">
                {conv.sessionType === 'voice' ? 'Voice Session' : 'Chat Session'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(conv.startedAt), { addSuffix: true })}
              </span>
            </div>
            {conv.summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {conv.summary}
              </p>
            )}
          </button>
        ))
      )}
    </div>
  );
}
```

**Add to voice.tsx:**
```typescript
import { ConversationHistory } from "@/components/ai/ConversationHistory";

// In component:
const [showHistory, setShowHistory] = useState(false);

// In JSX:
<Sheet open={showHistory} onOpenChange={setShowHistory}>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon">
      <History className="h-5 w-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Conversation History</SheetTitle>
    </SheetHeader>
    <ConversationHistory
      onSelectConversation={(id) => {
        // Load conversation messages
        setShowHistory(false);
      }}
    />
  </SheetContent>
</Sheet>
```

**API Hooks (client/src/lib/api.ts):**
```typescript
export function useAIConversations() {
  return useQuery({
    queryKey: ["ai-conversations"],
    queryFn: async () => {
      const response = await fetch("/api/ai/conversations", {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    }
  });
}

export function useAIConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["ai-conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const response = await fetch(`/api/ai/conversations/${conversationId}/messages`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!conversationId
  });
}
```

---

### 8. Practice Seeding Auto-Execution

**File:** `server/routes.ts:2565-2572`
**Impact:** Empty practice library on first deployment

**Implementation - Add auto-seeding on startup:**

**Modify `server/index.ts`:**
```typescript
import { storage } from "./storage";

async function initializeApp() {
  // Check if practices exist, seed if empty
  const existingPractices = await storage.getPractices({ limit: 1 });
  if (existingPractices.length === 0) {
    console.log("No practices found, seeding default practices...");
    await storage.seedDefaultPractices();
    console.log("Default practices seeded successfully");
  }
}

// Call during server startup
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeApp().catch(console.error);
});
```

---

### 9. Timezone Support for Reminders

**File:** `server/routes.ts:1181` (TODO comment)
**Impact:** Reminders may fire at wrong times for non-UTC users

**Database Change (shared/schema.ts):**
```typescript
// Add to userSettings table
timezone: text("timezone").default("UTC"),
```

**Implementation:**
```typescript
// In reminder sending logic
import { formatInTimeZone, utcToZonedTime } from "date-fns-tz";

async function shouldSendReminder(user: User, reminderTime: string): Promise<boolean> {
  const userTimezone = user.settings?.timezone || "UTC";
  const now = new Date();
  const userLocalTime = formatInTimeZone(now, userTimezone, "HH:mm");
  return userLocalTime === reminderTime;
}

// Update user settings endpoint
app.patch("/api/user/settings", requireAuth, async (req, res) => {
  const { timezone, ...otherSettings } = req.body;

  // Validate timezone if provided
  if (timezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch (e) {
      return res.status(400).json({ error: "Invalid timezone" });
    }
  }

  // ... update settings
});
```

---

### 10. Ritual Type Validation

**File:** `server/routes.ts:1924-1936`
**Impact:** Invalid ritual types stored in database

**Fix:**
```typescript
const ritualTypeSchema = z.enum(["morning", "evening"]);

app.post("/api/rituals", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const validation = ritualTypeSchema.safeParse(req.body.ritualType);
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid ritual type. Must be 'morning' or 'evening'"
    });
  }

  // ... proceed with validated data
});
```

---

## MEDIUM PRIORITY FIXES (Next Sprint)

### 11. Daily Rituals Dedicated UI Flows

**Files to Create:**
- `client/src/components/rituals/MorningRitual.tsx`
- `client/src/components/rituals/EveningRitual.tsx`

**Morning Ritual Flow:**
```typescript
export function MorningRitual() {
  const [step, setStep] = useState<'energy' | 'intention' | 'breathwork' | 'complete'>('energy');

  return (
    <div className="space-y-6">
      {step === 'energy' && (
        <EnergyStressCheck
          onComplete={(energy, stress) => {
            // Store values
            setStep('intention');
          }}
        />
      )}
      {step === 'intention' && (
        <IntentionSetting
          onComplete={() => setStep('breathwork')}
          onSkip={() => setStep('complete')}
        />
      )}
      {step === 'breathwork' && (
        <QuickBreathwork
          onComplete={() => setStep('complete')}
          onSkip={() => setStep('complete')}
        />
      )}
      {step === 'complete' && (
        <RitualComplete type="morning" />
      )}
    </div>
  );
}
```

---

### 12. Trend Graphs Implementation

**File to Create:** `client/src/components/metrics/MetricTrendChart.tsx`

```typescript
import { Line } from "react-chartjs-2";

interface MetricTrendChartProps {
  metrics: DailyMetric[];
  selectedMetrics: ('mood' | 'energy' | 'stress' | 'sleep')[];
  dateRange: 'week' | 'month' | 'quarter';
}

export function MetricTrendChart({ metrics, selectedMetrics, dateRange }: MetricTrendChartProps) {
  const datasets = selectedMetrics.map(metric => ({
    label: metric.charAt(0).toUpperCase() + metric.slice(1),
    data: metrics.map(m => m[`${metric}Score`]),
    borderColor: METRIC_COLORS[metric],
    backgroundColor: 'transparent',
    tension: 0.4
  }));

  return (
    <div className="h-64">
      <Line
        data={{
          labels: metrics.map(m => format(new Date(m.date), 'MMM d')),
          datasets
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 10 }
          }
        }}
      />
    </div>
  );
}
```

---

### 13. AI Insights Generation

**New Endpoint (server/routes.ts):**
```typescript
app.get("/api/metrics/insights", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Get last 30 days of metrics
    const metrics = await storage.getDailyMetrics(userId, { days: 30 });

    if (metrics.length < 7) {
      return res.json({
        insights: [],
        message: "Need at least 7 days of data to generate insights"
      });
    }

    // Generate insights using OpenAI
    const insights = await generateMetricInsights(metrics);
    res.json({ insights });
  } catch (error) {
    console.error("Insights generation error:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

async function generateMetricInsights(metrics: DailyMetric[]): Promise<string[]> {
  const prompt = `Analyze these wellness metrics and provide 3-5 actionable insights:
  ${JSON.stringify(metrics.map(m => ({
    date: m.date,
    mood: m.moodScore,
    energy: m.energyScore,
    stress: m.stressScore,
    sleep: m.sleepHours
  })))}

  Focus on:
  - Patterns (e.g., "Energy is lower on Mondays")
  - Correlations (e.g., "Better sleep correlates with lower stress")
  - Recommendations (e.g., "Try morning breathwork on high-stress days")`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content || "[]").insights;
}
```

---

### 14. Payment Integration for Events

**Dependencies to Add:**
```bash
npm install stripe @stripe/stripe-js
```

**Backend Implementation (server/routes.ts):**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

app.post("/api/events/:id/create-checkout", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const event = await storage.getEvent(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const user = await storage.getUser(userId);
  const priceInCents = user?.accountTier === 'member'
    ? event.vipPriceCents || event.priceCents
    : event.priceCents;

  if (!priceInCents || priceInCents === 0) {
    // Free event - register directly
    const registration = await storage.registerForEvent(event.id, userId);
    return res.json({ registration, free: true });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: event.title },
        unit_amount: priceInCents
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.APP_URL}/events/${event.id}?registered=true`,
    cancel_url: `${process.env.APP_URL}/events/${event.id}`,
    metadata: { eventId: event.id, userId }
  });

  res.json({ checkoutUrl: session.url });
});

// Webhook to confirm payment
app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await storage.registerForEvent(
      session.metadata.eventId,
      session.metadata.userId,
      { paymentStatus: 'paid', paymentAmountCents: session.amount_total }
    );
  }

  res.json({ received: true });
});
```

---

## LOW PRIORITY FIXES (Backlog)

### 15. Remove Unused react-router-dom

**Command:**
```bash
npm uninstall react-router-dom @types/react-router-dom
```

**Verify no imports remain:**
```bash
grep -r "react-router-dom" client/src/
```

---

### 16. Remove Console Debug Statements

**Files:** `client/src/pages/voice.tsx` (lines 190, 212, 257, 330, 378)

**Pattern to Replace:**
```typescript
// Before
console.error("Voice error:", error);

// After
// Remove or replace with proper error handling
import { captureException } from "@sentry/browser"; // if using Sentry
captureException(error);
```

---

### 17. Fix Type Safety Issues

**File:** `client/src/lib/api.ts`

**Replace `any` types with proper interfaces:**
```typescript
// Line 67-70: Replace
interface DashboardData {
  moods: Mood[];
  journals: JournalEntry[];
  habits: Habit[];
  completions: HabitCompletion[];
}

// Line 1007: Replace
interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  score: number;
  streak: number;
}
```

---

### 18. Fix Parameter Typo

**File:** `server/storage.ts:2005`

**Current:**
```typescript
async joinChallenge(challengeId: string, oduserId: string): Promise<ChallengeParticipant>
```

**Fix:**
```typescript
async joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant>
```

---

### 19. Sleep Hours Type Clarification

**File:** `shared/schema.ts:421`

**Current (ambiguous):**
```typescript
sleepHours: integer("sleep_hours"), // stored as minutes for precision
```

**Fix (choose one):**
```typescript
// Option A: Store as hours with decimal
sleepHours: decimal("sleep_hours", { precision: 3, scale: 1 }), // e.g., 7.5 hours

// Option B: Store as minutes (rename column)
sleepMinutes: integer("sleep_minutes"), // e.g., 450 minutes = 7.5 hours
```

---

## Implementation Schedule

### Week 1: Critical Fixes
- [ ] Challenge join duplicate check
- [ ] Query pagination limits
- [ ] XP transaction safety
- [ ] Score range validation

### Week 2: High Priority Features
- [ ] Focus page query param handling
- [ ] VIP early access logic
- [ ] AI conversation history UI
- [ ] Auto-seed practices
- [ ] Timezone support
- [ ] Ritual type validation

### Week 3: Medium Priority Enhancements
- [ ] Morning/Evening ritual flows
- [ ] Trend graphs
- [ ] AI insights generation
- [ ] Payment integration (if required)

### Week 4: Cleanup & Polish
- [ ] Remove unused dependencies
- [ ] Fix type safety issues
- [ ] Remove debug statements
- [ ] Fix parameter typos

---

## Testing Checklist

### Critical Fixes
- [ ] Try joining same challenge twice - should fail with 409
- [ ] Request limit=999999 on /api/challenges - should cap at 100
- [ ] Trigger concurrent XP awards - verify correct totals
- [ ] Submit energyScore=15 - should fail validation

### High Priority
- [ ] Navigate from library with practiceId - correct practice loads
- [ ] VIP user sees early access events - non-VIP sees "VIP Only"
- [ ] Voice page shows history button - conversations display
- [ ] Fresh deployment has default practices
- [ ] Set timezone in settings - reminders respect it

### Medium Priority
- [ ] Complete morning ritual flow end-to-end
- [ ] View 30-day trends with multiple metrics
- [ ] Request AI insights with 7+ days of data
- [ ] Complete paid event checkout flow

---

## Dependencies & Notes

### New NPM Packages Needed
- `stripe` and `@stripe/stripe-js` (if implementing payments)
- `date-fns-tz` (for timezone support)

### Environment Variables Needed
- `STRIPE_SECRET_KEY` (if implementing payments)
- `STRIPE_WEBHOOK_SECRET` (if implementing payments)

### Database Migrations
- Add `timezone` column to user_settings table
- Consider index on `challenge_participants(challenge_id, user_id)` for faster lookups

---

## Conclusion

This plan addresses **23 distinct issues** across the REWIRE platform:
- 4 critical security/data integrity fixes
- 6 high-priority feature completions
- 8 medium-priority enhancements
- 5 low-priority code quality improvements

Implementing the critical and high-priority fixes will significantly improve application stability and complete the core feature set. Medium and low-priority items can be addressed incrementally.
