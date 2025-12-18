import { useState } from "react";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  Zap,
  Brain,
  Moon,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Calendar,
  ChevronRight,
  Heart,
  Activity,
  Sparkles,
  Check,
  Target,
} from "lucide-react";
import {
  useTodayMetrics,
  useSaveMetrics,
  useWeeklyMetrics,
  useCurrentScorecard,
  useScorecardHistory,
  useMilestones,
  useGamification,
  type DailyMetrics,
  type WeeklyScorecard,
  type UserMilestone,
} from "@/lib/api";

// Score labels
const scoreLabels: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😫", label: "Very Low" },
  2: { emoji: "😔", label: "Low" },
  3: { emoji: "😐", label: "Okay" },
  4: { emoji: "🙂", label: "Good" },
  5: { emoji: "😊", label: "Great" },
};

function ScoreSlider({
  label,
  icon,
  value,
  onChange,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
          <span className="text-sm font-medium text-birch">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{scoreLabels[value]?.emoji}</span>
          <span className="text-xs text-sage/60 w-16">
            {scoreLabels[value]?.label}
          </span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={5}
        step={1}
        className="py-2"
      />
    </div>
  );
}

function SleepInput({
  hours,
  quality,
  onHoursChange,
  onQualityChange,
}: {
  hours: number;
  quality: number;
  onHoursChange: (h: number) => void;
  onQualityChange: (q: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20">
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-birch">Sleep Hours</span>
          </div>
          <span className="text-lg font-bold text-birch">{hours}h</span>
        </div>
        <Slider
          value={[hours]}
          onValueChange={([v]) => onHoursChange(v)}
          min={0}
          max={12}
          step={0.5}
          className="py-2"
        />
      </div>
      <ScoreSlider
        label="Sleep Quality"
        icon={<Sparkles className="w-4 h-4 text-indigo-400" />}
        value={quality}
        onChange={onQualityChange}
        color="bg-indigo-500/20"
      />
    </div>
  );
}

function MetricTrend({
  current,
  previous,
  label,
}: {
  current: number | null;
  previous: number | null;
  label: string;
}) {
  if (current === null) return null;

  const diff = previous !== null ? current - previous : 0;
  const trend = diff > 0.2 ? "up" : diff < -0.2 ? "down" : "stable";

  return (
    <div className="flex items-center gap-1">
      {trend === "up" && <TrendingUp className="w-3 h-3 text-green-400" />}
      {trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
      {trend === "stable" && <Minus className="w-3 h-3 text-sage/60" />}
      <span className="text-[10px] text-sage/60">vs last week</span>
    </div>
  );
}

function ScorecardCard({ scorecard }: { scorecard: WeeklyScorecard }) {
  const metrics = [
    { label: "Mood", value: scorecard.avgMood, icon: <Smile className="w-4 h-4" />, color: "text-yellow-400" },
    { label: "Energy", value: scorecard.avgEnergy, icon: <Zap className="w-4 h-4" />, color: "text-orange-400" },
    { label: "Stress", value: scorecard.avgStress, icon: <Brain className="w-4 h-4" />, color: "text-red-400", invert: true },
    { label: "Sleep", value: scorecard.avgSleepHours, icon: <Moon className="w-4 h-4" />, color: "text-indigo-400", suffix: "h" },
  ];

  return (
    <Card className="border-forest-floor bg-deep-pine">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sage" />
            <span className="text-sm font-medium text-birch">
              Week of {new Date(scorecard.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] border-sage/30 text-sage/80">
            {scorecard.totalHabitsCompleted} habits
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <div className={`${metric.color} mb-1`}>{metric.icon}</div>
              <p className="text-lg font-bold text-birch">
                {metric.value !== null ? metric.value.toFixed(1) : "-"}
                {metric.suffix || ""}
              </p>
              <p className="text-[10px] text-sage/60">{metric.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MilestoneCard({ milestone }: { milestone: UserMilestone }) {
  return (
    <Card className="border-forest-floor bg-deep-pine">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-birch/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-birch" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-birch">{milestone.title}</h4>
            {milestone.description && (
              <p className="text-xs text-sage/60">{milestone.description}</p>
            )}
          </div>
          {milestone.achievedAt && (
            <span className="text-[10px] text-sage/50">
              {new Date(milestone.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Metrics() {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [notes, setNotes] = useState("");

  const { data: todayMetrics } = useTodayMetrics();
  const { data: weeklyAvg } = useWeeklyMetrics();
  const { data: currentScorecard } = useCurrentScorecard();
  const { data: scorecardHistory } = useScorecardHistory(8);
  const { data: milestones } = useMilestones();
  const { data: gamification } = useGamification();
  const saveMetrics = useSaveMetrics();

  const hasLoggedToday = !!todayMetrics;

  const handleLogMetrics = () => {
    if (todayMetrics) {
      setMood(todayMetrics.moodScore || 3);
      setEnergy(todayMetrics.energyScore || 3);
      setStress(todayMetrics.stressScore || 3);
      setSleepHours(todayMetrics.sleepHours || 7);
      setSleepQuality(todayMetrics.sleepQuality || 3);
      setNotes(todayMetrics.notes || "");
    }
    setShowLogDialog(true);
  };

  const handleSaveMetrics = () => {
    saveMetrics.mutate({
      moodScore: mood,
      energyScore: energy,
      stressScore: stress,
      sleepHours: sleepHours,
      sleepQuality: sleepQuality,
      notes: notes || undefined,
    });
    setShowLogDialog(false);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-night-forest">
        {/* Header */}
        <div className="bg-gradient-to-br from-deep-pine via-forest-floor/80 to-night-forest px-6 pt-6 pb-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-birch">
                Mindful Metrics
              </h1>
              <p className="text-sage/80 mt-1">Track your wellbeing</p>
            </div>
            {gamification && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-birch/20 rounded-full">
                <Target className="w-4 h-4 text-birch" />
                <span className="text-xs font-bold text-birch">
                  Lv.{gamification.currentLevel}
                </span>
              </div>
            )}
          </div>

          {/* Today's Quick Stats */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            <div
              className={`rounded-lg p-2 text-center ${hasLoggedToday ? "bg-green-500/10" : "bg-sage/10"}`}
            >
              <Smile
                className={`w-5 h-5 mx-auto ${hasLoggedToday ? "text-yellow-400" : "text-sage/40"}`}
              />
              <p className="text-lg font-bold text-birch mt-1">
                {todayMetrics?.moodScore || "-"}
              </p>
              <p className="text-[10px] text-sage/60">Mood</p>
            </div>
            <div
              className={`rounded-lg p-2 text-center ${hasLoggedToday ? "bg-green-500/10" : "bg-sage/10"}`}
            >
              <Zap
                className={`w-5 h-5 mx-auto ${hasLoggedToday ? "text-orange-400" : "text-sage/40"}`}
              />
              <p className="text-lg font-bold text-birch mt-1">
                {todayMetrics?.energyScore || "-"}
              </p>
              <p className="text-[10px] text-sage/60">Energy</p>
            </div>
            <div
              className={`rounded-lg p-2 text-center ${hasLoggedToday ? "bg-green-500/10" : "bg-sage/10"}`}
            >
              <Brain
                className={`w-5 h-5 mx-auto ${hasLoggedToday ? "text-red-400" : "text-sage/40"}`}
              />
              <p className="text-lg font-bold text-birch mt-1">
                {todayMetrics?.stressScore || "-"}
              </p>
              <p className="text-[10px] text-sage/60">Stress</p>
            </div>
            <div
              className={`rounded-lg p-2 text-center ${hasLoggedToday ? "bg-green-500/10" : "bg-sage/10"}`}
            >
              <Moon
                className={`w-5 h-5 mx-auto ${hasLoggedToday ? "text-indigo-400" : "text-sage/40"}`}
              />
              <p className="text-lg font-bold text-birch mt-1">
                {todayMetrics?.sleepHours ? `${todayMetrics.sleepHours}h` : "-"}
              </p>
              <p className="text-[10px] text-sage/60">Sleep</p>
            </div>
          </div>

          {/* Log Today Button */}
          <Button
            className={`w-full mt-4 ${hasLoggedToday ? "bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30" : "bg-birch hover:bg-birch/90 text-deep-pine"}`}
            onClick={handleLogMetrics}
          >
            {hasLoggedToday ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Update Today's Log
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Log Today's Metrics
              </>
            )}
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <Tabs defaultValue="overview" className="px-4 pt-4">
            <TabsList className="w-full bg-deep-pine/50 mb-4">
              <TabsTrigger value="overview" className="flex-1 text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                History
              </TabsTrigger>
              <TabsTrigger value="milestones" className="flex-1 text-xs">
                <Trophy className="w-3 h-3 mr-1" />
                Milestones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pb-6">
              {/* Weekly Average */}
              {weeklyAvg && (
                <Card className="border-forest-floor bg-deep-pine">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-birch flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      This Week's Average
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-birch/10 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smile className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs text-sage/70">Mood</span>
                          </div>
                          <span className="text-lg font-bold text-birch">
                            {weeklyAvg.avgMood?.toFixed(1) || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-birch/10 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-400" />
                            <span className="text-xs text-sage/70">Energy</span>
                          </div>
                          <span className="text-lg font-bold text-birch">
                            {weeklyAvg.avgEnergy?.toFixed(1) || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-birch/10 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-red-400" />
                            <span className="text-xs text-sage/70">Stress</span>
                          </div>
                          <span className="text-lg font-bold text-birch">
                            {weeklyAvg.avgStress?.toFixed(1) || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-birch/10 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs text-sage/70">Sleep</span>
                          </div>
                          <span className="text-lg font-bold text-birch">
                            {weeklyAvg.avgSleepHours?.toFixed(1) || "-"}h
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Current Scorecard */}
              {currentScorecard && (
                <div>
                  <h3 className="text-sm font-medium text-birch mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Weekly Scorecard
                  </h3>
                  <ScorecardCard scorecard={currentScorecard} />
                </div>
              )}

              {/* Quick Insights */}
              <Card className="border-forest-floor bg-deep-pine">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-birch flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {weeklyAvg?.avgMood && weeklyAvg.avgMood >= 4 && (
                      <div className="flex items-center gap-2 text-xs">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-sage/80">
                          Your mood has been great this week!
                        </span>
                      </div>
                    )}
                    {weeklyAvg?.avgSleepHours && weeklyAvg.avgSleepHours < 7 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Moon className="w-3 h-3 text-indigo-400" />
                        <span className="text-sage/80">
                          Consider getting more sleep (aim for 7-8h)
                        </span>
                      </div>
                    )}
                    {weeklyAvg?.avgStress && weeklyAvg.avgStress >= 4 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Brain className="w-3 h-3 text-red-400" />
                        <span className="text-sage/80">
                          Stress is elevated - try a breathing exercise
                        </span>
                      </div>
                    )}
                    {!weeklyAvg && (
                      <p className="text-xs text-sage/60">
                        Log your metrics daily to see insights here
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-3 pb-6">
              {scorecardHistory?.length === 0 ? (
                <div className="text-center py-12 text-sage/60">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No history yet</p>
                  <p className="text-xs mt-1">
                    Weekly scorecards will appear here
                  </p>
                </div>
              ) : (
                scorecardHistory?.map((scorecard) => (
                  <ScorecardCard key={scorecard.id} scorecard={scorecard} />
                ))
              )}
            </TabsContent>

            <TabsContent value="milestones" className="space-y-3 pb-6">
              {milestones?.length === 0 ? (
                <div className="text-center py-12 text-sage/60">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No milestones yet</p>
                  <p className="text-xs mt-1">
                    Keep tracking to earn milestones
                  </p>
                </div>
              ) : (
                milestones?.map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Log Metrics Dialog */}
        <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
          <DialogContent className="bg-deep-pine border-forest-floor max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-birch flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {hasLoggedToday ? "Update Today's Metrics" : "Log Today's Metrics"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <ScoreSlider
                label="Mood"
                icon={<Smile className="w-4 h-4 text-yellow-400" />}
                value={mood}
                onChange={setMood}
                color="bg-yellow-500/20"
              />
              <ScoreSlider
                label="Energy"
                icon={<Zap className="w-4 h-4 text-orange-400" />}
                value={energy}
                onChange={setEnergy}
                color="bg-orange-500/20"
              />
              <ScoreSlider
                label="Stress"
                icon={<Brain className="w-4 h-4 text-red-400" />}
                value={stress}
                onChange={setStress}
                color="bg-red-500/20"
              />
              <div className="border-t border-forest-floor pt-4">
                <SleepInput
                  hours={sleepHours}
                  quality={sleepQuality}
                  onHoursChange={setSleepHours}
                  onQualityChange={setSleepQuality}
                />
              </div>
              <div className="border-t border-forest-floor pt-4">
                <label className="text-sm text-sage mb-2 block">
                  Notes (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling today?"
                  className="bg-night-forest border-forest-floor text-birch placeholder:text-sage/40"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowLogDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-birch hover:bg-birch/90 text-deep-pine"
                  onClick={handleSaveMetrics}
                  disabled={saveMetrics.isPending}
                >
                  {saveMetrics.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}
