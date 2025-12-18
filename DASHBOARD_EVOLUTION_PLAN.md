# REWIRE Dashboard Feature Evolution Plan

## Executive Summary

This document outlines the evolution of the REWIRE platform from its current state to the target feature set. The existing codebase is a **mature, well-architected coaching platform** built with React 19 + Vite (frontend), Express.js (backend), PostgreSQL + Drizzle ORM (database), and OpenAI integration (AI coaching).

---

## Feature Analysis: What Exists vs What Needs Building

---

## 1. Daily Rewire Rituals

### Target Features:
- Morning focus prompts
- Evening reflection journaling
- Breath cues or body scan timers
- Optional AI voice coach check-ins
- Tailor daily content based on energy state or stress level

### Current State: **~60% Exists**

| Component | Status | Notes |
|-----------|--------|-------|
| Morning/Evening prompts | **Partial** | Journal prompts exist via `/api/journal/prompts` (AI-generated), but not time-of-day aware |
| Reflection journaling | **Exists** | Full journal system at `/journal` page with mood tagging |
| Breath cues | **Exists** | 7 breathing techniques in `/focus` page with voice guidance |
| Body scan timers | **Missing** | Not implemented |
| AI voice coach check-ins | **Exists** | Micro-sessions at `/voice` page with 5-min daily check-ins |
| Energy/stress tailoring | **Partial** | Mood tracking exists (5 levels), but not used to tailor content |

### Changes Required:

**Database:**
```sql
-- Add time-of-day ritual tracking
CREATE TABLE daily_rituals (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  ritual_type VARCHAR(20) NOT NULL, -- 'morning' | 'evening'
  completed BOOLEAN DEFAULT FALSE,
  energy_level INTEGER, -- 1-10 scale
  stress_level INTEGER, -- 1-10 scale
  notes TEXT,
  completed_at TIMESTAMP
);

-- Add body scan practices table
CREATE TABLE body_scan_sessions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  duration_seconds INTEGER NOT NULL,
  focus_areas JSONB, -- array of body areas scanned
  notes TEXT,
  created_at TIMESTAMP
);
```

**Frontend Changes:**
1. **New Component: `MorningRitual.tsx`** - Morning focus flow with:
   - Energy/stress level check-in (new)
   - Daily intention setting (use existing journal prompts)
   - Quick breathwork option (link to `/focus`)
   - Morning quote (existing)

2. **New Component: `EveningRitual.tsx`** - Evening reflection flow with:
   - Day review prompt
   - Gratitude journaling
   - Stress release (existing Release feature)
   - Sleep preparation breathwork

3. **Enhance `home.tsx`** - Add ritual cards based on time of day:
   - Before noon: Show Morning Ritual card
   - After 6pm: Show Evening Ritual card
   - Track completion status

4. **New Component: `BodyScanTimer.tsx`** - Guided body scan with:
   - Selectable duration (5, 10, 15, 20 min)
   - Focus area progression
   - Optional voice guidance
   - Completion tracking

**API Endpoints:**
- `GET /api/rituals/today` - Get today's ritual status
- `POST /api/rituals` - Log ritual completion
- `GET /api/rituals/recommendations` - AI-powered content based on energy/stress
- `POST /api/body-scan` - Log body scan session

---

## 2. Guided Breathwork & Meditation Library

### Target Features:
- On-demand access to categorized practices (energizing, grounding, sleep, etc.)
- Flag favourites and track usage
- Short, medium, and long-duration options
- New monthly uploads to keep it fresh

### Current State: **~50% Exists**

| Component | Status | Notes |
|-----------|--------|-------|
| Breathing techniques | **Exists** | 7 techniques in `focus.tsx` with visual guides |
| Categories | **Partial** | Implicit in technique names, not filterable |
| Duration options | **Partial** | Fixed per technique, not user-selectable |
| Voice guidance | **Exists** | TTS via OpenAI |
| Ambient sounds | **Exists** | `useAmbientSound` hook |
| Favourites | **Missing** | Not implemented |
| Usage tracking | **Missing** | Not implemented |
| Meditation practices | **Missing** | Only breathing, no guided meditations |
| Content library | **Missing** | Hardcoded techniques, no CMS |

