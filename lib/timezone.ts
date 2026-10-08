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

export function formatLocalTime(value: string | null | undefined, timezone?: string | null): string {
  if (!value) return "—";
  const tz = getEffectiveTimezone(timezone);
  const clean = value.split(".")[0];

  try {
    if (clean.includes("T")) {
      return new Date(clean).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: tz,
      });
    }
    return new Date(`1970-01-01T${clean}`).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
    });
  } catch {
    return value;
  }
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
    });
  } catch {
    return value;
  }
}

export function getClockParts(timezone?: string | null) {
  const tz = getEffectiveTimezone(timezone);
  const now = new Date();

  return {
    time: now.toLocaleTimeString("es-PE", { timeZone: tz }),
    date: now.toLocaleDateString("es-PE", { timeZone: tz }),
    day: now.toLocaleDateString("es-PE", { weekday: "long", timeZone: tz }),
  };
}
