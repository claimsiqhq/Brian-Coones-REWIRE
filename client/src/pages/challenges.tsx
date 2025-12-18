import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Trophy,
  Users,
  Flame,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Medal,
  Star,
  Zap,
  Award,
  Sparkles,
} from "lucide-react";
import {
  useChallenges,
  useMyChallenge,
  useJoinChallenge,
  useLeaveChallenge,
  useChallengeCheckin,
  useChallengeLeaderboard,
  useGamification,
  type Challenge,
  type ChallengeParticipant,
} from "@/lib/api";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getDaysRemaining(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getProgressPercentage(
  startDate: string,
  endDate: string
): number {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function ChallengeCard({
  challenge,
  participation,
  onJoin,
  onLeave,
  onCheckin,
  onViewDetails,
}: {
  challenge: Challenge;
  participation?: ChallengeParticipant;
  onJoin?: () => void;
  onLeave?: () => void;
  onCheckin?: () => void;
  onViewDetails: () => void;
}) {
  const isActive = participation?.status === "active";
  const daysRemaining = getDaysRemaining(challenge.endDate);
  const progress = getProgressPercentage(challenge.startDate, challenge.endDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-forest-floor bg-deep-pine">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-birch/30 to-sage/20 flex items-center justify-center text-birch flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-birch text-sm truncate">
                    {challenge.title}
                  </h3>
                  <p className="text-xs text-sage/70 mt-0.5 line-clamp-1">
                    {challenge.description}
                  </p>
                </div>
                {isActive && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                    Active
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-sage/60">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {challenge.durationDays} days
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysRemaining}d left
                </span>
                {challenge.category && (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 px-1.5 border-sage/30"
                  >
                    {challenge.category}
                  </Badge>
                )}
              </div>

              {isActive && participation && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sage/70">Progress</span>
                    <span className="text-birch font-medium">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-orange-400">
                      <Flame className="w-3 h-3" />
                      <span className="text-xs font-medium">
                        {participation.currentStreak} day streak
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sage/60">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="text-xs">
                        {participation.totalCompletions} completed
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                {isActive ? (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs bg-birch/20 hover:bg-birch/30 text-birch"
                      onClick={onCheckin}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Check In Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-sage"
                      onClick={onViewDetails}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs bg-birch hover:bg-birch/90 text-deep-pine"
                      onClick={onJoin}
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Join Challenge
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-sage"
                      onClick={onViewDetails}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LeaderboardEntry({
  rank,
  name,
  streak,
  completions,
  isCurrentUser,
}: {
  rank: number;
  name: string;
  streak: number;
  completions: number;
  isCurrentUser: boolean;
}) {
  const getRankIcon = () => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <span className="w-5 text-center text-sage/60">{rank}</span>;
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg ${
        isCurrentUser ? "bg-birch/10 border border-birch/30" : "bg-deep-pine"
      }`}
    >
      <div className="flex items-center justify-center w-8">
        {getRankIcon()}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${isCurrentUser ? "text-birch" : "text-sage"}`}>
          {name}
          {isCurrentUser && (
            <span className="ml-1 text-xs text-birch/60">(You)</span>
          )}
        </p>
        <div className="flex items-center gap-2 text-xs text-sage/60">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" />
            {streak} streak
          </span>
          <span>{completions} days</span>
        </div>
      </div>
      {rank <= 3 && (
        <Sparkles className="w-4 h-4 text-birch/50" />
      )}
    </div>
  );
}

export default function Challenges() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showCheckinDialog, setShowCheckinDialog] = useState(false);
  const [checkinNotes, setCheckinNotes] = useState("");
  const [checkinParticipant, setCheckinParticipant] = useState<ChallengeParticipant | null>(null);

  const { data: allChallenges, isLoading } = useChallenges({ active: true });
  const { data: myChallenges } = useMyChallenge();
  const { data: gamification } = useGamification();
  const { data: leaderboard } = useChallengeLeaderboard(selectedChallenge?.id || "");

  const joinChallenge = useJoinChallenge();
  const leaveChallenge = useLeaveChallenge();
  const challengeCheckin = useChallengeCheckin();

  const myParticipationMap = new Map(
    myChallenges?.map((p) => [p.challengeId, p]) || []
  );

  const activeChallenges = myChallenges?.filter((p) => p.status === "active") || [];

  const handleJoin = (challengeId: string) => {
    joinChallenge.mutate(challengeId);
  };

  const handleCheckinStart = (challenge: Challenge, participant: ChallengeParticipant) => {
    setSelectedChallenge(challenge);
    setCheckinParticipant(participant);
    setCheckinNotes("");
    setShowCheckinDialog(true);
  };

  const handleCheckinSubmit = () => {
    if (!selectedChallenge || !checkinParticipant) return;

    challengeCheckin.mutate({
      challengeId: selectedChallenge.id,
      participantId: checkinParticipant.id,
      completed: true,
      notes: checkinNotes || undefined,
    });
    setShowCheckinDialog(false);
    setSelectedChallenge(null);
    setCheckinParticipant(null);
  };

  const handleViewDetails = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-night-forest">
        {/* Header */}
        <div className="bg-gradient-to-br from-deep-pine via-forest-floor/80 to-night-forest px-6 pt-6 pb-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-birch">
                Challenges
              </h1>
              <p className="text-sage/80 mt-1">Build habits together</p>
            </div>
            {gamification && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-birch/20 rounded-full">
                <Award className="w-4 h-4 text-birch" />
                <span className="text-xs font-bold text-birch">
                  Lv.{gamification.currentLevel}
                </span>
              </div>
            )}
          </div>

          {/* Active Challenges Summary */}
          {activeChallenges.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-birch/10 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-birch">
                  <Target className="w-4 h-4" />
                  <span className="text-lg font-bold">
                    {activeChallenges.length}
                  </span>
                </div>
                <p className="text-[10px] text-sage/60">Active</p>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="text-lg font-bold">
                    {Math.max(...activeChallenges.map((c) => c.currentStreak), 0)}
                  </span>
                </div>
                <p className="text-[10px] text-sage/60">Best Streak</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-lg font-bold">
                    {activeChallenges.reduce((sum, c) => sum + c.totalCompletions, 0)}
                  </span>
                </div>
                <p className="text-[10px] text-sage/60">Completions</p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <Tabs defaultValue={activeChallenges.length > 0 ? "my" : "discover"} className="px-4 pt-4">
            <TabsList className="w-full bg-deep-pine/50 mb-4">
              <TabsTrigger value="my" className="flex-1 text-xs">
                <Target className="w-3 h-3 mr-1" />
                My Challenges
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex-1 text-xs">
                <Users className="w-3 h-3 mr-1" />
                Discover
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my" className="space-y-3 pb-6">
              {activeChallenges.length === 0 ? (
                <div className="text-center py-12 text-sage/60">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active challenges</p>
                  <p className="text-xs mt-1">
                    Join a challenge to start building habits
                  </p>
                </div>
              ) : (
                activeChallenges.map((participation) => (
                  <ChallengeCard
                    key={participation.id}
                    challenge={participation.challenge}
                    participation={participation}
                    onCheckin={() =>
                      handleCheckinStart(participation.challenge, participation)
                    }
                    onViewDetails={() => handleViewDetails(participation.challenge)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="discover" className="space-y-3 pb-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-32 bg-deep-pine animate-pulse" />
                  ))}
                </div>
              ) : allChallenges?.length === 0 ? (
                <div className="text-center py-12 text-sage/60">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No challenges available</p>
                  <p className="text-xs mt-1">Check back soon!</p>
                </div>
              ) : (
                allChallenges
                  ?.filter((c) => !myParticipationMap.has(c.id))
                  .map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onJoin={() => handleJoin(challenge.id)}
                      onViewDetails={() => handleViewDetails(challenge)}
                    />
                  ))
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Check-in Dialog */}
        <Dialog open={showCheckinDialog} onOpenChange={setShowCheckinDialog}>
          <DialogContent className="bg-deep-pine border-forest-floor">
            <DialogHeader>
              <DialogTitle className="text-birch flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Daily Check-in
              </DialogTitle>
              <DialogDescription className="text-sage/70">
                {selectedChallenge?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-birch/10 rounded-lg p-4 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-birch" />
                <p className="text-birch font-medium">
                  Great work! You're building a lasting habit.
                </p>
                {checkinParticipant && (
                  <p className="text-xs text-sage/60 mt-1">
                    Current streak: {checkinParticipant.currentStreak + 1} days
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-sage mb-2 block">
                  Add notes (optional)
                </label>
                <Textarea
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  placeholder="How did it go today?"
                  className="bg-night-forest border-forest-floor text-birch placeholder:text-sage/40"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCheckinDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleCheckinSubmit}
                  disabled={challengeCheckin.isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {challengeCheckin.isPending ? "Saving..." : "Complete Check-in"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Challenge Details Dialog */}
        <Dialog
          open={!!selectedChallenge && !showCheckinDialog}
          onOpenChange={(open) => !open && setSelectedChallenge(null)}
        >
          <DialogContent className="bg-deep-pine border-forest-floor max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-birch flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {selectedChallenge?.title}
              </DialogTitle>
              <DialogDescription className="text-sage/70">
                {selectedChallenge?.description}
              </DialogDescription>
            </DialogHeader>

            {selectedChallenge && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-birch/10 rounded-lg p-3 text-center">
                    <Calendar className="w-5 h-5 mx-auto text-birch mb-1" />
                    <p className="text-xs text-sage/60">Duration</p>
                    <p className="text-sm font-medium text-birch">
                      {selectedChallenge.durationDays} days
                    </p>
                  </div>
                  <div className="bg-birch/10 rounded-lg p-3 text-center">
                    <Clock className="w-5 h-5 mx-auto text-birch mb-1" />
                    <p className="text-xs text-sage/60">Remaining</p>
                    <p className="text-sm font-medium text-birch">
                      {getDaysRemaining(selectedChallenge.endDate)} days
                    </p>
                  </div>
                </div>

                <div className="bg-forest-floor/50 rounded-lg p-3">
                  <p className="text-xs text-sage/60 mb-1">Daily Habit</p>
                  <p className="text-sm text-birch">{selectedChallenge.habitTemplate}</p>
                </div>

                {/* Leaderboard */}
                <div>
                  <h3 className="text-sm font-medium text-birch mb-2 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Leaderboard
                  </h3>
                  {leaderboard && leaderboard.length > 0 ? (
                    <div className="space-y-2">
                      {leaderboard.slice(0, 10).map((entry) => (
                        <LeaderboardEntry
                          key={entry.participant.id}
                          rank={entry.rank}
                          name={
                            entry.user?.firstName
                              ? `${entry.user.firstName} ${entry.user.lastName || ""}`
                              : "Anonymous"
                          }
                          streak={entry.participant.currentStreak}
                          completions={entry.participant.totalCompletions}
                          isCurrentUser={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-sage/60 text-center py-4">
                      Be the first to join!
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {myParticipationMap.has(selectedChallenge.id) ? (
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => {
                        leaveChallenge.mutate(selectedChallenge.id);
                        setSelectedChallenge(null);
                      }}
                    >
                      Leave Challenge
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-birch hover:bg-birch/90 text-deep-pine"
                      onClick={() => {
                        handleJoin(selectedChallenge.id);
                        setSelectedChallenge(null);
                      }}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Join Challenge
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}
