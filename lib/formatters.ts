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
  if (!type) return "Aviso de asistencia";
  const map: Record<string, string> = {
    LATE_ARRIVAL: "Tardanza registrada",
    ASISTENCIA_TARDE: "Tardanza registrada",
    NO_PHOTO: "Registro sin fotografía",
    PHOTO_DOWNLOAD_FAILED: "Revisión de fotografía pendiente",
    ANALYSIS_ERROR: "Revisión manual de asistencia",
    FACE_FRAUD: "Observación en validación facial",
    FRAUDE_FACIAL: "Observación en validación facial",
    ROSTRO_NO_DETECTADO: "Verificación facial incompleta",
    SUPLANTACION_IDENTIDAD: "Verificación de identidad pendiente",
    FACE_MISMATCH: "Verificación de identidad pendiente",
    NO_MATCH: "Verificación de identidad pendiente",
    OUT_OF_AREA: "Ubicación fuera del área asignada",
    OUT_OF_RANGE: "Ubicación fuera del área asignada",
    LOCATION_MISMATCH: "Ubicación fuera del área asignada",
    OUTSIDE_SCHEDULE: "Marcaje fuera de horario",
    EARLY_CHECKIN: "Entrada anticipada",
    INTERNAL_ERROR: "Revisión manual requerida",
    ABSENCE: "Inasistencia",
    UNJUSTIFIED_ABSENCE: "Inasistencia injustificada",
    DEVICE_MISMATCH: "Dispositivo no reconocido",
    UNKNOWN_DEVICE: "Dispositivo no reconocido",
    LOCATION_DISABLED: "Ubicación desactivada",
  };
  const key = type.trim().toUpperCase();
  return map[key] || "Aviso de validación de asistencia";
}

export function formatAlertMessage(msg: string | null | undefined, type?: string | null): string {
  const cleanMsg = msg ? msg.trim() : "";
  const t = type ? type.trim().toUpperCase() : "";
  const lowerMsg = cleanMsg.toLowerCase();

  // Intelligent natural messages by type or technical substring
  if (
    t === "ROSTRO_NO_DETECTADO" ||
    lowerMsg.includes("no se detectó ninguna cara") ||
    lowerMsg.includes("no se detectó ningún rostro") ||
    lowerMsg.includes("rostro_no_detectado")
  ) {
    return "No se logró identificar un rostro visible en la fotografía registrada. Se recomienda revisar la marcación del colaborador.";
  }

  if (
    t === "FACE_MISMATCH" ||
    t === "NO_MATCH" ||
    t === "SUPLANTACION_IDENTIDAD" ||
    lowerMsg.includes("face mismatch") ||
    lowerMsg.includes("no match") ||
    lowerMsg.includes("cara no coincide") ||
    lowerMsg.includes("similaridad")
  ) {
    return "La imagen registrada presenta diferencias respecto al perfil del colaborador. Se sugiere revisión por el responsable.";
  }

  if (
    t === "FACE_FRAUD" ||
    t === "FRAUDE_FACIAL" ||
    lowerMsg.includes("posible fraude") ||
    lowerMsg.includes("score real") ||
    lowerMsg.includes("confianza:") ||
    lowerMsg.includes("fraud") ||
    lowerMsg.includes("spoof")
  ) {
    return "La fotografía capturada requiere validación manual por baja nitidez o inconsistencia en la captura facial.";
  }

  if (
    t === "NO_PHOTO" ||
    lowerMsg === "no photo provided" ||
    lowerMsg.includes("no photo") ||
    lowerMsg.includes("asistencia sin foto")
  ) {
    return "La asistencia fue registrada sin adjuntar fotografía de respaldo.";
  }

  if (
    t === "ANALYSIS_ERROR" ||
    t === "INTERNAL_ERROR" ||
    t === "PHOTO_DOWNLOAD_FAILED" ||
    lowerMsg.includes("modelos de ia") ||
    lowerMsg.includes("error interno") ||
    lowerMsg.includes("cannot download") ||
    lowerMsg.includes("no se pudo descargar") ||
    lowerMsg.includes("ai validation flagged anomaly")
  ) {
    return "No fue posible completar la verificación automática de la imagen en este registro. Por favor valide la asistencia manualmente.";
  }

  if (t === "OUTSIDE_SCHEDULE" || lowerMsg.includes("outside schedule") || lowerMsg.includes("fuera de horario")) {
    return "Marcaje de asistencia registrado fuera del horario laboral programado.";
  }

  if (
    t === "OUT_OF_RANGE" ||
    t === "OUT_OF_AREA" ||
    t === "LOCATION_MISMATCH" ||
    lowerMsg.includes("out of range") ||
    lowerMsg.includes("out of area")
  ) {
    return "El registro de asistencia se realizó fuera del perímetro geográfico establecido para el proyecto.";
  }

  if (t === "LATE_ARRIVAL" || t === "ASISTENCIA_TARDE") {
    return "Registro de asistencia realizado después del horario de ingreso establecido.";
  }

  if (t === "EARLY_CHECKIN") {
    return "Registro de entrada realizado antes del horario habitual de inicio.";
  }

  if (!cleanMsg || cleanMsg === "-" || lowerMsg === "test alert") {
    return "Se detectó una observación en el registro de asistencia que requiere revisión del responsable.";
  }

  return cleanMsg;
}
