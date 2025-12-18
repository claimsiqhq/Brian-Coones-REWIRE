import { useState } from "react";
import { motion } from "framer-motion";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Building2,
  Globe,
  DollarSign,
  CalendarCheck,
  ExternalLink,
  Sparkles,
  GraduationCap,
  Presentation,
  UsersRound,
  Mic2,
  CheckCircle2,
  X,
  Play,
} from "lucide-react";
import {
  useEvents,
  useMyEventRegistrations,
  useRegisterForEvent,
  useCancelEventRegistration,
  type Event,
  type EventRegistration,
} from "@/lib/api";

const eventTypeIcons: Record<string, React.ReactNode> = {
  retreat: <Building2 className="w-5 h-5" />,
  webinar: <Presentation className="w-5 h-5" />,
  masterclass: <GraduationCap className="w-5 h-5" />,
  workshop: <UsersRound className="w-5 h-5" />,
  group_session: <Mic2 className="w-5 h-5" />,
};

const eventTypeLabels: Record<string, string> = {
  retreat: "Retreat",
  webinar: "Webinar",
  masterclass: "Masterclass",
  workshop: "Workshop",
  group_session: "Group Session",
};

const eventTypeColors: Record<string, string> = {
  retreat: "from-emerald-600/30 to-teal-600/20",
  webinar: "from-blue-600/30 to-indigo-600/20",
  masterclass: "from-purple-600/30 to-pink-600/20",
  workshop: "from-orange-600/30 to-amber-600/20",
  group_session: "from-rose-600/30 to-red-600/20",
};

