import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoles = ["client", "coach", "admin", "superadmin"] as const;
export type UserRole = typeof userRoles[number];

// Account tiers for premium features
export const accountTiers = ["free", "member", "coach"] as const;
export type AccountTier = typeof accountTiers[number];

// Users table - email-based authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  username: text("username").unique(),
  password: text("password"),
  name: text("name"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default("client"),
  accountTier: varchar("account_tier", { length: 20 }).notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coach-Client relationships
export const coachClients = pgTable("coach_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coach invites for clients to join
export const coachInvites = pgTable("coach_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").notNull().references(() => users.id),
  code: varchar("code", { length: 20 }).notNull().unique(),
  inviteeEmail: varchar("invitee_email", { length: 255 }),
  inviteeName: varchar("invitee_name", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  usedBy: varchar("used_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moods = pgTable("moods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  mood: text("mood").notNull(),
  energyLevel: integer("energy_level"),
  stressLevel: integer("stress_level"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  label: text("label").notNull(),
  order: integer("order").notNull().default(0),
});

export const habitCompletions = pgTable("habit_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  habitId: varchar("habit_id").notNull().references(() => habits.id),
  date: text("date").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mood: text("mood"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const homework = pgTable("homework", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  assignedBy: varchar("assigned_by").references(() => users.id),
  content: text("content").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const visionBoardItems = pgTable("vision_board_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(),
  label: text("label").notNull(),
  order: integer("order").notNull().default(0),
});

export const ventMessages = pgTable("vent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: text("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  coachVoice: boolean("coach_voice").notNull().default(true),
  notifications: boolean("notifications").notNull().default(true),
  darkMode: boolean("dark_mode").notNull().default(false),
  reminderTime: text("reminder_time").notNull().default("09:00"),
  timezone: text("timezone").notNull().default("UTC"),
  privacyShareMoods: boolean("privacy_share_moods").notNull().default(true),
  privacyShareJournals: boolean("privacy_share_journals").notNull().default(false),
  privacyShareHabits: boolean("privacy_share_habits").notNull().default(true),
});

// Session statuses
export const sessionStatuses = ["scheduled", "completed", "cancelled", "rescheduled"] as const;
export type SessionStatus = typeof sessionStatuses[number];

// Coaching sessions table
export const coachingSessions = pgTable("coaching_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").notNull().references(() => users.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  notes: text("notes"),
  calendarEventId: text("calendar_event_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Journaling templates - multi-day guided programs
export const journalingTemplates = pgTable("journaling_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  totalDays: integer("total_days").notNull().default(7),
  isShared: boolean("is_shared").notNull().default(false), // Available in shared library
  category: varchar("category", { length: 50 }).default("general"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual prompts for each day of a template
export const templatePrompts = pgTable("template_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => journalingTemplates.id),
  dayNumber: integer("day_number").notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  tips: text("tips"),
});

// User progress on journaling templates
export const userTemplateProgress = pgTable("user_template_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateId: varchar("template_id").notNull().references(() => journalingTemplates.id),
  currentDay: integer("current_day").notNull().default(1),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  assignedBy: varchar("assigned_by").references(() => users.id), // If assigned by coach
});

// Journal entries linked to template prompts
export const templateJournalEntries = pgTable("template_journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  progressId: varchar("progress_id").notNull().references(() => userTemplateProgress.id),
  promptId: varchar("prompt_id").notNull().references(() => templatePrompts.id),
  content: text("content").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Client transfers/referrals between coaches
export const clientTransfers = pgTable("client_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  fromCoachId: varchar("from_coach_id").notNull().references(() => users.id),
  toCoachId: varchar("to_coach_id").notNull().references(() => users.id),
  notes: text("notes"), // Transfer notes/context
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Co-coaching - multiple coaches per client/program
export const coCoaches = pgTable("co_coaches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  primaryCoachId: varchar("primary_coach_id").notNull().references(() => users.id),
  secondaryCoachId: varchar("secondary_coach_id").notNull().references(() => users.id),
  role: varchar("role", { length: 30 }).default("co-coach"), // co-coach, specialist, supervisor
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity notifications for coach collaboration
export const coachNotifications = pgTable("coach_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coachId: varchar("coach_id").notNull().references(() => users.id), // Who receives the notification
  actorId: varchar("actor_id").references(() => users.id), // Who performed the action
  clientId: varchar("client_id").references(() => users.id), // Related client
  type: varchar("type", { length: 50 }).notNull(), // homework_assigned, transfer_request, session_booked, etc.
  title: text("title").notNull(),
  message: text("message"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily motivational quotes
export const dailyQuotes = pgTable("daily_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quote: text("quote").notNull(),
  author: text("author"),
  category: varchar("category", { length: 50 }).default("motivation"), // motivation, mindfulness, growth, gratitude
  createdAt: timestamp("created_at").defaultNow(),
});

// User quote views (track which quotes users have seen)
export const userQuoteViews = pgTable("user_quote_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  quoteId: varchar("quote_id").notNull().references(() => dailyQuotes.id),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Micro coaching sessions - daily 5-minute check-ins
export const microSessions = pgTable("micro_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  durationSeconds: integer("duration_seconds").notNull().default(0), // Actual duration
  targetDurationSeconds: integer("target_duration_seconds").notNull().default(300), // 5 minutes = 300 seconds
  completed: boolean("completed").notNull().default(false),
  sessionType: varchar("session_type", { length: 30 }).default("daily-checkin"), // daily-checkin, quick-chat, focused
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// App profiles - theme and feature configurations
export const appProfiles = pgTable("app_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "REWIRE with Brian Coones"
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false), // Default profile for new users
  themeTokens: jsonb("theme_tokens").notNull().default({}), // CSS variable overrides
  featureFlags: jsonb("feature_flags").notNull().default({}), // Enabled/disabled features
  logoUrl: text("logo_url"),
  brandName: text("brand_name"),
  contactEmail: text("contact_email"), // Email used for sending emails from this profile
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profile assignments - which profile a user is assigned to
export const userProfileAssignments = pgTable("user_profile_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  profileId: varchar("profile_id").notNull().references(() => appProfiles.id),
  assignedBy: varchar("assigned_by").references(() => users.id), // Superadmin who assigned it
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const insertMoodSchema = createInsertSchema(moods).omit({ id: true, timestamp: true });
export const insertHabitSchema = createInsertSchema(habits).omit({ id: true, order: true });
export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).omit({ id: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, timestamp: true });
export const insertHomeworkSchema = createInsertSchema(homework).omit({ id: true, createdAt: true });
export const insertVisionBoardItemSchema = createInsertSchema(visionBoardItems).omit({ id: true, order: true });
export const insertVentMessageSchema = createInsertSchema(ventMessages).omit({ id: true, timestamp: true });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, earnedAt: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });
export const updateUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, userId: true }).partial();
export const insertCoachClientSchema = createInsertSchema(coachClients).omit({ id: true, createdAt: true });
export const insertCoachInviteSchema = createInsertSchema(coachInvites).omit({ id: true, createdAt: true, usedBy: true });
export const insertCoachingSessionSchema = createInsertSchema(coachingSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const updateCoachingSessionSchema = createInsertSchema(coachingSessions).omit({ id: true, coachId: true, clientId: true, createdAt: true, updatedAt: true }).partial();

// New schemas for collaboration features
export const insertJournalingTemplateSchema = createInsertSchema(journalingTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTemplatePromptSchema = createInsertSchema(templatePrompts).omit({ id: true });
export const insertUserTemplateProgressSchema = createInsertSchema(userTemplateProgress).omit({ id: true, startedAt: true, completedAt: true });
export const insertTemplateJournalEntrySchema = createInsertSchema(templateJournalEntries).omit({ id: true, completedAt: true });
export const insertClientTransferSchema = createInsertSchema(clientTransfers).omit({ id: true, createdAt: true, respondedAt: true, status: true });
export const insertCoCoachSchema = createInsertSchema(coCoaches).omit({ id: true, createdAt: true });
export const insertCoachNotificationSchema = createInsertSchema(coachNotifications).omit({ id: true, createdAt: true, read: true });
export const insertDailyQuoteSchema = createInsertSchema(dailyQuotes).omit({ id: true, createdAt: true });
export const insertMicroSessionSchema = createInsertSchema(microSessions).omit({ id: true, createdAt: true });
export const insertAppProfileSchema = createInsertSchema(appProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const updateAppProfileSchema = createInsertSchema(appProfiles).omit({ id: true, createdAt: true, updatedAt: true }).partial();
export const insertUserProfileAssignmentSchema = createInsertSchema(userProfileAssignments).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertMood = z.infer<typeof insertMoodSchema>;
export type Mood = typeof moods.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;
export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;
export type Homework = typeof homework.$inferSelect;
export type InsertVisionBoardItem = z.infer<typeof insertVisionBoardItemSchema>;
export type VisionBoardItem = typeof visionBoardItems.$inferSelect;
export type InsertVentMessage = z.infer<typeof insertVentMessageSchema>;
export type VentMessage = typeof ventMessages.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type CoachClient = typeof coachClients.$inferSelect;
export type InsertCoachClient = z.infer<typeof insertCoachClientSchema>;
export type CoachInvite = typeof coachInvites.$inferSelect;
export type InsertCoachInvite = z.infer<typeof insertCoachInviteSchema>;
export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSession = z.infer<typeof insertCoachingSessionSchema>;
export type UpdateCoachingSession = z.infer<typeof updateCoachingSessionSchema>;

// New types for collaboration features
export type JournalingTemplate = typeof journalingTemplates.$inferSelect;
export type InsertJournalingTemplate = z.infer<typeof insertJournalingTemplateSchema>;
export type TemplatePrompt = typeof templatePrompts.$inferSelect;
export type InsertTemplatePrompt = z.infer<typeof insertTemplatePromptSchema>;
export type UserTemplateProgress = typeof userTemplateProgress.$inferSelect;
export type InsertUserTemplateProgress = z.infer<typeof insertUserTemplateProgressSchema>;
export type TemplateJournalEntry = typeof templateJournalEntries.$inferSelect;
export type InsertTemplateJournalEntry = z.infer<typeof insertTemplateJournalEntrySchema>;
export type ClientTransfer = typeof clientTransfers.$inferSelect;
export type InsertClientTransfer = z.infer<typeof insertClientTransferSchema>;
export type CoCoach = typeof coCoaches.$inferSelect;
export type InsertCoCoach = z.infer<typeof insertCoCoachSchema>;
export type CoachNotification = typeof coachNotifications.$inferSelect;
export type InsertCoachNotification = z.infer<typeof insertCoachNotificationSchema>;

// Types for quotes and micro sessions
export type DailyQuote = typeof dailyQuotes.$inferSelect;
export type InsertDailyQuote = z.infer<typeof insertDailyQuoteSchema>;
export type MicroSession = typeof microSessions.$inferSelect;
export type InsertMicroSession = z.infer<typeof insertMicroSessionSchema>;

// Types for app profiles
export type AppProfile = typeof appProfiles.$inferSelect;
export type InsertAppProfile = z.infer<typeof insertAppProfileSchema>;
export type UpdateAppProfile = z.infer<typeof updateAppProfileSchema>;
export type UserProfileAssignment = typeof userProfileAssignments.$inferSelect;
export type InsertUserProfileAssignment = z.infer<typeof insertUserProfileAssignmentSchema>;

// Theme tokens interface for type safety
export interface ThemeTokens {
  nightForest?: string;
  deepPine?: string;
  forestFloor?: string;
  sage?: string;
  birch?: string;
  ember?: string;
  fontDisplay?: string;
  fontSans?: string;
  [key: string]: string | undefined;
}

// Feature flags interface
export interface FeatureFlags {
  groundCheck?: boolean;
  dailyAnchors?: boolean;
  reflections?: boolean;
  groundingPractice?: boolean;
  coachBrian?: boolean;
  visionBoard?: boolean;
  achievements?: boolean;
  release?: boolean;
  brotherhood?: boolean;
  dailyRituals?: boolean;
  practiceLibrary?: boolean;
  challenges?: boolean;
  events?: boolean;
  mindfulMetrics?: boolean;
  [key: string]: boolean | undefined;
}

// ============================================
// NEW FEATURE TABLES - Dashboard Evolution
// ============================================

// Daily Metrics - Expanded check-in beyond just mood
export const dailyMetrics = pgTable("daily_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD
  moodScore: integer("mood_score"), // 1-5
  energyScore: integer("energy_score"), // 1-10
  stressScore: integer("stress_score"), // 1-10
  sleepHours: integer("sleep_hours"), // stored as minutes for precision
  sleepQuality: integer("sleep_quality"), // 1-5
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Rituals - Morning and Evening routines
export const dailyRituals = pgTable("daily_rituals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD
  ritualType: varchar("ritual_type", { length: 20 }).notNull(), // 'morning' | 'evening'
  completed: boolean("completed").notNull().default(false),
  energyBefore: integer("energy_before"), // 1-10
  energyAfter: integer("energy_after"), // 1-10
  practicesCompleted: jsonb("practices_completed").default([]), // Array of practice IDs
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Practice Library - Breathing, Meditation, Body Scan
export const practices = pgTable("practices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 20 }).notNull(), // 'breathing' | 'meditation' | 'body_scan'
  name: text("name").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  category: varchar("category", { length: 30 }).notNull(), // 'energizing' | 'grounding' | 'sleep' | 'focus' | 'stress_relief'
  durationSeconds: integer("duration_seconds").notNull(),
  durationCategory: varchar("duration_category", { length: 10 }), // 'short' | 'medium' | 'long'
  iconName: text("icon_name"),
  colorGradient: text("color_gradient"),
  phases: jsonb("phases"), // For breathing: [{phase, duration, label}]
  audioUrl: text("audio_url"), // For meditation
  specialInstructions: text("special_instructions"),
  cycles: integer("cycles"), // For breath cycles
  isPremium: boolean("is_premium").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Practice Favorites
export const practiceFavorites = pgTable("practice_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  practiceId: varchar("practice_id").notNull().references(() => practices.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Practice Sessions - Usage tracking
export const practiceSessions = pgTable("practice_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  practiceId: varchar("practice_id").notNull().references(() => practices.id),
  durationSeconds: integer("duration_seconds").notNull(),
  completed: boolean("completed").notNull().default(false),
  moodBefore: integer("mood_before"), // 1-5
  moodAfter: integer("mood_after"), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenges System
export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  habitTemplate: text("habit_template").notNull(), // The habit to track
  durationDays: integer("duration_days").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  challengeType: varchar("challenge_type", { length: 20 }).notNull(), // 'public' | 'private' | 'coach'
  category: varchar("category", { length: 30 }), // 'cold_exposure' | 'mindfulness' | 'fitness' | 'nutrition'
  goalMetric: varchar("goal_metric", { length: 30 }), // 'energy' | 'stress' | 'sleep' | 'focus'
  maxParticipants: integer("max_participants"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge Participants
export const challengeParticipants = pgTable("challenge_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  totalCompletions: integer("total_completions").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'completed' | 'dropped'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Challenge Check-ins
export const challengeCheckins = pgTable("challenge_checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull().references(() => challengeParticipants.id),
  date: text("date").notNull(),
  completed: boolean("completed").notNull().default(false),
  energyBefore: integer("energy_before"),
  energyAfter: integer("energy_after"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Gamification - XP and Levels
export const userGamification = pgTable("user_gamification", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  totalXp: integer("total_xp").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1),
  xpToNextLevel: integer("xp_to_next_level").notNull().default(100),
  streakMultiplier: integer("streak_multiplier").notNull().default(100), // stored as percentage (100 = 1.0x)
  updatedAt: timestamp("updated_at").defaultNow(),
});

// XP Transactions Log
export const xpTransactions = pgTable("xp_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  source: varchar("source", { length: 50 }).notNull(), // 'habit_complete' | 'challenge_day' | 'streak_bonus' | 'achievement' | 'practice_complete'
  sourceId: varchar("source_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Goals
export const userGoals = pgTable("user_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  goalType: varchar("goal_type", { length: 30 }).notNull(), // 'stress_management' | 'energy' | 'focus' | 'sleep' | 'emotional_regulation'
  priority: integer("priority").notNull().default(1),
  targetDescription: text("target_description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events System
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 30 }).notNull(), // 'retreat' | 'webinar' | 'masterclass' | 'workshop' | 'group_session'
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  timezone: text("timezone").notNull().default("UTC"),
  locationType: varchar("location_type", { length: 20 }).notNull(), // 'virtual' | 'in_person' | 'hybrid'
  locationDetails: text("location_details"),
  maxParticipants: integer("max_participants"),
  priceCents: integer("price_cents").notNull().default(0),
  vipPriceCents: integer("vip_price_cents"),
  vipEarlyAccessHours: integer("vip_early_access_hours").notNull().default(0),
  imageUrl: text("image_url"),
  recordingUrl: text("recording_url"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event Registrations
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("registered"), // 'registered' | 'attended' | 'cancelled' | 'no_show'
  paymentStatus: varchar("payment_status", { length: 20 }), // 'pending' | 'paid' | 'refunded'
  paymentAmountCents: integer("payment_amount_cents"),
  calendarEventId: text("calendar_event_id"),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  registeredAt: timestamp("registered_at").defaultNow(),
});

// Weekly Scorecards (pre-computed)
export const weeklyScorecards = pgTable("weekly_scorecards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekStart: text("week_start").notNull(), // YYYY-MM-DD of Monday
  avgMood: integer("avg_mood"), // stored as x10 for precision (35 = 3.5)
  avgEnergy: integer("avg_energy"),
  avgStress: integer("avg_stress"),
  avgSleepHours: integer("avg_sleep_hours"), // stored as minutes
  avgSleepQuality: integer("avg_sleep_quality"),
  totalHabitsCompleted: integer("total_habits_completed").notNull().default(0),
  totalPracticesCompleted: integer("total_practices_completed").notNull().default(0),
  totalJournalEntries: integer("total_journal_entries").notNull().default(0),
  highlights: jsonb("highlights").default([]),
  insights: jsonb("insights").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Milestones
export const userMilestones = pgTable("user_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  milestoneType: varchar("milestone_type", { length: 50 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metricValue: integer("metric_value"),
  achievedAt: timestamp("achieved_at").defaultNow(),
});

// AI Conversation History
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionType: varchar("session_type", { length: 20 }).notNull(), // 'micro_session' | 'chat' | 'voice' | 'quick_action'
  actionType: varchar("action_type", { length: 20 }), // 'regulate' | 'reframe' | 'reset' for quick actions
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  messagesCount: integer("messages_count").notNull().default(0),
  summary: text("summary"),
});

// AI Messages
export const aiMessages = pgTable("ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => aiConversations.id),
  role: varchar("role", { length: 10 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  suggestedAction: jsonb("suggested_action"), // {type: 'breathwork' | 'journal' | 'meditation', id: string}
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// INSERT SCHEMAS FOR NEW TABLES
// ============================================

export const insertDailyMetricsSchema = createInsertSchema(dailyMetrics).omit({ id: true, createdAt: true, updatedAt: true });
export const updateDailyMetricsSchema = createInsertSchema(dailyMetrics).omit({ id: true, userId: true, date: true, createdAt: true, updatedAt: true }).partial();
export const insertDailyRitualSchema = createInsertSchema(dailyRituals).omit({ id: true, createdAt: true, completedAt: true });
export const insertPracticeSchema = createInsertSchema(practices).omit({ id: true, createdAt: true, updatedAt: true });
export const updatePracticeSchema = createInsertSchema(practices).omit({ id: true, createdAt: true, updatedAt: true }).partial();
export const insertPracticeFavoriteSchema = createInsertSchema(practiceFavorites).omit({ id: true, createdAt: true });
export const insertPracticeSessionSchema = createInsertSchema(practiceSessions).omit({ id: true, createdAt: true });
export const insertChallengeSchema = createInsertSchema(challenges).omit({ id: true, createdAt: true });
export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).omit({ id: true, joinedAt: true, currentStreak: true, bestStreak: true, totalCompletions: true });
export const insertChallengeCheckinSchema = createInsertSchema(challengeCheckins).omit({ id: true, createdAt: true });
export const insertUserGamificationSchema = createInsertSchema(userGamification).omit({ id: true, updatedAt: true });
export const insertXpTransactionSchema = createInsertSchema(xpTransactions).omit({ id: true, createdAt: true });
export const insertUserGoalSchema = createInsertSchema(userGoals).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true });
export const updateEventSchema = createInsertSchema(events).omit({ id: true, createdBy: true, createdAt: true, updatedAt: true }).partial();
export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({ id: true, registeredAt: true });
export const insertWeeklyScorecardSchema = createInsertSchema(weeklyScorecards).omit({ id: true, createdAt: true });
export const insertUserMilestoneSchema = createInsertSchema(userMilestones).omit({ id: true, achievedAt: true });
export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({ id: true, startedAt: true, endedAt: true, messagesCount: true });
export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({ id: true, createdAt: true });

// ============================================
// TYPES FOR NEW TABLES
// ============================================

export type DailyMetrics = typeof dailyMetrics.$inferSelect;
export type InsertDailyMetrics = z.infer<typeof insertDailyMetricsSchema>;
export type UpdateDailyMetrics = z.infer<typeof updateDailyMetricsSchema>;
export type DailyRitual = typeof dailyRituals.$inferSelect;
export type InsertDailyRitual = z.infer<typeof insertDailyRitualSchema>;
export type Practice = typeof practices.$inferSelect;
export type InsertPractice = z.infer<typeof insertPracticeSchema>;
export type UpdatePractice = z.infer<typeof updatePracticeSchema>;
export type PracticeFavorite = typeof practiceFavorites.$inferSelect;
export type InsertPracticeFavorite = z.infer<typeof insertPracticeFavoriteSchema>;
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;
export type ChallengeCheckin = typeof challengeCheckins.$inferSelect;
export type InsertChallengeCheckin = z.infer<typeof insertChallengeCheckinSchema>;
export type UserGamification = typeof userGamification.$inferSelect;
export type InsertUserGamification = z.infer<typeof insertUserGamificationSchema>;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type InsertXpTransaction = z.infer<typeof insertXpTransactionSchema>;
export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = z.infer<typeof insertUserGoalSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type WeeklyScorecard = typeof weeklyScorecards.$inferSelect;
export type InsertWeeklyScorecard = z.infer<typeof insertWeeklyScorecardSchema>;
export type UserMilestone = typeof userMilestones.$inferSelect;
export type InsertUserMilestone = z.infer<typeof insertUserMilestoneSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;

// ============================================
// ENUMS AND CONSTANTS
// ============================================

export const practiceTypes = ["breathing", "meditation", "body_scan"] as const;
export type PracticeType = typeof practiceTypes[number];

export const practiceCategories = ["energizing", "grounding", "sleep", "focus", "stress_relief"] as const;
export type PracticeCategory = typeof practiceCategories[number];

export const durationCategories = ["short", "medium", "long"] as const;
export type DurationCategory = typeof durationCategories[number];

export const ritualTypes = ["morning", "evening"] as const;
export type RitualType = typeof ritualTypes[number];

export const challengeTypes = ["public", "private", "coach"] as const;
export type ChallengeType = typeof challengeTypes[number];

export const goalTypes = ["stress_management", "energy", "focus", "sleep", "emotional_regulation"] as const;
export type GoalType = typeof goalTypes[number];

export const eventTypes = ["retreat", "webinar", "masterclass", "workshop", "group_session"] as const;
export type EventType = typeof eventTypes[number];

export const locationTypes = ["virtual", "in_person", "hybrid"] as const;
export type LocationType = typeof locationTypes[number];

export const quickActionTypes = ["regulate", "reframe", "reset"] as const;
export type QuickActionType = typeof quickActionTypes[number];
