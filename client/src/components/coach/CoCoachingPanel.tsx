import { useState } from "react";
import { Users, Plus, X, Loader2, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCoCoaches, useAddCoCoach, useRemoveCoCoach, useAllCoaches, type CoCoach } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CoCoachingPanelProps {
  clientId: string;
  clientName: string;
}

export default function CoCoachingPanel({ clientId, clientName }: CoCoachingPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [selectedRole, setSelectedRole] = useState("co-coach");

  const { data: coCoaches = [], isLoading } = useCoCoaches(clientId);
  const { data: allCoaches = [] } = useAllCoaches();
  const addMutation = useAddCoCoach();
  const removeMutation = useRemoveCoCoach();
  const { toast } = useToast();

  // Filter out coaches already assigned
  const availableCoaches = allCoaches.filter(
    (c) => !coCoaches.some((cc) => cc.secondaryCoachId === c.id)
  );

  const handleAddCoCoach = () => {
    if (!selectedCoachId) {
      toast({
        title: "Select a Coach",
        description: "Please select a coach to add",
        variant: "destructive",
      });
      return;
    }

    addMutation.mutate(
      { clientId, secondaryCoachId: selectedCoachId, role: selectedRole },
      {
        onSuccess: () => {
          toast({
            title: "Co-Coach Added",
            description: "The coach now has access to this client",
          });
          setShowAddDialog(false);
          setSelectedCoachId("");
          setSelectedRole("co-coach");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to add co-coach",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleRemoveCoCoach = (coCoachId: string) => {
    removeMutation.mutate(
      { clientId, coCoachId },
      {
        onSuccess: () => {
          toast({
            title: "Co-Coach Removed",
            description: "Access has been revoked",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to remove co-coach",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "specialist":
        return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Specialist</Badge>;
      case "supervisor":
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Supervisor</Badge>;
      default:
        return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Co-Coach</Badge>;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm">Co-Coaching Team</h4>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : coCoaches.length === 0 ? (
        <div className="text-center py-4">
          <UserPlus className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No co-coaches assigned</p>
          <p className="text-xs text-muted-foreground">Add coaches to collaborate on this client</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coCoaches.map((cc) => (
            <div
              key={cc.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {cc.secondaryCoach?.profileImageUrl && (
                    <AvatarImage src={cc.secondaryCoach.profileImageUrl} />
                  )}
                  <AvatarFallback className="bg-violet-100 text-violet-600 text-xs">
                    {cc.secondaryCoach?.firstName?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {cc.secondaryCoach?.firstName} {cc.secondaryCoach?.lastName}
                  </p>
                  <div className="mt-0.5">{getRoleBadge(cc.role)}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                onClick={() => handleRemoveCoCoach(cc.id)}
                disabled={removeMutation.isPending}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Co-Coach Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95%] rounded-xl">
          <DialogHeader>
            <DialogTitle>Add Co-Coach for {clientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Coach</Label>
              <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a coach..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCoaches.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No available coaches
                    </SelectItem>
                  ) : (
                    availableCoaches.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.firstName} {coach.lastName || coach.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="co-coach">Co-Coach (Equal access)</SelectItem>
                  <SelectItem value="specialist">Specialist (Focused area)</SelectItem>
                  <SelectItem value="supervisor">Supervisor (Oversight)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCoCoach} disabled={addMutation.isPending || !selectedCoachId}>
              {addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Add Co-Coach"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
