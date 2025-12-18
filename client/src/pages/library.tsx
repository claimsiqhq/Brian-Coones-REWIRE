import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Wind,
  Heart,
  Zap,
  Moon,
  Leaf,
  Brain,
  Flame,
  Clock,
  Star,
  Filter,
  Sparkles,
  Activity,
  Play,
  LayoutGrid,
  List,
  CheckCircle,
} from "lucide-react";
import {
  usePractices,
  useFavorites,
  useToggleFavorite,
  usePracticeHistory,
  usePracticeStats,
  type Practice,
} from "@/lib/api";

const categoryIcons: Record<string, React.ReactNode> = {
  energizing: <Zap className="w-4 h-4" />,
  grounding: <Leaf className="w-4 h-4" />,
  sleep: <Moon className="w-4 h-4" />,
  focus: <Brain className="w-4 h-4" />,
  stress_relief: <Heart className="w-4 h-4" />,
};

const categoryLabels: Record<string, string> = {
  energizing: "Energizing",
  grounding: "Grounding",
  sleep: "Sleep",
  focus: "Focus",
  stress_relief: "Stress Relief",
};

const typeIcons: Record<string, React.ReactNode> = {
  breathing: <Wind className="w-4 h-4" />,
  meditation: <Sparkles className="w-4 h-4" />,
  body_scan: <Activity className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  breathing: "Breathing",
  meditation: "Meditation",
  body_scan: "Body Scan",
};

const durationLabels: Record<string, string> = {
  short: "1-3 min",
  medium: "5-10 min",
  long: "15+ min",
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) {
    return `${seconds}s`;
  }
  return `${minutes} min`;
}

