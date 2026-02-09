import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signup: (email: string, password: string, name?: string, captchaToken?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "imageforge_token";
const USER_KEY = "imageforge_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const login = useCallback(async (email: string, password: string, captchaToken?: string) => {
    setIsLoading(true);
    try {
      const res = await api<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: { email, password, captchaToken },
      });
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string, captchaToken?: string) => {
    setIsLoading(true);
    try {
      const res = await api<{ user: User; token: string }>("/auth/signup", {
        method: "POST",
        body: { email, password, name, captchaToken },
      });
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
