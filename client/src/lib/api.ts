import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Mood, Habit, HabitCompletion, JournalEntry, Homework, VisionBoardItem, VentMessage, UserAchievement, UserSettings, CoachingSession } from "@shared/schema";

const API_BASE = "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Moods
export function useMoods() {
  return useQuery<Mood[]>({
    queryKey: ["moods"],
    queryFn: () => fetchJSON<Mood[]>(`${API_BASE}/moods`),
  });
}

export function useTodayMood() {
  return useQuery<Mood | null>({
    queryKey: ["mood", "today"],
    queryFn: () => fetchJSON<Mood | null>(`${API_BASE}/moods/today`),
  });
}

export function useCreateMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mood: string) =>
      fetchJSON<Mood>(`${API_BASE}/moods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moods"] });
      queryClient.invalidateQueries({ queryKey: ["mood", "today"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "dashboard"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && 
          query.queryKey[0] === "stats" && 
          query.queryKey[1] === "mood-trends"
      });
      queryClient.invalidateQueries({ queryKey: ["stats", "habits"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "streaks"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}

// Habits
export function useHabits() {
  return useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: () => fetchJSON<Habit[]>(`${API_BASE}/habits`),
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) =>
      fetchJSON<Habit>(`${API_BASE}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<{ success: boolean }>(`${API_BASE}/habits/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useToggleHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) =>
      fetchJSON<HabitCompletion>(`${API_BASE}/habits/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date, completed }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["habit-completions", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["stats", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "habits"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "streaks"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}

export function useHabitCompletions(date: string) {
  return useQuery<HabitCompletion[]>({
    queryKey: ["habit-completions", date],
    queryFn: () => fetchJSON<HabitCompletion[]>(`${API_BASE}/habits/completions/${date}`),
  });
}

// Journal
export function useJournalEntries() {
  return useQuery<JournalEntry[]>({
    queryKey: ["journal"],
    queryFn: () => fetchJSON<JournalEntry[]>(`${API_BASE}/journal`),
  });
}

export function useJournalPrompts() {
  return useQuery<string[]>({
    queryKey: ["journal", "prompts"],
    queryFn: () => fetchJSON<string[]>(`${API_BASE}/journal/prompts`),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: { title: string; content: string; mood?: string }) =>
      fetchJSON<JournalEntry>(`${API_BASE}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stats", "streaks"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; title?: string; content?: string; mood?: string | null }) =>
      fetchJSON<JournalEntry>(`${API_BASE}/journal/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.title, content: data.content, mood: data.mood }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<{ success: boolean }>(`${API_BASE}/journal/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

// Homework
export function useActiveHomework() {
  return useQuery<Homework | null>({
    queryKey: ["homework", "active"],
    queryFn: () => fetchJSON<Homework | null>(`${API_BASE}/homework/active`),
  });
}

export function useCreateHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      fetchJSON<Homework>(`${API_BASE}/homework`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", "active"] });
    },
  });
}

export function useCompleteHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<{ success: boolean }>(`${API_BASE}/homework/${id}/complete`, {
        method: "PATCH",
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["homework", "active"] });
      const previousHomework = queryClient.getQueryData(["homework", "active"]);
      queryClient.setQueryData(["homework", "active"], null);
      return { previousHomework };
    },
    onError: (err, variables, context) => {
      if (context?.previousHomework) {
        queryClient.setQueryData(["homework", "active"], context.previousHomework);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["homework", "active"] });
    },
  });
}

// Vision Board
export function useVisionBoard() {
  return useQuery<VisionBoardItem[]>({
    queryKey: ["vision-board"],
    queryFn: () => fetchJSON<VisionBoardItem[]>(`${API_BASE}/vision-board`),
  });
}

export function useCreateVisionBoardItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: { imageUrl: string; label: string }) =>
      fetchJSON<VisionBoardItem>(`${API_BASE}/vision-board`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vision-board"] });
    },
  });
}

export function useUpdateVisionBoardItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; imageUrl?: string; label?: string }) =>
      fetchJSON<VisionBoardItem>(`${API_BASE}/vision-board/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: data.imageUrl, label: data.label }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vision-board"] });
    },
  });
}

export function useDeleteVisionBoardItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<{ success: boolean }>(`${API_BASE}/vision-board/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vision-board"] });
    },
  });
}

// Vent Messages
export function useVentMessages() {
  return useQuery<VentMessage[]>({
    queryKey: ["vent"],
    queryFn: () => fetchJSON<VentMessage[]>(`${API_BASE}/vent`),
  });
}

export function useCreateVentMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      fetchJSON<VentMessage>(`${API_BASE}/vent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vent"] });
    },
  });
}

// Stats & Dashboard
export interface DashboardStats {
  totalMoodCheckins: number;
  totalJournalEntries: number;
  totalHabitsCompleted: number;
  currentStreak: number;
}

