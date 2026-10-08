/**
 * Helper utilities for formatting user names, alert types, and alert messages in Spanish.
 */

export function formatUserName(userId: string | null | undefined, userMap?: Map<string, string>): string {
  if (!userId) return "Usuario";
  
  const key = String(userId).trim().toLowerCase();
  const name = userMap?.get(key);
  if (name && !/^[0-9a-fA-F-]{32,36}$/.test(name)) {
    return name;
  }
  
  // If it's a raw UUID string (not resolved to a user name)
  if (/^[0-9a-fA-F-]{32,36}$/.test(userId)) {
    return "Colaborador";
  }
  
  return userId;
}

export function formatAlertType(type: string | null | undefined): string {
  if (!type) return "TARDANZA";
  const map: Record<string, string> = {
    LATE_ARRIVAL: "TARDANZA",
    NO_PHOTO: "SIN FOTO",
    NO_MATCH: "ROSTRO NO COINCIDE",
    OUT_OF_RANGE: "FUERA DE RANGO",
    OUTSIDE_SCHEDULE: "FUERA DE HORARIO",
    EARLY_CHECKIN: "TEMPRANO",
    ABSENCE: "INASISTENCIA",
  };
  const key = type.trim().toUpperCase();
  return map[key] || key.replace(/_/g, " ");
}

export function formatAlertMessage(msg: string | null | undefined, type?: string | null): string {
  const cleanMsg = msg ? msg.trim() : "";
  
  if (!cleanMsg || cleanMsg === "-" || cleanMsg.toLowerCase() === "test alert") {
    const t = type ? type.trim().toUpperCase() : "";
    if (t === "LATE_ARRIVAL") return "Registro de asistencia con tardanza respecto al horario";
    if (t === "NO_PHOTO") return "Asistencia registrada sin fotografía adjunta";
    if (t === "NO_MATCH") return "El rostro de la foto no coincide con el colaborador";
    if (t === "OUT_OF_RANGE") return "Registro de asistencia fuera del rango geográfico permitido";
    if (t === "OUTSIDE_SCHEDULE") return "Registro realizado fuera del horario laboral";
    return "Alerta de incidencia en el registro de asistencia";
  }
  
  if (cleanMsg === "AI validation flagged anomaly") return "Anomalía detectada en la validación del sistema";
  if (cleanMsg.includes("No photo")) return "Asistencia registrada sin fotografía adjunta";
  
  return cleanMsg;
}
