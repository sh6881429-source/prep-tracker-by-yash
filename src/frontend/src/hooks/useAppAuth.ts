import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createElement } from "react";

export type AppSession =
  | { role: "admin"; name: string }
  | { role: "user"; phone: string; name: string; details: string }
  | null;

const STORAGE_KEY = "preptracker_session";

function readSession(): AppSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppSession;
  } catch {
    return null;
  }
}

function writeSession(session: AppSession): void {
  if (session === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

interface AuthContextValue {
  session: AppSession;
  loginAsAdmin: () => void;
  loginAsUser: (phone: string, name: string, details: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession>(readSession);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSession(readSession());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const loginAsAdmin = useCallback(() => {
    const s: AppSession = { role: "admin", name: "Yash" };
    writeSession(s);
    setSession(s);
  }, []);

  const loginAsUser = useCallback(
    (phone: string, name: string, details: string) => {
      const s: AppSession = { role: "user", phone, name, details };
      writeSession(s);
      setSession(s);
    },
    [],
  );

  const logout = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const value: AuthContextValue = {
    session,
    loginAsAdmin,
    loginAsUser,
    logout,
    isLoggedIn: session !== null,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAppAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAppAuth must be used within AppAuthProvider");
  }
  return ctx;
}