export interface MoodTrend {
  date: string;
  mood: string;
  score: number;
}

export interface HabitStats {
  totalHabits: number;
  completedToday: number;
  currentStreak: number;
  longestStreak: number;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["stats", "dashboard"],
    queryFn: () => fetchJSON<DashboardStats>(`${API_BASE}/stats/dashboard`),
  });
}

export function useMoodTrends(days: number = 7) {
  return useQuery<MoodTrend[]>({
    queryKey: ["stats", "mood-trends", days],
    queryFn: () => fetchJSON<MoodTrend[]>(`${API_BASE}/stats/mood-trends?days=${days}`),
  });
}

export function useHabitStats() {
  return useQuery<HabitStats>({
    queryKey: ["stats", "habits"],
    queryFn: () => fetchJSON<HabitStats>(`${API_BASE}/stats/habits`),
  });
}

interface AllStreaks {
  moodStreak: { current: number; longest: number };
  journalStreak: { current: number; longest: number };
  habitStreak: { current: number; longest: number };
}

export function useAllStreaks() {
  return useQuery<AllStreaks>({
    queryKey: ["stats", "streaks"],
    queryFn: () => fetchJSON<AllStreaks>(`${API_BASE}/stats/streaks`),
  });
}

// Achievements
export function useAchievements() {
  return useQuery<UserAchievement[]>({
    queryKey: ["achievements"],
    queryFn: () => fetchJSON<UserAchievement[]>(`${API_BASE}/achievements`),
  });
}

export function useAwardAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (achievementId: string) =>
      fetchJSON<{ awarded: boolean; achievement?: UserAchievement }>(`${API_BASE}/achievements/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}

// User Settings
export function useUserSettings() {
  return useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: () => fetchJSON<UserSettings>(`${API_BASE}/settings`),
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<Omit<UserSettings, "id" | "userId">>) =>
      fetchJSON<UserSettings>(`${API_BASE}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

// User Profile
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; profileImageUrl?: string }) =>
      fetchJSON<any>(`${API_BASE}/user/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useDeleteAllUserData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJSON<{ success: boolean; message: string }>(`${API_BASE}/user/data`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export async function exportUserData(): Promise<void> {
  const response = await fetch(`${API_BASE}/user/export`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindfulcoach-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Breathing Voice (Natural TTS)
export async function fetchBreathingAudio(text: string): Promise<ArrayBuffer> {
  const response = await fetch(`${API_BASE}/breathing/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch breathing audio");
  }
  return response.arrayBuffer();
}

// Coach Chat with RAG
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useCoachChat() {
  return useMutation({
    mutationFn: (data: { message: string; conversationHistory: ChatMessage[] }) =>
      fetchJSON<{ response: string }>(`${API_BASE}/coach/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });
}

// Coach-Client Relationships
export interface ClientInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
}

export interface ClientData {
  moods?: any[];
  journals?: any[];
  habits?: any[];
  completions?: any[];
  stats: DashboardStats;
}

export interface CoachInvite {
  id: string;
  code: string;
  inviteeEmail: string | null;
  inviteeName: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}

export function useCoachClients() {
  return useQuery<ClientInfo[]>({
    queryKey: ["coach", "clients"],
    queryFn: () => fetchJSON<ClientInfo[]>(`${API_BASE}/coach/clients`),
  });
}

export function useClientData(clientId: string | null) {
  return useQuery<ClientData>({
    queryKey: ["coach", "client", clientId],
    queryFn: () => fetchJSON<ClientData>(`${API_BASE}/coach/client/${clientId}/data`),
    enabled: !!clientId,
  });
}

export function useClientVentMessages(clientId: string | null) {
  return useQuery<VentMessage[]>({
    queryKey: ["coach", "client", clientId, "vent"],
    queryFn: () => fetchJSON<VentMessage[]>(`${API_BASE}/coach/client/${clientId}/vent-messages`),
    enabled: !!clientId,
  });
}

export function useCreateCoachInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: { email?: string; name?: string }) =>
      fetchJSON<CoachInvite & { emailSent?: boolean }>(`${API_BASE}/coach/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "invites"] });
    },
  });
}

export function useCoachInvites() {
  return useQuery<(CoachInvite & { status: string; usedByUser: { id: string; name: string; email: string | null } | null })[]>({
    queryKey: ["coach", "invites"],
    queryFn: () => fetchJSON(`${API_BASE}/coach/invites`),
  });
}

export function useAssignHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, content }: { clientId: string; content: string }) =>
      fetchJSON<any>(`${API_BASE}/coach/assign-homework/${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["coach", "client", variables.clientId] });
    },
  });
}

export function useMyCoach() {
  return useQuery<any>({
    queryKey: ["my-coach"],
    queryFn: () => fetchJSON<any>(`${API_BASE}/my-coach`),
  });
}

export function useJoinCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      fetchJSON<{ success: boolean; coach: any }>(`${API_BASE}/join-coach/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-coach"] });
    },
  });
}

