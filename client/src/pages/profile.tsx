import { useState, useRef } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Bell,
  LogOut,
  ChevronRight,
  User,
  Volume2,
  Clock,
  Shield,
  HelpCircle,
  Star,
  Trash2,
  Download,
  Smile,
  BookHeart,
  Target,
  UserCog,
  Camera,
  Loader2,
  Video,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSettings, useUpdateUserSettings, useMyCoach, useUpdateUserProfile, useDeleteAllUserData, exportUserData, useSessions } from "@/lib/api";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, logoutMutation, isCoach, isSuperAdmin, refetchUser } = useAuth();
  const isAdmin = user?.role === "superadmin";
  const { data: settings, isLoading } = useUserSettings();
  const { data: myCoach } = useMyCoach();
  
  const isClient = !isCoach && !isAdmin && !!user;
  const { data: sessions = [] } = useSessions({ enabled: isClient });
  
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
  
  const getSessionStatusColor = (status: string, scheduledAt: string) => {
    if (status === "completed") return "bg-sage/20 text-sage";
    if (status === "cancelled") return "bg-red-900/30 text-red-400";
    if (isPast(new Date(scheduledAt)) && status === "scheduled") return "bg-birch/20 text-birch";
    return "bg-forest-floor/30 text-sage";
  };
  
  const getSessionStatusIcon = (status: string, scheduledAt: string) => {
    if (status === "completed") return <CheckCircle2 className="w-4 h-4" />;
    if (status === "cancelled") return <XCircle className="w-4 h-4" />;
    return <Video className="w-4 h-4" />;
  };
  const updateSettingsMutation = useUpdateUserSettings();
  const updateProfileMutation = useUpdateUserProfile();
  const deleteDataMutation = useDeleteAllUserData();
  const { toast } = useToast();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEditProfile = () => {
    setEditFirstName(user?.firstName || "");
    setEditLastName(user?.lastName || "");
    setEditProfileImage(user?.profileImageUrl || null);
    setShowEditProfileDialog(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(
      {
        firstName: editFirstName.trim() || undefined,
        lastName: editLastName.trim() || undefined,
        profileImageUrl: editProfileImage || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Profile updated",
            description: "Your profile has been saved.",
          });
          setShowEditProfileDialog(false);
          refetchUser?.();
        },
        onError: () => {
          toast({
            title: "Failed to update profile",
            description: "Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSettingChange = (key: string, value: boolean | string) => {
    updateSettingsMutation.mutate({ [key]: value }, {
      onSuccess: () => {
        toast({
          title: "Settings updated",
          description: "Your preferences have been saved.",
        });
      }
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setShowLogoutDialog(false);
      }
    });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await exportUserData();
      toast({
        title: "Data exported",
        description: "Your data has been downloaded as a JSON file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="bg-gradient-to-br from-deep-pine via-deep-pine to-night-forest text-birch px-5 pt-6 pb-5 rounded-b-2xl shrink-0">
            <div className="flex flex-col items-center">
              <Skeleton className="h-20 w-20 rounded-full mb-2 mt-2" />
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex-1 px-6 pt-4 space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  const coachVoice = settings?.coachVoice ?? true;
  const notifications = settings?.notifications ?? true;
  const reminderTime = settings?.reminderTime ?? "09:00";
  const privacyShareMoods = settings?.privacyShareMoods ?? true;
  const privacyShareJournals = settings?.privacyShareJournals ?? false;
  const privacyShareHabits = settings?.privacyShareHabits ?? true;

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";
  
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || "U";

  const roleLabel = isCoach ? "Coach" : "Member";

  return (
    <MobileLayout>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="bg-gradient-to-br from-deep-pine via-deep-pine to-night-forest text-birch px-5 pt-6 pb-5 rounded-b-2xl shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-birch/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex flex-col items-center relative z-10">
            <Avatar className="h-20 w-20 border-4 border-birch/20 shadow-xl mb-2 mt-2" data-testid="avatar-profile">
              {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
              <AvatarFallback className="bg-forest-floor text-birch">{initials}</AvatarFallback>
            </Avatar>
            <h1 className="text-lg font-display font-bold text-birch mb-0" data-testid="text-profile-name">{displayName}</h1>
            <p className="text-sage text-[10px]" data-testid="text-profile-tier">{roleLabel}</p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 pt-4 pb-6">
          <div className="space-y-4 pb-2">
            {/* My Sessions - For clients */}
            {isClient && sessions.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">My Sessions</h3>
                <Card className="border border-forest-floor/40 shadow-sm overflow-hidden bg-deep-pine">
                  <div className="divide-y divide-border/50">
                    {sessions.slice(0, 5).map((session: any) => (
                      <div key={session.id} className="p-3 flex items-center gap-3" data-testid={`session-${session.id}`}>
                        <div className={`p-1.5 rounded-lg ${getSessionStatusColor(session.status, session.scheduledAt)}`}>
                          {getSessionStatusIcon(session.status, session.scheduledAt)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs" data-testid={`session-date-${session.id}`}>
                              {formatSessionDate(session.scheduledAt)}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize" data-testid={`session-status-${session.id}`}>
                              {session.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1" data-testid={`session-time-${session.id}`}>
                            <Clock className="w-3 h-3" />
                            {formatSessionTime(session.scheduledAt)} · {session.durationMinutes || 60}min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {sessions.length > 5 && (
                    <div className="px-3 py-2 border-t border-border/50 text-center">
                      <span className="text-[10px] text-muted-foreground">+ {sessions.length - 5} more sessions</span>
                    </div>
                  )}
                </Card>
              </div>
            )}
            
            <div className="space-y-1">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Coach Settings</h3>
              <Card className="border border-forest-floor/40 shadow-sm overflow-hidden bg-deep-pine">
                <div className="divide-y divide-border/50">
                  <div className="p-3 flex items-center justify-between" data-testid="setting-coach-voice">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-forest-floor/30 text-sage rounded-lg">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium text-xs block">Coach Voice</span>
                        <span className="text-[10px] text-muted-foreground">Brian speaks responses aloud</span>
                      </div>
                    </div>
                    <Switch 
                      checked={coachVoice} 
                      onCheckedChange={(value) => handleSettingChange("coachVoice", value)}
                      className="scale-75 origin-right" 
                      data-testid="switch-coach-voice" 
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Reminders</h3>
              <Card className="border border-forest-floor/40 shadow-sm overflow-hidden bg-deep-pine">
                <div className="divide-y divide-border/50">
                  <div className="p-3 flex items-center justify-between" data-testid="setting-notifications">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-birch/20 text-birch rounded-lg">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium text-xs block">Daily Check-in</span>
                        <span className="text-[10px] text-muted-foreground">Remind me to log my mood</span>
                      </div>
                    </div>
                    <Switch 
                      checked={notifications} 
                      onCheckedChange={(value) => handleSettingChange("notifications", value)}
                      className="scale-75 origin-right" 
                      data-testid="switch-notifications" 
                    />
                  </div>
                  {notifications && (
                    <div className="p-3 flex items-center justify-between" data-testid="setting-reminder-time">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-birch/20 text-birch rounded-lg">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-xs block">Reminder Time</span>
                          <span className="text-[10px] text-muted-foreground">When to send daily reminder</span>
                        </div>
                      </div>
                      <Select value={reminderTime} onValueChange={(value) => handleSettingChange("reminderTime", value)}>
                        <SelectTrigger className="w-24 h-8 text-xs" data-testid="select-reminder-time">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="07:00">7:00 AM</SelectItem>
                          <SelectItem value="08:00">8:00 AM</SelectItem>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="18:00">6:00 PM</SelectItem>
                          <SelectItem value="21:00">9:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Account</h3>
              <Card className="border border-forest-floor/40 shadow-sm overflow-hidden bg-deep-pine">
                <div className="divide-y divide-border/50">
                  <div
                    className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    data-testid="setting-account"
                    onClick={handleOpenEditProfile}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleOpenEditProfile()}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-birch/20 text-birch rounded-lg">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-xs">Edit Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" data-testid="setting-upgrade">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg">
                        <Star className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium text-xs block">Upgrade to Premium</span>
                        <span className="text-[10px] text-muted-foreground">Unlock all features</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Super Admin Panel Link */}
            {isSuperAdmin && (
              <div className="space-y-1">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Administration</h3>
                <Card className="border border-forest-floor/40 shadow-sm overflow-hidden bg-deep-pine">
                  <a
                    href="/admin"
                    className="p-3 flex items-center justify-between hover:bg-forest-floor/20 transition-colors cursor-pointer block"
                    data-testid="link-admin-panel"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-ember/20 text-ember rounded-lg">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium text-xs block">Admin Panel</span>
                        <span className="text-[10px] text-muted-foreground">Manage profiles and users</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </a>
                </Card>
              </div>
            )}

            {/* Show coach info for anyone who has a coach (including coaches with supervisors) */}
            {myCoach && (
              <div className="space-y-1">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                  {isCoach ? "Your Supervisor" : "Your Coach"}
                </h3>
                <Card className="border border-forest-floor/40 shadow-sm overflow-hidden bg-deep-pine">
                  <div className="p-3 flex items-center gap-3">
                    <div className="p-1.5 bg-forest-floor/30 text-sage rounded-lg">
                      <UserCog className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium text-xs block" data-testid="text-coach-name">
                        {myCoach.firstName && myCoach.lastName
                          ? `${myCoach.firstName} ${myCoach.lastName}`
                          : myCoach.email || (isCoach ? "Your Supervisor" : "Your Coach")
                        }
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {isCoach ? "Supervision & mentorship" : "Connected coach"}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Coach sharing settings - show for anyone who has a coach */}
            {myCoach && (
              <div className="space-y-1">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Coach Sharing</h3>
                <Card className="border border-forest-floor/40 shadow-sm overflow-hidden bg-deep-pine">
                  <div className="divide-y divide-border/50">
                    <div className="p-3 flex items-center justify-between" data-testid="setting-share-moods">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-birch/20 text-birch rounded-lg">
                          <Smile className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-xs block">Share Mood Data</span>
                          <span className="text-[10px] text-muted-foreground">Let your coach see your moods</span>
                        </div>
                      </div>
                      <Switch 
                        checked={privacyShareMoods} 
                        onCheckedChange={(value) => handleSettingChange("privacyShareMoods", value)}
                        className="scale-75 origin-right" 
                        data-testid="switch-share-moods" 
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between" data-testid="setting-share-habits">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-green-50 text-green-500 rounded-lg">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-xs block">Share Habits</span>
                          <span className="text-[10px] text-muted-foreground">Let your coach see your habits</span>
                        </div>
                      </div>
                      <Switch 
                        checked={privacyShareHabits} 
                        onCheckedChange={(value) => handleSettingChange("privacyShareHabits", value)}
                        className="scale-75 origin-right" 
                        data-testid="switch-share-habits" 
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between" data-testid="setting-share-journals">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-sage/20 text-sage rounded-lg">
                          <BookHeart className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-xs block">Share Journals</span>
                          <span className="text-[10px] text-muted-foreground">Let your coach read your journals</span>
                        </div>
                      </div>
                      <Switch 
                        checked={privacyShareJournals} 
                        onCheckedChange={(value) => handleSettingChange("privacyShareJournals", value)}
                        className="scale-75 origin-right" 
                        data-testid="switch-share-journals" 
                      />
                    </div>
                  </div>
                </Card>
                <p className="text-[10px] text-muted-foreground px-1 pt-1">
                  These settings control what your coach can see about your progress.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Data & Privacy</h3>
              <Card className="border border-forest-floor/40 shadow-sm overflow-hidden bg-deep-pine">
                <div className="divide-y divide-border/50">
                  <div 
                    className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" 
                    data-testid="setting-export-data"
                    onClick={handleExportData}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleExportData()}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-xs">{isExporting ? "Exporting..." : "Export My Data"}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div 
                    className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" 
                    data-testid="setting-privacy"
                    onClick={() => setShowPrivacyDialog(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setShowPrivacyDialog(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-sage/20 text-sage rounded-lg">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-xs">Privacy Policy</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div
                    className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    data-testid="setting-delete-data"
                    onClick={() => setShowDeleteDialog(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setShowDeleteDialog(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-red-50 text-red-500 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-xs">Delete All Data</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Support</h3>
              <Card className="border border-forest-floor/40 shadow-sm overflow-hidden bg-deep-pine">
                <div className="divide-y divide-border/50">
                  <div className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" data-testid="setting-help">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-teal-50 text-teal-500 rounded-lg">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-xs">Help & FAQ</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            </div>

            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 h-10 text-xs mt-2"
              data-testid="button-logout"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="w-3.5 h-3.5 mr-2" /> Log Out
            </Button>

            <p className="text-center text-[10px] text-muted-foreground pt-2">
              REWIRE v1.0.0
            </p>
          </div>
        </ScrollArea>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Log Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Data Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Data</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your moods, journal entries, habits, and achievements will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => {
                deleteDataMutation.mutate(undefined, {
                  onSuccess: () => {
                    toast({
                      title: "Data deleted",
                      description: "All your data has been permanently deleted.",
                    });
                    setShowDeleteDialog(false);
                  },
                  onError: () => {
                    toast({
                      title: "Error",
                      description: "Failed to delete data. Please try again.",
                      variant: "destructive",
                    });
                  },
                });
              }}
              disabled={deleteDataMutation.isPending}
            >
              {deleteDataMutation.isPending ? "Deleting..." : "Delete Everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  {editProfileImage ? (
                    <AvatarImage src={editProfileImage} />
                  ) : null}
                  <AvatarFallback className="text-2xl">
                    {editFirstName?.[0] || editLastName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                  type="button"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">Tap camera to change photo</p>
            </div>

            {/* Name Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditProfileDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="sm:max-w-[500px] w-[90%] rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-sage" />
              Privacy Policy
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-muted-foreground">
            <section>
              <h3 className="font-semibold text-foreground mb-2">Your Data, Your Control</h3>
              <p>At MindfulCoach, we believe your personal wellness data belongs to you. We are committed to protecting your privacy and giving you full control over your information.</p>
            </section>
            
            <section>
              <h3 className="font-semibold text-foreground mb-2">What We Collect</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account information (email, name)</li>
                <li>Mood check-ins and journal entries</li>
                <li>Habit tracking data</li>
                <li>Vision board items</li>
                <li>Coaching session notes (if applicable)</li>
              </ul>
            </section>
            
            <section>
              <h3 className="font-semibold text-foreground mb-2">How We Use Your Data</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>To provide personalized wellness insights</li>
                <li>To generate AI-powered journal prompts</li>
                <li>To track your progress over time</li>
                <li>To connect you with your coach (if applicable)</li>
              </ul>
            </section>
            
            <section>
              <h3 className="font-semibold text-foreground mb-2">Coach Sharing</h3>
              <p>If you're connected to a coach, you control what they can see through your Coach Sharing settings. You can enable or disable sharing of moods, habits, and journal entries at any time.</p>
            </section>
            
            <section>
              <h3 className="font-semibold text-foreground mb-2">Your Rights</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Export:</strong> Download all your data anytime</li>
                <li><strong>Delete:</strong> Permanently remove all your data</li>
                <li><strong>Control:</strong> Manage sharing settings</li>
              </ul>
            </section>
            
            <section>
              <h3 className="font-semibold text-foreground mb-2">Data Security</h3>
              <p>Your data is encrypted and stored securely. We never sell your personal information to third parties.</p>
            </section>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPrivacyDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
