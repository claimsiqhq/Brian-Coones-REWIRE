import { useState } from "react";
import { Library, Plus, BookOpen, Loader2, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJournalingTemplates, useTemplateLibrary, useCreateTemplate, type JournalingTemplate } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SharedLibrary() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalDays, setTotalDays] = useState("7");
  const [category, setCategory] = useState("general");
  const [prompts, setPrompts] = useState<{ dayNumber: number; title: string; prompt: string; tips?: string }[]>([]);
  const [currentPromptDay, setCurrentPromptDay] = useState(1);
  const [currentPromptTitle, setCurrentPromptTitle] = useState("");
  const [currentPromptText, setCurrentPromptText] = useState("");
  const [currentPromptTips, setCurrentPromptTips] = useState("");

  const { data: myTemplates = [], isLoading: loadingMine } = useJournalingTemplates();
  const { data: sharedTemplates = [], isLoading: loadingShared } = useTemplateLibrary();
  const createMutation = useCreateTemplate();
  const { toast } = useToast();

  const handleAddPrompt = () => {
    if (!currentPromptTitle || !currentPromptText) {
      toast({
        title: "Missing Info",
        description: "Please enter a title and prompt",
        variant: "destructive",
      });
      return;
    }

    setPrompts([...prompts, {
      dayNumber: currentPromptDay,
      title: currentPromptTitle,
      prompt: currentPromptText,
      tips: currentPromptTips || undefined,
    }]);
    setCurrentPromptDay(currentPromptDay + 1);
    setCurrentPromptTitle("");
    setCurrentPromptText("");
    setCurrentPromptTips("");
  };

  const handleCreateTemplate = () => {
    if (!title || prompts.length === 0) {
      toast({
        title: "Missing Info",
        description: "Please add a title and at least one prompt",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(
      {
        title,
        description: description || undefined,
        totalDays: parseInt(totalDays),
        category,
        isShared: true, // Share to library by default
        prompts,
      },
      {
        onSuccess: () => {
          toast({
            title: "Template Created",
            description: "Your template has been added to the library",
          });
          setShowCreateDialog(false);
          resetForm();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create template",
            variant: "destructive",
          });
        },
      }
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTotalDays("7");
    setCategory("general");
    setPrompts([]);
    setCurrentPromptDay(1);
    setCurrentPromptTitle("");
    setCurrentPromptText("");
    setCurrentPromptTips("");
  };

  const isLoading = loadingMine || loadingShared;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Content Library</h3>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-3 h-3 mr-1" />
          Create Template
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* My Templates */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                My Templates ({myTemplates.length})
              </h4>
              {myTemplates.length === 0 ? (
                <Card className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">No templates created yet</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {myTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              )}
            </div>

            {/* Shared Templates */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Shared Library ({sharedTemplates.length})
              </h4>
              {sharedTemplates.length === 0 ? (
                <Card className="p-4 text-center">
                  <Share2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No shared templates yet</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {sharedTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} shared />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95%] max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Create Journaling Template</DialogTitle>
            <DialogDescription>
              Build a multi-day guided journaling program for your clients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Title</Label>
              <Input
                placeholder="e.g., 7-Day Gratitude Journey"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this program helps with..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Total Days</Label>
                <Select value={totalDays} onValueChange={setTotalDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="21">21 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="gratitude">Gratitude</SelectItem>
                    <SelectItem value="mindfulness">Mindfulness</SelectItem>
                    <SelectItem value="anxiety">Anxiety</SelectItem>
                    <SelectItem value="self-discovery">Self-Discovery</SelectItem>
                    <SelectItem value="relationships">Relationships</SelectItem>
                    <SelectItem value="goals">Goals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prompts Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3">Daily Prompts ({prompts.length} added)</h4>

              {prompts.length > 0 && (
                <div className="mb-3 space-y-1">
                  {prompts.map((p, i) => (
                    <div key={i} className="text-xs p-2 bg-muted/50 rounded">
                      <span className="font-medium">Day {p.dayNumber}:</span> {p.title}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Day {currentPromptDay}</Badge>
                </div>
                <Input
                  placeholder="Prompt title (e.g., 'Morning Reflection')"
                  value={currentPromptTitle}
                  onChange={(e) => setCurrentPromptTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Write the journaling prompt..."
                  value={currentPromptText}
                  onChange={(e) => setCurrentPromptText(e.target.value)}
                  className="min-h-[80px]"
                />
                <Input
                  placeholder="Tips (optional)"
                  value={currentPromptTips}
                  onChange={(e) => setCurrentPromptTips(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPrompt}
                  className="w-full"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Prompt
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={createMutation.isPending || !title || prompts.length === 0}>
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({ template, shared }: { template: JournalingTemplate; shared?: boolean }) {
  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h5 className="font-medium text-sm">{template.title}</h5>
            {shared && (
              <Share2 className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
          </div>
          {template.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs h-5">
              {template.totalDays} days
            </Badge>
            {template.category && (
              <Badge variant="outline" className="text-xs h-5">
                {template.category}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
