"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "./auth.provider";
import { getApiBaseUrl } from "@/lib/api-host";

export function useAuthGuard(allowedRoles: string[]) {
  const { token, user, role, hydrated, logout } = useAuth();
  const rolesKey = allowedRoles.join(",");

  const [checking, setChecking] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || checkedRef.current) return;

    if (!token || !user) {
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    if (user.exp && user.exp < Date.now() / 1000) {
      logout();
      return;
    }

    const currentAllowed = rolesKey.split(",").filter(Boolean);
    if (!role || (!currentAllowed.includes(role) && role !== "ADMIN")) {
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    checkedRef.current = true;
    setChecking(false);
  }, [hydrated, token, user, role, rolesKey, logout]);

  return useMemo(
    () => ({
      hydrated,
      token,
      user,
      role,
      checkingAuth: checking || !hydrated || !token,
    }),
    [hydrated, token, user, role, checking]
  );
}
