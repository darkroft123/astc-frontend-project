"use client";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

import { jwtDecode } from "jwt-decode";
import { tokenService } from "./token.service";
import { getApiBaseUrl } from "@/lib/api-host";

type JwtPayload = {
  sub?: string;
  email?: string;
  username?: string;
  role?: string | { code?: string };
  exp?: number;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  id?: string;
};

interface AuthContextValue {
  token: string | null;
  user: JwtPayload | null;
  role: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    const loginStartStr = params.get("loginStart");
    const redirectStartStr = params.get("redirectStart");

    const stored = tokenService.get();

    const finalToken =
      tokenFromUrl &&
      tokenFromUrl !== "undefined" &&
      tokenFromUrl !== "null"
        ? tokenFromUrl
        : stored;

    if (finalToken) {
      setTokenState(finalToken);
      tokenService.set(finalToken);

      try {
        jwtDecode<JwtPayload>(finalToken);
      } catch (e) {
        console.error("Invalid token during load", e);
      }
    }

    if (tokenFromUrl) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    // limpiar URL
    window.history.replaceState({}, "", window.location.pathname);

    setHydrated(true);

    if (tokenFromUrl && loginStartStr) {
      const now = Date.now();
      const loginStart = parseInt(loginStartStr, 10);
      const redirectStart = redirectStartStr ? parseInt(redirectStartStr, 10) : now;
      const totalDuration = now - loginStart;
      const redirectDuration = now - redirectStart;
      console.log(`[AUTH PERF] Redirect duration = ${redirectDuration} ms`);
      console.log(`[AUTH PERF] Total login duration = ${totalDuration} ms`);
    }
  }, []);

  const user = useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return { ...decoded, id: decoded.sub };
    } catch {
      return null;
    }
  }, [token]);

  const role = useMemo(() => {
    const r = user?.role;
    if (!r) return null;
    return typeof r === "string" ? r : r.code ?? null;
  }, [user]);

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      tokenService.set(token);
    } else {
      tokenService.clear();
    }
  }, [token, hydrated]);

  const setToken = (t: string) => {
    setTokenState(t);
    tokenService.set(t); // ðŸ”¥ FIX IMPORTANTE
  };

  const logout = () => {
    tokenService.clear();
    setTokenState(null);
    window.location.assign(getApiBaseUrl(3003));
  };

  const isAuthenticated = useMemo(() => {
    return !!token && !!user;
  }, [token, user]);

  if (!hydrated) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        hydrated,
        isAuthenticated,
        setToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
