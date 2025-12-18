import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Shield, Palette, Users, Plus, Pencil, Trash2, Check, ArrowLeft } from "lucide-react";
import type { AppProfile, User, FeatureFlags, ThemeTokens } from "@shared/schema";

const defaultFeatureFlags: FeatureFlags = {
  groundCheck: true,
  dailyAnchors: true,
  reflections: true,
  groundingPractice: true,
  coachBrian: true,
  visionBoard: true,
  achievements: true,
  release: true,
  brotherhood: true,
};

const featureLabels: Record<keyof FeatureFlags, string> = {
  groundCheck: "Daily Ground Check",
  dailyAnchors: "Daily Anchors (Habits)",
  reflections: "Reflections (Journal)",
  groundingPractice: "Grounding Practice (Breathing)",
  coachBrian: "Coach Brian (AI Chat)",
  visionBoard: "Vision Board",
  achievements: "Achievements",
  release: "Release (Vent)",
  brotherhood: "Brotherhood (Guide Features)",
};

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (user?.role !== "superadmin") {
    return (
      <div className="min-h-screen bg-night-forest flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-deep-pine border-forest-floor">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-ember mx-auto mb-4" />
            <CardTitle className="text-birch">Access Denied</CardTitle>
            <CardDescription className="text-sage/80">
              You need super admin privileges to access this area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation("/")} 
              className="w-full bg-birch text-night-forest hover:bg-birch/90"
              data-testid="button-go-home"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night-forest">
      <div className="max-w-6xl mx-auto p-4 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/")}
            className="text-sage hover:text-birch"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-cormorant text-birch tracking-wider">Super Admin</h1>
            <p className="text-sage/70 text-sm">Manage app profiles and user assignments</p>
          </div>
        </div>

        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-deep-pine">
            <TabsTrigger value="profiles" className="data-[state=active]:bg-forest-floor">
              <Palette className="w-4 h-4 mr-2" />
              Profiles
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-forest-floor">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="mt-4">
            <ProfilesTab />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProfilesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AppProfile | null>(null);

  const { data: profiles, isLoading } = useQuery<AppProfile[]>({
    queryKey: ["/api/admin/profiles"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/profiles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete profile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/app-profile"] });
      toast({ title: "Profile deleted" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/profiles/${id}/set-default`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to set default");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/app-profile"] });
      toast({ title: "Default profile updated" });
    },
  });

  if (isLoading) {
    return <div className="text-sage text-center py-8">Loading profiles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg text-birch">App Profiles</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-birch text-night-forest hover:bg-birch/90" data-testid="button-create-profile">
              <Plus className="w-4 h-4 mr-2" />
              New Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-deep-pine border-forest-floor max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-birch">Create New Profile</DialogTitle>
              <DialogDescription className="text-sage/80">
                Configure theme colors and feature flags
              </DialogDescription>
            </DialogHeader>
            <ProfileForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {profiles?.map((profile) => (
          <Card key={profile.id} className="bg-deep-pine border-forest-floor">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-birch flex items-center gap-2">
                    {profile.name}
                    {profile.isDefault && (
                      <Badge variant="outline" className="text-sage border-sage">
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-sage/70">
                    {profile.description || "No description"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!profile.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(profile.id)}
                      className="text-sage hover:text-birch"
                      data-testid={`button-set-default-${profile.id}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingProfile(profile)}
                        className="text-sage hover:text-birch"
                        data-testid={`button-edit-${profile.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-deep-pine border-forest-floor max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-birch">Edit Profile</DialogTitle>
                      </DialogHeader>
                      <ProfileForm profile={profile} onSuccess={() => setEditingProfile(null)} />
                    </DialogContent>
                  </Dialog>
                  {!profile.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(profile.id)}
                      className="text-ember hover:text-ember/80"
                      data-testid={`button-delete-${profile.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(profile.themeTokens as ThemeTokens || {}).slice(0, 5).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-1 text-xs text-sage/70"
                  >
                    <div
                      className="w-4 h-4 rounded border border-forest-floor"
                      style={{ backgroundColor: value }}
                    />
                    {key}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProfileForm({ profile, onSuccess }: { profile?: AppProfile; onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState(profile?.name || "");
  const [description, setDescription] = useState(profile?.description || "");
  const [brandName, setBrandName] = useState(profile?.brandName || "");
  const [logoUrl, setLogoUrl] = useState(profile?.logoUrl || "");
  const [themeTokens, setThemeTokens] = useState<ThemeTokens>(
    (profile?.themeTokens as ThemeTokens) || {
      nightForest: "#1a1f1c",
      deepPine: "#252b27",
      forestFloor: "#4a5550",
      sage: "#87A892",
      birch: "#D4C5A9",
      ember: "#E07A4A",
    }
  );
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(
    (profile?.featureFlags as FeatureFlags) || { ...defaultFeatureFlags }
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const url = profile ? `/api/admin/profiles/${profile.id}` : "/api/admin/profiles";
      const method = profile ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, brandName, logoUrl, themeTokens, featureFlags }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/app-profile"] });
      toast({ title: profile ? "Profile updated" : "Profile created" });
      onSuccess();
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name" className="text-birch">Profile Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-night-forest border-forest-floor text-birch"
            data-testid="input-profile-name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description" className="text-birch">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-night-forest border-forest-floor text-birch"
            data-testid="input-profile-description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="brandName" className="text-birch">Brand Name</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="bg-night-forest border-forest-floor text-birch"
              data-testid="input-brand-name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="logoUrl" className="text-birch">Logo URL</Label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="bg-night-forest border-forest-floor text-birch"
              data-testid="input-logo-url"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-birch mb-3">Theme Colors</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(themeTokens).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="color"
                value={value || "#000000"}
                onChange={(e) => setThemeTokens({ ...themeTokens, [key]: e.target.value })}
                className="w-10 h-10 rounded border border-forest-floor cursor-pointer"
                data-testid={`color-${key}`}
              />
              <div className="flex-1">
                <Label className="text-sage text-xs">{key}</Label>
                <Input
                  value={value || ""}
                  onChange={(e) => setThemeTokens({ ...themeTokens, [key]: e.target.value })}
                  className="h-8 bg-night-forest border-forest-floor text-birch text-xs"
                  data-testid={`input-color-${key}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-birch mb-3">Feature Flags</h3>
        <div className="grid gap-2">
          {Object.entries(featureLabels).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-2 px-3 bg-night-forest rounded">
              <Label className="text-sage text-sm">{label}</Label>
              <Switch
                checked={featureFlags[key as keyof FeatureFlags] !== false}
                onCheckedChange={(checked) => 
                  setFeatureFlags({ ...featureFlags, [key]: checked })
                }
                data-testid={`switch-${key}`}
              />
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={!name || mutation.isPending}
        className="w-full bg-birch text-night-forest hover:bg-birch/90"
        data-testid="button-save-profile"
      >
        {mutation.isPending ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
      </Button>
    </div>
  );
}

function UsersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: profiles } = useQuery<AppProfile[]>({
    queryKey: ["/api/admin/profiles"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated" });
    },
  });

  const assignProfileMutation = useMutation({
    mutationFn: async ({ userId, profileId }: { userId: string; profileId: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      if (!res.ok) throw new Error("Failed to assign profile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/app-profile"] });
      toast({ title: "Profile assigned" });
    },
  });

  if (usersLoading) {
    return <div className="text-sage text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg text-birch">User Management</h2>
      
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {users?.map((user) => (
            <Card key={user.id} className="bg-deep-pine border-forest-floor">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-birch font-medium">{user.name || user.username || "Unknown"}</p>
                      <p className="text-sage/70 text-sm">{user.email}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        user.role === "superadmin" ? "text-ember border-ember" :
                        user.role === "coach" ? "text-birch border-birch" :
                        "text-sage border-sage"
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sage/70 text-xs">Role</Label>
                      <Select
                        value={user.role || "client"}
                        onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                      >
                        <SelectTrigger className="bg-night-forest border-forest-floor text-birch" data-testid={`select-role-${user.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-deep-pine border-forest-floor">
                          <SelectItem value="client">Warrior (Client)</SelectItem>
                          <SelectItem value="coach">Guide (Coach)</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sage/70 text-xs">App Profile</Label>
                      <Select
                        onValueChange={(profileId) => assignProfileMutation.mutate({ userId: user.id, profileId })}
                      >
                        <SelectTrigger className="bg-night-forest border-forest-floor text-birch" data-testid={`select-profile-${user.id}`}>
                          <SelectValue placeholder="Assign profile..." />
                        </SelectTrigger>
                        <SelectContent className="bg-deep-pine border-forest-floor">
                          {profiles?.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.name} {profile.isDefault && "(Default)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
