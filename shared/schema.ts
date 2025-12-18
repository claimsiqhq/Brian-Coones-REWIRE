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
  name: text("name").notNull(), // e.g., "Grounded Warriors", "Wellness Pro"
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false), // Default profile for new users
  themeTokens: jsonb("theme_tokens").notNull().default({}), // CSS variable overrides
  featureFlags: jsonb("feature_flags").notNull().default({}), // Enabled/disabled features
  logoUrl: text("logo_url"),
  brandName: text("brand_name"),
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
  [key: string]: boolean | undefined;
}
