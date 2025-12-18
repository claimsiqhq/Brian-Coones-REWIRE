import { useState } from "react";
import { ArrowRightLeft, Check, X, Loader2, UserPlus, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useIncomingTransfers,
  useOutgoingTransfers,
  useRespondToTransfer,
  useCreateTransfer,
  useAllCoaches,
  useCoachClients,
  type ClientTransfer,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function ClientTransfers() {
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  const { data: incoming = [], isLoading: loadingIncoming } = useIncomingTransfers();
  const { data: outgoing = [], isLoading: loadingOutgoing } = useOutgoingTransfers();
  const { data: coaches = [] } = useAllCoaches();
  const { data: clients = [] } = useCoachClients();
  const respondMutation = useRespondToTransfer();
  const createMutation = useCreateTransfer();
  const { toast } = useToast();

  const handleRespond = (id: string, status: "accepted" | "rejected") => {
    respondMutation.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast({
            title: status === "accepted" ? "Transfer Accepted" : "Transfer Declined",
            description: status === "accepted"
              ? "Client has been added to your roster"
              : "Transfer request has been declined",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to process transfer",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCreateTransfer = () => {
    if (!selectedClientId || !selectedCoachId) {
      toast({
        title: "Missing Information",
        description: "Please select a client and coach",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(
      { clientId: selectedClientId, toCoachId: selectedCoachId, notes: transferNotes },
      {
        onSuccess: () => {
          toast({
            title: "Transfer Request Sent",
            description: "The coach will be notified of your request",
          });
          setShowTransferDialog(false);
          setSelectedClientId("");
          setSelectedCoachId("");
          setTransferNotes("");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create transfer request",
            variant: "destructive",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Accepted</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingIncoming = incoming.filter(t => t.status === "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Client Transfers</h3>
          {pendingIncoming.length > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
              {pendingIncoming.length}
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={() => setShowTransferDialog(true)}>
          <Send className="w-3 h-3 mr-1" />
          Refer Client
        </Button>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="incoming" className="flex-1">
            Incoming ({incoming.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex-1">
            Outgoing ({outgoing.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <ScrollArea className="h-[350px]">
            {loadingIncoming ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : incoming.length === 0 ? (
              <Card className="p-6 text-center">
                <UserPlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No incoming transfers</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {incoming.map((transfer) => (
                  <Card key={transfer.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-violet-100 text-violet-600">
                            {transfer.client?.firstName?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {transfer.client?.firstName} {transfer.client?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            From: {transfer.fromCoach?.firstName} {transfer.fromCoach?.lastName}
                          </p>
                          {transfer.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{transfer.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(transfer.status)}
                        {transfer.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-green-600 hover:bg-green-50"
                              onClick={() => handleRespond(transfer.id, "accepted")}
                              disabled={respondMutation.isPending}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => handleRespond(transfer.id, "rejected")}
                              disabled={respondMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {transfer.createdAt && formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true })}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="outgoing">
          <ScrollArea className="h-[350px]">
            {loadingOutgoing ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : outgoing.length === 0 ? (
              <Card className="p-6 text-center">
                <Send className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No outgoing transfers</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {outgoing.map((transfer) => (
                  <Card key={transfer.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-violet-100 text-violet-600">
                            {transfer.client?.firstName?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {transfer.client?.firstName} {transfer.client?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            To: {transfer.toCoach?.firstName} {transfer.toCoach?.lastName}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(transfer.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {transfer.createdAt && formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true })}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Create Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="w-[95%] rounded-xl">
          <DialogHeader>
            <DialogTitle>Refer Client to Another Coach</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName || client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Coach</Label>
              <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a coach..." />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.firstName} {coach.lastName || coach.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add context for the receiving coach..."
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransfer} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