### Changes Required:

**Database:**
```sql
-- Practice library (replaces hardcoded techniques)
CREATE TABLE practices (
  id VARCHAR PRIMARY KEY,
  type VARCHAR(20) NOT NULL, -- 'breathing' | 'meditation' | 'body_scan'
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  category VARCHAR(30) NOT NULL, -- 'energizing' | 'grounding' | 'sleep' | 'focus' | 'stress_relief'
  duration_seconds INTEGER NOT NULL,
  duration_category VARCHAR(10), -- 'short' | 'medium' | 'long'
  icon_name TEXT,
  color_gradient TEXT,
  phases JSONB, -- For breathing: array of {phase, duration, label}
  audio_url TEXT, -- For meditation: audio file URL
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- User favorites
CREATE TABLE practice_favorites (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  practice_id VARCHAR NOT NULL REFERENCES practices(id),
  created_at TIMESTAMP,
  UNIQUE(user_id, practice_id)
);

-- Practice usage tracking
CREATE TABLE practice_sessions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  practice_id VARCHAR NOT NULL REFERENCES practices(id),
  duration_seconds INTEGER NOT NULL, -- Actual duration completed
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

**Frontend Changes:**
1. **Refactor `focus.tsx` → `library.tsx`** - Complete library page with:
   - Category filters (tabs: All, Energizing, Grounding, Sleep, Focus)
   - Duration filters (Short <5min, Medium 5-15min, Long 15min+)
   - Favorites section at top
   - "Recently Used" section
   - Search functionality

2. **New Component: `PracticeCard.tsx`** - Reusable card with:
   - Favorite toggle (heart icon)
   - Duration badge
   - Category tag
   - Usage count indicator

3. **New Component: `MeditationPlayer.tsx`** - Audio meditation player with:
   - Play/pause controls
   - Progress bar
   - Background audio support
   - Timer display

4. **Enhance `PracticeSession.tsx`** - Unified session view for:
   - Breathing (existing visual guide)
   - Meditation (audio player)
   - Body scan (guided prompts)

**API Endpoints:**
- `GET /api/practices` - List all practices with filters
- `GET /api/practices/:id` - Get single practice
- `POST /api/practices/:id/favorite` - Toggle favorite
- `POST /api/practices/:id/session` - Log session start
- `PATCH /api/practices/session/:id` - Update session (completion)
- `GET /api/practices/favorites` - Get user favorites
- `GET /api/practices/history` - Get usage history

**Admin Endpoints (for content management):**
- `POST /api/admin/practices` - Create practice
- `PATCH /api/admin/practices/:id` - Update practice
- `DELETE /api/admin/practices/:id` - Delete practice

---

## 3. Habit & Challenge Tracker

### Target Features:
- Create or join habit streaks (e.g., Cold Plunge 7-day challenge)
- Tie habits to energy/performance goals
- Daily reminders and micro-rewards for streaks
- Gamified "levels" to encourage engagement

### Current State: **~40% Exists**

| Component | Status | Notes |
|-----------|--------|-------|
| Habit creation | **Exists** | Via `habits` table |
| Daily completion | **Exists** | Via `habit_completions` table |
| Streak tracking | **Exists** | Current/best streaks in stats |
| Achievements | **Exists** | 8 achievements, basic badges |
| Challenges | **Missing** | No challenge/group system |
| Goals linking | **Missing** | Habits not tied to goals |
| Daily reminders | **Partial** | Email reminders exist, not habit-specific |
| Micro-rewards | **Missing** | No XP/points system |
| Gamified levels | **Missing** | No leveling system |

### Changes Required:

**Database:**
```sql
-- Challenges system
CREATE TABLE challenges (
  id VARCHAR PRIMARY KEY,
  created_by VARCHAR REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  habit_template TEXT NOT NULL, -- The habit to track
  duration_days INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  challenge_type VARCHAR(20) NOT NULL, -- 'public' | 'private' | 'coach'
  category VARCHAR(30), -- 'cold_exposure' | 'mindfulness' | 'fitness' | 'nutrition'
  goal_metric VARCHAR(30), -- 'energy' | 'stress' | 'sleep' | 'focus'
  max_participants INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);

