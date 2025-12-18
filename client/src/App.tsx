import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "next-themes";
import { CelebrationProvider } from "@/hooks/useCelebration";
import { AppProfileProvider } from "@/hooks/useAppProfile";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/lib/api";
import { Loader2 } from "lucide-react";

// Store pending invite code for redirect after login
const PENDING_INVITE_KEY = "pending_invite_code";

// Eagerly loaded pages (small/critical)
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";

// Lazy loaded pages (heavy/not immediately needed)
const Journal = lazy(() => import("@/pages/journal"));
const Voice = lazy(() => import("@/pages/voice"));
const Profile = lazy(() => import("@/pages/profile"));
const Focus = lazy(() => import("@/pages/focus"));
const Stats = lazy(() => import("@/pages/stats"));
const Vision = lazy(() => import("@/pages/vision"));
const CoachDashboard = lazy(() => import("@/pages/coach-dashboard"));
const JoinCoach = lazy(() => import("@/pages/join-coach"));
const Templates = lazy(() => import("@/pages/templates"));
const AdminPanel = lazy(() => import("@/pages/admin-panel"));
const Library = lazy(() => import("@/pages/library"));
const Challenges = lazy(() => import("@/pages/challenges"));
const Events = lazy(() => import("@/pages/events"));
const Metrics = lazy(() => import("@/pages/metrics"));

// ThemeSync component to sync settings with theme
function ThemeSync() {
  const { data: settings } = useUserSettings();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (settings?.darkMode !== undefined) {
      setTheme(settings.darkMode ? "dark" : "light");
    }
  }, [settings?.darkMode, setTheme]);

  return null;
}

// Loading fallback component for lazy loaded pages
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Loading page...</p>
      </div>
    </div>
  );
}

function AuthenticatedRouter() {
  // Role is now selected at registration and is permanent
  // No need to check for missing role - all new users have one

  return (
    <>
      <ThemeSync />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/journal" component={Journal} />
          <Route path="/voice" component={Voice} />
          <Route path="/profile" component={Profile} />
          <Route path="/focus" component={Focus} />
          <Route path="/stats" component={Stats} />
          <Route path="/vision" component={Vision} />
          <Route path="/clients" component={CoachDashboard} />
          <Route path="/join/:code" component={JoinCoach} />
          <Route path="/templates" component={Templates} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/library" component={Library} />
          <Route path="/challenges" component={Challenges} />
          <Route path="/events" component={Events} />
          <Route path="/metrics" component={Metrics} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  // Store invite code if user lands on /join/:code while not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const match = location.match(/^\/join\/([a-zA-Z0-9]+)$/);
      if (match) {
        localStorage.setItem(PENDING_INVITE_KEY, match[1]);
      }
    }
  }, [isLoading, isAuthenticated, location]);

  // Redirect to pending invite after authentication
  useEffect(() => {
    if (isAuthenticated) {
      const pendingCode = localStorage.getItem(PENDING_INVITE_KEY);
      if (pendingCode) {
        localStorage.removeItem(PENDING_INVITE_KEY);
        setLocation(`/join/${pendingCode}`);
      }
    }
  }, [isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Check if there's a pending invite to show context message
    const pendingInvite = localStorage.getItem(PENDING_INVITE_KEY);
    return <AuthPage pendingInvite={pendingInvite} />;
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AppProfileProvider>
          <TooltipProvider>
            <CelebrationProvider>
              <Toaster />
              <AppContent />
            </CelebrationProvider>
          </TooltipProvider>
        </AppProfileProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
