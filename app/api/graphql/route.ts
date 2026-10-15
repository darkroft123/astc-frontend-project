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
  MOCK_NOTIFICATIONS,
  MOCK_USERS,
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

    // 2. Projects & Members
    if (
      query.includes("getAllProjects") ||
      query.includes("getMyProjects") ||
      query.includes("listProjects") ||
      query.includes("getProjects")
    ) {
      return NextResponse.json({
        data: {
          getAllProjects: MOCK_PROJECTS,
          getMyProjects: MOCK_PROJECTS,
          listProjects: MOCK_PROJECTS,
          getProjects: MOCK_PROJECTS,
        },
      });
    }

    if (query.includes("getProjectMembers") || query.includes("listProjectMembers")) {
      const pid = variables.projectId || variables.id;
      const proj = MOCK_PROJECTS.find((p) => p.id === pid) || MOCK_PROJECTS[0];
      const members = proj?.members || [
        { userId: "pm-001", role: "PROJECT_MANAGER" },
        { userId: "user-002", role: "TEAM_MEMBER" },
      ];
      return NextResponse.json({
        data: {
          getProjectMembers: members,
          listProjectMembers: members,
        },
      });
    }

    // 2.1 Users
    if (
      query.includes("getAllUsers") ||
      query.includes("listUsers") ||
      query.includes("getUsers")
    ) {
      return NextResponse.json({
        data: {
          getAllUsers: MOCK_USERS,
          listUsers: { items: MOCK_USERS, total: MOCK_USERS.length },
          getUsers: MOCK_USERS,
        },
      });
    }

    if (query.includes("getProjectById")) {
      const pid = variables.id || variables.projectId;
      const proj = MOCK_PROJECTS.find((p) => p.id === pid) || MOCK_PROJECTS[0];
      return NextResponse.json({
        data: {
          getProjectById: proj,
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
    if (query.includes("getAlertDetail")) {
      const aid = variables.id;
      const found = MOCK_ALERTS_LIST.find((a) => a.id === aid) || MOCK_ALERTS_LIST[0];
      return NextResponse.json({
        data: {
          getAlertDetail: found,
        },
      });
    }

    if (query.includes("approveAlert")) {
      const aid = variables.alertId || variables.id;
      const found = MOCK_ALERTS_LIST.find((a) => a.id === aid);
      if (found) found.status = "APPROVED";
      return NextResponse.json({
        data: {
          approveAlert: { id: aid, status: "APPROVED" },
        },
      });
    }

    if (query.includes("cancelAlert") || query.includes("dismissAlert")) {
      const aid = variables.alertId || variables.id;
      const found = MOCK_ALERTS_LIST.find((a) => a.id === aid);
      if (found) found.status = "CANCELLED";
      return NextResponse.json({
        data: {
          cancelAlert: { id: aid, status: "CANCELLED" },
        },
      });
    }

    if (query.includes("markAllAlertsAsReviewed") || query.includes("markAllAsReviewed")) {
      MOCK_ALERTS_LIST.forEach((a) => {
        a.status = "REVIEWED";
      });
      return NextResponse.json({
        data: {
          markAllAlertsAsReviewed: true,
        },
      });
    }

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

    // 7. Notifications
    if (query.includes("getUnreadNotificationsCount") || query.includes("unread")) {
      const count = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
      return NextResponse.json({
        data: {
          getUnreadNotificationsCount: count,
        },
      });
    }

    if (
      query.includes("getallnotifications") ||
      query.includes("getNotificationsByCategory") ||
      query.includes("getNotifications")
    ) {
      const page = variables.page || 1;
      const size = variables.size || 10;
      const start = (page - 1) * size;
      const paged = MOCK_NOTIFICATIONS.slice(start, start + size);
      return NextResponse.json({
        data: {
          getallnotifications: {
            page,
            size,
            total: MOCK_NOTIFICATIONS.length,
            items: paged,
          },
          getNotificationsByCategory: {
            page,
            size,
            total: MOCK_NOTIFICATIONS.length,
            items: paged,
          },
        },
      });
    }

    if (query.includes("markAllAsRead") || query.includes("markAllRead")) {
      MOCK_NOTIFICATIONS.forEach((n) => {
        n.read = true;
      });
      return NextResponse.json({
        data: {
          markAllAsRead: true,
        },
      });
    }

    if (query.includes("markAsRead")) {
      const nid = variables.notificationId || variables.id;
      const item = MOCK_NOTIFICATIONS.find((n) => n.id === nid);
      if (item) item.read = true;
      return NextResponse.json({
        data: {
          markAsRead: true,
        },
      });
    }

    if (query.includes("deleteNotification")) {
      const nid = variables.notificationId || variables.id;
      const idx = MOCK_NOTIFICATIONS.findIndex((n) => n.id === nid);
      if (idx !== -1) MOCK_NOTIFICATIONS.splice(idx, 1);
      return NextResponse.json({
        data: {
          deleteNotification: true,
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