-- Challenge participation
CREATE TABLE challenge_participants (
  id VARCHAR PRIMARY KEY,
  challenge_id VARCHAR NOT NULL REFERENCES challenges(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  joined_at TIMESTAMP,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'completed' | 'dropped'
  UNIQUE(challenge_id, user_id)
);

-- Challenge daily check-ins
CREATE TABLE challenge_checkins (
  id VARCHAR PRIMARY KEY,
  participant_id VARCHAR NOT NULL REFERENCES challenge_participants(id),
  date TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  energy_before INTEGER, -- 1-10
  energy_after INTEGER, -- 1-10
  created_at TIMESTAMP,
  UNIQUE(participant_id, date)
);

-- Gamification: User XP and Levels
CREATE TABLE user_gamification (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) UNIQUE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_to_next_level INTEGER DEFAULT 100,
  streak_multiplier DECIMAL(3,2) DEFAULT 1.0,
  updated_at TIMESTAMP
);

-- XP transaction log
CREATE TABLE xp_transactions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'habit_complete' | 'challenge_day' | 'streak_bonus' | 'achievement'
  source_id VARCHAR,
  description TEXT,
  created_at TIMESTAMP
);

-- Enhanced habits with goals
ALTER TABLE habits ADD COLUMN goal_metric VARCHAR(30); -- 'energy' | 'stress' | 'sleep' | 'focus'
ALTER TABLE habits ADD COLUMN reminder_time TEXT; -- HH:MM format
ALTER TABLE habits ADD COLUMN reminder_enabled BOOLEAN DEFAULT FALSE;
```

**Frontend Changes:**
1. **New Page: `/challenges`** - Challenge hub with:
   - Active challenges list
   - Available challenges to join
   - Create challenge (for coaches)
   - Leaderboards

2. **New Component: `ChallengeCard.tsx`** - Shows:
   - Challenge title and description
   - Days remaining
   - Participant count
   - User's progress if joined
   - Join/Leave button

3. **New Component: `ChallengeDetail.tsx`** - Full view:
   - Daily check-in interface
   - Streak visualization
   - Leaderboard
   - Energy/performance tracking chart
   - Participant list

4. **Enhance `home.tsx`** - Add:
   - Active challenge progress card
   - XP/Level indicator in header
   - Streak bonus notifications

5. **New Component: `LevelProgress.tsx`** - Gamification display:
   - Current level badge
   - XP progress bar
   - Next level preview
   - Recent XP gains

6. **Enhance habit cards** - Add:
   - Goal metric indicator
   - Reminder time setting
   - XP reward preview

**API Endpoints:**
- `GET /api/challenges` - List challenges (public + user's private)
- `GET /api/challenges/:id` - Get challenge details
- `POST /api/challenges` - Create challenge
- `POST /api/challenges/:id/join` - Join challenge
- `POST /api/challenges/:id/leave` - Leave challenge
- `POST /api/challenges/:id/checkin` - Daily check-in
- `GET /api/challenges/:id/leaderboard` - Get leaderboard
- `GET /api/user/gamification` - Get XP/level
- `GET /api/user/xp-history` - Get XP transactions

---

## 4. AI Micro-Coach (Chat or Voice)

### Target Features:
- Ask the AI coach how to regulate, reframe, or reset
- Voice or text-based interaction
- Personalized based on their Rewire goals
- Responds with mindfulness prompts, journal questions, or breath sequences

### Current State: **~70% Exists**

| Component | Status | Notes |
|-----------|--------|-------|
| Text chat | **Exists** | Via `/api/coach/chat` with OpenAI |
| Voice conversation | **Exists** | Real-time via OpenAI Realtime API |
| Micro-sessions | **Exists** | 5-min daily check-ins |
| Coach personality | **Exists** | System prompt in `openai.ts` |
| Goal personalization | **Partial** | Uses user data but not explicit goals |
| Action suggestions | **Missing** | Doesn't suggest specific practices |
| Quick actions | **Missing** | No "regulate/reframe/reset" buttons |
| Session history | **Partial** | Conversations not persisted |

### Changes Required:

**Database:**
```sql
-- User goals/focus areas
CREATE TABLE user_goals (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  goal_type VARCHAR(30) NOT NULL, -- 'stress_management' | 'energy' | 'focus' | 'sleep' | 'emotional_regulation'
  priority INTEGER DEFAULT 1,
  target_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);

