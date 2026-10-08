"use client";
import { useCallback } from "react";

import { loginApi } from "./auth.api";

import { useAuth } from "./auth.provider";

const TAG = "🚀 useLogin";

const scheme = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.port === '443' || window.location.hostname.includes('joyit.io')) ? 'https' : 'http';
const ROLE_ROUTES: Record<string, string> = {
  ADMIN: `${scheme}://astc-backoffice.joyit.io`,
  USER: `${scheme}://attendance.joyit.io`,
  PROJECT_MANAGER: `${scheme}://astc-project.joyit.io`,
};

export function useLogin() {
  const { setToken } = useAuth();

  const login = useCallback(
    async (input: {
      email: string;
      password: string;
    }) => {
      console.log(TAG, "START LOGIN");

      try {
        // LOGIN API
        const { token, user } =
          await loginApi(input);

        console.log(
          TAG,
          "TOKEN RECEIVED:",
          token
        );

        if (!token) {
          throw new Error("No se recibió token");
        }

        // GLOBAL AUTH STATE
        setToken(token);

        // ROLE
        const role =
          user?.role?.code ?? null;

        console.log(TAG, "ROLE:", role);

        if (!role) {
          throw new Error("Rol no encontrado");
        }

        // ROUTE
        const redirectUrl =
          ROLE_ROUTES[role];

        if (!redirectUrl) {
          throw new Error(`Sin ruta para el rol: ${role}`);
        }

        const finalUrl =
          `${redirectUrl}?token=` +
          encodeURIComponent(token);

        console.log(
          TAG,
          "REDIRECT →",
          finalUrl
        );

        window.location.assign(finalUrl);

        return true;
      } catch (err) {
        console.error(
          TAG,
          "LOGIN ERROR:",
          err
        );

        return false;
      }
    },
    [setToken]
  );

  return { login };
}