import { useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, BookOpen, Calendar, Play, Check, Lightbulb, Loader2 } from "lucide-react";
import { useTemplateLibrary, useTemplateProgress, useTemplate, useStartTemplate, useSubmitTemplateEntry, type JournalingTemplate, type UserTemplateProgress } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Templates() {
  const [selectedTemplate, setSelectedTemplate] = useState<JournalingTemplate | null>(null);
  const [activeProgress, setActiveProgress] = useState<UserTemplateProgress | null>(null);
  const [entryContent, setEntryContent] = useState("");
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  const { data: libraryTemplates = [], isLoading: loadingLibrary } = useTemplateLibrary();
  const { data: myProgress = [], isLoading: loadingProgress } = useTemplateProgress();
  const { data: templateDetails } = useTemplate(selectedTemplate?.id || activeProgress?.templateId || null);
  const startTemplateMutation = useStartTemplate();
  const submitEntryMutation = useSubmitTemplateEntry();
  const { toast } = useToast();

  const handleStartTemplate = (template: JournalingTemplate) => {
    startTemplateMutation.mutate(template.id, {
      onSuccess: (progress) => {
        setActiveProgress(progress);
        setSelectedTemplate(template);
        toast({ title: "Journey started!", description: `Day 1 of ${template.totalDays} begins now.` });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to start program.", variant: "destructive" });
      },
    });
  };

  const handleSubmitEntry = () => {
    if (!activeProgress || !templateDetails || !entryContent.trim()) return;

    const currentPrompt = templateDetails.prompts.find(p => p.dayNumber === activeProgress.currentDay);
    if (!currentPrompt) return;

    submitEntryMutation.mutate(
      { progressId: activeProgress.id, promptId: currentPrompt.id, content: entryContent },
      {
        onSuccess: () => {
          toast({ title: "Entry saved!", description: "Great reflection! Keep up the momentum." });
          setEntryContent("");
          setShowPromptDialog(false);
          // Refresh progress
          setActiveProgress(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save entry.", variant: "destructive" });
        },
      }
    );
  };

  // Show active program view
  if (activeProgress && templateDetails) {
    const currentPrompt = templateDetails.prompts.find(p => p.dayNumber === activeProgress.currentDay);
    const progressPercent = ((activeProgress.currentDay - 1) / templateDetails.totalDays) * 100;

    return (
      <MobileLayout>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border/50">
            <Button variant="ghost" size="sm" onClick={() => setActiveProgress(null)} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl font-display font-bold">{templateDetails.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={progressPercent} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">
                Day {activeProgress.currentDay}/{templateDetails.totalDays}
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {currentPrompt ? (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader>
                  <div className="flex items-center gap-2 text-primary">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Day {currentPrompt.dayNumber}</span>
                  </div>
                  <CardTitle className="text-lg">{currentPrompt.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{currentPrompt.prompt}</p>

                  {currentPrompt.tips && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">{currentPrompt.tips}</p>
                    </div>
                  )}

                  <Button
                    onClick={() => setShowPromptDialog(true)}
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Write Today's Entry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Check className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <h3 className="font-semibold text-lg">Program Complete!</h3>
                  <p className="text-muted-foreground mt-1">
                    Congratulations on completing this journey.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Previous days overview */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Your Journey</h3>
              <div className="space-y-2">
                {templateDetails.prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-3 rounded-lg border ${
                      prompt.dayNumber < activeProgress.currentDay
                        ? "bg-green-50 border-green-200"
                        : prompt.dayNumber === activeProgress.currentDay
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/30 border-border/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {prompt.dayNumber < activeProgress.currentDay ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : prompt.dayNumber === activeProgress.currentDay ? (
                        <Play className="w-4 h-4 text-primary" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className="text-sm font-medium">Day {prompt.dayNumber}: {prompt.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Entry Dialog */}
          <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
            <DialogContent className="w-[95%] rounded-xl">
              <DialogHeader>
                <DialogTitle>{currentPrompt?.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{currentPrompt?.prompt}</p>
                <Textarea
                  placeholder="Write your thoughts..."
                  value={entryContent}
                  onChange={(e) => setEntryContent(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowPromptDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleSubmitEntry}
                  disabled={!entryContent.trim() || submitEntryMutation.isPending}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  {submitEntryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Entry"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </MobileLayout>
    );
  }

  // Main template library view
  return (
    <MobileLayout>
      <div className="flex flex-col h-full">
        <div className="p-6 pb-2">
          <h1 className="text-2xl font-display font-bold">Guided Programs</h1>
          <p className="text-muted-foreground mt-1">Multi-day journaling journeys for growth</p>
        </div>

        <ScrollArea className="flex-1 px-4">
          {/* Active Programs */}
          {myProgress.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
                Continue Your Journey
              </h2>
              <div className="space-y-3">
                {myProgress.filter(p => !p.completedAt).map((progress) => (
                  <Card
                    key={progress.id}
                    className="cursor-pointer hover:shadow-md transition-all border-primary/30 bg-gradient-to-r from-primary/5 to-transparent"
                    onClick={() => {
                      setActiveProgress(progress);
                      if (progress.template) setSelectedTemplate(progress.template);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{progress.template?.title || "Program"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Day {progress.currentDay} of {progress.template?.totalDays || "?"}
                          </p>
                        </div>
                        <Button size="sm" className="bg-primary">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                      <Progress
                        value={((progress.currentDay - 1) / (progress.template?.totalDays || 7)) * 100}
                        className="mt-3 h-1.5"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Template Library */}
          <div className="pb-6">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Explore Programs
            </h2>

            {loadingLibrary ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : libraryTemplates.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No programs available yet.</p>
                  <p className="text-sm text-muted-foreground/70">Check back soon for new journeys!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {libraryTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shrink-0">
                          <BookOpen className="w-8 h-8" />
                        </div>
                        <div className="flex-1 p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{template.title}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {template.totalDays} days
                            </Badge>
                            {template.category && (
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="mt-2 h-7 text-xs bg-gradient-to-r from-primary to-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTemplate(template);
                            }}
                            disabled={startTemplateMutation.isPending}
                          >
                            {startTemplateMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Play className="w-3 h-3 mr-1" /> Start Journey
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </MobileLayout>
  );
}
