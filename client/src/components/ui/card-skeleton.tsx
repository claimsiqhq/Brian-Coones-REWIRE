import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-forest-floor/30 bg-deep-pine/50 p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function HabitCardSkeleton() {
  return (
    <div className="flex items-center p-3 rounded-lg bg-night-forest/50 border border-forest-floor/30">
      <Skeleton className="h-5 w-5 rounded-full mr-3" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-8 ml-2" />
    </div>
  );
}

export function MoodCardSkeleton() {
  return (
    <div className="rounded-xl border border-forest-floor/30 bg-deep-pine/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-4 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 flex-1 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function StatsBarSkeleton() {
  return (
    <div className="flex justify-between items-center bg-deep-pine/80 rounded-xl px-3 py-2 border border-forest-floor/30">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

export function SessionCardSkeleton() {
  return (
    <div className="rounded-xl border border-forest-floor/30 bg-deep-pine/50 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function MetricsCardSkeleton() {
  return (
    <div className="rounded-xl border border-forest-floor/30 bg-deep-pine/50 p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function PracticeCardSkeleton() {
  return (
    <div className="rounded-xl border border-forest-floor/30 bg-deep-pine overflow-hidden">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 flex-shrink-0" />
        <div className="flex-1 py-3 pr-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-3 px-3 pt-2">
      {/* Header skeleton */}
      <div className="h-24 rounded-b-2xl bg-gradient-to-br from-deep-pine to-night-forest animate-pulse" />

      {/* Stats bar */}
      <StatsBarSkeleton />

      {/* Mood card */}
      <MoodCardSkeleton />

      {/* Habit cards */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        {[1, 2, 3].map((i) => (
          <HabitCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function JournalListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ClientListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  );
}
