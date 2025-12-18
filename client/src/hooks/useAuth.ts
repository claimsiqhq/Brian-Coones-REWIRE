import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/user", {
    credentials: "include",
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data || null;
}

type LoginData = {
  identifier: string; // email or username
  password: string;
  rememberMe?: boolean;
};

type RegisterData = {
  email: string;
  password: string;
  username?: string;
  name?: string;
  role: "client" | "coach";
};

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error, refetch: refetchUser } = useQuery<User | null>({
    queryKey: ["auth-user"],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth-user"], null);
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isCoach: user?.role === "coach" || user?.role === "admin" || user?.role === "superadmin",
    isSuperAdmin: user?.role === "superadmin",
    loginMutation,
    registerMutation,
    logoutMutation,
    refetchUser,
  };
}
