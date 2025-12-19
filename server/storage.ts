import { db, pool } from "./db";
import { eq, and, desc, gte, sql, inArray, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import {
  users,
  moods,
  habits,
  habitCompletions,
  journalEntries,
  homework,
  visionBoardItems,
  ventMessages,
  userAchievements,
  userSettings,
  coachClients,
  coachInvites,
  coachingSessions,
  journalingTemplates,
  templatePrompts,
  userTemplateProgress,
  templateJournalEntries,
  clientTransfers,
  coCoaches,
  coachNotifications,
  appProfiles,
  userProfileAssignments,
  // New feature tables
  dailyMetrics,
  dailyRituals,
  practices,
  practiceFavorites,
  practiceSessions,
  challenges,
  challengeParticipants,
  challengeCheckins,
  userGamification,
  xpTransactions,
  userGoals,
  events,
  eventRegistrations,
  weeklyScorecards,
  userMilestones,
  aiConversations,
  aiMessages,
  type User,
  type UpsertUser,
  type Mood,
  type InsertMood,
  type Habit,
  type InsertHabit,
  type HabitCompletion,
  type InsertHabitCompletion,
  type JournalEntry,
  type InsertJournalEntry,
  type Homework,
  type InsertHomework,
  type VisionBoardItem,
  type InsertVisionBoardItem,
  type VentMessage,
  type InsertVentMessage,
  type UserAchievement,
  type InsertUserAchievement,
  type UserSettings,
  type UpdateUserSettings,
  type CoachClient,
  type InsertCoachClient,
  type CoachInvite,
  type CoachingSession,
  type InsertCoachingSession,
  type UpdateCoachingSession,
  type JournalingTemplate,
  type InsertJournalingTemplate,
  type TemplatePrompt,
  type UserTemplateProgress,
  type InsertUserTemplateProgress,
  type TemplateJournalEntry,
  type InsertTemplateJournalEntry,
  type ClientTransfer,
  type InsertClientTransfer,
  type CoCoach,
  type InsertCoCoach,
  type CoachNotification,
  type InsertCoachNotification,
  dailyQuotes,
  userQuoteViews,
  microSessions,
  type DailyQuote,
  type InsertDailyQuote,
  type MicroSession,
  type InsertMicroSession,
  type AppProfile,
  type InsertAppProfile,
  type UpdateAppProfile,
  type UserProfileAssignment,
  type InsertUserProfileAssignment,
  // New feature types
  type DailyMetrics,
  type InsertDailyMetrics,
  type UpdateDailyMetrics,
  type DailyRitual,
  type InsertDailyRitual,
  type Practice,
  type InsertPractice,
  type UpdatePractice,
  type PracticeFavorite,
  type InsertPracticeFavorite,
  type PracticeSession,
  type InsertPracticeSession,
  type Challenge,
  type InsertChallenge,
  type ChallengeParticipant,
  type InsertChallengeParticipant,
  type ChallengeCheckin,
  type InsertChallengeCheckin,
  type UserGamification,
  type InsertUserGamification,
  type XpTransaction,
  type InsertXpTransaction,
  type UserGoal,
  type InsertUserGoal,
  type Event,
  type InsertEvent,
  type UpdateEvent,
  type EventRegistration,
  type InsertEventRegistration,
  type WeeklyScorecard,
  type InsertWeeklyScorecard,
  type UserMilestone,
  type InsertUserMilestone,
  type AiConversation,
  type InsertAiConversation,
  type AiMessage,
  type InsertAiMessage,
} from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailOrUsername(identifier: string): Promise<User | undefined>;
  createUser(user: { email: string; password: string; username?: string; name?: string; role: "client" | "coach" }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, data: { firstName?: string; lastName?: string; profileImageUrl?: string; email?: string }): Promise<User>;

  // Coach-Client Methods
  getClientsByCoach(coachId: string): Promise<User[]>;
  getCoachForClient(clientId: string): Promise<User | undefined>;
  addClientToCoach(coachId: string, clientId: string): Promise<CoachClient>;
  removeClientFromCoach(coachId: string, clientId: string): Promise<void>;
  createCoachInvite(coachId: string, code: string, expiresAt?: Date): Promise<CoachInvite>;
  getCoachInvite(code: string): Promise<CoachInvite | undefined>;
  useCoachInvite(code: string, clientId: string): Promise<void>;

  // Moods
  getMoodsByUser(userId: string): Promise<Mood[]>;
  createMood(mood: InsertMood): Promise<Mood>;
  getTodayMood(userId: string): Promise<Mood | undefined>;

  // Habits
  getHabitsByUser(userId: string): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  deleteHabit(id: string): Promise<void>;
  
  // Habit Completions
  getHabitCompletion(habitId: string, date: string): Promise<HabitCompletion | undefined>;
  upsertHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion>;
  getHabitCompletionsForDate(habitIds: string[], date: string): Promise<HabitCompletion[]>;

  // Journal Entries
  getJournalEntriesByUser(userId: string): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: string, data: { title?: string; content?: string; mood?: string | null }): Promise<JournalEntry>;
  deleteJournalEntry(id: string): Promise<void>;

  // Homework
  getActiveHomework(userId: string): Promise<Homework | undefined>;
  createHomework(hw: InsertHomework): Promise<Homework>;
  completeHomework(id: string): Promise<void>;

  // Vision Board
  getVisionBoardItems(userId: string): Promise<VisionBoardItem[]>;
  createVisionBoardItem(item: InsertVisionBoardItem): Promise<VisionBoardItem>;
  updateVisionBoardItem(id: string, data: { imageUrl?: string; label?: string }): Promise<VisionBoardItem>;
  deleteVisionBoardItem(id: string): Promise<void>;

  // Vent Messages
  getVentMessagesByUser(userId: string): Promise<VentMessage[]>;
  createVentMessage(message: InsertVentMessage): Promise<VentMessage>;

  // Stats & Achievements
  getMoodTrends(userId: string, days: number): Promise<{ date: string; mood: string; score: number; energyLevel: number | null; stressLevel: number | null }[]>;
  getHabitStats(userId: string): Promise<{ totalHabits: number; completedToday: number; currentStreak: number; longestStreak: number }>;
  getDashboardStats(userId: string): Promise<{ totalMoodCheckins: number; totalJournalEntries: number; totalHabitsCompleted: number; currentStreak: number }>;
  getAllStreaks(userId: string): Promise<{ 
    moodStreak: { current: number; longest: number }; 
    journalStreak: { current: number; longest: number }; 
    habitStreak: { current: number; longest: number };
  }>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  awardAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  hasAchievement(userId: string, achievementId: string): Promise<boolean>;

  // User Settings
  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings>;
  getUsersWithRemindersEnabled(reminderTime: string): Promise<{ userId: string; email: string; name: string }[]>;

  // Coach Context for RAG
  getCoachContext(userId: string): Promise<{
    recentMoods: { mood: string; date: string }[];
    recentJournals: { title: string; content: string; mood?: string; date: string }[];
    habits: { label: string; completed: boolean }[];
    currentStreak: number;
  }>;

  // Coaching Sessions
  createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession>;
  getCoachingSession(id: string): Promise<CoachingSession | undefined>;
  getSessionsByCoach(coachId: string): Promise<CoachingSession[]>;
  getSessionsByClient(clientId: string): Promise<CoachingSession[]>;
  getSessionsForCoachClient(coachId: string, clientId: string): Promise<CoachingSession[]>;
  updateCoachingSession(id: string, updates: UpdateCoachingSession): Promise<CoachingSession>;
  deleteCoachingSession(id: string): Promise<void>;
  getUpcomingSessions(userId: string, role: 'coach' | 'client'): Promise<CoachingSession[]>;
  
  // Data Management
  deleteAllUserData(userId: string): Promise<void>;

  // Journaling Templates
  getJournalingTemplates(userId: string): Promise<JournalingTemplate[]>;
  getSharedTemplates(): Promise<JournalingTemplate[]>;
  getTemplateWithPrompts(templateId: string): Promise<(JournalingTemplate & { prompts: TemplatePrompt[] }) | null>;
  createJournalingTemplate(templateData: InsertJournalingTemplate, prompts: Array<{ dayNumber: number; title: string; prompt: string; tips?: string }>): Promise<JournalingTemplate>;
  getUserTemplateProgress(userId: string): Promise<Array<UserTemplateProgress & { template: (JournalingTemplate & { prompts: TemplatePrompt[] }) | null }>>;
  startTemplateProgress(data: InsertUserTemplateProgress): Promise<UserTemplateProgress>;
  createTemplateJournalEntry(data: InsertTemplateJournalEntry): Promise<TemplateJournalEntry>;
  advanceTemplateProgress(progressId: string): Promise<void>;

  // Client Transfers
  createClientTransfer(data: InsertClientTransfer): Promise<ClientTransfer>;
  getIncomingTransfers(coachId: string): Promise<ClientTransfer[]>;
  getOutgoingTransfers(coachId: string): Promise<ClientTransfer[]>;
  respondToTransfer(id: string, coachId: string, status: string): Promise<ClientTransfer | null>;
  transferClient(clientId: string, fromCoachId: string, toCoachId: string): Promise<void>;

  // Co-Coaching
  getCoCoaches(clientId: string): Promise<CoCoach[]>;
  addCoCoach(data: InsertCoCoach): Promise<CoCoach>;
  removeCoCoach(id: string): Promise<void>;

  // Coach Notifications
  createCoachNotification(data: InsertCoachNotification): Promise<CoachNotification>;
  getCoachNotifications(coachId: string): Promise<CoachNotification[]>;
  getUnreadNotificationCount(coachId: string): Promise<number>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(coachId: string): Promise<void>;

  // Coaches List
  getAllCoaches(): Promise<User[]>;

  // Daily Quotes
  getDailyQuote(userId: string): Promise<DailyQuote | null>;
  getAllQuotes(): Promise<DailyQuote[]>;
  createQuote(data: InsertDailyQuote): Promise<DailyQuote>;
  seedDefaultQuotes(): Promise<void>;

  // Micro Sessions
  getTodayMicroSession(userId: string): Promise<MicroSession | null>;
  getMicroSessionStreak(userId: string): Promise<{ current: number; longest: number }>;
  createOrUpdateMicroSession(data: InsertMicroSession): Promise<MicroSession>;
  completeMicroSession(userId: string, date: string, durationSeconds: number): Promise<MicroSession>;

  // App Profiles (Super Admin)
  getAllAppProfiles(): Promise<AppProfile[]>;
  getAppProfile(id: string): Promise<AppProfile | undefined>;
  getDefaultAppProfile(): Promise<AppProfile | undefined>;
  createAppProfile(data: InsertAppProfile): Promise<AppProfile>;
  updateAppProfile(id: string, data: UpdateAppProfile): Promise<AppProfile>;
  deleteAppProfile(id: string): Promise<void>;
  setDefaultProfile(id: string): Promise<void>;
  
  // User Profile Assignments
  getUserProfileAssignment(userId: string): Promise<UserProfileAssignment | undefined>;
  getUserAppProfile(userId: string): Promise<AppProfile | undefined>;
  assignProfileToUser(userId: string, profileId: string, assignedBy?: string): Promise<UserProfileAssignment>;
  removeUserProfileAssignment(userId: string): Promise<void>;
  
  // Super Admin
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;

  // ========== NEW FEATURE METHODS ==========

  // Daily Metrics
  getTodayMetrics(userId: string): Promise<DailyMetrics | null>;
  getMetricsByDateRange(userId: string, startDate: string, endDate: string): Promise<DailyMetrics[]>;
  createOrUpdateDailyMetrics(userId: string, date: string, data: UpdateDailyMetrics): Promise<DailyMetrics>;
  getWeeklyMetricsAverage(userId: string, weekStart: string): Promise<{
    avgMood: number | null;
    avgEnergy: number | null;
    avgStress: number | null;
    avgSleepHours: number | null;
    avgSleepQuality: number | null;
  }>;

  // Daily Rituals
  getTodayRituals(userId: string): Promise<DailyRitual[]>;
  getRitualByTypeAndDate(userId: string, date: string, ritualType: string): Promise<DailyRitual | null>;
  createOrUpdateRitual(data: InsertDailyRitual): Promise<DailyRitual>;
  completeRitual(id: string, energyAfter?: number): Promise<DailyRitual>;

  // Practice Library
  getAllPractices(filters?: { type?: string; category?: string; durationCategory?: string }): Promise<Practice[]>;
  getPractice(id: string): Promise<Practice | null>;
  createPractice(data: InsertPractice): Promise<Practice>;
  updatePractice(id: string, data: UpdatePractice): Promise<Practice>;
  deletePractice(id: string): Promise<void>;
  seedDefaultPractices(): Promise<void>;

  // Practice Favorites & Sessions
  getUserFavorites(userId: string): Promise<(PracticeFavorite & { practice: Practice })[]>;
  toggleFavorite(userId: string, practiceId: string): Promise<boolean>;
  createPracticeSession(data: InsertPracticeSession): Promise<PracticeSession>;
  getUserPracticeSessions(userId: string, limit?: number): Promise<(PracticeSession & { practice: Practice })[]>;
  getPracticeUsageStats(userId: string): Promise<{ practiceId: string; count: number; totalDuration: number }[]>;

  // Challenges
  getChallenges(filters?: { type?: string; category?: string; active?: boolean }): Promise<Challenge[]>;
  getChallenge(id: string): Promise<Challenge | null>;
  createChallenge(data: InsertChallenge): Promise<Challenge>;
  getChallengeParticipant(challengeId: string, userId: string): Promise<ChallengeParticipant | undefined>;
  joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant>;
  leaveChallenge(challengeId: string, userId: string): Promise<void>;
  getChallengeParticipants(challengeId: string): Promise<(ChallengeParticipant & { user: User })[]>;
  getUserChallenges(userId: string): Promise<(ChallengeParticipant & { challenge: Challenge })[]>;
  createChallengeCheckin(data: InsertChallengeCheckin): Promise<ChallengeCheckin>;
  getChallengeLeaderboard(challengeId: string): Promise<{ participant: ChallengeParticipant; user: User; rank: number }[]>;

  // Gamification
  getUserGamification(userId: string): Promise<UserGamification>;
  awardXp(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<{ xp: XpTransaction; gamification: UserGamification }>;
  getXpHistory(userId: string, limit?: number): Promise<XpTransaction[]>;
  calculateLevel(totalXp: number): { level: number; xpToNextLevel: number };

  // User Goals
  getUserGoals(userId: string): Promise<UserGoal[]>;
  createUserGoal(data: InsertUserGoal): Promise<UserGoal>;
  updateUserGoal(id: string, data: Partial<InsertUserGoal>): Promise<UserGoal>;
  deleteUserGoal(id: string): Promise<void>;

  // Events
  getEvents(filters?: { type?: string; upcoming?: boolean; published?: boolean; hasRecording?: boolean }): Promise<Event[]>;
  getEvent(id: string): Promise<Event | null>;
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: UpdateEvent): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  registerForEvent(eventId: string, userId: string): Promise<EventRegistration>;
  cancelEventRegistration(eventId: string, userId: string): Promise<void>;
  getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]>;
  getEventRegistrations(eventId: string): Promise<(EventRegistration & { user: User })[]>;

  // Weekly Scorecards
  getWeeklyScorecard(userId: string, weekStart: string): Promise<WeeklyScorecard | null>;
  createOrUpdateWeeklyScorecard(data: InsertWeeklyScorecard): Promise<WeeklyScorecard>;
  getUserScorecards(userId: string, limit?: number): Promise<WeeklyScorecard[]>;

  // User Milestones
  getUserMilestones(userId: string): Promise<UserMilestone[]>;
  createMilestone(data: InsertUserMilestone): Promise<UserMilestone>;

  // AI Conversations
  createAiConversation(data: InsertAiConversation): Promise<AiConversation>;
  getAiConversation(id: string): Promise<AiConversation | null>;
  endAiConversation(id: string, summary?: string): Promise<AiConversation>;
  getUserAiConversations(userId: string, limit?: number): Promise<AiConversation[]>;
  addAiMessage(data: InsertAiMessage): Promise<AiMessage>;
  getConversationMessages(conversationId: string): Promise<AiMessage[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: "sessions"
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return result[0];
  }

  async getUserByEmailOrUsername(identifier: string): Promise<User | undefined> {
    // Try to find by email first, then by username
    const normalizedIdentifier = identifier.toLowerCase();
    const result = await db.select().from(users).where(
      or(
        eq(users.email, normalizedIdentifier),
        eq(users.username, identifier)
      )
    ).limit(1);
    return result[0];
  }

  async createUser(userData: { email: string; password: string; username?: string; name?: string; role: "client" | "coach" }): Promise<User> {
    const emailLower = userData.email.toLowerCase();
    const [user] = await db
      .insert(users)
      .values({
        email: emailLower,
        username: userData.username || null,
        password: userData.password,
        name: userData.name || userData.username || emailLower.split('@')[0],
        role: userData.role,
        accountTier: "free",
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: { firstName?: string; lastName?: string; profileImageUrl?: string; email?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Coach-Client Methods
  async getClientsByCoach(coachId: string): Promise<User[]> {
    const relationships = await db.select().from(coachClients)
      .where(and(eq(coachClients.coachId, coachId), eq(coachClients.status, "active")));
    
    if (relationships.length === 0) return [];
    
    const clientIds = relationships.map(r => r.clientId);
    return db.select().from(users).where(inArray(users.id, clientIds));
  }

  async getCoachForClient(clientId: string): Promise<User | undefined> {
    const [relationship] = await db.select().from(coachClients)
      .where(and(eq(coachClients.clientId, clientId), eq(coachClients.status, "active")))
      .limit(1);
    
    if (!relationship) return undefined;
    return this.getUser(relationship.coachId);
  }

  async addClientToCoach(coachId: string, clientId: string): Promise<CoachClient> {
    const [result] = await db.insert(coachClients)
      .values({ coachId, clientId, status: "active" })
      .returning();
    return result;
  }

  async removeClientFromCoach(coachId: string, clientId: string): Promise<void> {
    await db.update(coachClients)
      .set({ status: "inactive" })
      .where(and(eq(coachClients.coachId, coachId), eq(coachClients.clientId, clientId)));
  }

  async createCoachInvite(coachId: string, code: string, expiresAt?: Date, inviteeEmail?: string, inviteeName?: string): Promise<CoachInvite> {
    const [result] = await db.insert(coachInvites)
      .values({ coachId, code, expiresAt, inviteeEmail, inviteeName })
      .returning();
    return result;
  }
  
  async getInvitesByCoach(coachId: string): Promise<CoachInvite[]> {
    return db.select().from(coachInvites)
      .where(eq(coachInvites.coachId, coachId))
      .orderBy(desc(coachInvites.createdAt));
  }

  async getCoachInvite(code: string): Promise<CoachInvite | undefined> {
    const [result] = await db.select().from(coachInvites)
      .where(eq(coachInvites.code, code))
      .limit(1);
    return result;
  }

  async useCoachInvite(code: string, clientId: string): Promise<void> {
    await db.update(coachInvites)
      .set({ usedBy: clientId })
      .where(eq(coachInvites.code, code));
  }

  // Moods
  async getMoodsByUser(userId: string): Promise<Mood[]> {
    return db.select().from(moods).where(eq(moods.userId, userId)).orderBy(desc(moods.timestamp));
  }

  async createMood(mood: InsertMood): Promise<Mood> {
    const result = await db.insert(moods).values(mood).returning();
    return result[0];
  }

  async getTodayMood(userId: string): Promise<Mood | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.select().from(moods)
      .where(eq(moods.userId, userId))
      .orderBy(desc(moods.timestamp))
      .limit(1);
    
    if (result.length > 0) {
      const moodDate = new Date(result[0].timestamp).toISOString().split('T')[0];
      if (moodDate === today) {
        return result[0];
      }
    }
    return undefined;
  }

  // Habits
  async getHabitsByUser(userId: string): Promise<Habit[]> {
    return db.select().from(habits).where(eq(habits.userId, userId)).orderBy(habits.order);
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const result = await db.insert(habits).values(habit).returning();
    return result[0];
  }

  async deleteHabit(id: string): Promise<void> {
    await db.delete(habits).where(eq(habits.id, id));
  }

  // Habit Completions
  async getHabitCompletion(habitId: string, date: string): Promise<HabitCompletion | undefined> {
    const result = await db.select().from(habitCompletions)
      .where(and(eq(habitCompletions.habitId, habitId), eq(habitCompletions.date, date)))
      .limit(1);
    return result[0];
  }

  async upsertHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion> {
    const existing = await this.getHabitCompletion(completion.habitId, completion.date);
    
    if (existing) {
      const result = await db.update(habitCompletions)
        .set({ completed: completion.completed })
        .where(eq(habitCompletions.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(habitCompletions).values(completion).returning();
      return result[0];
    }
  }

  async getHabitCompletionsForDate(habitIds: string[], date: string): Promise<HabitCompletion[]> {
    if (habitIds.length === 0) return [];
    return db.select().from(habitCompletions)
      .where(eq(habitCompletions.date, date));
  }

  // Journal Entries
  async getJournalEntriesByUser(userId: string): Promise<JournalEntry[]> {
    return db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.timestamp));
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const result = await db.insert(journalEntries).values(entry).returning();
    return result[0];
  }

  async updateJournalEntry(id: string, data: { title?: string; content?: string; mood?: string | null }): Promise<JournalEntry> {
    const result = await db.update(journalEntries)
      .set(data)
      .where(eq(journalEntries.id, id))
      .returning();
    return result[0];
  }

  async deleteJournalEntry(id: string): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  // Homework
  async getActiveHomework(userId: string): Promise<Homework | undefined> {
    const result = await db.select().from(homework)
      .where(and(eq(homework.userId, userId), eq(homework.completed, false)))
      .orderBy(desc(homework.createdAt))
      .limit(1);
    return result[0];
  }

  async createHomework(hw: InsertHomework): Promise<Homework> {
    const result = await db.insert(homework).values(hw).returning();
    return result[0];
  }

  async completeHomework(id: string): Promise<void> {
    await db.update(homework)
      .set({ completed: true })
      .where(eq(homework.id, id));
  }

  // Vision Board
  async getVisionBoardItems(userId: string): Promise<VisionBoardItem[]> {
    return db.select().from(visionBoardItems)
      .where(eq(visionBoardItems.userId, userId))
      .orderBy(visionBoardItems.order);
  }

  async createVisionBoardItem(item: InsertVisionBoardItem): Promise<VisionBoardItem> {
    const result = await db.insert(visionBoardItems).values(item).returning();
    return result[0];
  }

  async updateVisionBoardItem(id: string, data: { imageUrl?: string; label?: string }): Promise<VisionBoardItem> {
    const result = await db.update(visionBoardItems)
      .set(data)
      .where(eq(visionBoardItems.id, id))
      .returning();
    return result[0];
  }

  async deleteVisionBoardItem(id: string): Promise<void> {
    await db.delete(visionBoardItems).where(eq(visionBoardItems.id, id));
  }

  // Vent Messages
  async getVentMessagesByUser(userId: string): Promise<VentMessage[]> {
    return db.select().from(ventMessages)
      .where(eq(ventMessages.userId, userId))
      .orderBy(desc(ventMessages.timestamp));
  }

  async createVentMessage(message: InsertVentMessage): Promise<VentMessage> {
    const result = await db.insert(ventMessages).values(message).returning();
    return result[0];
  }

  // Stats & Achievements
  async getMoodTrends(userId: string, days: number): Promise<{ date: string; mood: string; score: number; energyLevel: number | null; stressLevel: number | null }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db.select().from(moods)
      .where(and(
        eq(moods.userId, userId),
        gte(moods.timestamp, startDate)
      ))
      .orderBy(moods.timestamp);
    
    const moodScores: Record<string, number> = {
      'great': 5,
      'good': 4,
      'okay': 3,
      'meh': 2,
      'bad': 1
    };
    
    return result.map(m => ({
      date: new Date(m.timestamp).toISOString().split('T')[0],
      mood: m.mood,
      score: moodScores[m.mood.toLowerCase()] || 3,
      energyLevel: m.energyLevel,
      stressLevel: m.stressLevel
    }));
  }

  async getHabitStats(userId: string): Promise<{ totalHabits: number; completedToday: number; currentStreak: number; longestStreak: number }> {
    const userHabits = await this.getHabitsByUser(userId);
    const today = new Date().toISOString().split('T')[0];
    
    if (userHabits.length === 0) {
      return { totalHabits: 0, completedToday: 0, currentStreak: 0, longestStreak: 0 };
    }
    
    const habitIds = userHabits.map(h => h.id);
    const todayCompletions = await db.select().from(habitCompletions)
      .where(and(
        inArray(habitCompletions.habitId, habitIds),
        eq(habitCompletions.date, today),
        eq(habitCompletions.completed, true)
      ));
    
    const allCompletions = await db.select().from(habitCompletions)
      .where(and(
        inArray(habitCompletions.habitId, habitIds),
        eq(habitCompletions.completed, true)
      ))
      .orderBy(desc(habitCompletions.date));
    
    const completedDates = Array.from(new Set(allCompletions.map(c => c.date))).sort().reverse();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date();
    
    for (const dateStr of completedDates) {
      const expectedDate = checkDate.toISOString().split('T')[0];
      if (dateStr === expectedDate) {
        tempStreak++;
        currentStreak = tempStreak;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
        break;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    
    return {
      totalHabits: userHabits.length,
      completedToday: todayCompletions.length,
      currentStreak,
      longestStreak
    };
  }

  async getDashboardStats(userId: string): Promise<{ totalMoodCheckins: number; totalJournalEntries: number; totalHabitsCompleted: number; currentStreak: number }> {
    const allMoods = await db.select().from(moods).where(eq(moods.userId, userId));
    const allJournalEntries = await db.select().from(journalEntries).where(eq(journalEntries.userId, userId));
    
    const userHabits = await this.getHabitsByUser(userId);
    let totalHabitsCompleted = 0;
    
    if (userHabits.length > 0) {
      const habitIds = userHabits.map(h => h.id);
      const completedHabits = await db.select().from(habitCompletions)
        .where(and(
          inArray(habitCompletions.habitId, habitIds),
          eq(habitCompletions.completed, true)
        ));
      totalHabitsCompleted = completedHabits.length;
    }
    
    const habitStats = await this.getHabitStats(userId);
    
    return {
      totalMoodCheckins: allMoods.length,
      totalJournalEntries: allJournalEntries.length,
      totalHabitsCompleted,
      currentStreak: habitStats.currentStreak
    };
  }

  private calculateStreak(dates: string[]): { current: number; longest: number } {
    if (dates.length === 0) {
      return { current: 0, longest: 0 };
    }
    
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date();
    
    for (const dateStr of uniqueDates) {
      const expectedDate = checkDate.toISOString().split('T')[0];
      if (dateStr === expectedDate) {
        tempStreak++;
        currentStreak = tempStreak;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        const dateGap = new Date(expectedDate).getTime() - new Date(dateStr).getTime();
        const daysGap = dateGap / (1000 * 60 * 60 * 24);
        if (daysGap === 1) {
          tempStreak = 1;
          checkDate = new Date(dateStr);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          tempStreak = 0;
          break;
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak, tempStreak);
    
    return { current: currentStreak, longest: longestStreak };
  }

  async getAllStreaks(userId: string): Promise<{ 
    moodStreak: { current: number; longest: number }; 
    journalStreak: { current: number; longest: number }; 
    habitStreak: { current: number; longest: number };
  }> {
    const allMoods = await db.select({ date: moods.timestamp }).from(moods)
      .where(eq(moods.userId, userId));
    const moodDates = allMoods.map(m => new Date(m.date).toISOString().split('T')[0]);
    const moodStreak = this.calculateStreak(moodDates);
    
    const allJournals = await db.select({ date: journalEntries.timestamp }).from(journalEntries)
      .where(eq(journalEntries.userId, userId));
    const journalDates = allJournals.map(j => new Date(j.date).toISOString().split('T')[0]);
    const journalStreak = this.calculateStreak(journalDates);
    
    const userHabits = await this.getHabitsByUser(userId);
    let habitStreak = { current: 0, longest: 0 };
    
    if (userHabits.length > 0) {
      const habitIds = userHabits.map(h => h.id);
      const allCompletions = await db.select({ date: habitCompletions.date }).from(habitCompletions)
        .where(and(
          inArray(habitCompletions.habitId, habitIds),
          eq(habitCompletions.completed, true)
        ));
      const habitDates = allCompletions.map(c => c.date);
      habitStreak = this.calculateStreak(habitDates);
    }
    
    return { moodStreak, journalStreak, habitStreak };
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return db.select().from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
  }

  async awardAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const result = await db.insert(userAchievements).values(achievement).returning();
    return result[0];
  }

  async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    const result = await db.select().from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ))
      .limit(1);
    return result.length > 0;
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    const result = await db.select().from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    
    if (result.length === 0) {
      const newSettings = await db.insert(userSettings)
        .values({ userId })
        .returning();
      return newSettings[0];
    }
    return result[0];
  }

  async updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    const updated = await db.update(userSettings)
      .set(settings)
      .where(eq(userSettings.id, existing.id))
      .returning();
    return updated[0];
  }

  async getUsersWithRemindersEnabled(reminderTime: string): Promise<{ userId: string; email: string; name: string }[]> {
    const results = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        firstName: users.firstName,
      })
      .from(userSettings)
      .innerJoin(users, eq(userSettings.userId, users.id))
      .where(
        and(
          eq(userSettings.notifications, true),
          eq(userSettings.reminderTime, reminderTime)
        )
      );
    
    return results.map(r => ({
      userId: r.userId,
      email: r.email || '',
      name: r.firstName || r.name || 'User'
    })).filter(r => r.email);
  }

  async getCoachContext(userId: string): Promise<{
    recentMoods: { mood: string; date: string }[];
    recentJournals: { title: string; content: string; mood?: string; date: string }[];
    habits: { label: string; completed: boolean }[];
    currentStreak: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const recentMoodsData = await db.select().from(moods)
      .where(eq(moods.userId, userId))
      .orderBy(desc(moods.timestamp))
      .limit(7);
    
    const recentMoods = recentMoodsData.map(m => ({
      mood: m.mood,
      date: new Date(m.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }));
    
    const recentJournalsData = await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.timestamp))
      .limit(5);
    
    const recentJournals = recentJournalsData.map(j => ({
      title: j.title,
      content: j.content.slice(0, 200),
      mood: j.mood || undefined,
      date: new Date(j.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }));
    
    const userHabits = await this.getHabitsByUser(userId);
    const habitIds = userHabits.map(h => h.id);
    const completionsToday = habitIds.length > 0 
      ? await this.getHabitCompletionsForDate(habitIds, today)
      : [];
    
    const habitsWithStatus = userHabits.map(h => ({
      label: h.label,
      completed: completionsToday.some(c => c.habitId === h.id && c.completed)
    }));
    
    const habitStats = await this.getHabitStats(userId);
    
    return {
      recentMoods,
      recentJournals,
      habits: habitsWithStatus,
      currentStreak: habitStats.currentStreak
    };
  }

  // Coaching Sessions
  async createCoachingSession(sessionData: InsertCoachingSession): Promise<CoachingSession> {
    const [result] = await db.insert(coachingSessions).values(sessionData).returning();
    return result;
  }

  async getCoachingSession(id: string): Promise<CoachingSession | undefined> {
    const [result] = await db.select().from(coachingSessions)
      .where(eq(coachingSessions.id, id))
      .limit(1);
    return result;
  }

  async getSessionsByCoach(coachId: string): Promise<CoachingSession[]> {
    return db.select().from(coachingSessions)
      .where(eq(coachingSessions.coachId, coachId))
      .orderBy(desc(coachingSessions.scheduledAt));
  }

  async getSessionsByClient(clientId: string): Promise<CoachingSession[]> {
    return db.select().from(coachingSessions)
      .where(eq(coachingSessions.clientId, clientId))
      .orderBy(desc(coachingSessions.scheduledAt));
  }

  async getSessionsForCoachClient(coachId: string, clientId: string): Promise<CoachingSession[]> {
    return db.select().from(coachingSessions)
      .where(and(
        eq(coachingSessions.coachId, coachId),
        eq(coachingSessions.clientId, clientId)
      ))
      .orderBy(desc(coachingSessions.scheduledAt));
  }

  async updateCoachingSession(id: string, updates: UpdateCoachingSession): Promise<CoachingSession> {
    const [result] = await db.update(coachingSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coachingSessions.id, id))
      .returning();
    return result;
  }

  async deleteCoachingSession(id: string): Promise<void> {
    await db.delete(coachingSessions).where(eq(coachingSessions.id, id));
  }

  async getUpcomingSessions(userId: string, role: 'coach' | 'client'): Promise<CoachingSession[]> {
    const now = new Date();
    const column = role === 'coach' ? coachingSessions.coachId : coachingSessions.clientId;

    return db.select().from(coachingSessions)
      .where(and(
        eq(column, userId),
        gte(coachingSessions.scheduledAt, now),
        eq(coachingSessions.status, 'scheduled')
      ))
      .orderBy(coachingSessions.scheduledAt);
  }

  // Data Management - Delete all user data (GDPR compliance)
  async deleteAllUserData(userId: string): Promise<void> {
    // Delete habit completions first (references habits)
    const userHabits = await db.select({ id: habits.id }).from(habits).where(eq(habits.userId, userId));
    const habitIds = userHabits.map(h => h.id);
    
    if (habitIds.length > 0) {
      await db.delete(habitCompletions).where(inArray(habitCompletions.habitId, habitIds));
    }
    
    // Delete template journal entries (references userTemplateProgress)
    const userProgress = await db.select({ id: userTemplateProgress.id })
      .from(userTemplateProgress)
      .where(eq(userTemplateProgress.userId, userId));
    const progressIds = userProgress.map(p => p.id);
    
    if (progressIds.length > 0) {
      await db.delete(templateJournalEntries).where(inArray(templateJournalEntries.progressId, progressIds));
    }
    
    // Delete user template progress
    await db.delete(userTemplateProgress).where(
      or(eq(userTemplateProgress.userId, userId), eq(userTemplateProgress.assignedBy, userId))
    );
    
    // Delete template prompts for user-created templates, then the templates themselves
    const userTemplates = await db.select({ id: journalingTemplates.id })
      .from(journalingTemplates)
      .where(eq(journalingTemplates.createdBy, userId));
    const templateIds = userTemplates.map(t => t.id);
    
    if (templateIds.length > 0) {
      // First delete all progress records that reference these templates
      const progressForTemplates = await db.select({ id: userTemplateProgress.id })
        .from(userTemplateProgress)
        .where(inArray(userTemplateProgress.templateId, templateIds));
      const progressIdsForTemplates = progressForTemplates.map(p => p.id);
      
      if (progressIdsForTemplates.length > 0) {
        await db.delete(templateJournalEntries).where(inArray(templateJournalEntries.progressId, progressIdsForTemplates));
        await db.delete(userTemplateProgress).where(inArray(userTemplateProgress.id, progressIdsForTemplates));
      }
      
      await db.delete(templatePrompts).where(inArray(templatePrompts.templateId, templateIds));
      await db.delete(journalingTemplates).where(eq(journalingTemplates.createdBy, userId));
    }
    
    // Delete core user data
    await db.delete(moods).where(eq(moods.userId, userId));
    await db.delete(habits).where(eq(habits.userId, userId));
    await db.delete(journalEntries).where(eq(journalEntries.userId, userId));
    await db.delete(homework).where(
      or(eq(homework.userId, userId), eq(homework.assignedBy, userId))
    );
    await db.delete(visionBoardItems).where(eq(visionBoardItems.userId, userId));
    await db.delete(ventMessages).where(eq(ventMessages.userId, userId));
    await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
    await db.delete(userSettings).where(eq(userSettings.userId, userId));
    
    // Delete coach-related data
    await db.delete(coachClients).where(
      or(eq(coachClients.coachId, userId), eq(coachClients.clientId, userId))
    );
    await db.delete(coachingSessions).where(
      or(eq(coachingSessions.coachId, userId), eq(coachingSessions.clientId, userId))
    );
    await db.delete(coachInvites).where(
      or(eq(coachInvites.coachId, userId), eq(coachInvites.usedBy, userId))
    );
    
    // Delete collaboration data
    await db.delete(clientTransfers).where(
      or(
        eq(clientTransfers.clientId, userId),
        eq(clientTransfers.fromCoachId, userId),
        eq(clientTransfers.toCoachId, userId)
      )
    );
    await db.delete(coCoaches).where(
      or(
        eq(coCoaches.clientId, userId),
        eq(coCoaches.primaryCoachId, userId),
        eq(coCoaches.secondaryCoachId, userId)
      )
    );
    await db.delete(coachNotifications).where(
      or(
        eq(coachNotifications.coachId, userId),
        eq(coachNotifications.actorId, userId),
        eq(coachNotifications.clientId, userId)
      )
    );
    
    // Delete quotes and micro sessions
    await db.delete(userQuoteViews).where(eq(userQuoteViews.userId, userId));
    await db.delete(microSessions).where(eq(microSessions.userId, userId));
  }

  // ========== JOURNALING TEMPLATES ==========

  async getJournalingTemplates(userId: string): Promise<JournalingTemplate[]> {
    return db.select().from(journalingTemplates)
      .where(or(
        eq(journalingTemplates.createdBy, userId),
        eq(journalingTemplates.isShared, true)
      ))
      .orderBy(desc(journalingTemplates.createdAt));
  }

  async getSharedTemplates(): Promise<JournalingTemplate[]> {
    return db.select().from(journalingTemplates)
      .where(eq(journalingTemplates.isShared, true))
      .orderBy(journalingTemplates.title);
  }

  async getTemplateWithPrompts(templateId: string) {
    const [template] = await db.select().from(journalingTemplates)
      .where(eq(journalingTemplates.id, templateId))
      .limit(1);

    if (!template) return null;

    const prompts = await db.select().from(templatePrompts)
      .where(eq(templatePrompts.templateId, templateId))
      .orderBy(templatePrompts.dayNumber);

    return { ...template, prompts };
  }

  async createJournalingTemplate(
    templateData: InsertJournalingTemplate,
    prompts: Array<{ dayNumber: number; title: string; prompt: string; tips?: string }>
  ): Promise<JournalingTemplate> {
    const [template] = await db.insert(journalingTemplates).values(templateData).returning();

    if (prompts && prompts.length > 0) {
      await db.insert(templatePrompts).values(
        prompts.map(p => ({
          templateId: template.id,
          dayNumber: p.dayNumber,
          title: p.title,
          prompt: p.prompt,
          tips: p.tips,
        }))
      );
    }

    return template;
  }

  async getUserTemplateProgress(userId: string) {
    const progress = await db.select().from(userTemplateProgress)
      .where(eq(userTemplateProgress.userId, userId))
      .orderBy(desc(userTemplateProgress.startedAt));

    // Get template info for each progress
    const results = await Promise.all(
      progress.map(async (p) => {
        const template = await this.getTemplateWithPrompts(p.templateId);
        return { ...p, template };
      })
    );

    return results;
  }

  async startTemplateProgress(data: InsertUserTemplateProgress): Promise<UserTemplateProgress> {
    const [result] = await db.insert(userTemplateProgress).values(data).returning();
    return result;
  }

  async createTemplateJournalEntry(data: InsertTemplateJournalEntry): Promise<TemplateJournalEntry> {
    const [result] = await db.insert(templateJournalEntries).values(data).returning();
    return result;
  }

  async advanceTemplateProgress(progressId: string): Promise<void> {
    const [progress] = await db.select().from(userTemplateProgress)
      .where(eq(userTemplateProgress.id, progressId))
      .limit(1);

    if (!progress) return;

    const [template] = await db.select().from(journalingTemplates)
      .where(eq(journalingTemplates.id, progress.templateId))
      .limit(1);

    if (!template) return;

    if (progress.currentDay >= template.totalDays) {
      // Mark as completed
      await db.update(userTemplateProgress)
        .set({ completedAt: new Date() })
        .where(eq(userTemplateProgress.id, progressId));
    } else {
      // Advance to next day
      await db.update(userTemplateProgress)
        .set({ currentDay: progress.currentDay + 1 })
        .where(eq(userTemplateProgress.id, progressId));
    }
  }

  // ========== CLIENT TRANSFERS ==========

  async createClientTransfer(data: InsertClientTransfer): Promise<ClientTransfer> {
    const [result] = await db.insert(clientTransfers).values(data).returning();
    return result;
  }

  async getIncomingTransfers(coachId: string): Promise<ClientTransfer[]> {
    return db.select().from(clientTransfers)
      .where(and(
        eq(clientTransfers.toCoachId, coachId),
        eq(clientTransfers.status, 'pending')
      ))
      .orderBy(desc(clientTransfers.createdAt));
  }

  async getOutgoingTransfers(coachId: string): Promise<ClientTransfer[]> {
    return db.select().from(clientTransfers)
      .where(eq(clientTransfers.fromCoachId, coachId))
      .orderBy(desc(clientTransfers.createdAt));
  }

  async respondToTransfer(id: string, coachId: string, status: string): Promise<ClientTransfer | null> {
    const [transfer] = await db.select().from(clientTransfers)
      .where(and(
        eq(clientTransfers.id, id),
        eq(clientTransfers.toCoachId, coachId)
      ))
      .limit(1);

    if (!transfer) return null;

    const [result] = await db.update(clientTransfers)
      .set({ status, respondedAt: new Date() })
      .where(eq(clientTransfers.id, id))
      .returning();

    return result;
  }

  async transferClient(clientId: string, fromCoachId: string, toCoachId: string): Promise<void> {
    // Update the coach-client relationship
    await db.update(coachClients)
      .set({ coachId: toCoachId })
      .where(and(
        eq(coachClients.clientId, clientId),
        eq(coachClients.coachId, fromCoachId)
      ));
  }

  // ========== CO-COACHING ==========

  async getCoCoaches(clientId: string): Promise<CoCoach[]> {
    return db.select().from(coCoaches)
      .where(eq(coCoaches.clientId, clientId));
  }

  async addCoCoach(data: InsertCoCoach): Promise<CoCoach> {
    const [result] = await db.insert(coCoaches).values(data).returning();
    return result;
  }

  async removeCoCoach(id: string): Promise<void> {
    await db.delete(coCoaches).where(eq(coCoaches.id, id));
  }

  // ========== COACH NOTIFICATIONS ==========

  async createCoachNotification(data: InsertCoachNotification): Promise<CoachNotification> {
    const [result] = await db.insert(coachNotifications).values(data).returning();
    return result;
  }

  async getCoachNotifications(coachId: string): Promise<CoachNotification[]> {
    return db.select().from(coachNotifications)
      .where(eq(coachNotifications.coachId, coachId))
      .orderBy(desc(coachNotifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationCount(coachId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(coachNotifications)
      .where(and(
        eq(coachNotifications.coachId, coachId),
        eq(coachNotifications.read, false)
      ));

    return result[0]?.count || 0;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(coachNotifications)
      .set({ read: true })
      .where(eq(coachNotifications.id, id));
  }

  async markAllNotificationsRead(coachId: string): Promise<void> {
    await db.update(coachNotifications)
      .set({ read: true })
      .where(eq(coachNotifications.coachId, coachId));
  }

  // ========== COACHES LIST ==========

  async getAllCoaches(): Promise<User[]> {
    return db.select().from(users)
      .where(eq(users.role, 'coach'));
  }

  // ========== DAILY QUOTES ==========

  async getDailyQuote(userId: string): Promise<DailyQuote | null> {
    // Get quotes the user hasn't seen yet
    const viewedQuoteIds = await db.select({ quoteId: userQuoteViews.quoteId })
      .from(userQuoteViews)
      .where(eq(userQuoteViews.userId, userId));

    const viewedIds = viewedQuoteIds.map(v => v.quoteId);

    // Get all quotes
    const allQuotes = await db.select().from(dailyQuotes);

    if (allQuotes.length === 0) {
      return null;
    }

    // Filter to unseen quotes
    let availableQuotes = allQuotes.filter(q => !viewedIds.includes(q.id));

    // If user has seen all quotes, reset and start over
    if (availableQuotes.length === 0) {
      availableQuotes = allQuotes;
    }

    // Use the date to get a consistent quote for the day
    const today = new Date().toISOString().split('T')[0];
    const dayIndex = parseInt(today.replace(/-/g, ''), 10) % availableQuotes.length;
    const quote = availableQuotes[dayIndex];

    // Mark as viewed
    const existingView = await db.select().from(userQuoteViews)
      .where(and(
        eq(userQuoteViews.userId, userId),
        eq(userQuoteViews.quoteId, quote.id)
      ))
      .limit(1);

    if (existingView.length === 0) {
      await db.insert(userQuoteViews).values({ userId, quoteId: quote.id });
    }

    return quote;
  }

  async getAllQuotes(): Promise<DailyQuote[]> {
    return db.select().from(dailyQuotes).orderBy(dailyQuotes.category);
  }

  async createQuote(data: InsertDailyQuote): Promise<DailyQuote> {
    const [result] = await db.insert(dailyQuotes).values(data).returning();
    return result;
  }

  async seedDefaultQuotes(): Promise<void> {
    const existingQuotes = await db.select().from(dailyQuotes).limit(1);
    if (existingQuotes.length > 0) return; // Already seeded

    const defaultQuotes: InsertDailyQuote[] = [
      // Motivation
      { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "motivation" },
      { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "motivation" },
      { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "motivation" },
      { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "motivation" },
      { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "motivation" },
      { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe", category: "motivation" },
      { quote: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy", category: "motivation" },

      // Mindfulness
      { quote: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh", category: "mindfulness" },
      { quote: "Be where you are, not where you think you should be.", author: "Unknown", category: "mindfulness" },
      { quote: "The mind is everything. What you think you become.", author: "Buddha", category: "mindfulness" },
      { quote: "In today's rush, we all think too much, seek too much, want too much, and forget about the joy of just being.", author: "Eckhart Tolle", category: "mindfulness" },
      { quote: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh", category: "mindfulness" },
      { quote: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James", category: "mindfulness" },

      // Growth
      { quote: "Growth is painful. Change is painful. But nothing is as painful as staying stuck somewhere you don't belong.", author: "Mandy Hale", category: "growth" },
      { quote: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", category: "growth" },
      { quote: "What we fear doing most is usually what we most need to do.", author: "Tim Ferriss", category: "growth" },
      { quote: "Life begins at the end of your comfort zone.", author: "Neale Donald Walsch", category: "growth" },
      { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar", category: "growth" },

      // Gratitude
      { quote: "Gratitude turns what we have into enough.", author: "Anonymous", category: "gratitude" },
      { quote: "When you are grateful, fear disappears and abundance appears.", author: "Tony Robbins", category: "gratitude" },
      { quote: "Gratitude is not only the greatest of virtues but the parent of all others.", author: "Cicero", category: "gratitude" },
      { quote: "The more grateful I am, the more beauty I see.", author: "Mary Davis", category: "gratitude" },
      { quote: "Gratitude makes sense of our past, brings peace for today, and creates a vision for tomorrow.", author: "Melody Beattie", category: "gratitude" },

      // Self-care
      { quote: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott", category: "motivation" },
      { quote: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha", category: "mindfulness" },
      { quote: "Rest when you're weary. Refresh and renew yourself. Then get back to work.", author: "Ralph Marston", category: "motivation" },
      { quote: "Self-care is giving the world the best of you, instead of what's left of you.", author: "Katie Reed", category: "growth" },
    ];

    await db.insert(dailyQuotes).values(defaultQuotes);
  }

  // ========== MICRO SESSIONS ==========

  async getTodayMicroSession(userId: string): Promise<MicroSession | null> {
    const today = new Date().toISOString().split('T')[0];
    const [result] = await db.select().from(microSessions)
      .where(and(
        eq(microSessions.userId, userId),
        eq(microSessions.date, today)
      ))
      .limit(1);
    return result || null;
  }

  async getMicroSessionStreak(userId: string): Promise<{ current: number; longest: number }> {
    const completedSessions = await db.select({ date: microSessions.date })
      .from(microSessions)
      .where(and(
        eq(microSessions.userId, userId),
        eq(microSessions.completed, true)
      ))
      .orderBy(desc(microSessions.date));

    const dates = completedSessions.map(s => s.date);
    return this.calculateStreak(dates);
  }

  async createOrUpdateMicroSession(data: InsertMicroSession): Promise<MicroSession> {
    const existing = await this.getTodayMicroSession(data.userId);

    if (existing) {
      const [result] = await db.update(microSessions)
        .set({
          durationSeconds: data.durationSeconds,
          completed: data.completed,
          notes: data.notes,
        })
        .where(eq(microSessions.id, existing.id))
        .returning();
      return result;
    }

    const [result] = await db.insert(microSessions).values(data).returning();
    return result;
  }

  async completeMicroSession(userId: string, date: string, durationSeconds: number): Promise<MicroSession> {
    const existing = await db.select().from(microSessions)
      .where(and(
        eq(microSessions.userId, userId),
        eq(microSessions.date, date)
      ))
      .limit(1);

    if (existing.length > 0) {
      const [result] = await db.update(microSessions)
        .set({
          durationSeconds,
          completed: true,
        })
        .where(eq(microSessions.id, existing[0].id))
        .returning();
      return result;
    }

    const [result] = await db.insert(microSessions).values({
      userId,
      date,
      durationSeconds,
      completed: true,
    }).returning();
    return result;
  }

  // ========== APP PROFILES ==========

  async getAllAppProfiles(): Promise<AppProfile[]> {
    return await db.select().from(appProfiles).orderBy(appProfiles.name);
  }

  async getAppProfile(id: string): Promise<AppProfile | undefined> {
    const [result] = await db.select().from(appProfiles).where(eq(appProfiles.id, id)).limit(1);
    return result;
  }

  async getDefaultAppProfile(): Promise<AppProfile | undefined> {
    const [result] = await db.select().from(appProfiles).where(eq(appProfiles.isDefault, true)).limit(1);
    return result;
  }

  async createAppProfile(data: InsertAppProfile): Promise<AppProfile> {
    const [result] = await db.insert(appProfiles).values(data).returning();
    return result;
  }

  async updateAppProfile(id: string, data: UpdateAppProfile): Promise<AppProfile> {
    const [result] = await db.update(appProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(appProfiles.id, id))
      .returning();
    return result;
  }

  async deleteAppProfile(id: string): Promise<void> {
    await db.delete(userProfileAssignments).where(eq(userProfileAssignments.profileId, id));
    await db.delete(appProfiles).where(eq(appProfiles.id, id));
  }

  async setDefaultProfile(id: string): Promise<void> {
    await db.update(appProfiles).set({ isDefault: false }).where(eq(appProfiles.isDefault, true));
    await db.update(appProfiles).set({ isDefault: true }).where(eq(appProfiles.id, id));
  }

  // ========== USER PROFILE ASSIGNMENTS ==========

  async getUserProfileAssignment(userId: string): Promise<UserProfileAssignment | undefined> {
    const [result] = await db.select().from(userProfileAssignments)
      .where(eq(userProfileAssignments.userId, userId))
      .limit(1);
    return result;
  }

  async getUserAppProfile(userId: string): Promise<AppProfile | undefined> {
    const assignment = await this.getUserProfileAssignment(userId);
    if (assignment) {
      return this.getAppProfile(assignment.profileId);
    }
    return this.getDefaultAppProfile();
  }

  async assignProfileToUser(userId: string, profileId: string, assignedBy?: string): Promise<UserProfileAssignment> {
    // Validate that the profile exists before assigning
    const profile = await this.getAppProfile(profileId);
    if (!profile) {
      throw new Error(`Profile with id ${profileId} does not exist`);
    }

    const existing = await this.getUserProfileAssignment(userId);

    if (existing) {
      const [result] = await db.update(userProfileAssignments)
        .set({ profileId, assignedBy })
        .where(eq(userProfileAssignments.userId, userId))
        .returning();
      return result;
    }

    const [result] = await db.insert(userProfileAssignments)
      .values({ userId, profileId, assignedBy })
      .returning();
    return result;
  }

  async removeUserProfileAssignment(userId: string): Promise<void> {
    await db.delete(userProfileAssignments).where(eq(userProfileAssignments.userId, userId));
  }

  // ========== SUPER ADMIN ==========

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.name);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [result] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result;
  }

  // ========== DAILY METRICS ==========

  async getTodayMetrics(userId: string): Promise<DailyMetrics | null> {
    const today = new Date().toISOString().split('T')[0];
    const [result] = await db.select().from(dailyMetrics)
      .where(and(eq(dailyMetrics.userId, userId), eq(dailyMetrics.date, today)))
      .limit(1);
    return result || null;
  }

  async getMetricsByDateRange(userId: string, startDate: string, endDate: string): Promise<DailyMetrics[]> {
    return db.select().from(dailyMetrics)
      .where(and(
        eq(dailyMetrics.userId, userId),
        gte(dailyMetrics.date, startDate),
        sql`${dailyMetrics.date} <= ${endDate}`
      ))
      .orderBy(desc(dailyMetrics.date));
  }

  async createOrUpdateDailyMetrics(userId: string, date: string, data: UpdateDailyMetrics): Promise<DailyMetrics> {
    const existing = await db.select().from(dailyMetrics)
      .where(and(eq(dailyMetrics.userId, userId), eq(dailyMetrics.date, date)))
      .limit(1);

    if (existing.length > 0) {
      const [result] = await db.update(dailyMetrics)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(dailyMetrics.id, existing[0].id))
        .returning();
      return result;
    }

    const [result] = await db.insert(dailyMetrics)
      .values({ userId, date, ...data })
      .returning();
    return result;
  }

  async getWeeklyMetricsAverage(userId: string, weekStart: string): Promise<{
    avgMood: number | null;
    avgEnergy: number | null;
    avgStress: number | null;
    avgSleepHours: number | null;
    avgSleepQuality: number | null;
  }> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const endDate = weekEnd.toISOString().split('T')[0];

    const metrics = await this.getMetricsByDateRange(userId, weekStart, endDate);

    if (metrics.length === 0) {
      return { avgMood: null, avgEnergy: null, avgStress: null, avgSleepHours: null, avgSleepQuality: null };
    }

    const sum = (arr: (number | null)[]) => arr.filter(n => n !== null).reduce((a, b) => a! + b!, 0);
    const count = (arr: (number | null)[]) => arr.filter(n => n !== null).length;
    const avg = (arr: (number | null)[]) => count(arr) > 0 ? sum(arr)! / count(arr) : null;

    return {
      avgMood: avg(metrics.map(m => m.moodScore)),
      avgEnergy: avg(metrics.map(m => m.energyScore)),
      avgStress: avg(metrics.map(m => m.stressScore)),
      avgSleepHours: avg(metrics.map(m => m.sleepHours)),
      avgSleepQuality: avg(metrics.map(m => m.sleepQuality)),
    };
  }

  // ========== DAILY RITUALS ==========

  async getTodayRituals(userId: string): Promise<DailyRitual[]> {
    const today = new Date().toISOString().split('T')[0];
    return db.select().from(dailyRituals)
      .where(and(eq(dailyRituals.userId, userId), eq(dailyRituals.date, today)));
  }

  async getRitualByTypeAndDate(userId: string, date: string, ritualType: string): Promise<DailyRitual | null> {
    const [result] = await db.select().from(dailyRituals)
      .where(and(
        eq(dailyRituals.userId, userId),
        eq(dailyRituals.date, date),
        eq(dailyRituals.ritualType, ritualType)
      ))
      .limit(1);
    return result || null;
  }

  async createOrUpdateRitual(data: InsertDailyRitual): Promise<DailyRitual> {
    const existing = await this.getRitualByTypeAndDate(data.userId, data.date, data.ritualType);

    if (existing) {
      const [result] = await db.update(dailyRituals)
        .set(data)
        .where(eq(dailyRituals.id, existing.id))
        .returning();
      return result;
    }

    const [result] = await db.insert(dailyRituals).values(data).returning();
    return result;
  }

  async completeRitual(id: string, energyAfter?: number): Promise<DailyRitual> {
    const [result] = await db.update(dailyRituals)
      .set({ completed: true, completedAt: new Date(), energyAfter })
      .where(eq(dailyRituals.id, id))
      .returning();
    return result;
  }

  // ========== PRACTICE LIBRARY ==========

  async getAllPractices(filters?: { type?: string; category?: string; durationCategory?: string }): Promise<Practice[]> {
    let query = db.select().from(practices).where(eq(practices.isActive, true));

    // Note: filters would need to be applied with additional where clauses
    // For now, fetch all and filter in memory for simplicity
    const results = await query.orderBy(practices.sortOrder);

    if (!filters) return results;

    return results.filter(p => {
      if (filters.type && p.type !== filters.type) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.durationCategory && p.durationCategory !== filters.durationCategory) return false;
      return true;
    });
  }

  async getPractice(id: string): Promise<Practice | null> {
    const [result] = await db.select().from(practices).where(eq(practices.id, id)).limit(1);
    return result || null;
  }

  async createPractice(data: InsertPractice): Promise<Practice> {
    const [result] = await db.insert(practices).values(data).returning();
    return result;
  }

  async updatePractice(id: string, data: UpdatePractice): Promise<Practice> {
    const [result] = await db.update(practices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(practices.id, id))
      .returning();
    return result;
  }

  async deletePractice(id: string): Promise<void> {
    await db.update(practices).set({ isActive: false }).where(eq(practices.id, id));
  }

  async seedDefaultPractices(): Promise<void> {
    const existing = await db.select().from(practices).limit(1);
    if (existing.length > 0) return;

    const defaultPractices: InsertPractice[] = [
      {
        type: "breathing",
        name: "4-7-8 Relaxing",
        subtitle: "Classic calm technique",
        description: "Inhale 4s, hold 7s, exhale 8s. Perfect for reducing anxiety and preparing for sleep.",
        category: "sleep",
        durationSeconds: 228, // ~4 cycles
        durationCategory: "short",
        iconName: "Moon",
        colorGradient: "from-forest-floor to-deep-pine",
        phases: JSON.stringify([
          { phase: "inhale", duration: 4000, label: "Inhale" },
          { phase: "hold", duration: 7000, label: "Hold" },
          { phase: "exhale", duration: 8000, label: "Exhale" },
        ]),
        sortOrder: 1,
      },
      {
        type: "breathing",
        name: "Box Breathing",
        subtitle: "Navy SEAL technique",
        description: "Equal 4-second intervals for inhale, hold, exhale, hold. Used by elite performers for focus.",
        category: "focus",
        durationSeconds: 192, // ~3 cycles
        durationCategory: "short",
        iconName: "Brain",
        colorGradient: "from-sage to-forest-floor",
        phases: JSON.stringify([
          { phase: "inhale", duration: 4000, label: "Inhale" },
          { phase: "hold", duration: 4000, label: "Hold" },
          { phase: "exhale", duration: 4000, label: "Exhale" },
          { phase: "holdEmpty", duration: 4000, label: "Hold" },
        ]),
        sortOrder: 2,
      },
      {
        type: "breathing",
        name: "Resonant Breathing",
        subtitle: "Heart coherence",
        description: "5-second inhales and exhales at ~6 breaths per minute. Optimizes heart rate variability.",
        category: "grounding",
        durationSeconds: 300, // 5 min
        durationCategory: "short",
        iconName: "Heart",
        colorGradient: "from-birch/80 to-sage",
        phases: JSON.stringify([
          { phase: "inhale", duration: 5000, label: "Inhale" },
          { phase: "exhale", duration: 5000, label: "Exhale" },
        ]),
        sortOrder: 3,
      },
      {
        type: "breathing",
        name: "Fire Breath",
        subtitle: "Bhastrika / Bellows",
        description: "Quick, powerful breaths to boost energy and alertness. Stokes your inner fire.",
        category: "energizing",
        durationSeconds: 60,
        durationCategory: "short",
        iconName: "Zap",
        colorGradient: "from-birch to-forest-floor",
        phases: JSON.stringify([
          { phase: "inhale", duration: 1000, label: "In" },
          { phase: "exhale", duration: 1000, label: "Out" },
        ]),
        cycles: 15,
        specialInstructions: "Breathe rapidly through your nose",
        sortOrder: 4,
      },
      {
        type: "breathing",
        name: "2-4 Relaxing",
        subtitle: "Extended exhale",
        description: "Short inhale, long exhale activates your parasympathetic nervous system for deep relaxation.",
        category: "stress_relief",
        durationSeconds: 180,
        durationCategory: "short",
        iconName: "Leaf",
        colorGradient: "from-sage/80 to-deep-pine",
        phases: JSON.stringify([
          { phase: "inhale", duration: 2000, label: "Inhale" },
          { phase: "exhale", duration: 4000, label: "Exhale" },
        ]),
        sortOrder: 5,
      },
      {
        type: "breathing",
        name: "Deep Belly",
        subtitle: "Diaphragmatic breathing",
        description: "Slow, deep breaths into your belly. The foundation of grounding work.",
        category: "grounding",
        durationSeconds: 300,
        durationCategory: "short",
        iconName: "Wind",
        colorGradient: "from-forest-floor to-sage/50",
        phases: JSON.stringify([
          { phase: "inhale", duration: 4000, label: "Breathe In" },
          { phase: "hold", duration: 1000, label: "Pause" },
          { phase: "exhale", duration: 6000, label: "Breathe Out" },
        ]),
        specialInstructions: "Place hand on belly, feel it rise and fall",
        sortOrder: 6,
      },
      {
        type: "breathing",
        name: "Wim Hof Method",
        subtitle: "Cold warrior breathing",
        description: "30 deep breaths followed by breath retention. Increases energy, focus, and stress resilience.",
        category: "energizing",
        durationSeconds: 180,
        durationCategory: "short",
        iconName: "Flame",
        colorGradient: "from-birch/70 to-deep-pine",
        phases: JSON.stringify([
          { phase: "inhale", duration: 1500, label: "Deep In" },
          { phase: "exhale", duration: 1500, label: "Let Go" },
        ]),
        cycles: 30,
        specialInstructions: "After 30 breaths, exhale and hold as long as comfortable",
        sortOrder: 7,
      },
      {
        type: "body_scan",
        name: "5-Minute Body Scan",
        subtitle: "Quick grounding",
        description: "A brief journey through your body to release tension and increase awareness.",
        category: "grounding",
        durationSeconds: 300,
        durationCategory: "short",
        iconName: "User",
        colorGradient: "from-sage to-forest-floor",
        sortOrder: 10,
      },
      {
        type: "body_scan",
        name: "Deep Body Scan",
        subtitle: "Full relaxation",
        description: "A thorough, peaceful journey through every part of your body.",
        category: "sleep",
        durationSeconds: 900,
        durationCategory: "medium",
        iconName: "Moon",
        colorGradient: "from-deep-pine to-night-forest",
        sortOrder: 11,
      },
    ];

    await db.insert(practices).values(defaultPractices);
  }

  // ========== PRACTICE FAVORITES & SESSIONS ==========

  async getUserFavorites(userId: string): Promise<(PracticeFavorite & { practice: Practice })[]> {
    const favorites = await db.select().from(practiceFavorites)
      .where(eq(practiceFavorites.userId, userId));

    const results = await Promise.all(favorites.map(async (fav) => {
      const practice = await this.getPractice(fav.practiceId);
      return { ...fav, practice: practice! };
    }));

    return results.filter(r => r.practice !== null);
  }

  async toggleFavorite(userId: string, practiceId: string): Promise<boolean> {
    const existing = await db.select().from(practiceFavorites)
      .where(and(eq(practiceFavorites.userId, userId), eq(practiceFavorites.practiceId, practiceId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(practiceFavorites).where(eq(practiceFavorites.id, existing[0].id));
      return false; // Unfavorited
    }

    await db.insert(practiceFavorites).values({ userId, practiceId });
    return true; // Favorited
  }

  async createPracticeSession(data: InsertPracticeSession): Promise<PracticeSession> {
    const [result] = await db.insert(practiceSessions).values(data).returning();
    return result;
  }

  async getUserPracticeSessions(userId: string, limit: number = 20): Promise<(PracticeSession & { practice: Practice })[]> {
    const sessions = await db.select().from(practiceSessions)
      .where(eq(practiceSessions.userId, userId))
      .orderBy(desc(practiceSessions.createdAt))
      .limit(limit);

    const results = await Promise.all(sessions.map(async (session) => {
      const practice = await this.getPractice(session.practiceId);
      return { ...session, practice: practice! };
    }));

    return results.filter(r => r.practice !== null);
  }

  async getPracticeUsageStats(userId: string): Promise<{ practiceId: string; count: number; totalDuration: number }[]> {
    const sessions = await db.select().from(practiceSessions)
      .where(eq(practiceSessions.userId, userId));

    const stats: Record<string, { count: number; totalDuration: number }> = {};

    for (const session of sessions) {
      if (!stats[session.practiceId]) {
        stats[session.practiceId] = { count: 0, totalDuration: 0 };
      }
      stats[session.practiceId].count++;
      stats[session.practiceId].totalDuration += session.durationSeconds;
    }

    return Object.entries(stats).map(([practiceId, data]) => ({ practiceId, ...data }));
  }

  // ========== CHALLENGES ==========

  async getChallenges(filters?: { type?: string; category?: string; active?: boolean }): Promise<Challenge[]> {
    let results = await db.select().from(challenges).orderBy(desc(challenges.createdAt));

    if (!filters) return results;

    return results.filter(c => {
      if (filters.type && c.challengeType !== filters.type) return false;
      if (filters.category && c.category !== filters.category) return false;
      if (filters.active !== undefined && c.isActive !== filters.active) return false;
      return true;
    });
  }

  async getChallenge(id: string): Promise<Challenge | null> {
    const [result] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    return result || null;
  }

  async createChallenge(data: InsertChallenge): Promise<Challenge> {
    const [result] = await db.insert(challenges).values(data).returning();
    return result;
  }

  // Check if user is already a participant in a challenge
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

  async joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant> {
    const [result] = await db.insert(challengeParticipants)
      .values({ challengeId, userId })
      .returning();
    return result;
  }

  async leaveChallenge(challengeId: string, userId: string): Promise<void> {
    await db.delete(challengeParticipants)
      .where(and(eq(challengeParticipants.challengeId, challengeId), eq(challengeParticipants.userId, userId)));
  }

  async getChallengeParticipants(challengeId: string): Promise<(ChallengeParticipant & { user: User })[]> {
    const participants = await db.select().from(challengeParticipants)
      .where(eq(challengeParticipants.challengeId, challengeId));

    const results = await Promise.all(participants.map(async (p) => {
      const user = await this.getUser(p.userId);
      return { ...p, user: user! };
    }));

    return results.filter(r => r.user !== undefined);
  }

  async getUserChallenges(userId: string): Promise<(ChallengeParticipant & { challenge: Challenge })[]> {
    const participations = await db.select().from(challengeParticipants)
      .where(eq(challengeParticipants.userId, userId));

    const results = await Promise.all(participations.map(async (p) => {
      const challenge = await this.getChallenge(p.challengeId);
      return { ...p, challenge: challenge! };
    }));

    return results.filter(r => r.challenge !== null);
  }

  async createChallengeCheckin(data: InsertChallengeCheckin): Promise<ChallengeCheckin> {
    const [result] = await db.insert(challengeCheckins).values(data).returning();

    // Update participant stats
    if (data.completed) {
      const participant = await db.select().from(challengeParticipants)
        .where(eq(challengeParticipants.id, data.participantId))
        .limit(1);

      if (participant.length > 0) {
        const p = participant[0];
        await db.update(challengeParticipants)
          .set({
            totalCompletions: p.totalCompletions + 1,
            currentStreak: p.currentStreak + 1,
            bestStreak: Math.max(p.bestStreak, p.currentStreak + 1),
          })
          .where(eq(challengeParticipants.id, p.id));
      }
    }

    return result;
  }

  async getChallengeLeaderboard(challengeId: string): Promise<{ participant: ChallengeParticipant; user: User; rank: number }[]> {
    const participants = await db.select().from(challengeParticipants)
      .where(eq(challengeParticipants.challengeId, challengeId))
      .orderBy(desc(challengeParticipants.totalCompletions));

    const results = await Promise.all(participants.map(async (p, index) => {
      const user = await this.getUser(p.userId);
      return { participant: p, user: user!, rank: index + 1 };
    }));

    return results.filter(r => r.user !== undefined);
  }

  // ========== GAMIFICATION ==========

  async getUserGamification(userId: string): Promise<UserGamification> {
    const [existing] = await db.select().from(userGamification)
      .where(eq(userGamification.userId, userId))
      .limit(1);

    if (existing) return existing;

    // Create new gamification record
    const [result] = await db.insert(userGamification)
      .values({ userId, totalXp: 0, currentLevel: 1, xpToNextLevel: 100 })
      .returning();
    return result;
  }

  calculateLevel(totalXp: number): { level: number; xpToNextLevel: number } {
    // XP curve: Level N requires 100 * N XP to reach
    // Level 1: 0-99 XP, Level 2: 100-299 XP, Level 3: 300-599 XP, etc.
    let level = 1;
    let xpForLevel = 100;
    let cumulativeXp = 0;

    while (cumulativeXp + xpForLevel <= totalXp) {
      cumulativeXp += xpForLevel;
      level++;
      xpForLevel = 100 * level;
    }

    const xpInCurrentLevel = totalXp - cumulativeXp;
    const xpToNextLevel = xpForLevel - xpInCurrentLevel;

    return { level, xpToNextLevel };
  }

  async awardXp(userId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<{ xp: XpTransaction; gamification: UserGamification }> {
    // Use atomic SQL increment to prevent race conditions
    // First, atomically increment the XP
    const [updated] = await db.update(userGamification)
      .set({
        totalXp: sql`${userGamification.totalXp} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(userGamification.userId, userId))
      .returning();

    // If no record exists, create one first
    let gamification = updated;
    if (!gamification) {
      const [created] = await db.insert(userGamification)
        .values({ userId, totalXp: amount })
        .returning();
      gamification = created;
    }

    // Calculate and update level based on new total
    const { level, xpToNextLevel } = this.calculateLevel(gamification.totalXp);
    if (gamification.currentLevel !== level || gamification.xpToNextLevel !== xpToNextLevel) {
      const [levelUpdated] = await db.update(userGamification)
        .set({ currentLevel: level, xpToNextLevel, updatedAt: new Date() })
        .where(eq(userGamification.userId, userId))
        .returning();
      gamification = levelUpdated;
    }

    // Create XP transaction record
    const [xp] = await db.insert(xpTransactions)
      .values({ userId, amount, source, sourceId, description })
      .returning();

    return { xp, gamification };
  }

  async getXpHistory(userId: string, limit: number = 50): Promise<XpTransaction[]> {
    return db.select().from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.createdAt))
      .limit(limit);
  }

  // ========== USER GOALS ==========

  async getUserGoals(userId: string): Promise<UserGoal[]> {
    return db.select().from(userGoals)
      .where(and(eq(userGoals.userId, userId), eq(userGoals.isActive, true)))
      .orderBy(userGoals.priority);
  }

  async createUserGoal(data: InsertUserGoal): Promise<UserGoal> {
    const [result] = await db.insert(userGoals).values(data).returning();
    return result;
  }

  async updateUserGoal(id: string, data: Partial<InsertUserGoal>): Promise<UserGoal> {
    const [result] = await db.update(userGoals)
      .set(data)
      .where(eq(userGoals.id, id))
      .returning();
    return result;
  }

  async deleteUserGoal(id: string): Promise<void> {
    await db.update(userGoals).set({ isActive: false }).where(eq(userGoals.id, id));
  }

  // ========== EVENTS ==========

  async getEvents(filters?: { type?: string; upcoming?: boolean; published?: boolean; hasRecording?: boolean }): Promise<Event[]> {
    let results = await db.select().from(events).orderBy(events.startTime);

    if (!filters) return results;

    const now = new Date();
    return results.filter(e => {
      if (filters.type && e.eventType !== filters.type) return false;
      if (filters.upcoming && new Date(e.startTime) < now) return false;
      if (filters.published !== undefined && e.isPublished !== filters.published) return false;
      if (filters.hasRecording && !e.recordingUrl) return false;
      return true;
    });
  }

  async getEvent(id: string): Promise<Event | null> {
    const [result] = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result || null;
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    const [result] = await db.insert(events).values(data).returning();
    return result;
  }

  async updateEvent(id: string, data: UpdateEvent): Promise<Event> {
    const [result] = await db.update(events)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return result;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, id));
    await db.delete(events).where(eq(events.id, id));
  }

  async registerForEvent(eventId: string, userId: string): Promise<EventRegistration> {
    const [result] = await db.insert(eventRegistrations)
      .values({ eventId, userId })
      .returning();
    return result;
  }

  async cancelEventRegistration(eventId: string, userId: string): Promise<void> {
    await db.update(eventRegistrations)
      .set({ status: "cancelled" })
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)));
  }

  async getUserEventRegistrations(userId: string): Promise<(EventRegistration & { event: Event })[]> {
    const registrations = await db.select().from(eventRegistrations)
      .where(eq(eventRegistrations.userId, userId));

    const results = await Promise.all(registrations.map(async (r) => {
      const event = await this.getEvent(r.eventId);
      return { ...r, event: event! };
    }));

    return results.filter(r => r.event !== null);
  }

  async getEventRegistrations(eventId: string): Promise<(EventRegistration & { user: User })[]> {
    const registrations = await db.select().from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId));

    const results = await Promise.all(registrations.map(async (r) => {
      const user = await this.getUser(r.userId);
      return { ...r, user: user! };
    }));

    return results.filter(r => r.user !== undefined);
  }

  // ========== WEEKLY SCORECARDS ==========

  async getWeeklyScorecard(userId: string, weekStart: string): Promise<WeeklyScorecard | null> {
    const [result] = await db.select().from(weeklyScorecards)
      .where(and(eq(weeklyScorecards.userId, userId), eq(weeklyScorecards.weekStart, weekStart)))
      .limit(1);
    return result || null;
  }

  async createOrUpdateWeeklyScorecard(data: InsertWeeklyScorecard): Promise<WeeklyScorecard> {
    const existing = await this.getWeeklyScorecard(data.userId, data.weekStart);

    if (existing) {
      const [result] = await db.update(weeklyScorecards)
        .set(data)
        .where(eq(weeklyScorecards.id, existing.id))
        .returning();
      return result;
    }

    const [result] = await db.insert(weeklyScorecards).values(data).returning();
    return result;
  }

  async getUserScorecards(userId: string, limit: number = 12): Promise<WeeklyScorecard[]> {
    return db.select().from(weeklyScorecards)
      .where(eq(weeklyScorecards.userId, userId))
      .orderBy(desc(weeklyScorecards.weekStart))
      .limit(limit);
  }

  // ========== USER MILESTONES ==========

  async getUserMilestones(userId: string): Promise<UserMilestone[]> {
    return db.select().from(userMilestones)
      .where(eq(userMilestones.userId, userId))
      .orderBy(desc(userMilestones.achievedAt));
  }

  async createMilestone(data: InsertUserMilestone): Promise<UserMilestone> {
    const [result] = await db.insert(userMilestones).values(data).returning();
    return result;
  }

  // ========== AI CONVERSATIONS ==========

  async createAiConversation(data: InsertAiConversation): Promise<AiConversation> {
    const [result] = await db.insert(aiConversations).values(data).returning();
    return result;
  }

  async getAiConversation(id: string): Promise<AiConversation | null> {
    const [result] = await db.select().from(aiConversations)
      .where(eq(aiConversations.id, id))
      .limit(1);
    return result || null;
  }

  async endAiConversation(id: string, summary?: string): Promise<AiConversation> {
    const [result] = await db.update(aiConversations)
      .set({ endedAt: new Date(), summary })
      .where(eq(aiConversations.id, id))
      .returning();
    return result;
  }

  async getUserAiConversations(userId: string, limit: number = 20): Promise<AiConversation[]> {
    return db.select().from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.startedAt))
      .limit(limit);
  }

  async addAiMessage(data: InsertAiMessage): Promise<AiMessage> {
    const [result] = await db.insert(aiMessages).values(data).returning();

    // Increment message count
    await db.update(aiConversations)
      .set({ messagesCount: sql`${aiConversations.messagesCount} + 1` })
      .where(eq(aiConversations.id, data.conversationId));

    return result;
  }

  async getConversationMessages(conversationId: string): Promise<AiMessage[]> {
    return db.select().from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt);
  }
}

export const storage = new DatabaseStorage();
