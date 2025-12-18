import { Link, useLocation } from "wouter";
import { Home, BookHeart, Mic, Wind, User, BarChart3, Eye, Users, TreeDeciduous, Library, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAppProfile } from "@/hooks/useAppProfile";
import type { FeatureFlags } from "@shared/schema";

interface MobileLayoutProps {
  children: React.ReactNode;
  /** Allow full width on larger screens (tablet/desktop) */
  fullWidth?: boolean;
}

export default function MobileLayout({ children, fullWidth = false }: MobileLayoutProps) {
  const [location] = useLocation();
  const { isCoach } = useAuth();
  const { isFeatureEnabled } = useAppProfile();

  // Navigation items with their associated feature flags
  interface NavItem {
    icon: typeof Home;
    label: string;
    path: string;
    featureFlag?: keyof FeatureFlags;
  }

  const allLeftNavItems: NavItem[] = [
    { icon: Home, label: "Ground", path: "/", featureFlag: "groundCheck" },
    { icon: BookHeart, label: "Reflect", path: "/journal", featureFlag: "reflections" },
    { icon: Library, label: "Library", path: "/library", featureFlag: "groundingPractice" },
  ];

  const allRightNavItemsCoach: NavItem[] = [
    { icon: Users, label: "Brothers", path: "/clients", featureFlag: "brotherhood" },
    { icon: Activity, label: "Metrics", path: "/metrics", featureFlag: "achievements" },
    { icon: User, label: "Profile", path: "/profile" }, // Always visible
  ];

  const allRightNavItemsClient: NavItem[] = [
    { icon: TreeDeciduous, label: "Vision", path: "/vision", featureFlag: "visionBoard" },
    { icon: Activity, label: "Metrics", path: "/metrics", featureFlag: "achievements" },
    { icon: User, label: "Profile", path: "/profile" }, // Always visible
  ];

  // Filter nav items based on feature flags
  const filterByFeatureFlag = (items: NavItem[]) =>
    items.filter(item => !item.featureFlag || isFeatureEnabled(item.featureFlag));

  const leftNavItems = filterByFeatureFlag(allLeftNavItems);
  const rightNavItems = filterByFeatureFlag(isCoach ? allRightNavItemsCoach : allRightNavItemsClient);

  const centerItem = { icon: Mic, label: "Coach", path: "/voice", featureFlag: "coachBrian" as keyof FeatureFlags };
  const showCenterItem = isFeatureEnabled("coachBrian");
  const isCenterActive = location === centerItem.path;

  return (
    <div className={cn(
      "h-[100dvh] w-full bg-background font-sans text-foreground flex flex-col mx-auto shadow-2xl overflow-hidden border-x border-border/50 relative",
      fullWidth
        ? "max-w-full md:max-w-4xl lg:max-w-6xl xl:max-w-7xl"
        : "max-w-md"
    )}>
      {/* Main Content Area - Flex Grow to fill space, overflow hidden by default */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {children}
      </div>

      {/* Navigation Bar - Fixed Height */}
      <nav
        className="shrink-0 z-50 bg-deep-pine/95 backdrop-blur-lg border-t border-forest-floor/40 pb-safe h-18 relative"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex justify-around items-end h-full px-4 pb-2">
          {/* Left nav items */}
          {leftNavItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className="flex flex-col items-center justify-center w-14 space-y-0.5 group cursor-pointer transition-all duration-200"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-xl transition-all duration-300 ease-out",
                      isActive
                        ? "bg-primary/10 text-primary translate-y-[-2px]"
                        : "text-muted-foreground group-hover:text-primary/70"
                    )}
                  >
                    <item.icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={cn("transition-transform duration-300", isActive && "scale-110")}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-medium transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Center floating button - Coach Brian (conditionally rendered) */}
          {showCenterItem && (
            <Link
              href={centerItem.path}
              aria-label={centerItem.label}
              aria-current={isCenterActive ? "page" : undefined}
            >
              <div
                className="flex flex-col items-center -mt-6 cursor-pointer group"
                data-testid="nav-coach"
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                    isCenterActive
                      ? "bg-gradient-to-br from-primary to-secondary scale-105 shadow-primary/30"
                      : "bg-gradient-to-br from-primary/90 to-secondary/90 group-hover:scale-105 group-hover:shadow-primary/20"
                  )}
                >
                  <Mic
                    size={26}
                    strokeWidth={2}
                    className="text-white"
                  />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-medium mt-1 transition-colors duration-200",
                    isCenterActive ? "text-primary" : "text-muted-foreground"
                  )}
              >
                {centerItem.label}
              </span>
            </div>
          </Link>
          )}

          {/* Right nav items */}
          {rightNavItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className="flex flex-col items-center justify-center w-14 space-y-0.5 group cursor-pointer transition-all duration-200"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-xl transition-all duration-300 ease-out",
                      isActive
                        ? "bg-primary/10 text-primary translate-y-[-2px]"
                        : "text-muted-foreground group-hover:text-primary/70"
                    )}
                  >
                    <item.icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={cn("transition-transform duration-300", isActive && "scale-110")}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-medium transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