const locationTypeIcons: Record<string, React.ReactNode> = {
  virtual: <Video className="w-3 h-3" />,
  in_person: <MapPin className="w-3 h-3" />,
  hybrid: <Globe className="w-3 h-3" />,
};

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatEventTime(dateStr: string, timezone: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

function EventCard({
  event,
  registration,
  onRegister,
  onViewDetails,
}: {
  event: Event;
  registration?: EventRegistration;
  onRegister?: () => void;
  onViewDetails: () => void;
}) {
  const isRegistered = registration?.status === "registered";
  const upcoming = isUpcoming(event.startTime);
  const hasRecording = !!event.recordingUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="overflow-hidden border-forest-floor bg-deep-pine cursor-pointer hover:border-sage/50 transition-all"
        onClick={onViewDetails}
      >
        <CardContent className="p-0">
          <div
            className={`h-20 bg-gradient-to-br ${eventTypeColors[event.eventType] || "from-forest-floor to-deep-pine"} relative flex items-center justify-center`}
          >
            <div className="text-white/80">
              {eventTypeIcons[event.eventType] || <Calendar className="w-8 h-8" />}
            </div>
            <div className="absolute top-2 left-2">
              <Badge className="bg-black/30 text-white border-0 text-[10px]">
                {eventTypeLabels[event.eventType]}
              </Badge>
            </div>
            {isRegistered && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-green-500/80 text-white border-0 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Registered
                </Badge>
              </div>
            )}
            {!upcoming && hasRecording && (
              <div className="absolute bottom-2 right-2">
                <Badge className="bg-birch/80 text-deep-pine border-0 text-[10px]">
                  <Play className="w-3 h-3 mr-1" />
                  Recording
                </Badge>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-birch text-sm line-clamp-1">
              {event.title}
            </h3>
            <p className="text-xs text-sage/70 mt-1 line-clamp-2">
              {event.description}
            </p>

            <div className="flex items-center gap-3 mt-3 text-xs text-sage/60">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatEventDate(event.startTime)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatEventTime(event.startTime, event.timezone)}
              </span>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 border-sage/30 text-sage/80"
                >
                  {locationTypeIcons[event.locationType]}
                  <span className="ml-1 capitalize">{event.locationType.replace("_", " ")}</span>
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 border-sage/30 text-sage/80"
                >
                  {formatPrice(event.priceCents)}
                </Badge>
              </div>
              {upcoming && !isRegistered && onRegister && (
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs bg-birch/20 hover:bg-birch/30 text-birch"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegister();
                  }}
                >
                  Register
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeType, setActiveType] = useState<string | undefined>(undefined);

  const { data: allEvents, isLoading } = useEvents({ upcoming: true });
  const { data: myRegistrations } = useMyEventRegistrations();

  const registerForEvent = useRegisterForEvent();
  const cancelRegistration = useCancelEventRegistration();

  const registrationMap = new Map(
    myRegistrations?.map((r) => [r.eventId, r]) || []
  );

  const filteredEvents = activeType
    ? allEvents?.filter((e) => e.eventType === activeType)
    : allEvents;

  const registeredEvents =
    myRegistrations?.filter((r) => r.status === "registered").map((r) => r.event) || [];

  const handleRegister = (eventId: string) => {
    registerForEvent.mutate(eventId);
  };

  const handleCancel = (eventId: string) => {
    cancelRegistration.mutate(eventId);
    setSelectedEvent(null);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-night-forest">
        {/* Header */}
        <div className="bg-gradient-to-br from-deep-pine via-forest-floor/80 to-night-forest px-6 pt-6 pb-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-birch">
                Events Hub
              </h1>
              <p className="text-sage/80 mt-1">Retreats, webinars & more</p>
            </div>
            {registeredEvents.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 rounded-full">
                <CalendarCheck className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-green-400">
                  {registeredEvents.length} upcoming
                </span>
              </div>
            )}
          </div>

          {/* Type Filters */}
          <ScrollArea className="mt-4 -mx-2 px-2">
            <div className="flex gap-2 pb-1">
              <Button
                variant="outline"
                size="sm"
                className={`h-7 text-xs whitespace-nowrap ${!activeType ? "bg-birch/20 text-birch border-birch/50" : "text-sage border-sage/30"}`}
                onClick={() => setActiveType(undefined)}
              >
                All
              </Button>
              {Object.entries(eventTypeLabels).map(([key, label]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className={`h-7 text-xs whitespace-nowrap ${activeType === key ? "bg-birch/20 text-birch border-birch/50" : "text-sage border-sage/30"}`}
                  onClick={() => setActiveType(activeType === key ? undefined : key)}
                >
                  {eventTypeIcons[key]}
                  <span className="ml-1.5">{label}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <Tabs defaultValue={registeredEvents.length > 0 ? "registered" : "browse"} className="px-4 pt-4">
            <TabsList className="w-full bg-deep-pine/50 mb-4">
              <TabsTrigger value="browse" className="flex-1 text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Browse
              </TabsTrigger>
              <TabsTrigger value="registered" className="flex-1 text-xs">
                <CalendarCheck className="w-3 h-3 mr-1" />
                My Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-3 pb-6">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-48 bg-deep-pine animate-pulse" />
                  ))}
                </div>
              ) : filteredEvents?.length === 0 ? (
                <div className="text-center py-12 text-sage/60">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming events</p>
                  <p className="text-xs mt-1">Check back soon!</p>
                </div>
              ) : (
                filteredEvents?.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    registration={registrationMap.get(event.id)}
                    onRegister={() => handleRegister(event.id)}
                    onViewDetails={() => setSelectedEvent(event)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="registered" className="space-y-3 pb-6">
              {registeredEvents.length === 0 ? (
                <div className="text-center py-12 text-sage/60">
                  <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No registered events</p>
                  <p className="text-xs mt-1">Browse and register for events</p>
                </div>
              ) : (
                registeredEvents.map(
                  (event) =>
                    event && (
                      <EventCard
                        key={event.id}
                        event={event}
                        registration={registrationMap.get(event.id)}
                        onViewDetails={() => setSelectedEvent(event)}
                      />
                    )
                )
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Event Details Dialog */}
        <Dialog
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
        >
          <DialogContent className="bg-deep-pine border-forest-floor max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                {selectedEvent && eventTypeIcons[selectedEvent.eventType]}
                <Badge className="text-[10px]">
                  {selectedEvent && eventTypeLabels[selectedEvent.eventType]}
                </Badge>
              </div>
              <DialogTitle className="text-birch mt-2">
                {selectedEvent?.title}
              </DialogTitle>
              <DialogDescription className="text-sage/70">
                {selectedEvent?.description}
              </DialogDescription>
            </DialogHeader>

            {selectedEvent && (
              <div className="space-y-4">
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-birch/10 rounded-lg p-3">
                    <Calendar className="w-4 h-4 text-birch mb-1" />
                    <p className="text-xs text-sage/60">Date</p>
                    <p className="text-sm font-medium text-birch">
                      {formatEventDate(selectedEvent.startTime)}
                    </p>
                  </div>
                  <div className="bg-birch/10 rounded-lg p-3">
                    <Clock className="w-4 h-4 text-birch mb-1" />
                    <p className="text-xs text-sage/60">Time</p>
                    <p className="text-sm font-medium text-birch">
                      {formatEventTime(selectedEvent.startTime, selectedEvent.timezone)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-forest-floor/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-birch">
                    {locationTypeIcons[selectedEvent.locationType]}
                    <span className="text-sm font-medium capitalize">
                      {selectedEvent.locationType.replace("_", " ")}
                    </span>
                  </div>
                  {selectedEvent.locationDetails && (
                    <p className="text-xs text-sage/70 mt-1">
                      {selectedEvent.locationDetails}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between bg-birch/10 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-birch" />
                    <span className="text-sm font-medium text-birch">
                      {formatPrice(selectedEvent.priceCents)}
                    </span>
                    {selectedEvent.vipPriceCents && (
                      <Badge variant="outline" className="text-[10px] text-sage">
                        <Sparkles className="w-3 h-3 mr-1" />
                        VIP: {formatPrice(selectedEvent.vipPriceCents)}
                      </Badge>
                    )}
                  </div>
                  {selectedEvent.maxParticipants && (
                    <div className="flex items-center gap-1 text-sage/60 text-xs">
                      <Users className="w-3 h-3" />
                      {selectedEvent.maxParticipants} spots
                    </div>
                  )}
                </div>

                {/* Recording */}
                {selectedEvent.recordingUrl && (
                  <div className="bg-birch/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-birch">
                        <Play className="w-4 h-4" />
                        <span className="text-sm font-medium">Recording Available</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-birch"
                        onClick={() => window.open(selectedEvent.recordingUrl!, "_blank")}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Watch
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {registrationMap.get(selectedEvent.id)?.status === "registered" ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleCancel(selectedEvent.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel Registration
                      </Button>
                      <Button
                        className="flex-1 bg-birch hover:bg-birch/90 text-deep-pine"
                        onClick={() => {
                          // Would integrate with calendar
                          setSelectedEvent(null);
                        }}
                      >
                        <CalendarCheck className="w-4 h-4 mr-1" />
                        Add to Calendar
                      </Button>
                    </>
                  ) : isUpcoming(selectedEvent.startTime) ? (
                    <Button
                      className="flex-1 bg-birch hover:bg-birch/90 text-deep-pine"
                      onClick={() => {
                        handleRegister(selectedEvent.id);
                        setSelectedEvent(null);
                      }}
                      disabled={registerForEvent.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {registerForEvent.isPending ? "Registering..." : "Register Now"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedEvent(null)}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}
