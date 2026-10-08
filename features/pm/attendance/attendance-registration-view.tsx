"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/atoms/status-badge";
import PeriodSelector from "@/components/period-selector";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import { getGraphQLUrl } from "@/lib/api-host";

const LIST_TEAM_FOR_REGISTRATION = `
  query listTeamAttendance(
    $page: Int!
    $size: Int!
    $projectId: String
    $fromDate: String
    $toDate: String
    $status: String
  ) {
    listTeamAttendance(
      page: $page
      size: $size
      projectId: $projectId
      fromDate: $fromDate
      toDate: $toDate
      status: $status
    ) {
      items {
        id
        userId
        projectId
        date
        checkIn
        checkOut
        status
      }
      page
      size
      total
    }
  }
`;

const REGISTER_ATTENDANCE = `
  mutation registerAttendance($input: RegisterAttendanceInput!) {
    registerAttendance(input: $input) {
      id
      userId
      date
      checkIn
      status
    }
  }
`;

type Period = "today" | "thisweek" | "month" | "currentperiod" | "3months" | "6months" | "9months" | "total" | "custom";

interface DateRange {
  fromDate: string;
  toDate: string;
  label: string;
  period: Period;
}

type TeamMember = {
  id: string;
  userId: string;
  fullName: string;
  checkIn?: string | null;
  status: string;
  location?: string | null;
  shiftType?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
};

const SHIFT_LABELS: Record<string, string> = {
  PERMANENT: "Permanente",
  ROTATING_4X4: "Rotativo 4x4",
  ROTATING_7X7: "Rotativo 7x7",
  FLEXIBLE: "Flexible",
  TRANSITORY: "Transitorio",
};

const mockMembers: TeamMember[] = [
  { id: "1", userId: "u1", fullName: "Carlos Mamani Gutierrez", checkIn: "08:15", status: "PRESENTE", location: "Oficina Principal", shiftType: "PERMANENT", workStartTime: "08:00", workEndTime: "17:00" },
  { id: "2", userId: "u2", fullName: "María Torres López", checkIn: "08:45", status: "PRESENTE", location: "Oficina Principal", shiftType: "ROTATING_4X4", workStartTime: "08:00", workEndTime: "20:00" },
  { id: "3", userId: "u3", fullName: "José Ramírez Flores", checkIn: null, status: "FALTA", location: null, shiftType: "PERMANENT", workStartTime: "22:00", workEndTime: "06:00" },
  { id: "4", userId: "u4", fullName: "Ana Silva Mendoza", checkIn: "09:10", status: "PRESENTE", location: "Remoto", shiftType: "FLEXIBLE", workStartTime: null, workEndTime: null },
];

function getInitialRange(p: Period): DateRange {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  if (p === "today") return { fromDate: formatDate(today), toDate: formatDate(today), label: "Hoy", period: p };
  if (p === "month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { fromDate: formatDate(from), toDate: formatDate(today), label: "Este mes", period: p };
  }
  if (p === "3months") {
    const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    return { fromDate: formatDate(from), toDate: formatDate(today), label: "Últimos 3 meses", period: p };
  }
  return { fromDate: "2000-01-01", toDate: formatDate(today), label: "Total general", period: p };
}

export function AttendanceRegistrationView() {
  const { token } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange("today"));
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  async function fetchTeam() {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: LIST_TEAM_FOR_REGISTRATION,
          variables: {
            page: 0,
            size: 100,
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
            projectId: null,
          },
        }),
      });

      const json = await res.json();

      if (json.errors || !json.data?.listTeamAttendance?.items) {
        setMembers([]);
      } else {
        setMembers(json.data.listTeamAttendance.items);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function registerAttendance(userId: string) {
    if (!token) return;
    setRegisteringId(userId);
    console.log(`[Attendance] Registering attendance for userId=${userId}, date=${dateRange.fromDate}, time=${new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}, location=Oficina Principal, photo=none`);
    try {
      const res = await fetch(getGraphQLUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: REGISTER_ATTENDANCE,
          variables: {
            input: {
              projectId: null,
              latitude: -16.5,
              longitude: -68.15,
            },
          },
        }),
      });

      const json = await res.json();
      if (json.errors) {
        console.error(`[Attendance] Registration FAILED for userId=${userId}: ${json.errors[0].message}`);
        alert("Error al registrar asistencia. Intente más tarde.");
        return;
      }

      console.log(`[Attendance] Registration SUCCESS for userId=${userId}`);
      alert("Asistencia registrada correctamente");
      fetchTeam();
    } catch (error) {
      console.error(`[Attendance] Registration ERROR for userId=${userId}`, error);
      alert("Error de conexión. Intente más tarde.");
      fetchTeam();
    } finally {
      setRegisteringId(null);
    }
  }

  useEffect(() => {
    fetchTeam();
  }, [dateRange, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">

        {/* HEADER COMPACTO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
          <div className="flex items-center gap-4">
            <Link href="/pm">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Registro de Asistencias</h1>
              <p className="text-zinc-600">{dateRange.label}</p>
            </div>
          </div>

          <PeriodSelector
            period={dateRange.period}
            dateRange={dateRange}
            onPeriodChange={setDateRange}
          />
        </div>



        {/* TABLA PRINCIPAL */}
        <Card className="border border-border shadow-sm mt-6">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold">Equipo - Registro Diario</h2>
              <Button className="gap-2 bg-teal-600 hover:bg-teal-700 w-full sm:w-auto" size="sm">
                <Plus className="h-4 w-4" />
                Registro Masivo
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-full text-sm">
                <thead>
                  <tr className="border-b text-zinc-600 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 text-left font-medium">Colaborador</th>
                    <th className="py-3 px-4 text-left font-medium">Tipo de Horario</th>
                    <th className="py-3 px-4 text-left font-medium">Estado</th>
                    <th className="py-3 px-4 text-left font-medium">Hora</th>
                    <th className="py-3 px-4 text-left font-medium">Ubicaci&oacute;n</th>
                    <th className="py-3 px-4 text-center font-medium w-40">Acci&oacute;n</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-600" />
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <p className="text-sm text-muted-foreground">No se pudo cargar la información del equipo. Intente más tarde.</p>
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="hover:bg-accent transition-colors">
                        <td className="py-4 px-4 font-medium text-foreground">{member.fullName}</td>
                        <td className="py-4 px-4">
                          {member.shiftType ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              member.shiftType.startsWith("ROTATING") ? "bg-violet-50 text-violet-700 border-violet-200" :
                              member.shiftType === "FLEXIBLE" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              member.shiftType === "TRANSITORY" ? "bg-sky-50 text-sky-700 border-sky-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {SHIFT_LABELS[member.shiftType] || member.shiftType}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {member.workStartTime && member.workEndTime && (
                            <span className="block text-[10px] text-zinc-400 mt-0.5">
                              {member.workStartTime} - {member.workEndTime}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={member.status} />
                        </td>
                        <td className="py-4 px-4 font-mono text-muted-foreground">
                          {member.checkIn || "—"}
                        </td>
                        <td className="py-4 px-4 text-zinc-600 text-sm">
                          {member.location || "—"}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {member.checkIn ? (
                            <Badge variant="outline" className="text-emerald-600 text-xs">
                              ? Registrado
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => registerAttendance(member.userId)}
                              disabled={registeringId === member.userId}
                              className="bg-teal-600 hover:bg-teal-700 text-xs px-5"
                            >
                              {registeringId === member.userId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <p className="text-sm text-muted-foreground">No se pudo cargar la información del equipo. Intente más tarde.</p>
                      </td>
                    </tr>
                  ) : (
                                "Registrar"
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
