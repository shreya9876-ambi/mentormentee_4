import { useEffect, useState, useCallback } from "react";
import { api, type SafeUser, type AppRole } from "@/lib/api";

export type { AppRole };
export type AuthUser = SafeUser;

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  role: AppRole | null;
  signOut: () => void;
  refresh: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.auth.getMe();
      if (res.user) {
        setUser(res.user);
        setRole(res.user.role);
      } else {
        setUser(null);
        setRole(null);
      }
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthChange = () => {
      fetchCurrentUser();
    };

    window.addEventListener("auth-changed", handleAuthChange);
    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, [fetchCurrentUser]);

  const signOut = useCallback(() => {
    api.auth.signOut();
    setUser(null);
    setRole(null);
    window.dispatchEvent(new Event("auth-changed"));
  }, []);

  return { user, role, loading, signOut, refresh: fetchCurrentUser };
}
