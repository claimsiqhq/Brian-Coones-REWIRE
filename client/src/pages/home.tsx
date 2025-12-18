import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Smile, Frown, Meh, Sun, Cloud, ChevronRight, AlertCircle, CheckCircle2, Circle, Flame, BookHeart, Target, TrendingUp, Trophy, Quote, Mic, Sparkles, Calendar, Clock, Video, Sunrise, Moon, Zap, Heart, RefreshCw, Award, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import bgImage from "@assets/generated_images/calming_abstract_mobile_background.png";
import { useHabits, useHabitCompletions, useToggleHabit, useTodayMood, useCreateMood, useCreateVentMessage, useMoodTrends, useHabitStats, useCreateHabit, useAchievements, useDashboardStats, useDailyQuote, useTodayMicroSession, useUpcomingSessions, useTodayRituals, useGamification, useQuickAction, useMyChallenge } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAppProfile } from "@/hooks/useAppProfile";
import { useToast } from "@/hooks/use-toast";
import { useCelebration, ACHIEVEMENT_CELEBRATIONS } from "@/hooks/useCelebration";
import { format, isToday, isTomorrow, formatDistanceToNow } from "date-fns";

export default function Home() {
  const [showCrisis, setShowCrisis] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [ventText, setVentText] = useState("");
  const [newHabitLabel, setNewHabitLabel] = useState("");
  const { user } = useAuth();
  const { isFeatureEnabled } = useAppProfile();
  const { toast } = useToast();
  const { celebrate, triggerConfetti } = useCelebration();
  const previousAchievementCountRef = useRef<number | null>(null);

  // Feature flags
  const showRelease = isFeatureEnabled("release");
  const showGroundCheck = isFeatureEnabled("groundCheck");
  const showDailyAnchors = isFeatureEnabled("dailyAnchors");
  const showCoachBrian = isFeatureEnabled("coachBrian");
  const showAchievements = isFeatureEnabled("achievements");

  const today = useMemo(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }, []);

  const { data: habits = [] } = useHabits();
  const { data: completions = [] } = useHabitCompletions(today);
  const { data: todayMood } = useTodayMood();
  const { data: moodTrends = [] } = useMoodTrends(7);
  const { data: habitStats } = useHabitStats();
  const { data: achievements = [] } = useAchievements();
  const { data: dashboardStats } = useDashboardStats();
  const { data: dailyQuote } = useDailyQuote();
  const { data: microSessionData } = useTodayMicroSession();
  const { data: todayRituals = [] } = useTodayRituals();
  const { data: gamification } = useGamification();
  const { data: myChallenges = [] } = useMyChallenge();

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
  const createVentMutation = useCreateVentMessage();
  const createHabitMutation = useCreateHabit();
  const nextSession = isClient && upcomingSessions.length > 0 ? upcomingSessions[0] : null;
  
  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };
  
  const formatSessionTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "h:mm a");
  };

  // Watch for new achievements and trigger celebrations
  useEffect(() => {
    if (achievements.length > 0) {
      if (previousAchievementCountRef.current !== null && achievements.length > previousAchievementCountRef.current) {
        // New achievement earned! Find the latest one and celebrate
        const latestAchievement = achievements[achievements.length - 1];
        const celebrationInfo = ACHIEVEMENT_CELEBRATIONS[latestAchievement.achievementId];
        if (celebrationInfo) {
          celebrate({
            title: celebrationInfo.title,
            description: celebrationInfo.description,
            icon: <span className="text-4xl">{celebrationInfo.emoji}</span>,
          });
        } else {
          // Generic celebration for unknown achievements
          celebrate({
            title: "Achievement Unlocked!",
            description: "You've earned a new achievement. Keep up the great work!",
          });
        }
      }
      previousAchievementCountRef.current = achievements.length;
    }
  }, [achievements, celebrate]);

  // Get user display name and initials
  const displayName = user?.name || user?.firstName || user?.username || "Friend";
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "U";

  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    if (todayMood) {
      setSelectedMood(todayMood.mood);
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
    createMoodMutation.mutate(mood, {
      onSuccess: () => {
        toast({
          title: "Mood logged!",
          description: `You're feeling ${mood.toLowerCase()} today.`,
        });
      }
    });
  };

  const handleSendVent = () => {
    if (ventText.trim()) {
      createVentMutation.mutate(ventText, {
        onSuccess: () => {
          toast({
            title: "Message sent",
            description: "Your coach will see this soon.",
          });
        }
      });
      setVentText("");
      setShowCrisis(false);
    }
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
        {/* Forest Header */}
        <div className="relative w-full h-36 shrink-0 overflow-hidden rounded-b-[2rem] shadow-lg z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-deep-pine via-forest-floor/80 to-night-forest" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(143,166,143,0.15),transparent_50%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-night-forest/50 to-transparent" />
          
          <div className="absolute top-0 left-0 right-0 p-5 pt-6 flex justify-between items-center z-10">
            <div>
              <p className="text-xs font-medium text-sage/80 uppercase tracking-wider mb-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</p>
              <h1 className="text-2xl font-display font-bold text-birch leading-tight drop-shadow-sm">{greeting()},<br/>{displayName}</h1>
            </div>
            <div className="flex gap-3 items-center">
              {/* Level Badge */}
              {gamification && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-birch/20 rounded-full backdrop-blur-sm border border-birch/30">
                  <Award className="w-4 h-4 text-birch" />
                  <span className="text-xs font-bold text-birch">Lv.{gamification.currentLevel}</span>
                </div>
              )}
              {showRelease && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-sage/20 hover:bg-sage/30 text-birch rounded-full px-3 py-1.5 h-auto gap-1.5 backdrop-blur-sm border border-sage/20"
                  onClick={() => setShowCrisis(true)}
                  data-testid="button-crisis-mode"
                  aria-label="Open release space - send a message to your coach"
                >
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  <span className="text-xs font-medium">Release</span>
                </Button>
              )}
              <Link href="/profile">
                <Avatar className="h-11 w-11 border-3 border-sage/30 shadow-xl cursor-pointer ring-2 ring-sage/20" aria-label="Go to profile">
                  {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={displayName} />}
                  <AvatarFallback className="bg-forest-floor text-birch">{initials}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 p-4 pt-2 flex flex-col gap-3 pb-4">

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

          {/* Compact Daily Quote - Inline banner style */}
          {dailyQuote && (
            <div className="shrink-0 bg-gradient-to-r from-deep-pine via-forest-floor/20 to-deep-pine rounded-xl px-4 py-3 shadow-sm border border-forest-floor/30">
              <div className="flex items-start gap-2">
                <Quote className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                <p className="text-xs text-birch/80 italic leading-relaxed line-clamp-2" data-testid="daily-quote">
                  "{dailyQuote.quote}" {dailyQuote.author && <span className="text-sage/70 not-italic">— {dailyQuote.author}</span>}
                </p>
              </div>
            </div>
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

          {/* Quick Stats Summary */}
          {dashboardStats && (
            <Link href="/stats">
              <div className="shrink-0 grid grid-cols-4 gap-2" data-testid="dashboard-summary">
                <div className="bg-gradient-to-br from-deep-pine to-forest-floor/30 rounded-xl p-2.5 text-center shadow-sm border border-forest-floor/30">
                  <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-forest-floor/30 flex items-center justify-center">
                    <Smile className="w-4 h-4 text-sage" />
                  </div>
                  <p className="text-lg font-bold text-birch" data-testid="stat-mood-checkins">{dashboardStats.totalMoodCheckins}</p>
                  <p className="text-[9px] text-sage/70 font-medium">Ground</p>
                </div>
                <div className="bg-gradient-to-br from-deep-pine to-forest-floor/30 rounded-xl p-2.5 text-center shadow-sm border border-forest-floor/30">
                  <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-forest-floor/30 flex items-center justify-center">
                    <BookHeart className="w-4 h-4 text-sage" />
                  </div>
                  <p className="text-lg font-bold text-birch" data-testid="stat-journal-entries">{dashboardStats.totalJournalEntries}</p>
                  <p className="text-[9px] text-sage/70 font-medium">Reflect</p>
                </div>
                <div className="bg-gradient-to-br from-deep-pine to-forest-floor/30 rounded-xl p-2.5 text-center shadow-sm border border-forest-floor/30">
                  <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-forest-floor/30 flex items-center justify-center">
                    <Target className="w-4 h-4 text-sage" />
                  </div>
                  <p className="text-lg font-bold text-birch" data-testid="stat-habits-completed">{dashboardStats.totalHabitsCompleted}</p>
                  <p className="text-[9px] text-sage/70 font-medium">Anchors</p>
                </div>
                <div className="bg-gradient-to-br from-deep-pine to-forest-floor/30 rounded-xl p-2.5 text-center shadow-sm border border-forest-floor/30">
                  <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-forest-floor/30 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-birch" />
                  </div>
                  <p className="text-lg font-bold text-birch" data-testid="stat-current-streak">{dashboardStats.currentStreak}</p>
                  <p className="text-[9px] text-sage/70 font-medium">Streak</p>
                </div>
              </div>
            </Link>
          )}

          {/* Row 1: Daily Ground Check */}
          {showGroundCheck && (
          <div className="shrink-0">
            <Card className="border-none shadow-lg bg-deep-pine/95 backdrop-blur-md overflow-hidden">
              <CardContent className="p-3 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sage/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm text-sage">How are you grounded today?</h2>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-birch to-birch/70 flex items-center justify-center shadow-sm">
                    <Sun className="h-3.5 w-3.5 text-night-forest" />
                  </div>
                </div>
                <div className="flex justify-between gap-1.5" role="group" aria-label="Select how grounded you feel">
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
                      className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all flex-1 h-16 ${
                        selectedMood === mood.label
                          ? `${mood.activeBg} ring-2 ${mood.ring} scale-105 shadow-md`
                          : `${mood.bg} hover:scale-102 hover:shadow-sm`
                      }`}
                    >
                      <mood.icon className={`w-6 h-6 mb-1 ${mood.color} ${selectedMood === mood.label ? 'animate-bounce' : ''}`} aria-hidden="true" style={{ animationDuration: '1s', animationIterationCount: selectedMood === mood.label ? 1 : 0 }} />
                      <span className={`text-[9px] font-semibold ${selectedMood === mood.label ? mood.color : 'text-muted-foreground'}`}>{mood.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* 7-Day Ground History */}
                {moodTrends.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-forest-floor/30">
                    <p className="text-[10px] font-medium text-sage/70 mb-2">Your Week</p>
                    <div className="flex justify-between gap-1" data-testid="mood-trends-container">
                      {moodTrends.slice(-7).map((trend, i) => {
                        const moodStyle = getMoodDisplay(trend.mood);
                        const MoodIcon = moodStyle.icon;
                        return (
                          <div key={i} className="flex flex-col items-center" data-testid={`mood-trend-${i}`}>
                            <div className={`w-7 h-7 rounded-full ${moodStyle.bg} flex items-center justify-center mb-0.5`}>
                              <MoodIcon className={`w-4 h-4 ${moodStyle.color}`} />
                            </div>
                            <span className="text-[8px] text-sage/60 font-medium">{formatTrendDate(trend.date)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}

          {/* Row 2: Daily Anchors (Fills remaining space) */}
          {showDailyAnchors && (
          <Card className="border-none shadow-lg flex-1 min-h-0 flex flex-col bg-gradient-to-br from-deep-pine to-forest-floor/20 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4 flex-1 min-h-0 flex flex-col relative">
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-tl from-sage/10 to-transparent rounded-full pointer-events-none" />
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-sage">Daily Anchors</h3>
                  {habitStats && habitStats.currentStreak > 0 && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-birch/20 rounded-full" data-testid="habit-streak-badge">
                      <Flame className="w-3 h-3 text-birch" />
                      <span className="text-[10px] font-bold text-birch" data-testid="text-habit-streak">{habitStats.currentStreak}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-16 bg-forest-floor/30 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={habitsWithCompletions.filter(h => h.completed).length}
                    aria-valuemin={0}
                    aria-valuemax={habitsWithCompletions.length}
                    aria-label={`${habitsWithCompletions.filter(h => h.completed).length} of ${habitsWithCompletions.length} anchors completed`}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-sage to-birch rounded-full transition-all duration-500"
                      style={{ width: `${habitsWithCompletions.length > 0 ? (habitsWithCompletions.filter(h => h.completed).length / habitsWithCompletions.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-sage" data-testid="text-habit-count" aria-hidden="true">
                    {habitsWithCompletions.filter(h => h.completed).length}/{habitsWithCompletions.length}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 space-y-2.5 overflow-y-auto no-scrollbar pr-1 relative z-10" role="list" aria-label="Daily anchors">
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
                    aria-label={`${habit.label}, ${habit.completed ? "completed" : "not completed"}. Press Enter to toggle.`}
                    className={`flex items-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      habit.completed
                        ? "bg-sage/10 border-sage/30 shadow-sm"
                        : "bg-night-forest/50 border-forest-floor/50 hover:border-sage/40 hover:shadow-md"
                    }`}
                  >
                    <div className={`mr-3 transition-all ${habit.completed ? "text-sage scale-110" : "text-forest-floor"}`}>
                      {habit.completed ? (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sage to-forest-floor flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-night-forest" data-testid={`icon-habit-completed-${habit.id}`} />
                        </div>
                      ) : (
                        <Circle className="w-6 h-6" data-testid={`icon-habit-incomplete-${habit.id}`} />
                      )}
                    </div>
                    <span className={`flex-1 text-sm font-medium ${habit.completed ? "text-sage/80 line-through" : "text-birch"}`} data-testid={`text-habit-label-${habit.id}`}>
                      {habit.label}
                    </span>
                    {habit.completed && (
                      <span className="text-[10px] font-bold text-birch">✓</span>
                    )}
                  </div>
                ))}
                
                {/* Add Anchor Button */}
                <button
                  onClick={() => setShowAddHabit(true)}
                  className="w-full py-3 text-xs font-medium text-sage/60 border-2 border-dashed border-sage/20 rounded-2xl hover:bg-sage/5 hover:border-sage/40 transition-all"
                  data-testid="button-add-habit"
                  aria-label="Add a new anchor to track"
                >
                  + Add New Anchor
                </button>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      {/* Release Modal */}
      <Dialog open={showCrisis} onOpenChange={setShowCrisis}>
        <DialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl border-none bg-deep-pine">
          <DialogHeader>
            <DialogTitle className="text-birch text-xl">Time to release</DialogTitle>
            <DialogDescription className="text-sage/80">
              This is a safe space. Let it out. Your coach will witness this.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea 
              placeholder="What weight are you carrying?" 
              className="min-h-[100px] bg-night-forest border-forest-floor focus-visible:ring-sage/30 text-birch placeholder:text-sage/50"
              value={ventText}
              onChange={(e) => setVentText(e.target.value)}
              data-testid="input-vent-message"
            />
            <div className="flex justify-center py-4">
              <Button variant="outline" size="lg" className="h-16 w-16 rounded-full border-sage/30 bg-night-forest text-sage hover:bg-forest-floor/30 hover:text-birch shadow-sm" data-testid="button-record-voice">
                <div className="w-4 h-4 rounded-full bg-birch animate-pulse" />
              </Button>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setShowCrisis(false)} className="flex-1 text-sage hover:bg-forest-floor/30 hover:text-birch" data-testid="button-cancel-vent">Cancel</Button>
            <Button className="flex-1 bg-birch hover:bg-birch/80 text-night-forest shadow-md border-none" onClick={handleSendVent} data-testid="button-send-vent">Release to Coach</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
