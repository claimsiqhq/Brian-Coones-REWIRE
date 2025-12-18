import { useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MoreHorizontal, Pin, Pencil, Trash2, Eye, Sparkles, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useJournalEntries, useCreateJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry, useActiveHomework, useCompleteHomework, useJournalPrompts } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { JournalEntry } from "@shared/schema";

const moodColors: Record<string, { bg: string; text: string }> = {
  "Rough": { bg: "bg-rose-900/30", text: "text-rose-400" },
  "Okay": { bg: "bg-slate-800/30", text: "text-slate-400" },
  "Good": { bg: "bg-sky-900/30", text: "text-sky-400" },
  "Great": { bg: "bg-sage/20", text: "text-sage" },
  "Amazing": { bg: "bg-birch/20", text: "text-birch" },
  "Anxious": { bg: "bg-orange-900/30", text: "text-orange-400" },
  "Grateful": { bg: "bg-sage/20", text: "text-sage" },
  "Inspired": { bg: "bg-sky-900/30", text: "text-sky-400" },
  "Calm": { bg: "bg-forest-floor/30", text: "text-sage" },
};

function formatDate(timestamp: Date | string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (entryDate.getTime() === today.getTime()) {
    return `Today, ${timeStr}`;
  } else if (entryDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${timeStr}`;
  } else {
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
  }
}

export default function Journal() {
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newMood, setNewMood] = useState("");
  
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editMood, setEditMood] = useState("");
  const [deleteEntry, setDeleteEntry] = useState<JournalEntry | null>(null);

  const { data: journals = [] } = useJournalEntries();
  const { data: homework } = useActiveHomework();
  const { data: prompts = [], isLoading: promptsLoading, refetch: refetchPrompts } = useJournalPrompts();
  const createJournalMutation = useCreateJournalEntry();
  const updateJournalMutation = useUpdateJournalEntry();
  const deleteJournalMutation = useDeleteJournalEntry();
  const completeHomeworkMutation = useCompleteHomework();
  const { toast } = useToast();

  const handlePromptClick = (prompt: string) => {
    setNewTitle(prompt);
    setShowNewEntry(true);
  };

  const handleCreateEntry = () => {
    if (newTitle.trim() && newContent.trim()) {
      createJournalMutation.mutate({
        title: newTitle,
        content: newContent,
        mood: newMood || undefined,
      }, {
        onSuccess: () => {
          toast({
            title: "Entry saved!",
            description: "Your journal entry has been created.",
          });
          setNewTitle("");
          setNewContent("");
          setNewMood("");
          setShowNewEntry(false);
        }
      });
    }
  };

  const handleCompleteHomework = () => {
    if (homework) {
      completeHomeworkMutation.mutate(homework.id, {
        onSuccess: () => {
          toast({
            title: "Homework completed!",
            description: "Great job finishing your assignment.",
          });
        }
      });
    }
  };

  const handleViewEntry = (entry: JournalEntry) => {
    setViewEntry(entry);
  };

  const handleStartEdit = (entry: JournalEntry) => {
    setEditEntry(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditMood(entry.mood || "");
  };

  const handleSaveEdit = () => {
    if (editEntry && editTitle.trim() && editContent.trim()) {
      updateJournalMutation.mutate({
        id: editEntry.id,
        title: editTitle,
        content: editContent,
        mood: editMood || null,
      }, {
        onSuccess: () => {
          toast({
            title: "Entry updated!",
            description: "Your changes have been saved.",
          });
          setEditEntry(null);
          setEditTitle("");
          setEditContent("");
          setEditMood("");
        }
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteEntry) {
      deleteJournalMutation.mutate(deleteEntry.id, {
        onSuccess: () => {
          toast({
            title: "Entry deleted",
            description: "The journal entry has been removed.",
          });
          setDeleteEntry(null);
        }
      });
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-deep-pine via-forest-floor/80 to-night-forest text-birch px-5 pt-6 pb-5 rounded-b-2xl relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sage/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h1 className="text-xl font-display font-bold text-birch">Reflections</h1>
              <p className="text-sage/80 text-xs mt-0.5">Go deeper within</p>
            </div>
            <Button 
              size="icon" 
              className="h-10 w-10 rounded-full shadow-lg bg-sage/20 hover:bg-sage/30 shrink-0"
              onClick={() => setShowNewEntry(true)}
              data-testid="button-new-journal"
            >
              <Plus className="w-5 h-5 text-birch" />
            </Button>
          </div>
        </div>

        {/* List Container - No Visible Scrollbar */}
        <div className="flex-1 px-5 pb-2 overflow-y-auto no-scrollbar">
          <div className="space-y-3">
            {/* AI Journal Prompts */}
            <Card className="border-forest-floor/50 shadow-md bg-deep-pine/80 overflow-hidden" data-testid="card-journal-prompts">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sage to-forest-floor flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-birch" />
                    </div>
                    <span className="text-sage font-semibold text-xs uppercase tracking-wider">Today's Prompts</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-sage/60 hover:text-sage"
                    onClick={() => refetchPrompts()}
                    disabled={promptsLoading}
                    data-testid="button-refresh-prompts"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${promptsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {promptsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-sage/60 py-2">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Generating personalized prompts...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {prompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-auto py-1.5 px-3 text-xs text-left whitespace-normal bg-forest-floor/40 hover:bg-forest-floor/60 text-birch border-forest-floor hover:border-sage transition-all"
                        onClick={() => handlePromptClick(prompt)}
                        data-testid={`button-prompt-${index}`}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pinned Homework Card */}
            {homework && (
              <Card className="border-none shadow-lg bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 overflow-hidden" data-testid="card-homework">
                <CardContent className="p-4 relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-accent/20 to-transparent rounded-bl-full" />
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Pin className="w-3 h-3 text-white fill-current" />
                    </div>
                    <span className="text-primary font-semibold text-xs uppercase tracking-wider">Session Homework</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug pl-8" data-testid="text-homework-content">
                    "{homework.content}"
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Button 
                      size="sm" 
                      className="h-8 text-xs bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-md"
                      onClick={handleCompleteHomework}
                      disabled={completeHomeworkMutation.isPending}
                      data-testid="button-complete-homework"
                    >
                      {completeHomeworkMutation.isPending ? "Completing..." : "✓ Mark Complete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {journals.length === 0 && !homework && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No journal entries yet.</p>
                <p className="text-xs mt-1">Tap + to create your first entry.</p>
              </div>
            )}

            {journals.map((entry) => {
              const moodStyle = entry.mood ? moodColors[entry.mood] || { bg: "bg-gray-100", text: "text-gray-600" } : null;
              return (
                <Card key={entry.id} className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer group bg-white/90 backdrop-blur-sm hover:scale-[1.01]" data-testid={`card-journal-${entry.id}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      {moodStyle ? (
                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide ${moodStyle.bg} ${moodStyle.text} shadow-sm`} data-testid={`text-journal-mood-${entry.id}`}>
                          {entry.mood}
                        </div>
                      ) : (
                        <div />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-primary" data-testid={`button-journal-menu-${entry.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem onClick={() => handleViewEntry(entry)} data-testid={`menu-view-${entry.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartEdit(entry)} data-testid={`menu-edit-${entry.id}`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteEntry(entry)} 
                            className="text-red-600 focus:text-red-600"
                            data-testid={`menu-delete-${entry.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-bold text-sm mb-1.5 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary group-hover:bg-clip-text group-hover:text-transparent transition-all" data-testid={`text-journal-title-${entry.id}`}>{entry.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed" data-testid={`text-journal-preview-${entry.id}`}>
                      {entry.content}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-primary/60 font-medium" data-testid={`text-journal-date-${entry.id}`}>
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.timestamp)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* New Entry Dialog */}
      <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
        <DialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-xl">New Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Entry title or prompt..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="min-h-[100px] border-border resize-none"
              rows={4}
              data-testid="input-journal-title"
            />
            <Textarea 
              placeholder="What's on your mind?" 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[120px] border-border"
              data-testid="input-journal-content"
            />
            <div>
              <p className="text-xs text-muted-foreground mb-2">How are you feeling?</p>
              <div className="flex gap-2 flex-wrap">
                {["Calm", "Grateful", "Inspired", "Anxious", "Rough"].map((mood) => (
                  <Button
                    key={mood}
                    type="button"
                    variant={newMood === mood ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setNewMood(newMood === mood ? "" : mood)}
                    data-testid={`button-mood-${mood.toLowerCase()}`}
                  >
                    {mood}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setShowNewEntry(false)} className="flex-1" data-testid="button-cancel-journal">
              Cancel
            </Button>
            <Button 
              className="flex-1 shadow-md" 
              onClick={handleCreateEntry}
              disabled={!newTitle.trim() || !newContent.trim() || createJournalMutation.isPending}
              data-testid="button-save-journal"
            >
              {createJournalMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={(open) => !open && setViewEntry(null)}>
        <DialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-xl" data-testid="view-entry-title">{viewEntry?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {viewEntry?.mood && (
              <div className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide mb-3 ${moodColors[viewEntry.mood]?.bg || "bg-gray-100"} ${moodColors[viewEntry.mood]?.text || "text-gray-600"}`}>
                {viewEntry.mood}
              </div>
            )}
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" data-testid="view-entry-content">
              {viewEntry?.content}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              {viewEntry && formatDate(viewEntry.timestamp)}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewEntry(null)} className="w-full" data-testid="button-close-view">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)}>
        <DialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Entry title..."
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="border-border"
              data-testid="input-edit-title"
            />
            <Textarea 
              placeholder="What's on your mind?" 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[120px] border-border"
              data-testid="input-edit-content"
            />
            <div>
              <p className="text-xs text-muted-foreground mb-2">How are you feeling?</p>
              <div className="flex gap-2 flex-wrap">
                {["Calm", "Grateful", "Inspired", "Anxious", "Rough"].map((mood) => (
                  <Button
                    key={mood}
                    type="button"
                    variant={editMood === mood ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setEditMood(editMood === mood ? "" : mood)}
                    data-testid={`button-edit-mood-${mood.toLowerCase()}`}
                  >
                    {mood}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setEditEntry(null)} className="flex-1" data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button 
              className="flex-1 shadow-md" 
              onClick={handleSaveEdit}
              disabled={!editTitle.trim() || !editContent.trim() || updateJournalMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateJournalMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteEntry?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <AlertDialogCancel className="flex-1" data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
              disabled={deleteJournalMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteJournalMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
