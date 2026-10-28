const DEFAULT_TIMEZONE = "America/Lima";

export function getEffectiveTimezone(projectTimezone?: string | null): string {
  if (projectTimezone && projectTimezone.length > 0) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: projectTimezone });
      return projectTimezone;
    } catch {
      // Invalid timezone, fall back to default
    }
  }
  return DEFAULT_TIMEZONE;
}

export function formatAttendanceTime(
  timeStr: string | null | undefined,
  dateStr?: string | null,
  timezone?: string | null
): string {
  if (!timeStr || timeStr === "-" || timeStr === "—") return "—";
  const tz = getEffectiveTimezone(timezone);

  if (timeStr.includes("T")) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: tz,
      });
    }
  }

  const clean = timeStr.trim();
  const parts = clean.split(":");
  if (parts.length >= 2) {
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (!isNaN(hour) && !isNaN(minute)) {
      if (dateStr) {
        const dStr = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
        const iso = `${dStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-05:00`;
        const d = new Date(iso);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: tz,
          });
        }
      }
      const ampm = hour >= 12 ? "p. m." : "a. m.";
      const h12 = hour % 12 || 12;
      return `${String(h12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
    }
  }
  return timeStr;
}

export function formatLocalTime(value: string | null | undefined, timezone?: string | null): string {
  return formatAttendanceTime(value, undefined, timezone);
}

export function formatDateTime(value: string | null | undefined, timezone?: string | null): string {
  if (!value) return "—";
  const tz = getEffectiveTimezone(timezone);

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("es-PE", {
      timeZone: tz,
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return value;
  }
}

export function getClockParts(timezone?: string | null) {
  const tz = getEffectiveTimezone(timezone);
  const now = new Date();

  return {
    time: now.toLocaleTimeString("es-PE", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true }),
    date: now.toLocaleDateString("es-PE", { timeZone: tz }),
    day: now.toLocaleDateString("es-PE", { weekday: "long", timeZone: tz }),
  };
}
