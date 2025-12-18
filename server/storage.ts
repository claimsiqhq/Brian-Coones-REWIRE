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
  getMoodTrends(userId: string, days: number): Promise<{ date: string; mood: string; score: number }[]>;
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
  async getMoodTrends(userId: string, days: number): Promise<{ date: string; mood: string; score: number }[]> {
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
      score: moodScores[m.mood.toLowerCase()] || 3
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
}

export const storage = new DatabaseStorage();