// Coaching Sessions
export function useSessions(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery<CoachingSession[]>({
    queryKey: ["sessions"],
    queryFn: () => fetchJSON<CoachingSession[]>(`${API_BASE}/sessions`),
    enabled,
  });
}

export function useUpcomingSessions(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery<CoachingSession[]>({
    queryKey: ["sessions", "upcoming"],
    queryFn: () => fetchJSON<CoachingSession[]>(`${API_BASE}/sessions/upcoming`),
    enabled,
  });
}

export function useClientSessions(clientId: string | null) {
  return useQuery<CoachingSession[]>({
    queryKey: ["sessions", "client", clientId],
    queryFn: () => fetchJSON<CoachingSession[]>(`${API_BASE}/sessions/client/${clientId}`),
    enabled: !!clientId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { clientId: string; scheduledAt: string; durationMinutes: number; notes?: string }) =>
      fetchJSON<CoachingSession>(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessions", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["sessions", "client", variables.clientId] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; scheduledAt?: string; durationMinutes?: number; notes?: string }) =>
      fetchJSON<CoachingSession>(`${API_BASE}/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessions", "upcoming"] });
    },
  });
}

export function useUpdateSessionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetchJSON<CoachingSession>(`${API_BASE}/sessions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessions", "upcoming"] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<{ success: boolean }>(`${API_BASE}/sessions/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessions", "upcoming"] });
    },
  });
}

// ============================================
// Journaling Templates
// ============================================

export interface JournalingTemplate {
  id: string;
  createdBy: string | null;
  title: string;
  description: string | null;
  totalDays: number;
  isShared: boolean;
  category: string | null;
  createdAt: string | null;
}

export interface TemplatePrompt {
  id: string;
  templateId: string;
  dayNumber: number;
  title: string;
  prompt: string;
  tips: string | null;
}

export interface TemplateWithPrompts extends JournalingTemplate {
  prompts: TemplatePrompt[];
}

export interface UserTemplateProgress {
  id: string;
  userId: string;
  templateId: string;
  currentDay: number;
  startedAt: string | null;
  completedAt: string | null;
  assignedBy: string | null;
  template?: JournalingTemplate;
}

export function useJournalingTemplates() {
  return useQuery<JournalingTemplate[]>({
    queryKey: ["templates"],
    queryFn: () => fetchJSON<JournalingTemplate[]>(`${API_BASE}/templates`),
  });
}

export function useTemplateLibrary() {
  return useQuery<JournalingTemplate[]>({
    queryKey: ["templates", "library"],
    queryFn: () => fetchJSON<JournalingTemplate[]>(`${API_BASE}/templates/library`),
  });
}

export function useTemplate(id: string | null) {
  return useQuery<TemplateWithPrompts>({
    queryKey: ["templates", id],
    queryFn: () => fetchJSON<TemplateWithPrompts>(`${API_BASE}/templates/${id}`),
    enabled: !!id,
  });
}

export function useTemplateProgress() {
  return useQuery<UserTemplateProgress[]>({
    queryKey: ["templates", "progress"],
    queryFn: () => fetchJSON<UserTemplateProgress[]>(`${API_BASE}/templates/progress`),
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; totalDays: number; isShared?: boolean; category?: string; prompts: { dayNumber: number; title: string; prompt: string; tips?: string }[] }) =>
      fetchJSON<JournalingTemplate>(`${API_BASE}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useStartTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      fetchJSON<UserTemplateProgress>(`${API_BASE}/templates/${templateId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", "progress"] });
    },
  });
}

export function useSubmitTemplateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ progressId, promptId, content }: { progressId: string; promptId: string; content: string }) =>
      fetchJSON<any>(`${API_BASE}/templates/progress/${progressId}/entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", "progress"] });
    },
  });
}

// ============================================
// Client Transfers / Referrals
// ============================================

export interface ClientTransfer {
  id: string;
  clientId: string;
  fromCoachId: string;
  toCoachId: string;
  notes: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string | null;
  respondedAt: string | null;
  client?: { firstName: string | null; lastName: string | null; email: string | null };
  fromCoach?: { firstName: string | null; lastName: string | null };
  toCoach?: { firstName: string | null; lastName: string | null };
}

export interface Coach {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
}

export function useAllCoaches() {
  return useQuery<Coach[]>({
    queryKey: ["coaches"],
    queryFn: () => fetchJSON<Coach[]>(`${API_BASE}/coaches`),
  });
}

export function useIncomingTransfers() {
  return useQuery<ClientTransfer[]>({
    queryKey: ["transfers", "incoming"],
    queryFn: () => fetchJSON<ClientTransfer[]>(`${API_BASE}/coach/transfers/incoming`),
  });
}

export function useOutgoingTransfers() {
  return useQuery<ClientTransfer[]>({
    queryKey: ["transfers", "outgoing"],
    queryFn: () => fetchJSON<ClientTransfer[]>(`${API_BASE}/coach/transfers/outgoing`),
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { clientId: string; toCoachId: string; notes?: string }) =>
      fetchJSON<ClientTransfer>(`${API_BASE}/coach/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
}

