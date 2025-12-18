# REWIRE Codebase Audit Report

**Date:** December 18, 2025
**Auditor:** Claude (AI Assistant)

---

## Executive Summary

This comprehensive audit reviewed the REWIRE wellness coaching platform to identify issues affecting functionality and flow. The codebase is a full-stack React/Express application with PostgreSQL using Drizzle ORM. Overall, the architecture is solid with well-organized code, but several issues were identified that require attention.

### Key Findings Overview

| Severity | Count | Description |
|----------|-------|-------------|
| **Critical** | 1 | Routing library conflict (FIXED) |
| **High** | 3 | Missing API initialization, potential data flow issues |
| **Medium** | 5 | UX improvements, type mismatches |
| **Low** | 4 | Code cleanup, optimization opportunities |

---

## Critical Issues (FIXED)

### 1. Routing Library Conflict - `library.tsx`

**File:** `client/src/pages/library.tsx:2`

**Issue:** The Library page was importing `useNavigate` from `react-router-dom` while the entire application uses `wouter` for routing. This caused navigation failures when users tried to start a practice from the library.

**Impact:** Users clicking "Start" on any practice would encounter a routing error, breaking the Practice Library feature entirely.

**Resolution:** Fixed by replacing:
```tsx
// Before
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate(`/focus?practiceId=${practice.id}`);

// After
import { useLocation } from "wouter";
const [, setLocation] = useLocation();
setLocation(`/focus?practiceId=${practice.id}`);
```

---

## High Priority Issues

### 2. Practice Library Data Seeding Required

**Status:** Database tables exist but may lack initial practice data

**Issue:** The Practice Library (`/library`) depends on the `practices` table being populated with breathing, meditation, and body scan entries. The route `/api/admin/seed-practices` exists (`server/routes.ts:2565-2572`) but may not have been executed.

**Impact:** Empty practice library on first deployment showing "No practices found"

**Recommendation:**
- Execute seed-practices endpoint via admin panel
- Or add auto-seeding on first application startup

### 3. Focus Page Missing Query Parameter Handling

**File:** `client/src/pages/focus.tsx`

**Issue:** The Focus page receives `?practiceId=` from the Library but doesn't fetch or use this to load a specific practice from the database. Currently, it only shows hardcoded breathing techniques.

**Impact:** Users selecting a practice from the Library land on the Focus page but don't see their selected practice - they see a generic list instead.

**Recommendation:** Add practice fetching logic:
```tsx
const searchParams = new URLSearchParams(window.location.search);
const practiceId = searchParams.get('practiceId');
const { data: selectedPractice } = usePractice(practiceId);
```

### 4. Daily Rituals Missing UI Implementation

**Issue:** The home page shows morning/evening ritual cards that link to `/focus`, but there's no dedicated ritual workflow (morning focus prompts, evening reflection journaling, body scan timers) as specified in the feature requirements.

**Impact:** Users can track rituals but lack the guided experience for morning focus prompts and evening reflection journaling.

**Recommendation:** Create dedicated ritual flows with:
- Morning: Focus prompts, intention setting
- Evening: Reflection journaling, body scan guided audio

---

## Medium Priority Issues

### 5. Metrics Dashboard Sleep Hours Type

**File:** `shared/schema.ts:421`

**Issue:** The `sleepHours` column in `dailyMetrics` is defined as `integer` with comment "stored as minutes for precision" but is labeled and used as hours throughout the UI.

**Impact:** Potential data inconsistency - if stored as minutes but displayed as hours without conversion.

**Recommendation:** Standardize to either:
- Store as hours (decimal)
- Store as minutes with proper conversion in UI

### 6. Challenge Participant Join Response Missing Challenge Details

**File:** `client/src/pages/challenges.tsx:394-405`

**Issue:** The `myChallenges` data includes `participation.challenge` but this relies on the API returning the challenge details nested within the participation object. Verify the API response includes this.

**Recommendation:** Confirm `getUserChallenges()` storage method returns challenge data with participant records.

### 7. Events VIP Early Access Logic Incomplete

**File:** `client/src/pages/events.tsx:190-195`

**Issue:** VIP badge displays when `event.vipEarlyAccessHours > 0` but there's no logic to check if the current user has VIP status or if early access is currently active.

**Recommendation:** Add VIP tier checking:
```tsx
const isVipUser = user?.accountTier === "member" || user?.accountTier === "coach";
const earlyAccessActive = /* check time logic */;
```

### 8. Weekly Scorecard Calculation

**File:** `server/routes.ts:2403-2421`

**Issue:** The current scorecard endpoint calculates the week start but the `getWeeklyScorecard` storage method needs to either compute averages on-the-fly or pre-compute them.

**Impact:** Scorecards may not reflect accurate weekly averages if not properly computed.

**Recommendation:** Verify scorecard computation logic includes all metrics from `dailyMetrics` table.

### 9. AI Conversation History UI Missing

**Issue:** AI conversation history is stored in `aiConversations` and `aiMessages` tables, but there's no UI to view past conversations on the Voice page.

**Impact:** Users cannot review previous coaching conversations.

**Recommendation:** Add conversation history sidebar or tab in `/voice` page.

---

## Low Priority Issues

### 10. Unused react-router-dom Dependency

**File:** `package.json:78`

**Issue:** `react-router-dom` is installed but should be removed since the app uses `wouter`.

**Impact:** Unnecessary bundle size, potential confusion for developers.

