import { registerAttendance, checkOut } from "@/app/services/assistance.service";

export interface QueuedAttendance {
  id: string;
  type: "ENTRY" | "EXIT";
  projectId: string | null;
  latitude: number | null;
  longitude: number | null;
  photoUrl?: string | null;
  timestamp: string;
}

const QUEUE_KEY = "astc_attendance_offline_queue";
const TODAY_CACHE_KEY_PREFIX = "astc_today_attendance_cache";

export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return window.navigator.onLine;
}

export function isNetworkError(err: unknown): boolean {
  if (!isOnline()) return true;
  if (!err) return false;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("conexión") ||
    msg.includes("load failed") ||
    msg.includes("econnrefused") ||
    msg.includes("fetch failed") ||
    msg.includes("timeout")
  );
}

export function getQueue(): QueuedAttendance[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("[OfflineQueue] Error reading queue:", e);
    return [];
  }
}

export function getPendingCount(): number {
  return getQueue().length;
}

function notifyQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("attendance-queue-changed"));
  }
}

export function enqueueAttendance(
  item: Omit<QueuedAttendance, "id" | "timestamp">
): QueuedAttendance {
  const current = getQueue();
  const queued: QueuedAttendance = {
    ...item,
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  const updated = [...current, queued];
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("[OfflineQueue] Error saving queue to localStorage:", e);
  }

  notifyQueueChanged();
  return queued;
}

export function cacheTodayAttendance(projectId: string | null | undefined, value: any): void {
  if (typeof window === "undefined") return;
  try {
    const key = `${TODAY_CACHE_KEY_PREFIX}_${projectId || "global"}`;
    if (value) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.error("[OfflineQueue] Error caching today attendance:", e);
  }
}

export function getCachedTodayAttendance(projectId: string | null | undefined): any | null {
  if (typeof window === "undefined") return null;
  try {
    const key = `${TODAY_CACHE_KEY_PREFIX}_${projectId || "global"}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("[OfflineQueue] Error reading today attendance cache:", e);
    return null;
  }
}

export async function flushAttendanceQueue(
  token: string
): Promise<{ synced: number; failed: number; remaining: number }> {
  if (!token || !isOnline()) {
    return { synced: 0, failed: 0, remaining: getPendingCount() };
  }

  const queue = getQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  let synced = 0;
  let failed = 0;
  const newQueue: QueuedAttendance[] = [];

  for (const item of queue) {
    try {
      if (item.type === "ENTRY") {
        await registerAttendance(token, {
          projectId: item.projectId || null,
          latitude: item.latitude,
          longitude: item.longitude,
          photoUrl: item.photoUrl || undefined,
        });
      } else {
        await checkOut(
          token,
          item.projectId || null,
          item.photoUrl || null,
          item.latitude || null,
          item.longitude || null
        );
      }
      synced++;
    } catch (err) {
      console.error("[OfflineQueue] Failed to sync item:", item.id, err);
      failed++;
      newQueue.push(item);
      // Si fue error de red, abortamos el resto del ciclo para no reintentar en bucle
      if (isNetworkError(err)) {
        break;
      }
    }
  }

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
  } catch (e) {
    console.error("[OfflineQueue] Error updating queue in localStorage:", e);
  }

  notifyQueueChanged();
  return { synced, failed, remaining: newQueue.length };
}
