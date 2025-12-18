import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AppProfile, ThemeTokens, FeatureFlags } from "@shared/schema";
import { useAuth } from "./useAuth";

interface AppProfileContextType {
  profile: AppProfile | null;
  isLoading: boolean;
  themeTokens: ThemeTokens;
  featureFlags: FeatureFlags;
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
  refetch: () => void;
  brandName: string | null;
  logoUrl: string | null;
}

const defaultThemeTokens: ThemeTokens = {
  nightForest: "#1a1f1c",
  deepPine: "#252b27",
  forestFloor: "#4a5550",
  sage: "#87A892",
  birch: "#D4C5A9",
  ember: "#E07A4A",
};

const defaultFeatureFlags: FeatureFlags = {
  groundCheck: true,
  dailyAnchors: true,
  reflections: true,
  groundingPractice: true,
  coachBrian: true,
  visionBoard: true,
  achievements: true,
  release: true,
  brotherhood: true,
};

const AppProfileContext = createContext<AppProfileContextType>({
  profile: null,
  isLoading: true,
  themeTokens: defaultThemeTokens,
  featureFlags: defaultFeatureFlags,
  isFeatureEnabled: () => true,
  refetch: () => {},
  brandName: null,
  logoUrl: null,
});

export function AppProfileProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Use authenticated endpoint if logged in, otherwise use public default endpoint
  const profileEndpoint = isAuthenticated ? "/api/app-profile" : "/api/app-profile/default";

  const { data: profile, isLoading: profileLoading, refetch } = useQuery<AppProfile | null>({
    queryKey: [profileEndpoint],
    staleTime: 1000 * 60 * 5,
    enabled: !authLoading, // Wait for auth state to be determined
  });

  const isLoading = authLoading || profileLoading;

  const themeTokens: ThemeTokens = {
    ...defaultThemeTokens,
    ...(profile?.themeTokens as ThemeTokens || {}),
  };

  const featureFlags: FeatureFlags = {
    ...defaultFeatureFlags,
    ...(profile?.featureFlags as FeatureFlags || {}),
  };

  const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
    return featureFlags[feature] !== false;
  };

  useEffect(() => {
    if (!isLoading && themeTokens) {
      const root = document.documentElement;
      
      // Convert hex to HSL values (without hsl() wrapper) for CSS variables
      const hexToHSL = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return hex;
        
        let r = parseInt(result[1], 16) / 255;
        let g = parseInt(result[2], 16) / 255;
        let b = parseInt(result[3], 16) / 255;
        
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }
        
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };
      
      // Map theme tokens to base CSS variables (HSL format without wrapper)
      const colorTokens: Record<string, string> = {
        nightForest: "--night-forest",
        deepPine: "--deep-pine",
        forestFloor: "--forest-floor",
        sage: "--sage",
        birch: "--birch",
        ember: "--ember",
      };
      
      Object.entries(themeTokens).forEach(([key, value]) => {
        if (value && colorTokens[key]) {
          const hslValue = hexToHSL(value);
          root.style.setProperty(colorTokens[key], hslValue);
          
          // Also map to semantic variables
          if (key === 'nightForest') {
            root.style.setProperty('--background', hslValue);
          } else if (key === 'deepPine') {
            root.style.setProperty('--card', hslValue);
          } else if (key === 'forestFloor') {
            root.style.setProperty('--border', hslValue);
            root.style.setProperty('--muted', hslValue);
          } else if (key === 'birch') {
            root.style.setProperty('--foreground', hslValue);
            root.style.setProperty('--card-foreground', hslValue);
            root.style.setProperty('--primary', hslValue);
          } else if (key === 'sage') {
            root.style.setProperty('--secondary', hslValue);
            root.style.setProperty('--muted-foreground', hslValue);
          } else if (key === 'ember') {
            root.style.setProperty('--accent', hslValue);
          }
        }
      });

      // Handle font tokens
      const fontDisplay = themeTokens.fontDisplay;
      const fontSans = themeTokens.fontSans;
      
      if (fontDisplay) {
        root.style.setProperty('--font-display', `'${fontDisplay}', Georgia, serif`);
      }
      if (fontSans) {
        root.style.setProperty('--font-sans', `'${fontSans}', sans-serif`);
      }
      
      // Load Google Fonts dynamically
      if (fontDisplay || fontSans) {
        const fonts = [fontDisplay, fontSans].filter((f): f is string => Boolean(f));
        const existingLink = document.getElementById('dynamic-google-fonts');
        if (existingLink) existingLink.remove();
        
        const link = document.createElement('link');
        link.id = 'dynamic-google-fonts';
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [isLoading, themeTokens]);

  return (
    <AppProfileContext.Provider
      value={{
        profile: profile || null,
        isLoading,
        themeTokens,
        featureFlags,
        isFeatureEnabled,
        refetch,
        brandName: profile?.brandName || null,
        logoUrl: profile?.logoUrl || null,
      }}
    >
      {children}
    </AppProfileContext.Provider>
  );
}

export function useAppProfile() {
  return useContext(AppProfileContext);
}

export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  const { isFeatureEnabled } = useAppProfile();
  return isFeatureEnabled(feature);
}
