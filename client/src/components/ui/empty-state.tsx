import { cn } from "@/lib/utils";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  iconClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      {/* Decorative background glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-teal/20 to-sage/10 rounded-full blur-2xl scale-150" />
        <div
          className={cn(
            "relative w-20 h-20 rounded-2xl bg-gradient-to-br from-deep-pine to-forest-floor flex items-center justify-center border border-forest-floor/50",
            iconClassName
          )}
        >
          <Icon className="w-10 h-10 text-sage" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-lg font-display font-semibold text-birch mb-2">
        {title}
      </h3>
      <p className="text-sm text-sage/70 max-w-xs mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-teal to-sage hover:from-teal/90 hover:to-sage/90 text-night-forest font-medium shadow-md glow-accent"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function EmptyHabits({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").Target}
      title="No Anchors Yet"
      description="Start building your grounding routine by adding your first daily anchor."
      actionLabel="Add Your First Anchor"
      onAction={onAdd}
    />
  );
}

export function EmptyJournalEntries({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").BookHeart}
      title="Your Journal Awaits"
      description="Capture your thoughts and reflections. Each entry helps you understand yourself better."
      actionLabel="Write Your First Entry"
      onAction={onAdd}
    />
  );
}

export function EmptyMoodHistory() {
  return (
    <EmptyState
      icon={require("lucide-react").Heart}
      title="No Mood Data Yet"
      description="Complete your daily ground check to start tracking your emotional patterns over time."
    />
  );
}

export function EmptySessions() {
  return (
    <EmptyState
      icon={require("lucide-react").Calendar}
      title="No Sessions Scheduled"
      description="Connect with your coach to schedule your first grounding session."
    />
  );
}

export function EmptyClients({ onInvite }: { onInvite: () => void }) {
  return (
    <EmptyState
      icon={require("lucide-react").Users}
      title="No Brothers Yet"
      description="Invite your first client to start their wellness journey with your guidance."
      actionLabel="Send an Invitation"
      onAction={onInvite}
    />
  );
}

export function EmptyPractices() {
  return (
    <EmptyState
      icon={require("lucide-react").Wind}
      title="Explore Practices"
      description="Discover breathing techniques, meditations, and body scans to support your wellbeing."
    />
  );
}
