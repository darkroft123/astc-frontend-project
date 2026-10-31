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
  
  if (/^[0-9a-fA-F-]{32,36}$/.test(userId)) {
    return "Trabajador";
  }
  
  return userId;
}

export function formatAlertType(type: string | null | undefined): string {
  if (!type) return "Tardanza";
  const map: Record<string, string> = {
    LATE_ARRIVAL: "Tardanza",
    ASISTENCIA_TARDE: "Tardanza",
    NO_PHOTO: "Sin foto",
    PHOTO_DOWNLOAD_FAILED: "Error de descarga de foto",
    ANALYSIS_ERROR: "Error de análisis biométrico",
    FACE_FRAUD: "Alerta biométrica",
    FRAUDE_FACIAL: "Alerta biométrica",
    ROSTRO_NO_DETECTADO: "Rostro no detectado",
    SUPLANTACION_IDENTIDAD: "Suplantación de identidad",
    FACE_MISMATCH: "Rostro no coincide",
    NO_MATCH: "Rostro no coincide",
    OUT_OF_AREA: "Fuera de rango",
    OUT_OF_RANGE: "Fuera de rango",
    OUTSIDE_SCHEDULE: "Fuera de horario",
    EARLY_CHECKIN: "Entrada anticipada",
    INTERNAL_ERROR: "Error del sistema",
    ABSENCE: "Inasistencia",
    UNJUSTIFIED_ABSENCE: "Inasistencia injustificada",
    DEVICE_MISMATCH: "Dispositivo no reconocido",
    LOCATION_DISABLED: "Ubicación desactivada",
  };
  const key = type.trim().toUpperCase();
  return map[key] || key.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function formatAlertMessage(msg: string | null | undefined, type?: string | null): string {
  const cleanMsg = msg ? msg.trim() : "";
  const t = type ? type.trim().toUpperCase() : "";

  // English backend messages translation
  const lowerMsg = cleanMsg.toLowerCase();
  if (lowerMsg === "no photo provided" || lowerMsg.includes("no photo")) {
    return "Asistencia registrada sin fotografía adjunta.";
  }
  if (lowerMsg.includes("ai validation flagged anomaly")) {
    return "Anomalía detectada en la validación biométrica del sistema.";
  }
  if (lowerMsg.includes("outside schedule")) {
    return "Marcaje de asistencia registrado fuera del horario programado.";
  }
  if (lowerMsg.includes("out of range") || lowerMsg.includes("out of area")) {
    return "Marcaje registrado fuera del perímetro geográfico del proyecto.";
  }
  if (lowerMsg.includes("face mismatch") || lowerMsg.includes("no match")) {
    return "El rostro capturado en la fotografía no coincide con el trabajador registrado.";
  }
  if (lowerMsg.includes("fraud") || lowerMsg.includes("spoof")) {
    return "Posible anomalía o inconsistencia biométrica en la fotografía.";
  }

  if (!cleanMsg || cleanMsg === "-" || lowerMsg === "test alert" || lowerMsg === "no_photo") {
    if (t === "LATE_ARRIVAL" || t === "ASISTENCIA_TARDE") return "Registro de asistencia con tardanza respecto al horario programado.";
    if (t === "NO_PHOTO") return "Asistencia registrada sin fotografía adjunta.";
    if (t === "ROSTRO_NO_DETECTADO") return "No se detectó ningún rostro humano en la fotografía.";
    if (t === "NO_MATCH" || t === "FACE_MISMATCH" || t === "SUPLANTACION_IDENTIDAD") return "El rostro de la foto no coincide con el trabajador.";
    if (t === "OUT_OF_RANGE" || t === "OUT_OF_AREA") return "Registro de asistencia fuera del rango geográfico permitido.";
    if (t === "OUTSIDE_SCHEDULE") return "Registro de asistencia fuera del horario laboral establecido.";
    if (t === "EARLY_CHECKIN") return "Registro de entrada anticipada antes de la hora fijada.";
    if (t === "FACE_FRAUD" || t === "FRAUDE_FACIAL") return "Fotografía con inconsistencia biométrica detectada.";
    if (t === "PHOTO_DOWNLOAD_FAILED") return "No se pudo cargar la imagen para la validación.";
    return "Incidencia registrada en el proceso de asistencia.";
  }

  return cleanMsg;
}
