import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Smile, Frown, Meh, Sun, Cloud, ChevronRight, CheckCircle2, Circle, Flame, BookHeart, Target, TrendingUp, Trophy, Mic, Sparkles, Calendar, Clock, Video, Sunrise, Moon, Zap, Heart, RefreshCw, Award, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import bgImage from "@assets/generated_images/calming_abstract_mobile_background.png";
import { useHabits, useHabitCompletions, useToggleHabit, useTodayMood, useCreateMood, useMoodTrends, useHabitStats, useCreateHabit, useDashboardStats, useTodayMicroSession, useUpcomingSessions, useTodayRituals, useGamification, useQuickAction, useMyChallenge, useUserGoals } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAppProfile } from "@/hooks/useAppProfile";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isTomorrow, formatDistanceToNow } from "date-fns";

export default function Home() {
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitLabel, setNewHabitLabel] = useState("");
  const { user } = useAuth();
  const { isFeatureEnabled } = useAppProfile();
  const { toast } = useToast();

  // Feature flags
  const showGroundCheck = isFeatureEnabled("groundCheck");
  const showDailyAnchors = isFeatureEnabled("dailyAnchors");
  const showCoachBrian = isFeatureEnabled("coachBrian");

  const today = useMemo(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }, []);

  const { data: habits = [] } = useHabits();
  const { data: completions = [] } = useHabitCompletions(today);
  const { data: todayMood } = useTodayMood();
  const { data: moodTrends = [] } = useMoodTrends(7);
  const { data: habitStats } = useHabitStats();
  const { data: dashboardStats } = useDashboardStats();
  const { data: microSessionData } = useTodayMicroSession();
  const { data: todayRituals = [] } = useTodayRituals();
  const { data: gamification } = useGamification();
  const { data: myChallenges = [] } = useMyChallenge();
  const { data: userGoals = [] } = useUserGoals();

  const isClient = !!user && user.role !== "coach" && user.role !== "admin";
  const { data: upcomingSessions = [] } = useUpcomingSessions({ enabled: isClient });

  // Quick action state
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [quickActionResponse, setQuickActionResponse] = useState<string | null>(null);
  const [quickActionLoading, setQuickActionLoading] = useState(false);
  const quickActionMutation = useQuickAction();

  // Get ritual status
  const morningRitual = todayRituals.find(r => r.ritualType === "morning");
  const eveningRitual = todayRituals.find(r => r.ritualType === "evening");
  const currentHour = new Date().getHours();
  const showMorningRitual = currentHour < 12;
  const showEveningRitual = currentHour >= 17;
  
  const toggleHabitMutation = useToggleHabit();
  const createMoodMutation = useCreateMood();
  const createHabitMutation = useCreateHabit();
  const nextSession = isClient && upcomingSessions.length > 0 ? upcomingSessions[0] : null;
  
  const formatSessionDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };
  
  const formatSessionTime = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return format(date, "h:mm a");
  };

  // Get user display name and initials
  const displayName = user?.name || user?.firstName || user?.username || "Friend";
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "U";

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [stressLevel, setStressLevel] = useState<number>(3);

  useEffect(() => {
    if (todayMood) {
      setSelectedMood(todayMood.mood);
      if (todayMood.energyLevel !== null && todayMood.energyLevel !== undefined) {
        setEnergyLevel(todayMood.energyLevel);
      }
      if (todayMood.stressLevel !== null && todayMood.stressLevel !== undefined) {
        setStressLevel(todayMood.stressLevel);
      }
    }
  }, [todayMood]);

  const habitsWithCompletions = useMemo(() => {
    return habits.map(habit => {
      const completion = completions.find(c => c.habitId === habit.id);
      return {
        ...habit,
        completed: completion?.completed || false
      };
    });
  }, [habits, completions]);

  const toggleHabit = (habitId: string, currentCompleted: boolean) => {
    toggleHabitMutation.mutate({
      habitId,
      date: today,
      completed: !currentCompleted
    }, {
      onSuccess: () => {
        toast({
          title: !currentCompleted ? "Habit completed!" : "Habit unmarked",
          description: !currentCompleted ? "Great job! Keep up the momentum." : "You can complete it again anytime.",
        });
      }
    });
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    createMoodMutation.mutate({ mood, energyLevel, stressLevel }, {
      onSuccess: () => {
        toast({
          title: "Ground Check logged!",
          description: `Mood: ${mood.toLowerCase()}, Energy: ${energyLevel}/5, Stress: ${stressLevel}/5`,
        });
      }
    });
  };

  const handleAddHabit = () => {
    if (newHabitLabel.trim() && !createHabitMutation.isPending) {
      createHabitMutation.mutate(newHabitLabel.trim(), {
        onSuccess: () => {
          toast({
            title: "Habit added!",
            description: `"${newHabitLabel.trim()}" has been added to your habits.`,
          });
          setNewHabitLabel("");
          setShowAddHabit(false);
        },
        onError: () => {
          toast({
            title: "Failed to add habit",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getGoalProgress = (goalType: string): number => {
    if (!moodTrends || moodTrends.length === 0) return 0;
    const recentMoods = moodTrends.slice(-7);
    
    if (goalType === "energy") {
      const avgEnergy = recentMoods.reduce((sum, m) => sum + (m.energyLevel ?? 3), 0) / recentMoods.length;
      return Math.round((avgEnergy / 5) * 100);
    }
    if (goalType === "stress_management") {
      const avgStress = recentMoods.reduce((sum, m) => sum + (m.stressLevel ?? 3), 0) / recentMoods.length;
      return Math.round(((5 - avgStress) / 5) * 100);
    }
    const habitProgress = habitsWithCompletions.filter(h => h.completed).length / (habitsWithCompletions.length || 1);
    return Math.round(habitProgress * 100);
  };

  const goalIcons: Record<string, typeof Zap> = {
    energy: Zap,
    stress_management: Heart,
    focus: Target,
    sleep: Moon,
    emotional_regulation: RefreshCw,
  };

  const goalLabels: Record<string, string> = {
    energy: "Energy",
    stress_management: "Stress",
    focus: "Focus",
    sleep: "Sleep",
    emotional_regulation: "Balance",
  };

  const handleQuickAction = async (actionType: "regulate" | "reframe" | "reset") => {
    setQuickActionLoading(true);
    setShowQuickAction(true);
    try {
      const result = await quickActionMutation.mutateAsync({ actionType });
      setQuickActionResponse(result.response);
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setQuickActionLoading(false);
    }
  };

  const getMoodDisplay = (mood: string) => {
    const moodMap: Record<string, { icon: typeof Frown; color: string; bg: string }> = {
      "Rough": { icon: Frown, color: "text-rose-500", bg: "bg-rose-100" },
      "Okay": { icon: Cloud, color: "text-slate-500", bg: "bg-slate-100" },
      "Good": { icon: Meh, color: "text-sky-500", bg: "bg-sky-100" },
      "Great": { icon: Smile, color: "text-emerald-500", bg: "bg-emerald-100" },
      "Amazing": { icon: Sun, color: "text-amber-500", bg: "bg-amber-100" },
    };
    return moodMap[mood] || moodMap["Okay"];
  };

  const formatTrendDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Compact Header */}
        <div className="relative w-full h-24 shrink-0 overflow-hidden rounded-b-2xl shadow-lg z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-deep-pine via-forest-floor/80 to-night-forest" />

          <div className="absolute inset-0 px-4 py-3 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <Link href="/profile">
                <Avatar className="h-10 w-10 border-2 border-sage/30 shadow-lg cursor-pointer" aria-label="Go to profile">
                  {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={displayName} />}
                  <AvatarFallback className="bg-forest-floor text-birch text-sm">{initials}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <p className="text-[10px] font-medium text-sage/70 uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</p>
                <h1 className="text-lg font-display font-bold text-birch leading-tight">{greeting()}, {displayName}</h1>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {gamification && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-birch/20 rounded-full border border-birch/30">
                  <Award className="w-3 h-3 text-birch" />
                  <span className="text-[10px] font-bold text-birch">Lv.{gamification.currentLevel}</span>
                </div>
              )}
              {habitStats && habitStats.currentStreak > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-ember/20 rounded-full border border-ember/30">
                  <Flame className="w-3 h-3 text-ember" />
                  <span className="text-[10px] font-bold text-ember">{habitStats.currentStreak}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Grid - Compact spacing */}
        <div className="flex-1 px-3 pt-2 flex flex-col gap-2 pb-2">

          {/* Upcoming Session Card - Only for clients with scheduled sessions */}
          {isClient && nextSession && (
            <Link href="/profile" className="shrink-0" data-testid="link-upcoming-session">
              <Card className="border-none shadow-lg bg-gradient-to-br from-deep-pine via-forest-floor/30 to-deep-pine overflow-hidden">
                <CardContent className="p-4 relative">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-bl from-sage/20 to-transparent rounded-full pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage to-forest-floor flex items-center justify-center shadow-md">
                        <Video className="w-6 h-6 text-night-forest" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-sage mb-0.5">Next Session</p>
                        <h3 className="font-semibold text-sm text-birch" data-testid="text-session-date">
                          {formatSessionDate(nextSession.scheduledAt)}
                        </h3>
                        <p className="text-xs text-sage/70 flex items-center gap-1" data-testid="text-session-time">
                          <Clock className="w-3 h-3" />
                          {formatSessionTime(nextSession.scheduledAt)} · {nextSession.durationMinutes || 60}min
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-sage" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}


          {/* Quick Actions - Regulate/Reframe/Reset */}
          {showCoachBrian && (
            <div className="shrink-0 grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickAction("regulate")}
                className="flex flex-col items-center p-3 bg-gradient-to-br from-sage/20 to-deep-pine rounded-xl border border-sage/30 hover:border-sage/50 transition-all"
              >
                <Heart className="w-6 h-6 text-sage mb-1" />
                <span className="text-[10px] font-semibold text-sage">Regulate</span>
              </button>
              <button
                onClick={() => handleQuickAction("reframe")}
                className="flex flex-col items-center p-3 bg-gradient-to-br from-birch/20 to-deep-pine rounded-xl border border-birch/30 hover:border-birch/50 transition-all"
              >
                <RefreshCw className="w-6 h-6 text-birch mb-1" />
                <span className="text-[10px] font-semibold text-birch">Reframe</span>
              </button>
              <button
                onClick={() => handleQuickAction("reset")}
                className="flex flex-col items-center p-3 bg-gradient-to-br from-amber-500/20 to-deep-pine rounded-xl border border-amber-500/30 hover:border-amber-500/50 transition-all"
              >
                <Zap className="w-6 h-6 text-amber-400 mb-1" />
                <span className="text-[10px] font-semibold text-amber-400">Reset</span>
              </button>
            </div>
          )}

          {/* Morning/Evening Ritual Card */}
          {(showMorningRitual || showEveningRitual) && (
            <Link href="/focus" className="shrink-0">
              <Card className={`border-none shadow-lg overflow-hidden ${
                (showMorningRitual && morningRitual?.completed) || (showEveningRitual && eveningRitual?.completed)
                  ? 'bg-gradient-to-br from-sage/20 via-forest-floor/10 to-deep-pine'
                  : 'bg-gradient-to-br from-amber-500/10 via-deep-pine to-deep-pine'
              }`}>
                <CardContent className="p-4 relative">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-bl from-sage/10 to-transparent rounded-full pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                        (showMorningRitual && morningRitual?.completed) || (showEveningRitual && eveningRitual?.completed)
                          ? 'bg-gradient-to-br from-sage to-forest-floor'
                          : 'bg-gradient-to-br from-amber-500 to-amber-600'
                      }`}>
                        {showMorningRitual ? (
                          morningRitual?.completed ? <CheckCircle2 className="w-6 h-6 text-night-forest" /> : <Sunrise className="w-6 h-6 text-night-forest" />
                        ) : (
                          eveningRitual?.completed ? <CheckCircle2 className="w-6 h-6 text-night-forest" /> : <Moon className="w-6 h-6 text-night-forest" />
                        )}
                      </div>
                      <div>
                        <h3 className={`font-semibold text-sm ${
                          (showMorningRitual && morningRitual?.completed) || (showEveningRitual && eveningRitual?.completed)
                            ? 'text-sage' : 'text-birch'
                        }`}>
                          {showMorningRitual
                            ? (morningRitual?.completed ? 'Morning Ritual Complete' : 'Morning Ritual')
                            : (eveningRitual?.completed ? 'Evening Ritual Complete' : 'Evening Ritual')
                          }
                        </h3>
                        <p className={`text-xs ${
                          (showMorningRitual && morningRitual?.completed) || (showEveningRitual && eveningRitual?.completed)
                            ? 'text-sage/70' : 'text-birch/70'
                        }`}>
                          {showMorningRitual
                            ? (morningRitual?.completed ? 'Start your day grounded' : 'Set your intention for today')
                            : (eveningRitual?.completed ? 'Ready for rest' : 'Reflect and release the day')
                          }
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${
                      (showMorningRitual && morningRitual?.completed) || (showEveningRitual && eveningRitual?.completed)
                        ? 'text-sage' : 'text-birch'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Active Challenge Card */}
          {myChallenges.length > 0 && myChallenges[0].challenge && (
            <Link href="/challenges" className="shrink-0">
              <Card className="border-none shadow-lg bg-gradient-to-br from-deep-pine via-forest-floor/20 to-deep-pine overflow-hidden">
                <CardContent className="p-4 relative">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-bl from-birch/10 to-transparent rounded-full pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-birch to-birch/70 flex items-center justify-center shadow-md">
                        <Users className="w-6 h-6 text-night-forest" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-sage mb-0.5">Active Challenge</p>
                        <h3 className="font-semibold text-sm text-birch line-clamp-1">{myChallenges[0].challenge.title}</h3>
                        <p className="text-xs text-sage/70 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-birch" />
                          {myChallenges[0].currentStreak} day streak · {myChallenges[0].totalCompletions} completed
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-sage" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* 5-Minute Daily Ground Check Card */}
          {showCoachBrian && (
          <Link href="/voice" className="shrink-0">
            <Card className={`border-none shadow-lg overflow-hidden ${
              microSessionData?.session?.completed
                ? 'bg-gradient-to-br from-sage/20 via-forest-floor/10 to-deep-pine'
                : 'bg-gradient-to-br from-birch/20 via-birch/10 to-deep-pine'
            }`}>
              <CardContent className="p-4 relative">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-bl from-sage/20 to-transparent rounded-full pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                      microSessionData?.session?.completed
                        ? 'bg-gradient-to-br from-sage to-forest-floor'
                        : 'bg-gradient-to-br from-birch to-birch/70'
                    }`}>
                      {microSessionData?.session?.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-night-forest" />
                      ) : (
                        <Mic className="w-6 h-6 text-night-forest" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-semibold text-sm ${
                        microSessionData?.session?.completed ? 'text-sage' : 'text-birch'
                      }`}>
                        {microSessionData?.session?.completed ? 'Ground Check Complete' : 'Daily Ground Check'}
                      </h3>
                      <p className={`text-xs ${
                        microSessionData?.session?.completed ? 'text-sage/70' : 'text-birch/70'
                      }`}>
                        {microSessionData?.session?.completed
                          ? `Rooted. ${microSessionData.streak.current} day streak`
                          : 'Connect with Coach Brian'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {microSessionData?.streak && microSessionData.streak.current > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-night-forest/60 rounded-full">
                        <Flame className="w-4 h-4 text-birch" />
                        <span className="text-xs font-bold text-birch">{microSessionData.streak.current}</span>
                      </div>
                    )}
                    <ChevronRight className={`w-5 h-5 ${
                      microSessionData?.session?.completed ? 'text-sage' : 'text-birch'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          )}

          {/* Quick Stats - Ultra compact horizontal strip */}
          {dashboardStats && (
            <Link href="/stats">
              <div className="shrink-0 flex justify-between items-center bg-deep-pine/80 rounded-xl px-3 py-2 border border-forest-floor/30" data-testid="dashboard-summary">
                <div className="flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-sage" />
                  <span className="text-sm font-bold text-birch" data-testid="stat-mood-checkins">{dashboardStats.totalMoodCheckins}</span>
                </div>
                <div className="w-px h-4 bg-forest-floor/50" />
                <div className="flex items-center gap-1.5">
                  <BookHeart className="w-3.5 h-3.5 text-sage" />
                  <span className="text-sm font-bold text-birch" data-testid="stat-journal-entries">{dashboardStats.totalJournalEntries}</span>
                </div>
                <div className="w-px h-4 bg-forest-floor/50" />
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-sage" />
                  <span className="text-sm font-bold text-birch" data-testid="stat-habits-completed">{dashboardStats.totalHabitsCompleted}</span>
                </div>
                <div className="w-px h-4 bg-forest-floor/50" />
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-ember" />
                  <span className="text-sm font-bold text-birch" data-testid="stat-current-streak">{dashboardStats.currentStreak}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-sage/50" />
              </div>
            </Link>
          )}

          {/* Row 1: Daily Ground Check - Compact */}
          {showGroundCheck && (
          <div className="shrink-0">
            <Card className="border-none shadow-lg bg-deep-pine/95 overflow-hidden">
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-xs text-sage">How are you grounded?</h2>
                  {moodTrends.length > 0 && (
                    <div className="flex gap-0.5" data-testid="mood-trends-container">
                      {moodTrends.slice(-7).map((trend, i) => {
                        const moodStyle = getMoodDisplay(trend.mood);
                        return (
                          <div key={i} className={`w-4 h-4 rounded-full ${moodStyle.bg} flex items-center justify-center`} data-testid={`mood-trend-${i}`} title={`${formatTrendDate(trend.date)}: ${trend.mood}`}>
                            <moodStyle.icon className={`w-2.5 h-2.5 ${moodStyle.color}`} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex justify-between gap-1" role="group" aria-label="Select how grounded you feel">
                  {[
                    { icon: Frown, label: "Rough", color: "text-rose-400", bg: "bg-rose-900/30", activeBg: "bg-rose-900/50", ring: "ring-rose-500" },
                    { icon: Cloud, label: "Okay", color: "text-slate-400", bg: "bg-slate-800/30", activeBg: "bg-slate-800/50", ring: "ring-slate-500" },
                    { icon: Meh, label: "Good", color: "text-sky-400", bg: "bg-sky-900/30", activeBg: "bg-sky-900/50", ring: "ring-sky-500" },
                    { icon: Smile, label: "Great", color: "text-sage", bg: "bg-sage/20", activeBg: "bg-sage/30", ring: "ring-sage" },
                    { icon: Sun, label: "Amazing", color: "text-birch", bg: "bg-birch/20", activeBg: "bg-birch/30", ring: "ring-birch" },
                  ].map((mood) => (
                    <button
                      key={mood.label}
                      data-testid={`button-mood-${mood.label.toLowerCase()}`}
                      onClick={() => handleMoodSelect(mood.label)}
                      aria-label={`Log ground check as ${mood.label}`}
                      aria-pressed={selectedMood === mood.label}
                      className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all flex-1 h-12 ${
                        selectedMood === mood.label
                          ? `${mood.activeBg} ring-1 ${mood.ring} scale-105`
                          : `${mood.bg} hover:scale-102`
                      }`}
                    >
                      <mood.icon className={`w-5 h-5 ${mood.color}`} aria-hidden="true" />
                      <span className={`text-[8px] font-semibold mt-0.5 ${selectedMood === mood.label ? mood.color : 'text-muted-foreground'}`}>{mood.label}</span>
                    </button>
                  ))}
                </div>

                {/* Energy & Stress - Inline compact */}
                <div className="mt-2 flex gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-birch shrink-0" />
                    <div className="flex gap-0.5 flex-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => setEnergyLevel(level)}
                          data-testid={`button-energy-${level}`}
                          className={`flex-1 h-1.5 rounded-full transition-all ${
                            level <= energyLevel ? 'bg-birch' : 'bg-forest-floor/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <Heart className="w-3 h-3 text-rose-400 shrink-0" />
                    <div className="flex gap-0.5 flex-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => setStressLevel(level)}
                          data-testid={`button-stress-${level}`}
                          className={`flex-1 h-1.5 rounded-full transition-all ${
                            level <= stressLevel ? 'bg-rose-400' : 'bg-forest-floor/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Row 2: Daily Anchors - Compact list */}
          {showDailyAnchors && (
          <Card className="border-none shadow-lg flex-1 min-h-0 flex flex-col bg-deep-pine/95 overflow-hidden">
            <CardContent className="p-2.5 flex-1 min-h-0 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-xs text-sage">Daily Anchors</h3>
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 w-12 bg-forest-floor/30 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={habitsWithCompletions.filter(h => h.completed).length}
                    aria-valuemin={0}
                    aria-valuemax={habitsWithCompletions.length}
                  >
                    <div
                      className="h-full bg-sage rounded-full transition-all duration-500"
                      style={{ width: `${habitsWithCompletions.length > 0 ? (habitsWithCompletions.filter(h => h.completed).length / habitsWithCompletions.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-sage" data-testid="text-habit-count">
                    {habitsWithCompletions.filter(h => h.completed).length}/{habitsWithCompletions.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar" role="list" aria-label="Daily anchors">
                {habitsWithCompletions.map((habit) => (
                  <div
                    key={habit.id}
                    data-testid={`habit-${habit.id}`}
                    onClick={() => toggleHabit(habit.id, habit.completed)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleHabit(habit.id, habit.completed);
                      }
                    }}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`${habit.label}, ${habit.completed ? "completed" : "not completed"}`}
                    className={`flex items-center p-2 rounded-lg transition-all cursor-pointer ${
                      habit.completed
                        ? "bg-sage/10 border border-sage/20"
                        : "bg-night-forest/50 border border-forest-floor/30 hover:border-sage/30"
                    }`}
                  >
                    <div className={`mr-2 ${habit.completed ? "text-sage" : "text-forest-floor"}`}>
                      {habit.completed ? (
                        <CheckCircle2 className="w-4 h-4" data-testid={`icon-habit-completed-${habit.id}`} />
                      ) : (
                        <Circle className="w-4 h-4" data-testid={`icon-habit-incomplete-${habit.id}`} />
                      )}
                    </div>
                    <span className={`flex-1 text-xs font-medium ${habit.completed ? "text-sage/70 line-through" : "text-birch"}`} data-testid={`text-habit-label-${habit.id}`}>
                      {habit.label}
                    </span>
                  </div>
                ))}

                {/* Add Anchor Button */}
                <button
                  onClick={() => setShowAddHabit(true)}
                  className="w-full py-2 text-[10px] font-medium text-sage/50 border border-dashed border-sage/20 rounded-lg hover:bg-sage/5 transition-all"
                  data-testid="button-add-habit"
                >
                  + Add Anchor
                </button>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Goals Progress - Compact inline */}
          {userGoals.filter(g => g.isActive).length > 0 && (
            <Link href="/metrics" className="shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-deep-pine/80 rounded-xl border border-forest-floor/30">
                <Target className="w-3.5 h-3.5 text-sage shrink-0" />
                <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar">
                  {userGoals.filter(g => g.isActive).slice(0, 3).map((goal) => {
                    const Icon = goalIcons[goal.goalType] || Target;
                    const progress = getGoalProgress(goal.goalType);
                    return (
                      <div key={goal.id} className="flex items-center gap-1.5 shrink-0" data-testid={`goal-progress-${goal.id}`}>
                        <Icon className="w-3 h-3 text-sage/70" />
                        <span className="text-[10px] font-medium text-birch">{goalLabels[goal.goalType]?.slice(0, 3) || goal.goalType.slice(0, 3)}</span>
                        <div className="w-8 h-1 bg-forest-floor/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sage rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <ChevronRight className="w-4 h-4 text-sage/50 shrink-0" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Add Anchor Modal */}
      <Dialog open={showAddHabit} onOpenChange={setShowAddHabit}>
        <DialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl border-none bg-deep-pine">
          <DialogHeader>
            <DialogTitle className="text-xl text-birch">Add New Anchor</DialogTitle>
            <DialogDescription className="text-sage/80">
              Choose a grounding practice or create your own.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suggested-habit" className="text-sm font-medium text-birch">Grounding Practices</Label>
              <Select
                value=""
                onValueChange={(value) => setNewHabitLabel(value)}
              >
                <SelectTrigger
                  id="suggested-habit"
                  className="bg-night-forest border-forest-floor text-birch focus:ring-sage/30"
                  data-testid="select-suggested-habit"
                >
                  <SelectValue placeholder="Choose a grounding practice..." />
                </SelectTrigger>
                <SelectContent className="bg-deep-pine border-forest-floor">
                  <SelectItem value="Cold water exposure" data-testid="option-habit-cold">Cold water exposure</SelectItem>
                  <SelectItem value="Morning forest walk" data-testid="option-habit-walk">Morning forest walk</SelectItem>
                  <SelectItem value="Grounding breathwork" data-testid="option-habit-breathe">Grounding breathwork</SelectItem>
                  <SelectItem value="Sit with the fire" data-testid="option-habit-fire">Sit with the fire</SelectItem>
                  <SelectItem value="10 minutes of stillness" data-testid="option-habit-stillness">10 minutes of stillness</SelectItem>
                  <SelectItem value="Write in my journal" data-testid="option-habit-journal">Write in my journal</SelectItem>
                  <SelectItem value="Connect with a brother" data-testid="option-habit-connect">Connect with a brother</SelectItem>
                  <SelectItem value="Physical training" data-testid="option-habit-exercise">Physical training</SelectItem>
                  <SelectItem value="Feet on the earth" data-testid="option-habit-earth">Feet on the earth</SelectItem>
                  <SelectItem value="Limit screen time" data-testid="option-habit-screen">Limit screen time</SelectItem>
                  <SelectItem value="8 hours of rest" data-testid="option-habit-sleep">8 hours of rest</SelectItem>
                  <SelectItem value="Practice gratitude" data-testid="option-habit-gratitude">Practice gratitude</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-forest-floor/50"></div>
              <span className="mx-3 text-xs text-sage/60">or</span>
              <div className="flex-grow border-t border-forest-floor/50"></div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-habit" className="text-sm font-medium text-birch">Create Your Own</Label>
              <Input
                id="custom-habit"
                placeholder="Type your own anchor..."
                className="bg-night-forest border-forest-floor text-birch placeholder:text-sage/50 focus-visible:ring-sage/30"
                value={newHabitLabel}
                onChange={(e) => setNewHabitLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddHabit();
                  }
                }}
                data-testid="input-new-habit"
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddHabit(false);
                setNewHabitLabel("");
              }}
              className="flex-1 text-sage hover:bg-forest-floor/30 hover:text-birch"
              data-testid="button-cancel-habit"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-birch hover:bg-birch/80 text-night-forest shadow-md border-none"
              onClick={handleAddHabit}
              disabled={!newHabitLabel.trim() || createHabitMutation.isPending}
              data-testid="button-save-habit"
            >
              {createHabitMutation.isPending ? "Adding..." : "Add Anchor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Action Response Modal */}
      <Dialog open={showQuickAction} onOpenChange={(open) => {
        setShowQuickAction(open);
        if (!open) setQuickActionResponse(null);
      }}>
        <DialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl border-none bg-deep-pine">
          <DialogHeader>
            <DialogTitle className="text-xl text-birch flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sage" />
              Coach Response
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {quickActionLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-10 h-10 border-3 border-sage/30 border-t-sage rounded-full animate-spin mb-3" />
                <p className="text-sm text-sage/70">Thinking...</p>
              </div>
            ) : (
              <div className="bg-night-forest/50 rounded-xl p-4 border border-forest-floor/30">
                <p className="text-sm text-birch/90 leading-relaxed whitespace-pre-wrap">{quickActionResponse}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowQuickAction(false);
                setQuickActionResponse(null);
              }}
              className="flex-1 text-sage hover:bg-forest-floor/30 hover:text-birch"
            >
              Close
            </Button>
            <Link href="/voice" className="flex-1">
              <Button className="w-full bg-birch hover:bg-birch/80 text-night-forest shadow-md border-none">
                Talk to Coach
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
