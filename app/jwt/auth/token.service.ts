import { AUTH_CONSTANTS } from "./auth.constants";

export const tokenService = {
  get(): string | null {
    try {
      return localStorage.getItem(AUTH_CONSTANTS.TOKEN_KEY);
    } catch {
      return null;
    }
  },

  set(token: string): void {
    try {
      localStorage.setItem(AUTH_CONSTANTS.TOKEN_KEY, token);
    } catch {
      // ignore or handle storage quota error
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(AUTH_CONSTANTS.TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};