function PracticeCard({
  practice,
  isFavorite,
  onToggleFavorite,
  sessionCount,
  onStart,
}: {
  practice: Practice;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  sessionCount: number;
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-forest-floor bg-deep-pine hover:border-sage/50 transition-all">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            <div
              className={`w-20 flex-shrink-0 bg-gradient-to-br ${practice.colorGradient || "from-forest-floor to-deep-pine"} flex flex-col items-center justify-center p-3 text-white`}
            >
              {typeIcons[practice.type] || <Wind className="w-6 h-6" />}
              <span className="text-xs mt-1 opacity-80">
                {formatDuration(practice.durationSeconds)}
              </span>
            </div>
            <div className="flex-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-birch text-sm leading-tight">
                    {practice.name}
                  </h3>
                  {practice.subtitle && (
                    <p className="text-xs text-sage mt-0.5">{practice.subtitle}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${isFavorite ? "text-birch" : "text-sage/50 hover:text-birch"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                >
                  <Star className={`w-4 h-4 ${isFavorite ? "fill-birch" : ""}`} />
                </Button>
              </div>
              <p className="text-xs text-sage/70 mt-1 line-clamp-2">
                {practice.description}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-1.5 border-sage/30 text-sage/80"
                  >
                    {categoryIcons[practice.category]}
                    <span className="ml-1">{categoryLabels[practice.category]}</span>
                  </Badge>
                  {sessionCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 px-1.5 border-sage/30 text-sage/80"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {sessionCount}x
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs bg-birch/20 hover:bg-birch/30 text-birch"
                  onClick={onStart}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Start
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Library() {
  const [, setLocation] = useLocation();
  const [activeType, setActiveType] = useState<string | undefined>(undefined);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [activeDuration, setActiveDuration] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showFilters, setShowFilters] = useState(false);

  const { data: practices, isLoading: loadingPractices } = usePractices({
    type: activeType,
    category: activeCategory,
    durationCategory: activeDuration,
  });
  const { data: favorites } = useFavorites();
  const { data: history } = usePracticeHistory(100);
  const { data: stats } = usePracticeStats();
  const toggleFavorite = useToggleFavorite();

  const favoriteIds = new Set(favorites?.map((f) => f.practiceId) || []);
  const sessionCounts = new Map(stats?.map((s) => [s.practiceId, s.count]) || []);

  const handleStartPractice = (practice: Practice) => {
    setLocation(`/focus?practiceId=${practice.id}`);
  };

  const handleToggleFavorite = (practiceId: string) => {
    toggleFavorite.mutate(practiceId);
  };

  const filteredFavorites = practices?.filter((p) => favoriteIds.has(p.id)) || [];
  const recentlyUsed =
    history
      ?.slice(0, 5)
      .map((h) => practices?.find((p) => p.id === h.practiceId))
      .filter(Boolean) || [];

  const clearFilters = () => {
    setActiveType(undefined);
    setActiveCategory(undefined);
    setActiveDuration(undefined);
  };

  const hasFilters = activeType || activeCategory || activeDuration;

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-night-forest">
        {/* Header */}
        <div className="bg-gradient-to-br from-deep-pine via-forest-floor/80 to-night-forest px-6 pt-6 pb-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-birch">
                Practice Library
              </h1>
              <p className="text-sage/80 mt-1">
                Breathing, meditation & body scans
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${showFilters ? "bg-birch/20 text-birch" : "text-sage"}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-sage"
                onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              >
                {viewMode === "list" ? (
                  <LayoutGrid className="w-4 h-4" />
                ) : (
                  <List className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              {/* Type Filter */}
              <div>
                <p className="text-xs text-sage/60 mb-2">Type</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className={`h-7 text-xs ${activeType === key ? "bg-birch/20 text-birch border-birch/50" : "text-sage border-sage/30"}`}
                      onClick={() =>
                        setActiveType(activeType === key ? undefined : key)
                      }
                    >
                      {typeIcons[key]}
                      <span className="ml-1.5">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <p className="text-xs text-sage/60 mb-2">Goal</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className={`h-7 text-xs ${activeCategory === key ? "bg-birch/20 text-birch border-birch/50" : "text-sage border-sage/30"}`}
                      onClick={() =>
                        setActiveCategory(activeCategory === key ? undefined : key)
                      }
                    >
                      {categoryIcons[key]}
                      <span className="ml-1.5">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Duration Filter */}
              <div>
                <p className="text-xs text-sage/60 mb-2">Duration</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(durationLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className={`h-7 text-xs ${activeDuration === key ? "bg-birch/20 text-birch border-birch/50" : "text-sage border-sage/30"}`}
                      onClick={() =>
                        setActiveDuration(activeDuration === key ? undefined : key)
                      }
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-sage hover:text-birch"
                  onClick={clearFilters}
                >
                  Clear all filters
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <Tabs defaultValue="all" className="px-4 pt-4">
            <TabsList className="w-full bg-deep-pine/50 mb-4">
              <TabsTrigger value="all" className="flex-1 text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1 text-xs">
                <Star className="w-3 h-3 mr-1" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex-1 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Recent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 pb-6">
              {loadingPractices ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-24 bg-deep-pine animate-pulse" />
                  ))}
                </div>
              ) : practices?.length === 0 ? (
                <div className="text-center py-12 text-sage/60">
                  <Wind className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No practices found</p>
                  {hasFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-birch"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                practices?.map((practice) => (
                  <PracticeCard
                    key={practice.id}
                    practice={practice}
                    isFavorite={favoriteIds.has(practice.id)}
                    onToggleFavorite={() => handleToggleFavorite(practice.id)}
                    sessionCount={sessionCounts.get(practice.id) || 0}
                    onStart={() => handleStartPractice(practice)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="favorites" className="space-y-3 pb-6">
              {filteredFavorites.length === 0 ? (
                <div className="text-center py-12 text-sage/60">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No favorites yet</p>
                  <p className="text-xs mt-1">
                    Tap the star on any practice to add it
                  </p>
                </div>
              ) : (
                filteredFavorites.map((practice) => (
                  <PracticeCard
                    key={practice.id}
                    practice={practice}
                    isFavorite={true}
                    onToggleFavorite={() => handleToggleFavorite(practice.id)}
                    sessionCount={sessionCounts.get(practice.id) || 0}
                    onStart={() => handleStartPractice(practice)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="recent" className="space-y-3 pb-6">
              {recentlyUsed.length === 0 ? (
                <div className="text-center py-12 text-sage/60">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent practices</p>
                  <p className="text-xs mt-1">
                    Your practice history will appear here
                  </p>
                </div>
              ) : (
                recentlyUsed.map(
                  (practice) =>
                    practice && (
                      <PracticeCard
                        key={practice.id}
                        practice={practice}
                        isFavorite={favoriteIds.has(practice.id)}
                        onToggleFavorite={() => handleToggleFavorite(practice.id)}
                        sessionCount={sessionCounts.get(practice.id) || 0}
                        onStart={() => handleStartPractice(practice)}
                      />
                    )
                )
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </div>
    </MobileLayout>
  );
}