-- AI conversation history
CREATE TABLE ai_conversations (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  session_type VARCHAR(20) NOT NULL, -- 'micro_session' | 'chat' | 'voice'
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  messages_count INTEGER DEFAULT 0,
  summary TEXT -- AI-generated session summary
);

-- AI conversation messages
CREATE TABLE ai_messages (
  id VARCHAR PRIMARY KEY,
  conversation_id VARCHAR NOT NULL REFERENCES ai_conversations(id),
  role VARCHAR(10) NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  suggested_action JSONB, -- {type: 'breathwork' | 'journal' | 'meditation', id: string}
  created_at TIMESTAMP
);

-- Quick action templates
CREATE TABLE coach_actions (
  id VARCHAR PRIMARY KEY,
  action_type VARCHAR(20) NOT NULL, -- 'regulate' | 'reframe' | 'reset'
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL, -- Template for AI
  suggested_practice_id VARCHAR REFERENCES practices(id),
  is_active BOOLEAN DEFAULT TRUE
);
```

**Frontend Changes:**
1. **Enhance `/voice` page** - Add:
   - Quick action buttons: "Regulate", "Reframe", "Reset"
   - Goal context display
   - Suggested practice cards after AI response
   - Session summary at end

2. **New Component: `QuickCoachActions.tsx`** - Floating action buttons:
   - Regulate (calm anxiety, reduce stress)
   - Reframe (perspective shift, cognitive reframe)
   - Reset (energy boost, mental clarity)
   - Each triggers specific AI prompt

3. **Enhance `CoachChat.tsx`** - Add:
   - Practice suggestion cards inline
   - "Start breathwork" / "Write journal" quick actions
   - Goal selector at start of session

4. **New Component: `SessionSummary.tsx`** - End of session:
   - Key takeaways
   - Recommended practices
   - Save to journal option
   - Follow-up reminder

**API Changes:**
- `GET /api/user/goals` - Get user's active goals
- `POST /api/user/goals` - Set goals
- `POST /api/coach/quick-action` - Trigger quick action (regulate/reframe/reset)
- `GET /api/coach/conversations` - Get conversation history
- `GET /api/coach/conversations/:id` - Get full conversation
- **Enhance `/api/coach/chat`** - Include:
  - User goals in system prompt
  - Recent mood/energy data
  - Suggested practice IDs in response

---

## 5. Events & Booking Hub

### Target Features:
- See and register for upcoming retreats, webinars, and masterclasses
- Add to calendar with reminders
- Access event recordings (when available)
- VIP client early access or discounts

### Current State: **~20% Exists**

| Component | Status | Notes |
|-----------|--------|-------|
| Session scheduling | **Exists** | 1-on-1 coaching sessions only |
| Google Calendar | **Exists** | Integration for sessions |
| Event registration | **Missing** | No group events |
| Event recordings | **Missing** | No video/recording system |
| VIP access | **Missing** | No tier-based access |
| Event reminders | **Missing** | No event-specific reminders |

### Changes Required:

**Database:**
```sql
-- Events table
CREATE TABLE events (
  id VARCHAR PRIMARY KEY,
  created_by VARCHAR REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type VARCHAR(30) NOT NULL, -- 'retreat' | 'webinar' | 'masterclass' | 'workshop' | 'group_session'
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  timezone TEXT DEFAULT 'UTC',
  location_type VARCHAR(20) NOT NULL, -- 'virtual' | 'in_person' | 'hybrid'
  location_details TEXT, -- Address or video link
  max_participants INTEGER,
  price_cents INTEGER DEFAULT 0,
  vip_price_cents INTEGER, -- Discounted VIP price
  vip_early_access_hours INTEGER DEFAULT 0, -- Hours before public
  image_url TEXT,
  recording_url TEXT, -- After event
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Event registrations
CREATE TABLE event_registrations (
  id VARCHAR PRIMARY KEY,
  event_id VARCHAR NOT NULL REFERENCES events(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'registered', -- 'registered' | 'attended' | 'cancelled' | 'no_show'
  payment_status VARCHAR(20), -- 'pending' | 'paid' | 'refunded'
  payment_amount_cents INTEGER,
  calendar_event_id TEXT, -- Google Calendar ID
  reminder_sent BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Event categories/tags
CREATE TABLE event_tags (
  id VARCHAR PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT
);

CREATE TABLE event_tag_assignments (
  event_id VARCHAR NOT NULL REFERENCES events(id),
  tag_id VARCHAR NOT NULL REFERENCES event_tags(id),
  PRIMARY KEY(event_id, tag_id)
);

-- VIP status (or use accountTier from users)
ALTER TABLE users ADD COLUMN is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN vip_since TIMESTAMP;
```

**Frontend Changes:**
1. **New Page: `/events`** - Events hub:
   - Upcoming events list
   - Category/type filters
   - Calendar view toggle
   - "My Registrations" tab
   - Past events with recordings

2. **New Component: `EventCard.tsx`** - Shows:
   - Event image
   - Title, date, time
   - Event type badge
   - Price (or "Free")
   - VIP discount indicator
   - "Register" button
   - Spots remaining

3. **New Component: `EventDetail.tsx`** - Full view:
   - Hero image
   - Full description
   - Host info
   - Registration form
   - Add to calendar button
   - Recording player (if available)

4. **New Component: `RegistrationForm.tsx`** - Checkout:
   - Registration confirmation
   - Payment integration (Stripe suggested)
   - Calendar integration
   - Reminder preferences

5. **Add to navigation** - Events tab in bottom nav

**API Endpoints:**
- `GET /api/events` - List upcoming events
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/register` - Register for event
- `DELETE /api/events/:id/registration` - Cancel registration
- `POST /api/events/:id/calendar` - Add to Google Calendar
- `GET /api/events/my-registrations` - Get user's registrations
- `GET /api/events/recordings` - Get available recordings

**Admin Endpoints:**
- `POST /api/admin/events` - Create event
- `PATCH /api/admin/events/:id` - Update event
- `DELETE /api/admin/events/:id` - Delete event
- `POST /api/admin/events/:id/publish` - Publish event
- `POST /api/admin/events/:id/recording` - Add recording

---

## 6. Mindful Metrics Dashboard

### Target Features:
- Weekly scorecard for: Energy, Mood, Stress levels, Sleep/HRV
- Trend graphs with milestone markers
- Progress insights (e.g., "Reduced daily stress by 30%")

### Current State: **~40% Exists**

| Component | Status | Notes |
|-----------|--------|-------|
| Mood tracking | **Exists** | 5-level mood check-ins |
| Mood trends graph | **Exists** | 7-day line chart |
| Habit stats | **Exists** | Completion counts and streaks |
| Achievements | **Exists** | 8 badges |
| Energy tracking | **Missing** | Not separate from mood |
| Stress tracking | **Missing** | Not tracked |
| Sleep tracking | **Missing** | Not tracked |
| HRV/wearable | **Missing** | No integrations |
| Weekly scorecard | **Missing** | No weekly aggregation |
| Milestone markers | **Missing** | No achievement timeline |
| Progress insights | **Missing** | No AI-generated insights |

### Changes Required:

**Database:**
```sql
-- Expanded daily check-in (beyond just mood)
CREATE TABLE daily_metrics (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  mood_score INTEGER, -- 1-5
  energy_score INTEGER, -- 1-10
  stress_score INTEGER, -- 1-10
  sleep_hours DECIMAL(3,1),
  sleep_quality INTEGER, -- 1-5
  hrv_avg INTEGER, -- If wearable connected
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Weekly scorecards (pre-computed for performance)
CREATE TABLE weekly_scorecards (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  week_start TEXT NOT NULL, -- YYYY-MM-DD of Monday
  avg_mood DECIMAL(3,2),
  avg_energy DECIMAL(3,2),
  avg_stress DECIMAL(3,2),
  avg_sleep_hours DECIMAL(3,2),
  avg_sleep_quality DECIMAL(3,2),
  total_habits_completed INTEGER,
  total_practices_completed INTEGER,
  total_journal_entries INTEGER,
  highlights JSONB, -- Array of notable achievements
  insights JSONB, -- AI-generated insights
  created_at TIMESTAMP,
  UNIQUE(user_id, week_start)
);

-- User milestones
CREATE TABLE user_milestones (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  milestone_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metric_value DECIMAL(10,2),
  achieved_at TIMESTAMP
);

-- Wearable integrations
CREATE TABLE wearable_connections (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  provider VARCHAR(30) NOT NULL, -- 'apple_health' | 'fitbit' | 'garmin' | 'whoop' | 'oura'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP
);
```

**Frontend Changes:**
1. **Enhance `/stats` → `/metrics`** - Full metrics dashboard:
   - Weekly scorecard card (prominent)
   - Multi-metric trend chart (mood, energy, stress overlay)
   - Metric-specific deep dives
   - Milestone timeline
   - AI insights section

2. **New Component: `WeeklyScorecard.tsx`** - Shows:
   - Week at a glance (Mon-Sun)
   - Key metrics with icons
   - Comparison to previous week (arrows)
   - Overall "wellness score"

3. **New Component: `MetricTrendChart.tsx`** - Enhanced chart:
   - Multiple metric lines (togglable)
   - Milestone markers on chart
   - Date range selector (week/month/quarter)
   - Annotations for significant events

4. **New Component: `DailyMetricsInput.tsx`** - Expanded check-in:
   - Mood slider (existing)
   - Energy slider (new)
   - Stress slider (new)
   - Sleep hours + quality (new)
   - Quick notes

5. **New Component: `AIInsights.tsx`** - Shows:
   - Weekly summary from AI
   - Pattern recognition ("You sleep better on weekends")
   - Recommendations ("Try evening breathwork on high-stress days")

6. **New Component: `MilestoneTimeline.tsx`** - Shows:
   - Achievement badges on timeline
   - Significant improvements marked
   - Personal bests

7. **New Component: `WearableConnect.tsx`** - Settings page:
   - Connect wearable buttons
   - Sync status
   - Data permissions

**API Endpoints:**
- `GET /api/metrics/today` - Get today's metrics
- `POST /api/metrics` - Log daily metrics
- `PATCH /api/metrics/:date` - Update metrics
- `GET /api/metrics/weekly` - Get weekly scorecard
- `GET /api/metrics/trends` - Get trend data (configurable range)
- `GET /api/metrics/insights` - Get AI-generated insights
- `GET /api/milestones` - Get user milestones
- `POST /api/wearables/connect/:provider` - OAuth flow for wearable
- `POST /api/wearables/sync` - Trigger manual sync

---

## Implementation Priority

### Phase 1: Foundation (Enhancing Existing)
1. **Mindful Metrics Dashboard** - Build on existing mood/stats
2. **AI Micro-Coach Enhancement** - Add quick actions and history

### Phase 2: Core New Features
3. **Daily Rewire Rituals** - Morning/evening flows
4. **Breathwork & Meditation Library** - Migrate to database-driven

### Phase 3: Engagement & Community
5. **Habit & Challenge Tracker** - Gamification and challenges
6. **Events & Booking Hub** - Community events

---

## Navigation Structure Update

### Current Bottom Nav:
- Home | Journal | Focus | Voice | Profile

### Proposed Bottom Nav:
- Home | Library | Challenges | Events | Profile

### Drawer/Side Menu:
- Dashboard (Home)
- Journal/Reflect
- Coach (Voice)
- Metrics
- Settings

---

## Technical Considerations

### Database Migrations
- Use Drizzle Kit for migrations
- Run in sequence, test on staging first
- Consider data migration for existing mood data → daily_metrics

### API Versioning
- Consider `/api/v2/` prefix for new endpoints
- Maintain backward compatibility for existing clients

### Performance
- Weekly scorecards should be pre-computed (cron job)
- Practice library should be cached
- Event listings should be paginated

### Wearable Integrations
- Start with Apple HealthKit (most common)
- Consider Oura/Whoop for HRV data
- Use background sync where possible

---

## Files to Create/Modify

### New Database Tables (shared/schema.ts)
- daily_rituals
- body_scan_sessions
- practices
- practice_favorites
- practice_sessions
- challenges
- challenge_participants
- challenge_checkins
- user_gamification
- xp_transactions
- user_goals
- ai_conversations
- ai_messages
- events
- event_registrations
- daily_metrics
- weekly_scorecards
- user_milestones
- wearable_connections

### New Pages (client/src/pages/)
- library.tsx (replace focus.tsx)
- challenges.tsx
- events.tsx
- metrics.tsx (enhance stats.tsx)

### New Components (client/src/components/)
- rituals/MorningRitual.tsx
- rituals/EveningRitual.tsx
- rituals/BodyScanTimer.tsx
- library/PracticeCard.tsx
- library/MeditationPlayer.tsx
- library/PracticeFilters.tsx
- challenges/ChallengeCard.tsx
- challenges/ChallengeDetail.tsx
- challenges/Leaderboard.tsx
- gamification/LevelProgress.tsx
- gamification/XPNotification.tsx
- coach/QuickCoachActions.tsx
- coach/SessionSummary.tsx
- events/EventCard.tsx
- events/EventDetail.tsx
- events/RegistrationForm.tsx
- metrics/WeeklyScorecard.tsx
- metrics/MetricTrendChart.tsx
- metrics/DailyMetricsInput.tsx
- metrics/AIInsights.tsx
- metrics/MilestoneTimeline.tsx

### Modified Files
- client/src/pages/home.tsx (add ritual cards, XP display)
- client/src/pages/voice.tsx (add quick actions, history)
- client/src/lib/api.ts (add new hooks)
- server/routes.ts (add new endpoints)
- server/storage.ts (add new queries)
- shared/schema.ts (add new tables)

---

## Summary

| Feature | Exists | To Build | Effort |
|---------|--------|----------|--------|
| Daily Rewire Rituals | 60% | 40% | Medium |
| Breathwork & Meditation Library | 50% | 50% | Medium |
| Habit & Challenge Tracker | 40% | 60% | High |
| AI Micro-Coach | 70% | 30% | Medium |
| Events & Booking Hub | 20% | 80% | High |
| Mindful Metrics Dashboard | 40% | 60% | Medium |

**Total estimated new code:** ~40% of existing codebase size
**Recommended approach:** Iterative phases, starting with enhancements to existing features

---

## Next Steps

1. Review and approve this plan
2. Create database migrations for Phase 1
3. Begin implementation of Mindful Metrics (builds on existing stats)
4. Iterate through phases with regular check-ins