**Recommendation:** Remove from dependencies:
```bash
npm uninstall react-router-dom
```

### 11. Build Script Missing tsx Dependency Resolution

**Issue:** Running `npm run build` fails with "tsx: not found" because tsx isn't in PATH during production builds.

**Recommendation:** Either:
- Use npx in build script: `"build": "npx tsx script/build.ts"`
- Or ensure tsx is available in production environment

### 12. TypeScript Type Definitions Warning

**Issue:** TypeScript check shows warnings about missing type definitions:
- `Cannot find type definition file for 'node'`
- `Cannot find type definition file for 'vite/client'`

**Recommendation:** Run `npm install` to ensure all type definitions are installed, or add to tsconfig:
```json
{
  "compilerOptions": {
    "types": ["node", "vite/client"]
  }
}
```

### 13. Feature Flag Consistency

**Issue:** Some feature flags in `FeatureFlags` interface (`dailyRituals`, `practiceLibrary`, `challenges`, `events`, `mindfulMetrics`) may not have corresponding checks in the UI components.

**Recommendation:** Audit each feature page to ensure feature flag checks are implemented.

---

## Database Schema Verification

### Tables Status

All required tables for the specified features are present in `shared/schema.ts`:

| Feature | Tables | Status |
|---------|--------|--------|
| Daily Rituals | `dailyRituals` | ✅ Defined |
| Practice Library | `practices`, `practiceFavorites`, `practiceSessions` | ✅ Defined |
| Challenges | `challenges`, `challengeParticipants`, `challengeCheckins` | ✅ Defined |
| Gamification | `userGamification`, `xpTransactions` | ✅ Defined |
| Goals | `userGoals` | ✅ Defined |
| Events | `events`, `eventRegistrations` | ✅ Defined |
| Metrics | `dailyMetrics`, `weeklyScorecards`, `userMilestones` | ✅ Defined |
| AI Coach | `aiConversations`, `aiMessages` | ✅ Defined |

### Database Migration Status

Ensure migrations are up-to-date:
```bash
npm run db:push
```

---

## Feature Implementation Status

### 1. Daily Rewire Rituals
- ✅ Database schema complete
- ✅ API endpoints exist
- ⚠️ UI shows ritual cards but lacks dedicated guided flows
- ❌ AI voice coach check-ins not integrated with rituals
- ❌ Content tailoring based on energy/stress not implemented

### 2. Guided Breathwork & Meditation Library
- ✅ Database schema complete
- ✅ API endpoints exist
- ✅ Library page implemented with filtering
- ✅ Favorites and history tracking
- ✅ Duration categories (short/medium/long)
- ⚠️ Need to seed default practices
- ❌ Audio/guided content needs creation

### 3. Habit & Challenge Tracker
- ✅ Database schema complete
- ✅ Challenges page fully implemented
- ✅ Habit streaks tracked
- ✅ Daily reminders available
- ✅ Gamified levels with XP system
- ⚠️ Micro-rewards for streaks need design

### 4. AI Micro-Coach
- ✅ Database schema complete
- ✅ Text and voice chat implemented
- ✅ Quick actions (Regulate/Reframe/Reset)
- ✅ Personalized based on user context
- ⚠️ Conversation history UI missing

### 5. Events & Booking Hub
- ✅ Database schema complete
- ✅ Events page with filtering
- ✅ Registration system
- ✅ Recordings tab
- ✅ VIP early access display
- ⚠️ Calendar integration partially implemented
- ❌ Payment processing not integrated

### 6. Mindful Metrics Dashboard
- ✅ Database schema complete
- ✅ Daily metrics logging
- ✅ Weekly scorecards
- ✅ Milestones tracking
- ⚠️ Trend graphs need implementation
- ❌ Wearable integrations not present

---

## Recommendations Summary

### Immediate Actions (Do Now)
1. ✅ **DONE** - Fix library.tsx routing conflict
2. Seed default practices via admin endpoint
3. Add practice loading to focus page from query params

### Short-term (This Week)
4. Add AI conversation history UI
5. Implement VIP tier checking for events
6. Remove react-router-dom dependency
7. Fix build script tsx resolution

### Medium-term (Next Sprint)
8. Create dedicated ritual flows (morning/evening)
9. Add trend graphs to metrics dashboard
10. Implement milestone markers in dashboard
11. Add practice audio content

### Long-term (Backlog)
12. Wearable device integrations (Apple Health, Fitbit)
13. Payment integration for premium events
14. Push notification system
15. Offline support/PWA enhancements

---

## Testing Recommendations

### Manual Testing Checklist
- [ ] Create account and log in
- [ ] Complete mood/ground check
- [ ] Add and complete a habit
- [ ] Navigate to Practice Library
- [ ] Start a practice from library
- [ ] Join a challenge
- [ ] Log daily metrics
- [ ] View weekly scorecard
- [ ] Register for an event
- [ ] Use AI coach quick actions
- [ ] Start voice conversation

### Areas Needing Automated Tests
- API endpoint integration tests
- Database storage method unit tests
- React component tests for key flows

---

## Conclusion

The REWIRE codebase has a solid foundation with comprehensive database schema and well-structured API routes. The main issues are:

1. **Critical**: One routing bug (now fixed)
2. **Flow Issues**: Missing practice loading, incomplete ritual flows
3. **Data**: May need initial data seeding
4. **Polish**: Some UI features incomplete or missing

With the fixes applied and recommendations followed, the application should provide a functional experience for all specified features.
