import { ASTCNotificationSDK, InAppNotification } from "./notification-sdk";

export type { InAppNotification };
export const notificationService = new ASTCNotificationSDK(4000, "");

export function getNotificationIcon(code?: string): string {
  if (!code) return "Bell";
  
  if (code.startsWith("AST00001") || code.startsWith("AST00002") || code.startsWith("AST00003") || code.startsWith("AST00004")) return "CheckCircle2";
  if (code.startsWith("AST00005") || code.startsWith("AST00006") || code.startsWith("AST00007") || code.startsWith("AST00008") || code.startsWith("AST00011")) return "AlertTriangle";
  if (code.startsWith("AST00009") || code.startsWith("AST00010")) return "Clock";
  if (code.startsWith("AST00012") || code.startsWith("AST00013") || code.startsWith("AST00014")) return "FileText";
  if (code.startsWith("ASP")) return "FolderHeart";
  if (code.startsWith("ASB")) return "UserCog";
  
  return "Bell";
}

export function getNotificationColor(code?: string): { text: string; bg: string; border: string; gradient: string } {
  if (!code) return { text: "text-text-4", bg: "bg-raised", border: "border-line", gradient: "bg-text-5" };
  
  // Asistencia (Verde)
  if (code === "AST00001" || code === "AST00002" || code === "AST00003" || code === "AST00004") {
    return { text: "text-green-ink", bg: "bg-green/10", border: "border-green/20", gradient: "bg-green" };
  }
  // Falta/Ausencia (Rojo)
  if (code === "AST00005" || code === "AST00006" || code === "AST00007" || code === "AST00008" || code === "AST00011") {
    return { text: "text-red-ink", bg: "bg-red/10", border: "border-red/20", gradient: "bg-red" };
  }
  // Salida (Naranja/Amarillo contexto - usa amber semantic)
  if (code === "AST00009" || code === "AST00010") {
    return { text: "text-amber-ink", bg: "bg-amber/10", border: "border-amber/20", gradient: "bg-amber" };
  }
  // Justificacion (Amarillo/Ambar)
  if (code === "AST00012" || code === "AST00013" || code === "AST00014") {
    return { text: "text-amber-ink", bg: "bg-amber/10", border: "border-amber/20", gradient: "bg-amber" };
  }
  // Project Manager (Violeta) - use primary
  if (code.startsWith("ASP")) {
    return { text: "text-primary", bg: "bg-primary/10", border: "border-primary/20", gradient: "bg-brand-gradient" };
  }
  // Backoffice (Azul) - use primary/link
  if (code.startsWith("ASB")) {
    return { text: "text-primary", bg: "bg-primary/10", border: "border-primary/20", gradient: "bg-brand-gradient" };
  }
  
  return { text: "text-text-4", bg: "bg-raised", border: "border-line", gradient: "bg-text-5" };
}

export function notifyUnreadCountChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("astc-notification-updated"));
  }
}

