import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { getChatResponse, textToSpeech, generateJournalPrompts, buildContextMessage, type ChatMessage } from "./openai";
import {
  insertMoodSchema,
  insertHabitSchema,
  insertHabitCompletionSchema,
  insertJournalEntrySchema,
  insertHomeworkSchema,
  insertVisionBoardItemSchema,
  insertVentMessageSchema,
  updateUserSettingsSchema,
  insertCoachingSessionSchema,
  updateCoachingSessionSchema,
} from "@shared/schema";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "./google-calendar";
import { sendCoachInviteEmail, sendDailyReminderEmail, sendWelcomeEmail, sendSessionBookingEmail as sendSessionEmailSendGrid, sendTestEmail } from "./sendgrid";
import crypto from "crypto";

const journalPromptsCache = new Map<string, { prompts: string[]; date: string }>();

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getUserId(req: any): string {
  return req.user?.id;
}

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

async function checkAndAwardAchievements(userId: string) {
  const newlyAwarded: string[] = [];
  
  try {
    const stats = await storage.getDashboardStats(userId);
    const habitStats = await storage.getHabitStats(userId);
    
    const achievementChecks = [
      { id: "first_mood", condition: stats.totalMoodCheckins >= 1 },
      { id: "first_journal", condition: stats.totalJournalEntries >= 1 },
      { id: "first_habit", condition: stats.totalHabitsCompleted >= 1 },
      { id: "streak_3", condition: habitStats.currentStreak >= 3 },
      { id: "streak_7", condition: habitStats.currentStreak >= 7 },
      { id: "mood_10", condition: stats.totalMoodCheckins >= 10 },
      { id: "journal_5", condition: stats.totalJournalEntries >= 5 },
      { id: "habits_20", condition: stats.totalHabitsCompleted >= 20 },
    ];
    
    for (const check of achievementChecks) {
      if (check.condition) {
        const hasIt = await storage.hasAchievement(userId, check.id);
        if (!hasIt) {
          await storage.awardAchievement({ userId, achievementId: check.id });
          newlyAwarded.push(check.id);
        }
      }
    }
  } catch (error) {
    console.error("Error checking achievements:", error);
  }
  
  return newlyAwarded;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  setupAuth(app);

  // Role is now permanent - set at registration only
  // Role switching endpoint has been removed

  // Update user profile (name, photo, email)
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { firstName, lastName, profileImageUrl, email } = req.body;

      // If email is being updated, check it's not already taken
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      const user = await storage.updateUserProfile(userId, { firstName, lastName, profileImageUrl, email });
      res.json(user);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Generate breathing guidance audio using OpenAI TTS
  app.post("/api/breathing/speak", isAuthenticated, async (req, res) => {
    try {
      const { text } = req.body as { text: string };

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      // Use "shimmer" voice for calmer, more natural breathing guidance
      const audioBuffer = await textToSpeech(text, "shimmer");

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      });
      res.send(audioBuffer);
    } catch (error) {
      console.error("Breathing speak error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  app.get("/api/moods", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const moods = await storage.getMoodsByUser(userId);
      res.json(moods);
    } catch (error) {
      console.error("Get moods error:", error);
      res.status(500).json({ error: "Failed to fetch moods" });
    }
  });

  app.get("/api/moods/today", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const mood = await storage.getTodayMood(userId);
      res.json(mood || null);
    } catch (error) {
      console.error("Get today mood error:", error);
      res.status(500).json({ error: "Failed to fetch today's mood" });
    }
  });

  app.post("/api/moods", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertMoodSchema.parse({
        ...req.body,
        userId
      });
      const mood = await storage.createMood(validatedData);
      await checkAndAwardAchievements(userId);
      res.json(mood);
    } catch (error) {
      console.error("Create mood error:", error);
      res.status(400).json({ error: "Invalid mood data" });
    }
  });

  app.get("/api/habits", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabitsByUser(userId);
      res.json(habits);
    } catch (error) {
      console.error("Get habits error:", error);
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  app.post("/api/habits", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertHabitSchema.parse({
        ...req.body,
        userId
      });
      const habit = await storage.createHabit(validatedData);
      res.json(habit);
    } catch (error) {
      console.error("Create habit error:", error);
      res.status(400).json({ error: "Invalid habit data" });
    }
  });

  app.delete("/api/habits/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteHabit(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete habit error:", error);
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  app.post("/api/habits/completions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertHabitCompletionSchema.parse(req.body);
      const completion = await storage.upsertHabitCompletion(validatedData);
      await checkAndAwardAchievements(userId);
      res.json(completion);
    } catch (error) {
      console.error("Toggle habit completion error:", error);
      res.status(400).json({ error: "Invalid completion data" });
    }
  });

  app.get("/api/habits/completions/:date", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const habits = await storage.getHabitsByUser(userId);
      const habitIds = habits.map(h => h.id);
      const completions = await storage.getHabitCompletionsForDate(habitIds, req.params.date);
      res.json(completions);
    } catch (error) {
      console.error("Get completions error:", error);
      res.status(500).json({ error: "Failed to fetch completions" });
    }
  });

  app.get("/api/journal", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const entries = await storage.getJournalEntriesByUser(userId);
      res.json(entries);
    } catch (error) {
      console.error("Get journal entries error:", error);
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/journal", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertJournalEntrySchema.parse({
        ...req.body,
        userId
      });
      const entry = await storage.createJournalEntry(validatedData);
      await checkAndAwardAchievements(userId);
      res.json(entry);
    } catch (error) {
      console.error("Create journal entry error:", error);
      res.status(400).json({ error: "Invalid journal entry data" });
    }
  });

  app.patch("/api/journal/:id", isAuthenticated, async (req, res) => {
    try {
      const { title, content, mood } = req.body;
      const entry = await storage.updateJournalEntry(req.params.id, { title, content, mood });
      res.json(entry);
    } catch (error) {
      console.error("Update journal entry error:", error);
      res.status(500).json({ error: "Failed to update journal entry" });
    }
  });

  app.delete("/api/journal/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteJournalEntry(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete journal entry error:", error);
      res.status(500).json({ error: "Failed to delete journal entry" });
    }
  });

  app.get("/api/journal/prompts", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const today = getTodayDateString();
      const cached = journalPromptsCache.get(userId);
      
      if (cached && cached.date === today) {
        return res.json(cached.prompts);
      }

      const context = await storage.getCoachContext(userId);
      const prompts = await generateJournalPrompts(context);
      
      journalPromptsCache.set(userId, { prompts, date: today });
      
      res.json(prompts);
    } catch (error) {
      console.error("Get journal prompts error:", error);
      res.status(500).json({ error: "Failed to generate journal prompts" });
    }
  });

  app.get("/api/homework/active", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const hw = await storage.getActiveHomework(userId);
      res.json(hw || null);
    } catch (error) {
      console.error("Get active homework error:", error);
      res.status(500).json({ error: "Failed to fetch homework" });
    }
  });

  app.post("/api/homework", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertHomeworkSchema.parse({
        ...req.body,
        userId
      });
      const hw = await storage.createHomework(validatedData);
      res.json(hw);
    } catch (error) {
      console.error("Create homework error:", error);
      res.status(400).json({ error: "Invalid homework data" });
    }
  });

  app.patch("/api/homework/:id/complete", isAuthenticated, async (req, res) => {
    try {
      await storage.completeHomework(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Complete homework error:", error);
      res.status(500).json({ error: "Failed to complete homework" });
    }
  });

  app.get("/api/vision-board", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const items = await storage.getVisionBoardItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Get vision board error:", error);
      res.status(500).json({ error: "Failed to fetch vision board items" });
    }
  });

  app.post("/api/vision-board", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertVisionBoardItemSchema.parse({
        ...req.body,
        userId
      });
      const item = await storage.createVisionBoardItem(validatedData);
      res.json(item);
    } catch (error) {
      console.error("Create vision board item error:", error);
      res.status(400).json({ error: "Invalid vision board item data" });
    }
  });

  app.patch("/api/vision-board/:id", isAuthenticated, async (req, res) => {
    try {
      const { imageUrl, label } = req.body;
      const item = await storage.updateVisionBoardItem(req.params.id, { imageUrl, label });
      res.json(item);
    } catch (error) {
      console.error("Update vision board item error:", error);
      res.status(500).json({ error: "Failed to update vision board item" });
    }
  });

  app.delete("/api/vision-board/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteVisionBoardItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete vision board item error:", error);
      res.status(500).json({ error: "Failed to delete vision board item" });
    }
  });

  app.get("/api/vent", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const messages = await storage.getVentMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      console.error("Get vent messages error:", error);
      res.status(500).json({ error: "Failed to fetch vent messages" });
    }
  });

  app.post("/api/vent", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = insertVentMessageSchema.parse({
        ...req.body,
        userId
      });
      const message = await storage.createVentMessage(validatedData);
      res.json(message);
    } catch (error) {
      console.error("Create vent message error:", error);
      res.status(400).json({ error: "Invalid vent message data" });
    }
  });

  app.get("/api/stats/dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/stats/mood-trends", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const days = parseInt(req.query.days as string) || 7;
      const trends = await storage.getMoodTrends(userId, days);
      res.json(trends);
    } catch (error) {
      console.error("Get mood trends error:", error);
      res.status(500).json({ error: "Failed to fetch mood trends" });
    }
  });

  app.get("/api/stats/habits", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getHabitStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Get habit stats error:", error);
      res.status(500).json({ error: "Failed to fetch habit stats" });
    }
  });

  app.get("/api/stats/streaks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const streaks = await storage.getAllStreaks(userId);
      res.json(streaks);
    } catch (error) {
      console.error("Get all streaks error:", error);
      res.status(500).json({ error: "Failed to fetch streaks" });
    }
  });

  app.get("/api/achievements", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Get achievements error:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.post("/api/achievements/check", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { achievementId } = req.body;
      const has = await storage.hasAchievement(userId, achievementId);
      if (!has) {
        const achievement = await storage.awardAchievement({
          userId,
          achievementId
        });
        res.json({ awarded: true, achievement });
      } else {
        res.json({ awarded: false, message: "Achievement already earned" });
      }
    } catch (error) {
      console.error("Check achievement error:", error);
      res.status(500).json({ error: "Failed to check achievement" });
    }
  });

  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const validatedData = updateUserSettingsSchema.parse(req.body);
      const settings = await storage.updateUserSettings(userId, validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  app.delete("/api/user/data", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await storage.deleteAllUserData(userId);
      res.json({ success: true, message: "All user data has been deleted" });
    } catch (error) {
      console.error("Delete user data error:", error);
      res.status(500).json({ error: "Failed to delete user data" });
    }
  });

  app.post("/api/email/test", isAuthenticated, async (req, res) => {
    try {
      const result = await sendTestEmail();
      res.json(result);
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  app.get("/api/user/export", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const moods = await storage.getMoodsByUser(userId);
      const habits = await storage.getHabitsByUser(userId);
      const journalEntries = await storage.getJournalEntriesByUser(userId);
      const visionBoardItems = await storage.getVisionBoardItems(userId);
      const achievements = await storage.getUserAchievements(userId);
      const settings = await storage.getUserSettings(userId);
      const ventMessages = await storage.getVentMessagesByUser(userId);
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          role: user?.role,
        },
        moods,
        habits,
        journalEntries,
        visionBoardItems,
        achievements,
        settings,
        ventMessages,
      };
      
      res.json(exportData);
    } catch (error) {
      console.error("Export user data error:", error);
      res.status(500).json({ error: "Failed to export user data" });
    }
  });

  app.post("/api/coach/chat", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { message, conversationHistory = [] } = req.body as {
        message: string;
        conversationHistory?: ChatMessage[];
      };

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const context = await storage.getCoachContext(userId);
      const response = await getChatResponse(message, context, conversationHistory);
      
      res.json({ response });
    } catch (error) {
      console.error("Coach chat error:", error);
      res.status(500).json({ error: "Failed to get coach response" });
    }
  });

  app.post("/api/coach/speak", isAuthenticated, async (req, res) => {
    try {
      const { text } = req.body as { text: string };

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      const audioBuffer = await textToSpeech(text);
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      });
      res.send(audioBuffer);
    } catch (error) {
      console.error("Coach speak error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  app.post("/api/coach/realtime-session", isAuthenticated, async (req, res) => {
    try {
      const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model: "gpt-realtime",
          }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("OpenAI Realtime API error:", error);
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      res.json({ 
        ephemeralKey: data.value,
        expiresAt: data.expires_at 
      });
    } catch (error) {
      console.error("Realtime session error:", error);
      res.status(500).json({ error: "Failed to create realtime session" });
    }
  });

  app.get("/api/coach/clients", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (user?.role !== "coach" && user?.role !== "admin") {
        return res.status(403).json({ error: "Only coaches can view clients" });
      }
      const clients = await storage.getClientsByCoach(userId);
      res.json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/coach/client/:clientId/vent-messages", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (user?.role !== "coach" && user?.role !== "admin") {
        return res.status(403).json({ error: "Only coaches can view client vent messages" });
      }

      const { clientId } = req.params;
      
      // Security: Verify this coach owns this client relationship
      const coachClients = await storage.getClientsByCoach(userId);
      const isMyClient = coachClients.some(c => c.id === clientId);
      if (!isMyClient) {
        return res.status(403).json({ error: "You don't have access to this client's data" });
      }

      const messages = await storage.getVentMessagesByUser(clientId);
      res.json(messages);
    } catch (error) {
      console.error("Get client vent messages error:", error);
      res.status(500).json({ error: "Failed to fetch vent messages" });
    }
  });

  app.get("/api/coach/client/:clientId/data", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (user?.role !== "coach" && user?.role !== "admin") {
        return res.status(403).json({ error: "Only coaches can view client data" });
      }

      const { clientId } = req.params;
      
      // Security: Verify this coach owns this client relationship
      const coachClients = await storage.getClientsByCoach(userId);
      const isMyClient = coachClients.some(c => c.id === clientId);
      if (!isMyClient) {
        return res.status(403).json({ error: "You don't have access to this client's data" });
      }

      const clientSettings = await storage.getUserSettings(clientId);
      
      const data: any = {};
      
      if (clientSettings.privacyShareMoods) {
        data.moods = await storage.getMoodsByUser(clientId);
      }
      if (clientSettings.privacyShareJournals) {
        data.journals = await storage.getJournalEntriesByUser(clientId);
      }
      if (clientSettings.privacyShareHabits) {
        data.habits = await storage.getHabitsByUser(clientId);
        const today = getTodayDateString();
        const habitIds = data.habits.map((h: any) => h.id);
        data.completions = await storage.getHabitCompletionsForDate(habitIds, today);
      }
      
      data.stats = await storage.getDashboardStats(clientId);
      
      res.json(data);
    } catch (error) {
      console.error("Get client data error:", error);
      res.status(500).json({ error: "Failed to fetch client data" });
    }
  });

  app.post("/api/coach/invite", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (user?.role !== "coach" && user?.role !== "admin") {
        return res.status(403).json({ error: "Only coaches can create invites" });
      }
      
      const { email, name } = req.body || {};
      
      const code = crypto.randomBytes(6).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invite = await storage.createCoachInvite(userId, code, expiresAt, email, name);
      
      let emailSent = false;
      
      // If email is provided, send the invitation email
      if (email && typeof email === 'string' && email.includes('@')) {
        try {
          const coachName = user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user?.name || user?.email || 'Your Coach';
          await sendCoachInviteEmail(email, coachName, code);
          console.log(`[Routes] Coach invite email sent to ${email}`);
          emailSent = true;
        } catch (emailError) {
          console.error("Failed to send invite email:", emailError);
          emailSent = false;
        }
      }
      
      res.json({ ...invite, emailSent, emailRequested: !!email });
    } catch (error) {
      console.error("Create invite error:", error);
      res.status(500).json({ error: "Failed to create invite" });
    }
  });
  
  app.get("/api/coach/invites", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (user?.role !== "coach" && user?.role !== "admin") {
        return res.status(403).json({ error: "Only coaches can view invites" });
      }
      
      const invites = await storage.getInvitesByCoach(userId);
      
      // Enrich invites with user info if used
      const enrichedInvites = await Promise.all(invites.map(async (invite) => {
        let usedByUser = null;
        if (invite.usedBy) {
          usedByUser = await storage.getUser(invite.usedBy);
        }
        const now = new Date();
        let status = 'pending';
        if (invite.usedBy) {
          status = 'used';
        } else if (invite.expiresAt && new Date(invite.expiresAt) < now) {
          status = 'expired';
        }
        return {
          ...invite,
          status,
          usedByUser: usedByUser ? {
            id: usedByUser.id,
            name: usedByUser.name || usedByUser.firstName || usedByUser.username,
            email: usedByUser.email
          } : null
        };
      }));
      
      res.json(enrichedInvites);
    } catch (error) {
      console.error("Get invites error:", error);
      res.status(500).json({ error: "Failed to fetch invites" });
    }
  });

  // Join a coach using an invite code
  // Note: Both clients AND coaches can join another coach (for supervision/mentorship)
  // This allows coaches to have their own coaches/supervisors while still being coaches
  app.post("/api/join-coach/:code", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { code } = req.params;

      const invite = await storage.getCoachInvite(code);
      if (!invite) {
        return res.status(404).json({ error: "Invalid invite code" });
      }
      if (invite.usedBy) {
        return res.status(400).json({ error: "Invite already used" });
      }
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Invite has expired" });
      }
      
      // Prevent coaches from accepting their own invites
      if (invite.coachId === userId) {
        return res.status(400).json({ error: "You cannot accept your own invite. Please share this link with your client." });
      }

      // Check if user is already connected to this coach
      const existingCoach = await storage.getCoachForClient(userId);
      if (existingCoach && existingCoach.id === invite.coachId) {
        return res.status(400).json({ error: "You are already connected to this coach" });
      }

      await storage.addClientToCoach(invite.coachId, userId);
      await storage.useCoachInvite(code, userId);

      const coach = await storage.getUser(invite.coachId);
      res.json({ success: true, coach });
    } catch (error) {
      console.error("Join coach error:", error);
      res.status(500).json({ error: "Failed to join coach" });
    }
  });

  app.get("/api/my-coach", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const coach = await storage.getCoachForClient(userId);
      res.json(coach || null);
    } catch (error) {
      console.error("Get coach error:", error);
      res.status(500).json({ error: "Failed to fetch coach" });
    }
  });

  app.post("/api/coach/assign-homework/:clientId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (user?.role !== "coach" && user?.role !== "admin") {
        return res.status(403).json({ error: "Only coaches can assign homework" });
      }
      
      const { clientId } = req.params;
      const { content } = req.body;
      
      const hw = await storage.createHomework({
        userId: clientId,
        assignedBy: userId,
        content,
        completed: false
      });
      
      res.json(hw);
    } catch (error) {
      console.error("Assign homework error:", error);
      res.status(500).json({ error: "Failed to assign homework" });
    }
  });

  // Coaching Sessions Routes
  app.get("/api/sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      let sessions;
      if (user?.role === "coach" || user?.role === "admin") {
        sessions = await storage.getSessionsByCoach(userId);
      } else {
        sessions = await storage.getSessionsByClient(userId);
      }
      
      res.json(sessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/upcoming", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const role = user?.role === "coach" || user?.role === "admin" ? "coach" : "client";
      
      const sessions = await storage.getUpcomingSessions(userId, role);
      res.json(sessions);
    } catch (error) {
      console.error("Get upcoming sessions error:", error);
      res.status(500).json({ error: "Failed to fetch upcoming sessions" });
    }
  });

  app.get("/api/sessions/client/:clientId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (user?.role !== "coach" && user?.role !== "admin") {
        return res.status(403).json({ error: "Only coaches can view client sessions" });
      }
      
      const { clientId } = req.params;
      
      const coachClients = await storage.getClientsByCoach(userId);
      const isMyClient = coachClients.some(c => c.id === clientId);
      if (!isMyClient) {
        return res.status(403).json({ error: "You don't have access to this client's sessions" });
      }
      
      const sessions = await storage.getSessionsForCoachClient(userId, clientId);
      res.json(sessions);
    } catch (error) {
      console.error("Get client sessions error:", error);
      res.status(500).json({ error: "Failed to fetch client sessions" });
    }
  });

  app.post("/api/sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (user?.role !== "coach" && user?.role !== "admin") {
        return res.status(403).json({ error: "Only coaches can create sessions" });
      }
      
      const { clientId, scheduledAt, durationMinutes, notes } = req.body;
      
      const coachClients = await storage.getClientsByCoach(userId);
      const isMyClient = coachClients.some(c => c.id === clientId);
      if (!isMyClient) {
        return res.status(403).json({ error: "This client is not in your roster" });
      }
      
      const client = await storage.getUser(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const validatedData = insertCoachingSessionSchema.parse({
        coachId: userId,
        clientId,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes || 60,
        notes,
        status: "scheduled",
      });
      
      const session = await storage.createCoachingSession(validatedData);
      
      const sessionStart = new Date(scheduledAt);
      const sessionEnd = new Date(sessionStart.getTime() + (durationMinutes || 60) * 60 * 1000);
      const coachName = user.name || user.firstName || "Your Coach";
      const clientName = client.name || client.firstName || "Client";
      
      try {
        const attendees: string[] = [];
        if (client.email) attendees.push(client.email);
        
        const calendarEvent = await createCalendarEvent(
          `Coaching Session: ${coachName} & ${clientName}`,
          notes || "Coaching session booked via MindfulCoach",
          sessionStart,
          sessionEnd,
          attendees
        );
        
        if (calendarEvent.id) {
          await storage.updateCoachingSession(session.id, {
            calendarEventId: calendarEvent.id,
          });
        }
        
        if (client.email) {
          await sendSessionEmailSendGrid(
            client.email,
            clientName,
            coachName,
            sessionStart,
            notes
          );
        }
      } catch (calendarError) {
        console.error("Calendar/Email integration error:", calendarError);
      }
      
      res.json(session);
    } catch (error) {
      console.error("Create session error:", error);
      res.status(400).json({ error: "Failed to create session" });
    }
  });

  app.patch("/api/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      const existingSession = await storage.getCoachingSession(id);
      if (!existingSession) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (existingSession.coachId !== userId) {
        return res.status(403).json({ error: "You don't have permission to modify this session" });
      }
      
      const validatedData = updateCoachingSessionSchema.parse(req.body);
      const session = await storage.updateCoachingSession(id, validatedData);
      
      if (existingSession.calendarEventId && (validatedData.scheduledAt || validatedData.durationMinutes)) {
        try {
          await updateCalendarEvent(existingSession.calendarEventId, {
            startTime: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
            endTime: validatedData.scheduledAt && validatedData.durationMinutes
              ? new Date(new Date(validatedData.scheduledAt).getTime() + validatedData.durationMinutes * 60 * 1000)
              : undefined,
          });
        } catch (calendarError) {
          console.error("Calendar update error:", calendarError);
        }
      }
      
      res.json(session);
    } catch (error) {
      console.error("Update session error:", error);
      res.status(400).json({ error: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      const existingSession = await storage.getCoachingSession(id);
      if (!existingSession) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      if (existingSession.coachId !== userId) {
        return res.status(403).json({ error: "You don't have permission to delete this session" });
      }
      
      if (existingSession.calendarEventId) {
        try {
          await deleteCalendarEvent(existingSession.calendarEventId);
        } catch (calendarError) {
          console.error("Calendar delete error:", calendarError);
        }
      }
      
      await storage.deleteCoachingSession(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  app.patch("/api/sessions/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { status } = req.body;

      if (!["scheduled", "completed", "cancelled", "rescheduled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const existingSession = await storage.getCoachingSession(id);
      if (!existingSession) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (existingSession.coachId !== userId) {
        return res.status(403).json({ error: "You don't have permission to modify this session" });
      }

      const session = await storage.updateCoachingSession(id, { status });

      if (status === "cancelled" && existingSession.calendarEventId) {
        try {
          await deleteCalendarEvent(existingSession.calendarEventId);
        } catch (calendarError) {
          console.error("Calendar delete error:", calendarError);
        }
      }

      res.json(session);
    } catch (error) {
      console.error("Update session status error:", error);
      res.status(400).json({ error: "Failed to update session status" });
    }
  });

  // ========== EMAIL REMINDERS ==========

  app.post("/api/reminders/send", async (req, res) => {
    try {
      const { reminderTime, secret } = req.body;
      
      if (secret !== process.env.REMINDER_SECRET && secret !== 'internal-cron') {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (!reminderTime || !/^\d{2}:\d{2}$/.test(reminderTime)) {
        return res.status(400).json({ error: "Invalid reminder time format. Use HH:MM" });
      }
      
      const users = await storage.getUsersWithRemindersEnabled(reminderTime);
      
      const results = {
        total: users.length,
        sent: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const user of users) {
        try {
          await sendDailyReminderEmail(user.email, user.name);
          results.sent++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to send to ${user.email}: ${error}`);
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error("Send reminders error:", error);
      res.status(500).json({ error: "Failed to send reminders" });
    }
  });

  app.post("/api/reminders/test", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ error: "No email found for user" });
      }
      
      const displayName = user.firstName || user.name || 'User';
      
      await sendDailyReminderEmail(user.email, displayName);
      
      res.json({ success: true, message: `Test reminder sent to ${user.email}` });
    } catch (error) {
      console.error("Test reminder error:", error);
      res.status(500).json({ error: "Failed to send test reminder" });
    }
  });

  // In-memory lock to prevent duplicate reminder sends per time slot
  // Note: For horizontally scaled deployments, use a database-based lock or external scheduler
  // IMPORTANT: All times are processed in UTC. Users should set reminder times in UTC.
  // TODO: Add user timezone to userSettings and convert reminder times for proper local time support.
  const sentReminders = new Set<string>();
  
  setInterval(async () => {
    const now = new Date();
    // Use UTC time consistently to avoid server timezone issues
    const utcHours = now.getUTCHours().toString().padStart(2, '0');
    const utcMinutes = now.getUTCMinutes().toString().padStart(2, '0');
    const currentTimeUTC = `${utcHours}:${utcMinutes}`;
    const todayUTC = now.toISOString().split('T')[0];
    const todayKey = `${todayUTC}-${currentTimeUTC}`;
    
    if (sentReminders.has(todayKey)) {
      return;
    }
    
    // Check valid times (in UTC)
    const validTimes = ['07:00', '08:00', '09:00', '12:00', '18:00', '21:00'];
    if (!validTimes.includes(currentTimeUTC)) {
      return;
    }
    
    sentReminders.add(todayKey);
    
    // Clean up old entries from previous days
    Array.from(sentReminders).forEach(key => {
      if (!key.startsWith(todayUTC)) {
        sentReminders.delete(key);
      }
    });
    
    try {
      const users = await storage.getUsersWithRemindersEnabled(currentTimeUTC);
      console.log(`[Reminder Scheduler] Sending reminders for ${currentTimeUTC} UTC to ${users.length} users`);
      
      for (const user of users) {
        try {
          await sendDailyReminderEmail(user.email, user.name);
          console.log(`[Reminder Scheduler] Sent reminder to ${user.email}`);
        } catch (error) {
          console.error(`[Reminder Scheduler] Failed to send to ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error("[Reminder Scheduler] Error:", error);
    }
  }, 60000);

  // ========== JOURNALING TEMPLATES ==========

  // Get all available templates (shared library + own templates)
  app.get("/api/templates", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const templates = await storage.getJournalingTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to get templates" });
    }
  });

  // Get shared template library
  app.get("/api/templates/library", isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getSharedTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get shared templates error:", error);
      res.status(500).json({ error: "Failed to get shared templates" });
    }
  });

  // Get single template with prompts
  app.get("/api/templates/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getTemplateWithPrompts(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Get template error:", error);
      res.status(500).json({ error: "Failed to get template" });
    }
  });

  // Create a new template (coach only)
  app.post("/api/templates", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { title, description, totalDays, isShared, category, prompts } = req.body;

      const template = await storage.createJournalingTemplate({
        createdBy: userId,
        title,
        description,
        totalDays,
        isShared: isShared || false,
        category,
      }, prompts);

      res.json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(400).json({ error: "Failed to create template" });
    }
  });

  // Get user's progress on templates
  app.get("/api/templates/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const progress = await storage.getUserTemplateProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Get template progress error:", error);
      res.status(500).json({ error: "Failed to get progress" });
    }
  });

  // Start a template program
  app.post("/api/templates/:id/start", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { assignedBy } = req.body;

      const progress = await storage.startTemplateProgress({
        userId,
        templateId: id,
        currentDay: 1,
        assignedBy,
      });

      res.json(progress);
    } catch (error) {
      console.error("Start template error:", error);
      res.status(400).json({ error: "Failed to start template" });
    }
  });

  // Submit a template journal entry
  app.post("/api/templates/progress/:progressId/entry", isAuthenticated, async (req, res) => {
    try {
      const { progressId } = req.params;
      const { promptId, content } = req.body;

      const entry = await storage.createTemplateJournalEntry({
        progressId,
        promptId,
        content,
      });

      // Advance to next day
      await storage.advanceTemplateProgress(progressId);

      res.json(entry);
    } catch (error) {
      console.error("Submit template entry error:", error);
      res.status(400).json({ error: "Failed to submit entry" });
    }
  });

  // ========== CLIENT TRANSFERS ==========

  // Get incoming transfer requests (for coaches)
  app.get("/api/coach/transfers/incoming", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const transfers = await storage.getIncomingTransfers(userId);
      res.json(transfers);
    } catch (error) {
      console.error("Get incoming transfers error:", error);
      res.status(500).json({ error: "Failed to get transfers" });
    }
  });

  // Get outgoing transfer requests
  app.get("/api/coach/transfers/outgoing", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const transfers = await storage.getOutgoingTransfers(userId);
      res.json(transfers);
    } catch (error) {
      console.error("Get outgoing transfers error:", error);
      res.status(500).json({ error: "Failed to get transfers" });
    }
  });

  // Initiate a client transfer
  app.post("/api/coach/transfer", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { clientId, toCoachId, notes } = req.body;

      const transfer = await storage.createClientTransfer({
        clientId,
        fromCoachId: userId,
        toCoachId,
        notes,
      });

      // Create notification for receiving coach
      await storage.createCoachNotification({
        coachId: toCoachId,
        actorId: userId,
        clientId,
        type: "transfer_request",
        title: "Client Transfer Request",
        message: notes || "A coach wants to transfer a client to you.",
      });

      res.json(transfer);
    } catch (error) {
      console.error("Create transfer error:", error);
      res.status(400).json({ error: "Failed to create transfer" });
    }
  });

  // Respond to a transfer request
  app.patch("/api/coach/transfers/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      const { status } = req.body;

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const transfer = await storage.respondToTransfer(id, userId, status);

      if (status === "accepted" && transfer) {
        // Update the coach-client relationship
        await storage.transferClient(transfer.clientId, transfer.fromCoachId, transfer.toCoachId);

        // Notify the original coach
        await storage.createCoachNotification({
          coachId: transfer.fromCoachId,
          actorId: userId,
          clientId: transfer.clientId,
          type: "transfer_accepted",
          title: "Transfer Accepted",
          message: "Your client transfer request was accepted.",
        });
      }

      res.json(transfer);
    } catch (error) {
      console.error("Respond to transfer error:", error);
      res.status(400).json({ error: "Failed to respond to transfer" });
    }
  });

  // ========== CO-COACHING ==========

  // Get co-coaches for a client
  app.get("/api/coach/client/:clientId/co-coaches", isAuthenticated, async (req, res) => {
    try {
      const { clientId } = req.params;
      const coCoaches = await storage.getCoCoaches(clientId);
      res.json(coCoaches);
    } catch (error) {
      console.error("Get co-coaches error:", error);
      res.status(500).json({ error: "Failed to get co-coaches" });
    }
  });

  // Add a co-coach
  app.post("/api/coach/client/:clientId/co-coach", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { clientId } = req.params;
      const { secondaryCoachId, role } = req.body;

      const coCoach = await storage.addCoCoach({
        clientId,
        primaryCoachId: userId,
        secondaryCoachId,
        role: role || "co-coach",
      });

      // Notify the co-coach
      await storage.createCoachNotification({
        coachId: secondaryCoachId,
        actorId: userId,
        clientId,
        type: "co_coach_added",
        title: "Co-Coaching Invitation",
        message: `You've been added as a ${role || "co-coach"} for a client.`,
      });

      res.json(coCoach);
    } catch (error) {
      console.error("Add co-coach error:", error);
      res.status(400).json({ error: "Failed to add co-coach" });
    }
  });

  // Remove a co-coach
  app.delete("/api/coach/client/:clientId/co-coach/:coCoachId", isAuthenticated, async (req, res) => {
    try {
      const { clientId, coCoachId } = req.params;
      await storage.removeCoCoach(coCoachId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove co-coach error:", error);
      res.status(400).json({ error: "Failed to remove co-coach" });
    }
  });

  // ========== COACH NOTIFICATIONS ==========

  // Get notifications for the current coach
  app.get("/api/coach/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const notifications = await storage.getCoachNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/coach/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to get count" });
    }
  });

  // Mark notification as read
  app.patch("/api/coach/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(400).json({ error: "Failed to mark as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/coach/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(400).json({ error: "Failed to mark all as read" });
    }
  });

  // ========== GET ALL COACHES (for transfers/co-coaching) ==========

  app.get("/api/coaches", isAuthenticated, async (req, res) => {
    try {
      const coaches = await storage.getAllCoaches();
      res.json(coaches);
    } catch (error) {
      console.error("Get coaches error:", error);
      res.status(500).json({ error: "Failed to get coaches" });
    }
  });

  // ========== DAILY QUOTES ==========

  // Get today's quote for the user
  app.get("/api/quotes/today", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);

      // Seed quotes if needed
      await storage.seedDefaultQuotes();

      const quote = await storage.getDailyQuote(userId);
      res.json(quote);
    } catch (error) {
      console.error("Get daily quote error:", error);
      res.status(500).json({ error: "Failed to get daily quote" });
    }
  });

  // Get all quotes (for admin)
  app.get("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const quotes = await storage.getAllQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Get quotes error:", error);
      res.status(500).json({ error: "Failed to get quotes" });
    }
  });

  // ========== MICRO SESSIONS (5-minute daily coaching) ==========

  // Get today's micro session status
  app.get("/api/micro-sessions/today", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const session = await storage.getTodayMicroSession(userId);
      const streak = await storage.getMicroSessionStreak(userId);
      res.json({ session, streak });
    } catch (error) {
      console.error("Get micro session error:", error);
      res.status(500).json({ error: "Failed to get micro session" });
    }
  });

  // Start or update a micro session
  app.post("/api/micro-sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { durationSeconds, completed, notes, sessionType } = req.body;
      const today = new Date().toISOString().split('T')[0];

      const session = await storage.createOrUpdateMicroSession({
        userId,
        date: today,
        durationSeconds: durationSeconds || 0,
        completed: completed || false,
        notes,
        sessionType: sessionType || 'daily-checkin',
      });

      res.json(session);
    } catch (error) {
      console.error("Create micro session error:", error);
      res.status(500).json({ error: "Failed to create micro session" });
    }
  });

  // Complete a micro session
  app.post("/api/micro-sessions/complete", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { durationSeconds } = req.body;
      const today = new Date().toISOString().split('T')[0];

      const session = await storage.completeMicroSession(userId, today, durationSeconds || 300);
      const streak = await storage.getMicroSessionStreak(userId);

      res.json({ session, streak });
    } catch (error) {
      console.error("Complete micro session error:", error);
      res.status(500).json({ error: "Failed to complete micro session" });
    }
  });

  // Get micro session streak
  app.get("/api/micro-sessions/streak", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const streak = await storage.getMicroSessionStreak(userId);
      res.json(streak);
    } catch (error) {
      console.error("Get micro session streak error:", error);
      res.status(500).json({ error: "Failed to get streak" });
    }
  });

  // ========== SUPER ADMIN ROUTES ==========

  // Middleware to check for superadmin role
  function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as any;
    if (user?.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden: Super admin access required" });
    }
    return next();
  }

  // Get default app profile (public - for login page branding)
  app.get("/api/app-profile/default", async (req, res) => {
    try {
      const profile = await storage.getDefaultAppProfile();
      res.json(profile || null);
    } catch (error) {
      console.error("Get default app profile error:", error);
      res.status(500).json({ error: "Failed to get default app profile" });
    }
  });

  // Get current user's app profile (for applying theme/features)
  app.get("/api/app-profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getUserAppProfile(userId);
      res.json(profile || null);
    } catch (error) {
      console.error("Get app profile error:", error);
      res.status(500).json({ error: "Failed to get app profile" });
    }
  });

  // Get all app profiles (super admin)
  app.get("/api/admin/profiles", isSuperAdmin, async (req, res) => {
    try {
      const profiles = await storage.getAllAppProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Get profiles error:", error);
      res.status(500).json({ error: "Failed to get profiles" });
    }
  });

  // Get single profile
  app.get("/api/admin/profiles/:id", isSuperAdmin, async (req, res) => {
    try {
      const profile = await storage.getAppProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // Create new app profile
  app.post("/api/admin/profiles", isSuperAdmin, async (req, res) => {
    try {
      const { name, description, themeTokens, featureFlags, logoUrl, brandName, isDefault } = req.body;
      const profile = await storage.createAppProfile({
        name,
        description,
        themeTokens: themeTokens || {},
        featureFlags: featureFlags || {},
        logoUrl,
        brandName,
        isDefault: isDefault || false,
      });
      res.json(profile);
    } catch (error) {
      console.error("Create profile error:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Update app profile
  app.patch("/api/admin/profiles/:id", isSuperAdmin, async (req, res) => {
    try {
      const { name, description, themeTokens, featureFlags, logoUrl, brandName } = req.body;
      const profile = await storage.updateAppProfile(req.params.id, {
        name,
        description,
        themeTokens,
        featureFlags,
        logoUrl,
        brandName,
      });
      res.json(profile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Delete app profile
  app.delete("/api/admin/profiles/:id", isSuperAdmin, async (req, res) => {
    try {
      await storage.deleteAppProfile(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete profile error:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // Set default profile
  app.post("/api/admin/profiles/:id/set-default", isSuperAdmin, async (req, res) => {
    try {
      await storage.setDefaultProfile(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Set default profile error:", error);
      res.status(500).json({ error: "Failed to set default profile" });
    }
  });

  // Get all users (super admin)
  app.get("/api/admin/users", isSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Update user role (super admin)
  app.patch("/api/admin/users/:id/role", isSuperAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!["client", "coach", "admin", "superadmin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Assign profile to user (super admin)
  app.post("/api/admin/users/:id/profile", isSuperAdmin, async (req, res) => {
    try {
      const { profileId } = req.body;
      if (!profileId) {
        return res.status(400).json({ error: "Profile ID is required" });
      }
      const adminId = getUserId(req);
      const assignment = await storage.assignProfileToUser(req.params.id, profileId, adminId);
      res.json(assignment);
    } catch (error: any) {
      console.error("Assign profile error:", error);
      if (error.message?.includes("does not exist")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to assign profile" });
    }
  });

  // Remove profile assignment from user (super admin)
  app.delete("/api/admin/users/:id/profile", isSuperAdmin, async (req, res) => {
    try {
      await storage.removeUserProfileAssignment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove profile assignment error:", error);
      res.status(500).json({ error: "Failed to remove profile assignment" });
    }
  });

  return httpServer;
}
