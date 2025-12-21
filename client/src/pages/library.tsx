import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Wind,
  Heart,
  Zap,
  Moon,
  Leaf,
  Brain,
  Clock,
  Star,
  Filter,
  Sparkles,
  Activity,
  Play,
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

function CompactPracticeCard({
  practice,
  isFavorite,
  onToggleFavorite,
  onStart,
}: {
  practice: Practice;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onStart: () => void;
}) {
  return (
    <Card 
      className="overflow-hidden border-forest-floor bg-deep-pine hover:border-sage/50 transition-all cursor-pointer"
      onClick={onStart}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-2.5">
          <div
            className={`w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br ${practice.colorGradient || "from-forest-floor to-deep-pine"} flex items-center justify-center text-white`}
          >
            {typeIcons[practice.type] || <Wind className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-birch text-sm leading-tight truncate">
              {practice.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-sage/70">
                {formatDuration(practice.durationSeconds)}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] h-4 px-1 border-sage/30 text-sage/60"
              >
                {categoryLabels[practice.category]}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${isFavorite ? "text-birch" : "text-sage/40 hover:text-birch"}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-birch" : ""}`} />
          </Button>
          <Play className="w-4 h-4 text-birch/70" />
        </div>
      </CardContent>
    </Card>
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
      <div className="flex flex-col h-full bg-night-forest overflow-hidden">
        {/* Compact Header */}
        <div className="shrink-0 bg-gradient-to-br from-deep-pine via-forest-floor/80 to-night-forest px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-display font-bold text-birch">
              Practice Library
            </h1>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${showFilters ? "bg-birch/20 text-birch" : "text-sage"}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Compact Tabs */}
          <Tabs defaultValue="all" className="mt-3">
            <TabsList className="w-full bg-deep-pine/50 h-8">
              <TabsTrigger value="all" className="flex-1 text-xs h-7">
                All
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1 text-xs h-7">
                <Star className="w-3 h-3 mr-1" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex-1 text-xs h-7">
                <Clock className="w-3 h-3 mr-1" />
                Recent
              </TabsTrigger>
            </TabsList>

            {/* Inline Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2"
              >
                {/* Type Filter */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className={`h-6 text-[10px] px-2 ${activeType === key ? "bg-birch/20 text-birch border-birch/50" : "text-sage border-sage/30"}`}
                      onClick={() => setActiveType(activeType === key ? undefined : key)}
                    >
                      {typeIcons[key]}
                      <span className="ml-1">{label}</span>
                    </Button>
                  ))}
                </div>
                {/* Category Filter */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className={`h-6 text-[10px] px-2 ${activeCategory === key ? "bg-birch/20 text-birch border-birch/50" : "text-sage border-sage/30"}`}
                      onClick={() => setActiveCategory(activeCategory === key ? undefined : key)}
                    >
                      {categoryIcons[key]}
                      <span className="ml-1">{label}</span>
                    </Button>
                  ))}
                </div>
                {/* Duration Filter */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(durationLabels).map(([key, label]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className={`h-6 text-[10px] px-2 ${activeDuration === key ? "bg-birch/20 text-birch border-birch/50" : "text-sage border-sage/30"}`}
                      onClick={() => setActiveDuration(activeDuration === key ? undefined : key)}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {label}
                    </Button>
                  ))}
                  {hasFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2 text-sage hover:text-birch"
                      onClick={clearFilters}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto mt-3" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <TabsContent value="all" className="space-y-2 pb-2 m-0">
                {loadingPractices ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="h-16 bg-deep-pine animate-pulse" />
                    ))}
                  </div>
                ) : practices?.length === 0 ? (
                  <div className="text-center py-8 text-sage/60">
                    <Wind className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No practices found</p>
                  </div>
                ) : (
                  practices?.map((practice) => (
                    <CompactPracticeCard
                      key={practice.id}
                      practice={practice}
                      isFavorite={favoriteIds.has(practice.id)}
                      onToggleFavorite={() => handleToggleFavorite(practice.id)}
                      onStart={() => handleStartPractice(practice)}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="favorites" className="space-y-2 pb-2 m-0">
                {filteredFavorites.length === 0 ? (
                  <div className="text-center py-8 text-sage/60">
                    <Star className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No favorites yet</p>
                  </div>
                ) : (
                  filteredFavorites.map((practice) => (
                    <CompactPracticeCard
                      key={practice.id}
                      practice={practice}
                      isFavorite={true}
                      onToggleFavorite={() => handleToggleFavorite(practice.id)}
                      onStart={() => handleStartPractice(practice)}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-2 pb-2 m-0">
                {recentlyUsed.length === 0 ? (
                  <div className="text-center py-8 text-sage/60">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent practices</p>
                  </div>
                ) : (
                  recentlyUsed.map(
                    (practice) =>
                      practice && (
                        <CompactPracticeCard
                          key={practice.id}
                          practice={practice}
                          isFavorite={favoriteIds.has(practice.id)}
                          onToggleFavorite={() => handleToggleFavorite(practice.id)}
                          onStart={() => handleStartPractice(practice)}
                        />
                      )
                  )
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}
