import { NextResponse } from "next/server";
import {
  MOCK_USER_PM,
  MOCK_PROJECTS,
  MOCK_TODAY_ATTENDANCE,
  MOCK_DASHBOARD_PM,
  MOCK_ATTENDANCES_LIST,
  MOCK_ALERTS_LIST,
  MOCK_JUSTIFICATIONS_LIST,
  MOCK_VACATIONS_LIST,
  MOCK_SCHEDULES,
} from "@/lib/mock-data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || "";
    const variables = body.variables || {};

    console.log("[MOCK GRAPHQL ROUTE] Processing query:", query.slice(0, 60).replace(/\s+/g, " "));

    // 1. Dashboard PM
    if (query.includes("getDashboard") || query.includes("getDashboardPM")) {
      return NextResponse.json({
        data: {
          getDashboard: MOCK_DASHBOARD_PM,
          getDashboardPM: MOCK_DASHBOARD_PM,
        },
      });
    }

    // 2. Projects
    if (query.includes("getMyProjects") || query.includes("listProjects")) {
      return NextResponse.json({
        data: {
          getMyProjects: MOCK_PROJECTS,
          listProjects: MOCK_PROJECTS,
        },
      });
    }

    if (query.includes("getProjectById")) {
      return NextResponse.json({
        data: {
          getProjectById: MOCK_PROJECTS[0],
        },
      });
    }

    // 3. Attendances
    if (query.includes("getTodayAttendance")) {
      return NextResponse.json({
        data: {
          getTodayAttendance: MOCK_TODAY_ATTENDANCE,
        },
      });
    }

    if (query.includes("listAttendance") || query.includes("listTeamAttendance")) {
      return NextResponse.json({
        data: {
          listAttendance: {
            items: MOCK_ATTENDANCES_LIST,
            page: 1,
            size: 20,
            total: MOCK_ATTENDANCES_LIST.length,
          },
          listTeamAttendance: {
            items: MOCK_ATTENDANCES_LIST,
            page: 1,
            size: 20,
            total: MOCK_ATTENDANCES_LIST.length,
          },
        },
      });
    }

    if (query.includes("registerAttendance")) {
      return NextResponse.json({
        data: {
          registerAttendance: {
            id: `att-mock-${Date.now()}`,
            userId: MOCK_USER_PM.id,
            date: new Date().toISOString().split("T")[0],
            checkIn: new Date().toLocaleTimeString("es-PE"),
            status: "ASISTENCIA",
          },
        },
      });
    }

    if (query.includes("checkOut")) {
      return NextResponse.json({
        data: {
          checkOut: {
            id: `att-mock-${Date.now()}`,
            checkOut: new Date().toLocaleTimeString("es-PE"),
            status: "ASISTENCIA",
          },
        },
      });
    }

    // 4. Alerts
    if (query.includes("listAttendanceAlerts") || query.includes("listAlerts")) {
      return NextResponse.json({
        data: {
          listAttendanceAlerts: {
            items: MOCK_ALERTS_LIST,
            page: 1,
            size: 20,
            total: MOCK_ALERTS_LIST.length,
          },
          listAlerts: {
            items: MOCK_ALERTS_LIST,
            page: 1,
            size: 20,
            total: MOCK_ALERTS_LIST.length,
          },
        },
      });
    }

    // 5. Justifications
    if (query.includes("listJustifications") || query.includes("listJustificationsPM")) {
      return NextResponse.json({
        data: {
          listJustifications: {
            items: MOCK_JUSTIFICATIONS_LIST,
            page: 1,
            size: 20,
            total: MOCK_JUSTIFICATIONS_LIST.length,
          },
          listJustificationsPM: {
            items: MOCK_JUSTIFICATIONS_LIST,
            page: 1,
            size: 20,
            total: MOCK_JUSTIFICATIONS_LIST.length,
          },
        },
      });
    }

    // 6. Vacations & Schedules
    if (query.includes("listMyVacations") || query.includes("listVacations")) {
      return NextResponse.json({
        data: {
          listMyVacations: MOCK_VACATIONS_LIST,
          listVacations: MOCK_VACATIONS_LIST,
        },
      });
    }

    if (query.includes("getEffectiveSchedule") || query.includes("listSchedules")) {
      return NextResponse.json({
        data: {
          getEffectiveSchedule: MOCK_SCHEDULES[0],
          listSchedules: MOCK_SCHEDULES,
        },
      });
    }

    // Default fallback
    return NextResponse.json({
      data: {
        success: true,
        message: "Mock response fallback",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { errors: [{ message: err.message || "Error in Mock GraphQL Route" }] },
      { status: 500 }
    );
  }
}
