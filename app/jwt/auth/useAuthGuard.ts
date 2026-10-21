"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "./auth.provider";
import { getApiBaseUrl } from "@/lib/api-host";

// [MOCK LOCAL] Devuelve usuario mock siempre autenticado
const MOCK_TOKEN = "mock_jwt_token_local_pm_12345";
const MOCK_USER = {
  id: "pm-001",
  sub: "pm-001",
  email: "jefeproyecto@astc.joyit.io",
  username: "jefeproyecto-x",
  firstName: "Carlos",
  lastName: "Mamani",
  role: "PROJECT_MANAGER",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  exp: 1893456000,
};

export function useAuthGuard(allowedRoles: string[]) {
  const { token, user, role, hydrated, logout } = useAuth();

  const [checking, setChecking] = useState(false);
  const checkedRef = useRef(true);

  useEffect(() => {
    // [MOCK LOCAL] Bypass de autenticacion sin backend para desarrollo rapido
    // Codigo original comentado para restauracion posterior:
    /*
    if (!hydrated || checkedRef.current) return;

    if (!token || !user) {
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    if (user.exp && user.exp < Date.now() / 1000) {
      logout();
      return;
    }

    if (!role || !allowedRoles.includes(role)) {
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    checkedRef.current = true;
    setChecking(false);
    */
  }, [hydrated, token, user, role]);

  const activeToken = token || MOCK_TOKEN;
  const activeUser = user || (MOCK_USER as any);
  const activeRole = role || "PROJECT_MANAGER";

  return useMemo(
    () => ({
      hydrated: true,
      token: activeToken,
      user: activeUser,
      role: activeRole,
      checkingAuth: false,
    }),
    [activeToken, activeUser, activeRole]
  );
}
