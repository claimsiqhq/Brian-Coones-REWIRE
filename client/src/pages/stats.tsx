import MobileLayout from "@/components/layout/MobileLayout";
import { useDashboardStats, useMoodTrends, useHabitStats, useAllStreaks } from "@/lib/api";
import { Flame, TrendingUp, BookOpen, CheckCircle2, Smile, Zap, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsPage() {
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: moodTrends, isLoading: trendsLoading } = useMoodTrends(7);
  const { data: habitStats, isLoading: habitStatsLoading } = useHabitStats();
  const { data: allStreaks, isLoading: streaksLoading } = useAllStreaks();

  const getMoodEmoji = (mood: string) => {
    const emojiMap: Record<string, string> = {
      'great': '😄',
      'good': '🙂',
      'okay': '😐',
      'meh': '😕',
      'bad': '😢'
    };
    return emojiMap[mood.toLowerCase()] || '😐';
  };

  return (
    <MobileLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-br from-deep-pine via-deep-pine to-night-forest text-birch px-5 pt-6 pb-5 rounded-b-2xl relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-birch/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <h1 className="text-xl font-bold font-display text-birch">Your Progress</h1>
            <p className="text-sage text-xs mt-0.5">Track your grounding journey</p>
          </div>
        </div>

        <div className="px-4 pt-4 pb-6 space-y-5">
          {/* All Streaks Section */}
          <div className="grid grid-cols-3 gap-3" data-testid="card-streaks">
            {/* Mood Streak */}
            <div className="bg-gradient-to-br from-birch/90 to-birch/70 rounded-xl p-3 shadow-lg">
              <div className="flex flex-col items-center">
                <Smile size={24} className="text-night-forest mb-1" />
                <span className="text-night-forest/80 text-[10px] font-medium">Ground</span>
                <span className="text-2xl font-bold text-night-forest" data-testid="text-mood-streak">
                  {streaksLoading ? "..." : allStreaks?.moodStreak?.current || 0}
                </span>
                <span className="text-night-forest/70 text-[10px]">day streak</span>
                <span className="text-night-forest/60 text-[9px] mt-1">
                  Best: {allStreaks?.moodStreak?.longest || 0}
                </span>
              </div>
            </div>
            
            {/* Journal Streak */}
            <div className="bg-gradient-to-br from-sage to-forest-floor rounded-xl p-3 shadow-lg">
              <div className="flex flex-col items-center">
                <BookOpen size={24} className="text-birch mb-1" />
                <span className="text-birch/80 text-[10px] font-medium">Reflect</span>
                <span className="text-2xl font-bold text-birch" data-testid="text-journal-streak">
                  {streaksLoading ? "..." : allStreaks?.journalStreak?.current || 0}
                </span>
                <span className="text-birch/70 text-[10px]">day streak</span>
                <span className="text-birch/60 text-[9px] mt-1">
                  Best: {allStreaks?.journalStreak?.longest || 0}
                </span>
              </div>
            </div>
            
            {/* Habit Streak */}
            <div className="bg-gradient-to-br from-forest-floor to-deep-pine rounded-xl p-3 shadow-lg border border-forest-floor/50">
              <div className="flex flex-col items-center">
                <Flame size={24} className="text-birch mb-1" />
                <span className="text-birch/80 text-[10px] font-medium">Anchors</span>
                <span className="text-2xl font-bold text-birch" data-testid="text-habit-streak">
                  {streaksLoading ? "..." : allStreaks?.habitStreak?.current || 0}
                </span>
                <span className="text-birch/70 text-[10px]">day streak</span>
                <span className="text-birch/60 text-[9px] mt-1">
                  Best: {allStreaks?.habitStreak?.longest || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-deep-pine rounded-xl p-4 shadow-sm border border-forest-floor/40" data-testid="stat-moods">
              <div className="flex items-center gap-2 text-birch mb-2">
                <Smile size={18} />
                <span className="text-xs font-medium text-sage">Ground Check-ins</span>
              </div>
              <p className="text-2xl font-bold text-birch" data-testid="text-mood-count">
                {statsLoading ? "..." : dashboardStats?.totalMoodCheckins || 0}
              </p>
            </div>
            
            <div className="bg-deep-pine rounded-xl p-4 shadow-sm border border-forest-floor/40" data-testid="stat-journal">
              <div className="flex items-center gap-2 text-sage mb-2">
                <BookOpen size={18} />
                <span className="text-xs font-medium text-sage">Reflections</span>
              </div>
              <p className="text-2xl font-bold text-birch" data-testid="text-journal-count">
                {statsLoading ? "..." : dashboardStats?.totalJournalEntries || 0}
              </p>
            </div>
            
            <div className="bg-deep-pine rounded-xl p-4 shadow-sm border border-forest-floor/40" data-testid="stat-habits">
              <div className="flex items-center gap-2 text-sage mb-2">
                <CheckCircle2 size={18} />
                <span className="text-xs font-medium text-sage">Anchors Completed</span>
              </div>
              <p className="text-2xl font-bold text-birch" data-testid="text-habits-count">
                {statsLoading ? "..." : dashboardStats?.totalHabitsCompleted || 0}
              </p>
            </div>
            
            <div className="bg-deep-pine rounded-xl p-4 shadow-sm border border-forest-floor/40" data-testid="stat-today">
              <div className="flex items-center gap-2 text-birch mb-2">
                <Zap size={18} />
                <span className="text-xs font-medium text-sage">Today's Progress</span>
              </div>
              <p className="text-2xl font-bold text-birch" data-testid="text-today-progress">
                {habitStatsLoading ? "..." : `${habitStats?.completedToday || 0}/${habitStats?.totalHabits || 0}`}
              </p>
            </div>
          </div>

          {/* Mood Trends Chart */}
          <div className="bg-deep-pine rounded-xl p-4 shadow-sm border border-forest-floor/40" data-testid="card-mood-trends">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-birch" />
              <h2 className="font-semibold text-birch">Ground Check Trends (7 days)</h2>
            </div>
            
            {trendsLoading ? (
              <div className="h-40 space-y-2">
                <Skeleton className="h-32 w-full" />
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Skeleton key={i} className="h-4 w-8" />
                  ))}
                </div>
              </div>
            ) : moodTrends && moodTrends.length > 0 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodTrends}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                    />
                    <YAxis 
                      domain={[1, 5]} 
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const labels: Record<number, string> = { 1: '😢', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };
                        return labels[value] || '';
                      }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-deep-pine rounded-lg shadow-lg p-2 border border-forest-floor text-sm">
                              <p className="text-sage">
                                {new Date(data.date).toLocaleDateString()}
                              </p>
                              <p className="font-medium text-birch">
                                {getMoodEmoji(data.mood)} {data.mood}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-sage gap-2">
                <Smile size={32} className="opacity-50" />
                <p className="text-sm">Log ground checks to see your trends</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </MobileLayout>
  );
}
