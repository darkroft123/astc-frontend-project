import { AUTH_CONSTANTS } from "./auth.constants";

const TAG = "🔐 TOKEN_SERVICE";

export const tokenService = {
  get(): string | null {
    try {
      const token = localStorage.getItem(AUTH_CONSTANTS.TOKEN_KEY);

      console.log(TAG, "GET:", token);

      return token;
    } catch (err) {
      console.log(TAG, "GET ERROR:", err);
      return null;
    }
  },

  set(token: string): void {
    try {
      console.log(TAG, "SET:", token);
      localStorage.setItem(AUTH_CONSTANTS.TOKEN_KEY, token);
    } catch (err) {
      console.log(TAG, "SET ERROR:", err);
    }
  },

  clear(): void {
    try {
      console.log(TAG, "CLEAR");
      localStorage.removeItem(AUTH_CONSTANTS.TOKEN_KEY);
    } catch (err) {
      console.log(TAG, "CLEAR ERROR:", err);
    }
  },
};