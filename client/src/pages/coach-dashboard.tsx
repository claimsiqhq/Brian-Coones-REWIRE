import { useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  useCoachClients,
  useClientData,
  useClientVentMessages,
  useCreateCoachInvite,
  useCoachInvites,
  useAssignHomework,
  useClientSessions,
  useCreateSession,
  useUpdateSessionStatus,
  useUnreadNotificationCount,
  type ClientInfo
} from "@/lib/api";
import {
  Users,
  ChevronLeft,
  Link as LinkIcon,
  Copy,
  Check,
  Send,
  BookHeart,
  Smile,
  Target,
  TrendingUp,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  Bell,
  ArrowRightLeft,
  Library
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import CoachNotifications from "@/components/coach/CoachNotifications";
import ClientTransfers from "@/components/coach/ClientTransfers";
import SharedLibrary from "@/components/coach/SharedLibrary";
import CoCoachingPanel from "@/components/coach/CoCoachingPanel";

const moodScores: Record<string, number> = {
  "great": 5,
  "good": 4,
  "okay": 3,
  "meh": 2,
  "bad": 1,
};

const moodEmojis: Record<string, string> = {
  "great": "😊",
  "good": "🙂",
  "okay": "😐",
  "meh": "😕",
  "bad": "😢",
};

function ClientList({
  clients,
  onSelectClient,
  isLoading,
  selectedClientId
}: {
  clients: ClientInfo[] | undefined;
  onSelectClient: (client: ClientInfo) => void;
  isLoading: boolean;
  selectedClientId?: string;
}) {
  const { toast } = useToast();
  const createInviteMutation = useCreateCoachInvite();
  const { data: invites = [] } = useCoachInvites();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showInvites, setShowInvites] = useState(false);

  const handleCreateInvite = async () => {
    try {
      const result = await createInviteMutation.mutateAsync(
        clientName.trim() ? { name: clientName.trim() } : undefined
      );
      setInviteCode(result.code);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create invite link",
        variant: "destructive",
      });
    }
  };

  const handleSendEmailInvite = async () => {
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await createInviteMutation.mutateAsync({
        email: clientEmail.trim(),
        name: clientName.trim() || undefined
      });
      setInviteCode(result.code);
      
      if (result.emailSent) {
        setEmailSent(true);
        toast({
          title: "Invitation Sent!",
          description: `An email invitation has been sent to ${clientEmail}`,
        });
      } else {
        setEmailSent(false);
        toast({
          title: "Email Could Not Be Sent",
          description: "Invite link created, but email failed to send. You can share the link manually.",
          variant: "destructive",
        });
      }
      setClientEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create invitation",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const handleNewInvite = () => {
    setInviteCode(null);
    setEmailSent(false);
    setClientEmail("");
    setClientName("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 border-dashed border-2 border-forest-floor bg-deep-pine/50">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-forest-floor/50 rounded-full">
            <LinkIcon className="w-5 h-5 text-sage" />
          </div>
          <div className="text-center">
            <h3 className="font-medium text-sm" data-testid="text-invite-title">Invite a Client</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Send an email invite or generate a link to share
            </p>
          </div>
          {inviteCode ? (
            <div className="w-full space-y-3">
              {emailSent && (
                <div className="bg-sage/20 border border-sage/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-sage">Email invitation sent successfully!</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input 
                  value={`${window.location.origin}/join/${inviteCode}`}
                  readOnly
                  className="text-xs"
                  data-testid="input-invite-link"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCopyLink}
                  data-testid="button-copy-invite"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Link expires in 7 days
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleNewInvite}
                className="w-full text-xs"
                data-testid="button-new-invite"
              >
                Create Another Invite
              </Button>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <div className="space-y-2">
                <Input 
                  type="text"
                  placeholder="Client's name (optional)"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="text-xs"
                  data-testid="input-client-name"
                />
                <div className="flex items-center gap-2">
                  <Input 
                    type="email"
                    placeholder="client@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="text-xs"
                    data-testid="input-client-email"
                  />
                  <Button 
                    size="sm"
                    onClick={handleSendEmailInvite}
                    disabled={createInviteMutation.isPending || !clientEmail.trim()}
                    data-testid="button-send-email-invite"
                  >
                    {createInviteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Enter your client's name and email to send an invitation
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-deep-pine px-2 text-sage/60">or</span>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={handleCreateInvite}
                disabled={createInviteMutation.isPending}
                className="w-full"
                data-testid="button-create-invite"
              >
                {createInviteMutation.isPending ? "Creating..." : "Generate Link Only"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Your Clients ({clients?.length || 0})
        </h3>
        
        {(!clients || clients.length === 0) ? (
          <Card className="p-6 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No clients yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use the invite link above to add clients
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => {
              const isSelected = selectedClientId === client.id;
              return (
                <Card
                  key={client.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => onSelectClient(client)}
                  data-testid={`card-client-${client.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {client.profileImageUrl && (
                        <AvatarImage src={client.profileImageUrl} />
                      )}
                      <AvatarFallback className={`${isSelected ? "bg-sage/20 text-sage" : "bg-forest-floor/50 text-sage"}`}>
                        {(client.firstName?.[0] || client.email?.[0] || "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${isSelected ? "text-primary" : ""}`} data-testid={`text-client-name-${client.id}`}>
                        {client.firstName && client.lastName
                          ? `${client.firstName} ${client.lastName}`
                          : client.email || "Unknown Client"
                        }
                      </p>
                      {client.email && client.firstName && (
                        <p className="text-xs text-muted-foreground truncate">
                          {client.email}
                        </p>
                      )}
                    </div>
                    <ChevronLeft className={`w-4 h-4 rotate-180 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Pending Invites Section */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowInvites(!showInvites)}
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-2 hover:text-foreground transition-colors"
            data-testid="button-toggle-invites"
          >
            Pending Invites ({invites.filter(i => i.status === 'pending').length})
            <ChevronLeft className={`w-3 h-3 transition-transform ${showInvites ? 'rotate-90' : '-rotate-90'}`} />
          </button>
          
          {showInvites && (
            <Card className="p-3 bg-deep-pine/50 border-forest-floor">
              <div className="space-y-2">
                {invites.map((invite) => {
                  const statusColors: Record<string, string> = {
                    pending: 'bg-birch/20 text-birch',
                    used: 'bg-sage/20 text-sage',
                    expired: 'bg-forest-floor/30 text-sage/50'
                  };
                  return (
                    <div key={invite.id} className="flex items-center justify-between py-2 border-b border-forest-floor/50 last:border-0" data-testid={`invite-${invite.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-birch" data-testid={`invite-name-${invite.id}`}>
                          {invite.inviteeName || invite.inviteeEmail || 'No name provided'}
                        </p>
                        {invite.inviteeEmail && (
                          <p className="text-[10px] text-sage/60 truncate">{invite.inviteeEmail}</p>
                        )}
                        {invite.status === 'used' && invite.usedByUser && (
                          <p className="text-[10px] text-sage">Joined as: {invite.usedByUser.name}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[invite.status] || statusColors.pending}`}>
                        {invite.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ClientDetail({ 
  client, 
  onBack 
}: { 
  client: ClientInfo; 
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { data: clientData, isLoading } = useClientData(client.id);
  const { data: ventMessages } = useClientVentMessages(client.id);
  const { data: sessions } = useClientSessions(client.id);
  const assignHomeworkMutation = useAssignHomework();
  const createSessionMutation = useCreateSession();
  const updateStatusMutation = useUpdateSessionStatus();
  const [homeworkContent, setHomeworkContent] = useState("");
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("10:00");
  const [sessionDuration, setSessionDuration] = useState("60");
  const [sessionNotes, setSessionNotes] = useState("");

  const handleAssignHomework = async () => {
    if (!homeworkContent.trim()) return;
    
    try {
      await assignHomeworkMutation.mutateAsync({
        clientId: client.id,
        content: homeworkContent,
      });
      setHomeworkContent("");
      toast({
        title: "Homework Assigned",
        description: "Your client will see this on their home page",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign homework",
        variant: "destructive",
      });
    }
  };

  const handleBookSession = async () => {
    if (!sessionDate || !sessionTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    try {
      const scheduledAt = new Date(`${sessionDate}T${sessionTime}`).toISOString();
      await createSessionMutation.mutateAsync({
        clientId: client.id,
        scheduledAt,
        durationMinutes: parseInt(sessionDuration),
        notes: sessionNotes || undefined,
      });
      setSessionDialogOpen(false);
      setSessionDate("");
      setSessionTime("10:00");
      setSessionDuration("60");
      setSessionNotes("");
      toast({
        title: "Session Booked",
        description: "Calendar invite sent to your client",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to book session",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (sessionId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: sessionId, status });
      toast({
        title: status === "completed" ? "Session Completed" : "Session Cancelled",
        description: status === "completed" ? "Great job!" : "Session has been cancelled",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Scheduled</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Cancelled</Badge>;
      case "rescheduled":
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Rescheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingSessions = sessions?.filter(s => s.status === "scheduled" && new Date(s.scheduledAt) >= new Date()) || [];
  const pastSessions = sessions?.filter(s => s.status !== "scheduled" || new Date(s.scheduledAt) < new Date()) || [];

  const clientName = client.firstName && client.lastName 
    ? `${client.firstName} ${client.lastName}`
    : client.email || "Client";

  const avgMoodScore = clientData?.moods?.length 
    ? (clientData.moods.reduce((sum, m) => sum + (moodScores[m.mood] || 3), 0) / clientData.moods.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="p-1"
          data-testid="button-back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Avatar className="h-10 w-10">
          {client.profileImageUrl && (
            <AvatarImage src={client.profileImageUrl} />
          )}
          <AvatarFallback className="bg-violet-100 text-violet-600">
            {(client.firstName?.[0] || client.email?.[0] || "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-sm" data-testid="text-client-detail-name">{clientName}</h2>
          {client.email && client.firstName && (
            <p className="text-xs text-muted-foreground">{client.email}</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Smile className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium">Mood Check-ins</span>
              </div>
              <p className="text-xl font-bold" data-testid="stat-mood-checkins">
                {clientData?.stats?.totalMoodCheckins || 0}
              </p>
              {avgMoodScore && (
                <p className="text-[10px] text-muted-foreground">
                  Avg: {avgMoodScore}/5
                </p>
              )}
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <BookHeart className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-medium">Journal Entries</span>
              </div>
              <p className="text-xl font-bold" data-testid="stat-journal-entries">
                {clientData?.stats?.totalJournalEntries || 0}
              </p>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium">Habits Done</span>
              </div>
              <p className="text-xl font-bold" data-testid="stat-habits-completed">
                {clientData?.stats?.totalHabitsCompleted || 0}
              </p>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-medium">Current Streak</span>
              </div>
              <p className="text-xl font-bold" data-testid="stat-current-streak">
                {clientData?.stats?.currentStreak || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">days</p>
            </Card>
          </div>

          {clientData?.moods && clientData.moods.length > 0 && (
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-medium">Recent Moods</span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {clientData.moods.slice(0, 7).map((mood: any) => (
                  <div key={mood.id} className="flex flex-col items-center min-w-[40px]">
                    <span className="text-lg">{moodEmojis[mood.mood] || "😐"}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {format(new Date(mood.timestamp), "MM/dd")}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {clientData?.habits && clientData.habits.length > 0 && (
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium">Current Habits</span>
              </div>
              <div className="space-y-1">
                {clientData.habits.map((habit: any) => {
                  const isCompleted = clientData.completions?.some(
                    (c: any) => c.habitId === habit.id && c.completed
                  );
                  return (
                    <div 
                      key={habit.id} 
                      className="flex items-center gap-2 text-xs"
                    >
                      <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={isCompleted ? 'text-foreground' : 'text-muted-foreground'}>
                        {habit.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {clientData?.journals && clientData.journals.length > 0 && (
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <BookHeart className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-medium">Recent Journal Entries</span>
              </div>
              <div className="space-y-2">
                {clientData.journals.slice(0, 3).map((entry: any) => (
                  <div key={entry.id} className="border-l-2 border-violet-200 pl-2">
                    <p className="text-xs font-medium">{entry.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {entry.content}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {format(new Date(entry.timestamp), "MMM d, yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {ventMessages && ventMessages.length > 0 && (
            <Card className="p-3 border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium">Crisis/Vent Messages</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-700 rounded-full">
                  {ventMessages.length}
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {ventMessages.map((msg: any) => (
                  <div key={msg.id} className="bg-white p-2 rounded-lg border border-amber-100" data-testid={`vent-message-${msg.id}`}>
                    <p className="text-xs">{msg.content}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {format(new Date(msg.timestamp), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {!clientData?.moods && !clientData?.habits && !clientData?.journals && (
            <Card className="p-4 text-center">
              <EyeOff className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No shared data available</p>
              <p className="text-xs text-muted-foreground mt-1">
                This client has not enabled data sharing yet
              </p>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium">Coaching Sessions</span>
              </div>
              <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs" data-testid="button-book-session">
                    <Plus className="w-3 h-3 mr-1" />
                    Book Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-base">Book a Session with {clientName}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="session-date" className="text-xs">Date</Label>
                      <Input
                        id="session-date"
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="text-sm"
                        data-testid="input-session-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-time" className="text-xs">Time</Label>
                      <Input
                        id="session-time"
                        type="time"
                        value={sessionTime}
                        onChange={(e) => setSessionTime(e.target.value)}
                        className="text-sm"
                        data-testid="input-session-time"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-duration" className="text-xs">Duration</Label>
                      <Select value={sessionDuration} onValueChange={setSessionDuration}>
                        <SelectTrigger id="session-duration" className="text-sm" data-testid="select-session-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-notes" className="text-xs">Notes (optional)</Label>
                      <Textarea
                        id="session-notes"
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="Agenda or topics to discuss..."
                        className="text-sm min-h-[60px]"
                        data-testid="textarea-session-notes"
                      />
                    </div>
                    <Button
                      onClick={handleBookSession}
                      disabled={!sessionDate || createSessionMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-booking"
                    >
                      {createSessionMutation.isPending ? "Booking..." : "Book Session"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {upcomingSessions.length > 0 && (
              <div className="space-y-2 mb-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</p>
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100" data-testid={`session-${session.id}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-medium">
                          {format(new Date(session.scheduledAt), "MMM d, yyyy")} at {format(new Date(session.scheduledAt), "h:mm a")}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{session.durationMinutes} min</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                        onClick={() => handleUpdateStatus(session.id, "completed")}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-complete-${session.id}`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                        onClick={() => handleUpdateStatus(session.id, "cancelled")}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-cancel-${session.id}`}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pastSessions.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Past Sessions</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {pastSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg" data-testid={`past-session-${session.id}`}>
                      <div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(session.scheduledAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!sessions || sessions.length === 0) && (
              <div className="text-center py-4">
                <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No sessions scheduled yet</p>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-medium">Assign Homework</span>
            </div>
            <Textarea
              placeholder="Write a task or assignment for your client..."
              value={homeworkContent}
              onChange={(e) => setHomeworkContent(e.target.value)}
              className="min-h-[80px] text-sm mb-2"
              data-testid="textarea-homework"
            />
            <Button
              onClick={handleAssignHomework}
              disabled={!homeworkContent.trim() || assignHomeworkMutation.isPending}
              className="w-full"
              data-testid="button-assign-homework"
            >
              {assignHomeworkMutation.isPending ? "Assigning..." : "Assign Homework"}
            </Button>
          </Card>

          {/* Co-Coaching Team */}
          <CoCoachingPanel clientId={client.id} clientName={clientName} />
        </>
      )}
    </div>
  );
}

// Desktop version of ClientDetail - no back button, optimized for wider screens
function ClientDetailDesktop({ client }: { client: ClientInfo }) {
  const { toast } = useToast();
  const { data: clientData, isLoading } = useClientData(client.id);
  const { data: ventMessages } = useClientVentMessages(client.id);
  const { data: sessions } = useClientSessions(client.id);
  const assignHomeworkMutation = useAssignHomework();
  const createSessionMutation = useCreateSession();
  const updateStatusMutation = useUpdateSessionStatus();
  const [homeworkContent, setHomeworkContent] = useState("");
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("10:00");
  const [sessionDuration, setSessionDuration] = useState("60");
  const [sessionNotes, setSessionNotes] = useState("");

  const handleAssignHomework = async () => {
    if (!homeworkContent.trim()) return;
    try {
      await assignHomeworkMutation.mutateAsync({
        clientId: client.id,
        content: homeworkContent,
      });
      setHomeworkContent("");
      toast({ title: "Homework Assigned", description: "Your client will see this on their home page" });
    } catch {
      toast({ title: "Error", description: "Failed to assign homework", variant: "destructive" });
    }
  };

  const handleBookSession = async () => {
    if (!sessionDate || !sessionTime) {
      toast({ title: "Missing Information", description: "Please select a date and time", variant: "destructive" });
      return;
    }
    try {
      const scheduledAt = new Date(`${sessionDate}T${sessionTime}`).toISOString();
      await createSessionMutation.mutateAsync({
        clientId: client.id,
        scheduledAt,
        durationMinutes: parseInt(sessionDuration),
        notes: sessionNotes || undefined,
      });
      setSessionDialogOpen(false);
      setSessionDate("");
      setSessionTime("10:00");
      setSessionDuration("60");
      setSessionNotes("");
      toast({ title: "Session Booked", description: "Calendar invite sent to your client" });
    } catch {
      toast({ title: "Error", description: "Failed to book session", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (sessionId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: sessionId, status });
      toast({
        title: status === "completed" ? "Session Completed" : "Session Cancelled",
        description: status === "completed" ? "Great job!" : "Session has been cancelled",
      });
    } catch {
      toast({ title: "Error", description: "Failed to update session", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Scheduled</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Cancelled</Badge>;
      case "rescheduled":
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Rescheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingSessions = sessions?.filter(s => s.status === "scheduled" && new Date(s.scheduledAt) >= new Date()) || [];
  const pastSessions = sessions?.filter(s => s.status !== "scheduled" || new Date(s.scheduledAt) < new Date()) || [];
  const clientName = client.firstName && client.lastName ? `${client.firstName} ${client.lastName}` : client.email || "Client";
  const avgMoodScore = clientData?.moods?.length
    ? (clientData.moods.reduce((sum: number, m: any) => sum + (moodScores[m.mood] || 3), 0) / clientData.moods.length).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-border/50">
        <Avatar className="h-16 w-16">
          {client.profileImageUrl && <AvatarImage src={client.profileImageUrl} />}
          <AvatarFallback className="bg-violet-100 text-violet-600 text-xl">
            {(client.firstName?.[0] || client.email?.[0] || "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold">{clientName}</h2>
          {client.email && client.firstName && (
            <p className="text-sm text-muted-foreground">{client.email}</p>
          )}
        </div>
      </div>

      {/* Stats Grid - 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Smile className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium">Mood Check-ins</span>
          </div>
          <p className="text-2xl font-bold">{clientData?.stats?.totalMoodCheckins || 0}</p>
          {avgMoodScore && <p className="text-xs text-muted-foreground">Avg: {avgMoodScore}/5</p>}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookHeart className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-medium">Journal Entries</span>
          </div>
          <p className="text-2xl font-bold">{clientData?.stats?.totalJournalEntries || 0}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">Habits Done</span>
          </div>
          <p className="text-2xl font-bold">{clientData?.stats?.totalHabitsCompleted || 0}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <p className="text-2xl font-bold">{clientData?.stats?.currentStreak || 0}</p>
          <p className="text-xs text-muted-foreground">days</p>
        </Card>
      </div>

      {/* Two column layout for details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Recent Moods */}
          {clientData?.moods && clientData.moods.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-violet-500" />
                <span className="text-sm font-medium">Recent Moods</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {clientData.moods.slice(0, 10).map((mood: any) => (
                  <div key={mood.id} className="flex flex-col items-center min-w-[50px]">
                    <span className="text-xl">{moodEmojis[mood.mood] || "😐"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(mood.timestamp), "MM/dd")}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Current Habits */}
          {clientData?.habits && clientData.habits.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Current Habits</span>
              </div>
              <div className="space-y-2">
                {clientData.habits.map((habit: any) => {
                  const isCompleted = clientData.completions?.some((c: any) => c.habitId === habit.id && c.completed);
                  return (
                    <div key={habit.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={isCompleted ? 'text-foreground' : 'text-muted-foreground'}>{habit.label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Recent Journal Entries */}
          {clientData?.journals && clientData.journals.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookHeart className="w-5 h-5 text-rose-500" />
                <span className="text-sm font-medium">Recent Journal Entries</span>
              </div>
              <div className="space-y-3">
                {clientData.journals.slice(0, 5).map((entry: any) => (
                  <div key={entry.id} className="border-l-2 border-violet-200 pl-3">
                    <p className="text-sm font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(entry.timestamp), "MMM d, yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Vent Messages */}
          {ventMessages && ventMessages.length > 0 && (
            <Card className="p-4 border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium">Crisis/Vent Messages</span>
                <Badge className="bg-amber-200 text-amber-700 text-xs">{ventMessages.length}</Badge>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {ventMessages.map((msg: any) => (
                  <div key={msg.id} className="bg-white p-3 rounded-lg border border-amber-100">
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(msg.timestamp), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Coaching Sessions */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Coaching Sessions</span>
              </div>
              <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <Plus className="w-4 h-4 mr-1" />
                    Book Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Book a Session with {clientName}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="session-date-desktop">Date</Label>
                        <Input
                          id="session-date-desktop"
                          type="date"
                          value={sessionDate}
                          onChange={(e) => setSessionDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="session-time-desktop">Time</Label>
                        <Input
                          id="session-time-desktop"
                          type="time"
                          value={sessionTime}
                          onChange={(e) => setSessionTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-duration-desktop">Duration</Label>
                      <Select value={sessionDuration} onValueChange={setSessionDuration}>
                        <SelectTrigger id="session-duration-desktop">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-notes-desktop">Notes (optional)</Label>
                      <Textarea
                        id="session-notes-desktop"
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="Agenda or topics to discuss..."
                      />
                    </div>
                    <Button onClick={handleBookSession} disabled={!sessionDate || createSessionMutation.isPending} className="w-full">
                      {createSessionMutation.isPending ? "Booking..." : "Book Session"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {upcomingSessions.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</p>
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">
                          {format(new Date(session.scheduledAt), "MMM d, yyyy")} at {format(new Date(session.scheduledAt), "h:mm a")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{session.durationMinutes} min</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:bg-green-100"
                        onClick={() => handleUpdateStatus(session.id, "completed")} disabled={updateStatusMutation.isPending}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:bg-red-100"
                        onClick={() => handleUpdateStatus(session.id, "cancelled")} disabled={updateStatusMutation.isPending}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pastSessions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past Sessions</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {pastSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(session.scheduledAt), "MMM d, yyyy")}
                      </span>
                      {getStatusBadge(session.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!sessions || sessions.length === 0) && (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No sessions scheduled yet</p>
              </div>
            )}
          </Card>

          {/* Assign Homework */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-5 h-5 text-violet-500" />
              <span className="text-sm font-medium">Assign Homework</span>
            </div>
            <Textarea
              placeholder="Write a task or assignment for your client..."
              value={homeworkContent}
              onChange={(e) => setHomeworkContent(e.target.value)}
              className="min-h-[100px] mb-3"
            />
            <Button onClick={handleAssignHomework} disabled={!homeworkContent.trim() || assignHomeworkMutation.isPending} className="w-full">
              {assignHomeworkMutation.isPending ? "Assigning..." : "Assign Homework"}
            </Button>
          </Card>

          {/* Co-Coaching Team */}
          <CoCoachingPanel clientId={client.id} clientName={clientName} />
        </div>
      </div>

      {/* Empty state */}
      {!clientData?.moods && !clientData?.habits && !clientData?.journals && (
        <Card className="p-8 text-center">
          <EyeOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">No shared data available</p>
          <p className="text-sm text-muted-foreground mt-1">
            This client has not enabled data sharing yet
          </p>
        </Card>
      )}
    </div>
  );
}

function CoachDashboardContent() {
  const { data: clients, isLoading } = useCoachClients();
  const { data: unreadCount } = useUnreadNotificationCount();
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);
  const [activeTab, setActiveTab] = useState("clients");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-secondary text-white px-5 pt-6 pb-3 md:rounded-b-none rounded-b-2xl shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-white/80" />
            <span className="text-white/80 text-xs">Coach Dashboard</span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-white" data-testid="text-dashboard-title">
            {selectedClient && !window.matchMedia('(min-width: 768px)').matches ? "Client Details" : "Your Clients"}
          </h1>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b border-border/30 shrink-0 bg-background/50 backdrop-blur-sm">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="clients" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="w-3 h-3 mr-1 hidden sm:inline" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs relative data-[state=active]:bg-primary data-[state=active]:text-white">
              <Bell className="w-3 h-3 mr-1 hidden sm:inline" />
              Activity
              {(unreadCount?.count ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount?.count}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="transfers" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
              <ArrowRightLeft className="w-3 h-3 mr-1 hidden sm:inline" />
              Transfers
            </TabsTrigger>
            <TabsTrigger value="library" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white">
              <Library className="w-3 h-3 mr-1 hidden sm:inline" />
              Library
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Clients Tab */}
        <TabsContent value="clients" className="flex-1 overflow-hidden m-0">
          {/* Mobile Layout: Stack */}
          <div className="h-full md:hidden">
            <ScrollArea className="h-full px-6 pt-4 pb-6">
              {selectedClient ? (
                <ClientDetail
                  client={selectedClient}
                  onBack={() => setSelectedClient(null)}
                />
              ) : (
                <ClientList
                  clients={clients}
                  onSelectClient={setSelectedClient}
                  isLoading={isLoading}
                />
              )}
            </ScrollArea>
          </div>

          {/* Tablet/Desktop Layout: Side by Side */}
          <div className="hidden md:flex h-full">
            {/* Left Sidebar - Client List */}
            <div className="w-80 lg:w-96 border-r border-border/50 bg-muted/20 shrink-0">
              <ScrollArea className="h-full px-4 pt-4 pb-6">
                <ClientList
                  clients={clients}
                  onSelectClient={setSelectedClient}
                  isLoading={isLoading}
                  selectedClientId={selectedClient?.id}
                />
              </ScrollArea>
            </div>

            {/* Right Panel - Client Details */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 pt-4 pb-6">
                {selectedClient ? (
                  <ClientDetailDesktop client={selectedClient} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Users className="w-16 h-16 text-muted-foreground/20 mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground">Select a Client</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose a client from the list to view their details
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full px-6 pt-4 pb-6">
            <CoachNotifications />
          </ScrollArea>
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full px-6 pt-4 pb-6">
            <ClientTransfers />
          </ScrollArea>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full px-6 pt-4 pb-6">
            <SharedLibrary />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CoachDashboard() {
  const { isCoach } = useAuth();

  if (!isCoach) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-full p-6">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Coach Access Required</h2>
          <p className="text-sm text-muted-foreground text-center">
            This page is only available to coaches. Update your role in your profile settings.
          </p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout fullWidth>
      <CoachDashboardContent />
    </MobileLayout>
  );
}
