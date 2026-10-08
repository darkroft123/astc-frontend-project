import { ASTCNotificationSDK } from "./notification-sdk";

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
  if (!code) return { text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-400", gradient: "from-slate-600 to-slate-800" };
  
  // Asistencia (Verde)
  if (code === "AST00001" || code === "AST00002" || code === "AST00003" || code === "AST00004") {
    return { text: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-500", gradient: "from-emerald-400 to-green-600" };
  }
  // Falta/Ausencia (Rojo)
  if (code === "AST00005" || code === "AST00006" || code === "AST00007" || code === "AST00008" || code === "AST00011") {
    return { text: "text-rose-600", bg: "bg-rose-100", border: "border-rose-500", gradient: "from-rose-500 to-red-600" };
  }
  // Salida (Naranja)
  if (code === "AST00009" || code === "AST00010") {
    return { text: "text-orange-600", bg: "bg-orange-100", border: "border-orange-500", gradient: "from-orange-400 to-orange-600" };
  }
  // Justificacion (Amarillo/Ambar)
  if (code === "AST00012" || code === "AST00013" || code === "AST00014") {
    return { text: "text-amber-600", bg: "bg-amber-100", border: "border-amber-500", gradient: "from-amber-400 to-orange-500" };
  }
  // Project Manager (Violeta)
  if (code.startsWith("ASP")) {
    return { text: "text-purple-600", bg: "bg-purple-100", border: "border-purple-500", gradient: "from-purple-500 to-fuchsia-600" };
  }
  // Backoffice (Azul)
  if (code.startsWith("ASB")) {
    return { text: "text-blue-600", bg: "bg-blue-100", border: "border-blue-500", gradient: "from-blue-500 to-indigo-600" };
  }
  
  return { text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-400", gradient: "from-slate-600 to-slate-800" };
}

export function notifyUnreadCountChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("astc-notification-updated"));
  }
}