export function useRespondToTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "rejected" }) =>
      fetchJSON<ClientTransfer>(`${API_BASE}/coach/transfers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["coach", "clients"] });
    },
  });
}

// ============================================
// Co-Coaching
// ============================================

export interface CoCoach {
  id: string;
  clientId: string;
  primaryCoachId: string;
  secondaryCoachId: string;
  role: string | null;
  createdAt: string | null;
  secondaryCoach?: Coach;
}

export function useCoCoaches(clientId: string | null) {
  return useQuery<CoCoach[]>({
    queryKey: ["co-coaches", clientId],
    queryFn: () => fetchJSON<CoCoach[]>(`${API_BASE}/coach/client/${clientId}/co-coaches`),
    enabled: !!clientId,
  });
}

export function useAddCoCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, secondaryCoachId, role }: { clientId: string; secondaryCoachId: string; role?: string }) =>
      fetchJSON<CoCoach>(`${API_BASE}/coach/client/${clientId}/co-coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secondaryCoachId, role }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["co-coaches", variables.clientId] });
    },
  });
}

export function useRemoveCoCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, coCoachId }: { clientId: string; coCoachId: string }) =>
      fetchJSON<{ success: boolean }>(`${API_BASE}/coach/client/${clientId}/co-coach/${coCoachId}`, {
        method: "DELETE",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["co-coaches", variables.clientId] });
    },
  });
}

// ============================================
// Coach Notifications
// ============================================

export interface CoachNotification {
  id: string;
  coachId: string;
  actorId: string | null;
  clientId: string | null;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  createdAt: string | null;
  actor?: { firstName: string | null; lastName: string | null };
  client?: { firstName: string | null; lastName: string | null };
}

export function useCoachNotifications() {
  return useQuery<CoachNotification[]>({
    queryKey: ["notifications"],
    queryFn: () => fetchJSON<CoachNotification[]>(`${API_BASE}/coach/notifications`),
  });
}

export function useUnreadNotificationCount() {
  return useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => fetchJSON<{ count: number }>(`${API_BASE}/coach/notifications/unread-count`),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<CoachNotification>(`${API_BASE}/coach/notifications/${id}/read`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJSON<{ success: boolean }>(`${API_BASE}/coach/notifications/read-all`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ============================================
// Daily Quotes
// ============================================

export interface DailyQuote {
  id: string;
  quote: string;
  author: string | null;
  category: string | null;
  createdAt: string | null;
}

export function useDailyQuote() {
  return useQuery<DailyQuote | null>({
    queryKey: ["quotes", "today"],
    queryFn: () => fetchJSON<DailyQuote | null>(`${API_BASE}/quotes/today`),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// ============================================
// Micro Sessions (5-minute daily coaching)
// ============================================

export interface MicroSession {
  id: string;
  userId: string;
  date: string;
  durationSeconds: number;
  targetDurationSeconds: number;
  completed: boolean;
  sessionType: string | null;
  notes: string | null;
  createdAt: string | null;
}

export interface MicroSessionStreak {
  current: number;
  longest: number;
}

export interface TodayMicroSessionResponse {
  session: MicroSession | null;
  streak: MicroSessionStreak;
}

export function useTodayMicroSession() {
  return useQuery<TodayMicroSessionResponse>({
    queryKey: ["micro-sessions", "today"],
    queryFn: () => fetchJSON<TodayMicroSessionResponse>(`${API_BASE}/micro-sessions/today`),
  });
}

export function useMicroSessionStreak() {
  return useQuery<MicroSessionStreak>({
    queryKey: ["micro-sessions", "streak"],
    queryFn: () => fetchJSON<MicroSessionStreak>(`${API_BASE}/micro-sessions/streak`),
  });
}

export function useStartMicroSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { durationSeconds?: number; sessionType?: string; notes?: string }) =>
      fetchJSON<MicroSession>(`${API_BASE}/micro-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["micro-sessions"] });
    },
  });
}

export function useCompleteMicroSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (durationSeconds: number) =>
      fetchJSON<{ session: MicroSession; streak: MicroSessionStreak }>(`${API_BASE}/micro-sessions/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationSeconds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["micro-sessions"] });
    },
  });
}
