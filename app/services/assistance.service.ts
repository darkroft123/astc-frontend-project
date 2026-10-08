import type {
  Dashboard,
  RegisterAttendanceInput,
  RegisterAttendanceOutput,
  VacationRequest,
  VacationBalance,
  VacationEligibility,
} from "@/components/types/dashboard";
import { getGraphQLUrl } from "@/lib/api-host";

/* ================= UTILS ================= */

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Respuesta JSON inválida del servidor");
  }
}

/* ================= DASHBOARD ================= */

export async function getDashboard(
  token: string,
  fromDate?: string,
  toDate?: string
): Promise<Dashboard> {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query getDashboard($fromDate: String, $toDate: String) {
          getDashboard(fromDate: $fromDate, toDate: $toDate) {
            totalAttendances
            totalAbsences
            pendingJustifications
          }
        }
      `,
      variables: { fromDate: fromDate || null, toDate: toDate || null },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    throw new Error(json?.errors?.[0]?.message || "Error al cargar el panel");
  }

  return json.data?.getDashboard;
}

/* ================= LIST ABSENCES ================= */

export async function listAbsences(token: string, params: any) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query listAbsences(
          $page: Int!
          $size: Int!
          $projectId: String
          $fromDate: String
          $toDate: String
          $type: String
          $justified: Boolean
        ) {
          listAbsences(
            page: $page
            size: $size
            projectId: $projectId
            fromDate: $fromDate
            toDate: $toDate
            type: $type
            justified: $justified
          ) {
            items {
              id
              date
              type
              justified
            }
            page
            size
            total
          }
        }
      `,
      variables: {
        page: Number(params.page ?? 0),
        size: Number(params.size ?? 50),
        projectId: params.projectId || null,
        fromDate: params.fromDate || null,
        toDate: params.toDate || null,
        type: params.type || null,
        justified: params.justified ?? null,
      },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    throw new Error(json?.errors?.[0]?.message || "Error al listar faltas");
  }

  return json.data?.listAbsences;
}

/* ================= LIST ATTENDANCE ================= */

export async function listAttendance(token: string, params: any) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query listAttendance(
          $page: Int!
          $size: Int!
          $projectId: String
          $fromDate: String
          $toDate: String
          $status: String
        ) {
          listAttendance(
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
              latitude
              longitude
              photoUrl
            }
            page
            size
            total
          }
        }
      `,
      variables: {
        page: Number.isFinite(Number(params.page ?? 0)) ? Number(params.page ?? 0) : 0,
        size: Number.isFinite(Number(params.size ?? 50)) && Number(params.size ?? 50) > 0 ? Number(params.size ?? 50) : 100,
        projectId: params.projectId || null,
        fromDate: params.fromDate || null,
        toDate: params.toDate || null,
        status: params.status || null,
      },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    throw new Error(json?.errors?.[0]?.message || "Error al listar asistencias");
  }

  return json.data?.listAttendance;
}
export async function registerAttendance(token: string, input: any) {
  console.log("[API] ATTENDANCE_REQUEST received | projectId:", input.projectId);
  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation registerAttendance($input: RegisterAttendanceInput!) {
          registerAttendance(input: $input) {
            id
            userId
            date
            checkIn
            status
          }
        }
      `,
      variables: {
        input: {
          projectId: input.projectId,
          latitude: Number(input.latitude),
          longitude: Number(input.longitude),
          photoUrl: input.photoUrl || null,
        },
      },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    const msg = json?.errors?.[0]?.message || "Error al registrar asistencia";
    console.error("[API] ATTENDANCE_FAILED | message:", msg);
    console.error("[API] ATTENDANCE_FAILED | full errors:", JSON.stringify(json?.errors, null, 2));
    throw new Error(msg);
  }

  console.log("[API] ATTENDANCE_SUCCESS | id:", json.data?.registerAttendance?.id, "| status:", json.data?.registerAttendance?.status);
  return json.data?.registerAttendance;
}

/* ================= CHECK-OUT (EXIT REGISTRATION) ================= */

export async function checkOut(
  token: string,
  projectId?: string | null,
  photoUrl?: string | null,
  latitude?: number | null,
  longitude?: number | null
) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation checkOut($projectId: String, $photoUrl: String, $latitude: Float, $longitude: Float) {
          checkOut(projectId: $projectId, photoUrl: $photoUrl, latitude: $latitude, longitude: $longitude) {
            id
            date
            checkIn
            checkOut
            status
            photoUrl
            latitude
            longitude
          }
        }
      `,
      variables: {
        projectId: projectId || null,
        photoUrl: photoUrl || null,
        latitude: latitude || null,
        longitude: longitude || null,
      },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    const msg = json?.errors?.[0]?.message || "Error al registrar salida";
    console.error("[API] CHECKOUT_FAILED:", msg, json?.errors);
    throw new Error(msg);
  }

  console.log("[API] CHECKOUT_SUCCESS | id:", json.data?.checkOut?.id);
  return json.data?.checkOut;
}

/* ================= GET TODAY ATTENDANCE ================= */

export async function getTodayAttendance(token: string, projectId?: string | null) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query getTodayAttendance($projectId: String) {
          getTodayAttendance(projectId: $projectId) {
            id
            date
            checkIn
            checkOut
            status
            photoUrl
            latitude
            longitude
          }
        }
      `,
      variables: { projectId: projectId || null },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    const msg = json?.errors?.[0]?.message || "Error al obtener asistencia de hoy";
    console.error("[API] TODAY_ATTENDANCE_FAILED:", msg, json?.errors);
    return null;
  }

  return json.data?.getTodayAttendance || null;
}

/* ================= SAVE JUSTIFICATION ================= */

export async function saveJustification(token: string, input: any) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation saveJustification($input: SaveJustificationInputInput!) {
          saveJustification(input: $input) {
            id
            status
            submittedAt
          }
        }
      `,
      variables: {
        input: {
          absenceId: input.absenceId,
          description: input.description,
          documentUrl: input.documentUrl || null,
          fileBase64: input.fileBase64 || null,
        },
      },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    throw new Error(json?.errors?.[0]?.message || "Error al guardar justificación");
  }

  return json.data?.saveJustification;
}

/* ================= LIST JUSTIFICATIONS ================= */

export async function listJustifications(token: string, params: any) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query listJustifications(
          $page: Int!
          $size: Int!
          $status: String
          $fromDate: String
          $toDate: String
        ) {
          listJustifications(
            page: $page
            size: $size
            status: $status
            fromDate: $fromDate
            toDate: $toDate
          ) {
            items {
              id
              absenceId
              userId
              description
              documentUrl
              status
              comment
              submittedAt
            }
            page
            size
            total
          }
        }
      `,
      variables: {
        page: Number(params.page ?? 0),
        size: Number(params.size ?? 50),
        status: params.status || null,
        fromDate: params.fromDate || null,
        toDate: params.toDate || null,
      },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    throw new Error(json?.errors?.[0]?.message || "Error al listar justificaciones");
  }

  return json.data?.listJustifications;
}

/* ================= EDIT JUSTIFICATION ================= */

export async function editJustification(token: string, id: string, input: any) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation editJustification($id: String!, $input: SaveJustificationInputInput!) {
          editJustification(id: $id, input: $input) {
            id
            status
            submittedAt
          }
        }
      `,
      variables: {
        id,
        input: {
          absenceId: input.absenceId,
          description: input.description || null,
          documentUrl: input.documentUrl || null,
          fileBase64: input.fileBase64 || null,
        },
      },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    const msg = json?.errors?.[0]?.message || "Error al editar justificación";
    console.error("[API] editJustification FAILED:", msg, json?.errors);
    throw new Error(msg);
  }

  return json.data?.editJustification;
}

/* ================= SUBMIT JUSTIFICATION ================= */

export async function submitJustification(token: string, id: string) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation submitJustification($id: String!) {
          submitJustification(id: $id) {
            id
            status
            submittedAt
          }
        }
      `,
      variables: { id },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    const msg = json?.errors?.[0]?.message || "Error al enviar justificación";
    console.error("[API] submitJustification FAILED:", msg, json?.errors);
    throw new Error(msg);
  }

  return json.data?.submitJustification;
}

/* ================= DELETE JUSTIFICATION ================= */

export async function deleteJustification(token: string, id: string) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation deleteJustification($id: String!) {
          deleteJustification(id: $id)
        }
      `,
      variables: { id },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    const msg = json?.errors?.[0]?.message || "Error al eliminar justificación";
    console.error("[API] deleteJustification FAILED:", msg, json?.errors);
    throw new Error(msg);
  }

  return json.data?.deleteJustification;
}

/* ================= GET JUSTIFICATION DETAIL ================= */

export async function getJustificationDetail(token: string, id: string) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query getJustificationDetailPM($id: String!) {
          getJustificationDetailPM(id: $id) {
            id
            absenceId
            userId
            description
            documentUrl
            status
            comment
            submittedAt
            reviewedAt
            reviewedBy
            absenceDate
            absenceType
            history {
              id
              previousStatus
              newStatus
              comment
              changedBy
              changedAt
            }
          }
        }
      `,
      variables: { id },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    const msg = json?.errors?.[0]?.message || "Error al obtener detalle de justificación";
    console.error("[API] getJustificationDetail FAILED:", msg, json?.errors);
    throw new Error(msg);
  }

  return json.data?.getJustificationDetailPM;
}

/* ================= JUSTIFY ABSENCE ================= */
export async function justifyAbsence(token: string, absenceId: string) {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation justifyAbsence($input: JustifyAbsenceInputInput!) {
          justifyAbsence(input: $input) {
            absenceId
            valid
          }
        }
      `,
      variables: {
        input: { absenceId },
      },
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    throw new Error(json?.errors?.[0]?.message || "Error al justificar");
  }

  return json.data?.justifyAbsence;
}

/* ================= GET MY PROJECTS ================= */
export async function getMyProjects(token: string): Promise<{
  id: string;
  name: string;
  workStartTime?: string;
  workEndTime?: string;
  graceMinutes?: number;
  vacationEligibilityDays?: number;
  holidays?: string[];
  members?: { userId: string; createdAt: string }[];
}[]> {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query getMyProjects {
          getMyProjects {
            id
            name
            workStartTime
            workEndTime
            graceMinutes
            timezone
            vacationEligibilityDays
            holidays
            members {
              userId
              createdAt
            }
          }
        }
      `,
    }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    throw new Error(json?.errors?.[0]?.message || "Error al obtener proyectos");
  }

  return json.data?.getMyProjects || [];
}

/* ================= GET USER PROFILE ================= */

export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleCode: string;
  roleName: string;
}

export async function getUserProfile(token: string, userId: string): Promise<UserProfile | null> {
  if (!token) throw new Error("Token de autenticación no encontrado");

  try {
    const res = await fetch(getGraphQLUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          query ListUsers {
            listUsers {
              id
              username
              firstName
              lastName
              email
              phone
              roleCode
              roleName
            }
          }
        `,
      }),
    });

    const json = await safeJson(res);

    if (!res.ok || json?.errors) {
      console.error("Error fetching user profile:", json?.errors);
      return null;
    }

    const users = json.data?.listUsers || [];
    return users.find((u: any) => u.id === userId) || null;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}

/* ================= VACATIONS ================= */

async function projectGraphqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<T> {
  if (!token) throw new Error("Token de autenticación no encontrado");

  const res = await fetch(getGraphQLUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.errors) {
    throw new Error(json?.errors?.[0]?.message || "Error de GraphQL");
  }

  return json?.data;
}

export async function listMyVacations(
  token: string,
  userId: string
): Promise<VacationRequest[]> {
  const data = await projectGraphqlRequest<{ listVacations: VacationRequest[] }>(
    `
    query listVacations($userId: String) {
      listVacations(userId: $userId) {
        id
        userId
        startDate
        endDate
        businessDays
        status
        comment
        reviewedBy
        reviewedAt
        createdAt
      }
    }
    `,
    { userId },
    token
  );
  return data.listVacations;
}

export async function getMyVacationBalance(
  token: string,
  userId: string
): Promise<VacationBalance> {
  const data = await projectGraphqlRequest<{ getVacationBalance: VacationBalance }>(
    `
    query getVacationBalance($userId: String!) {
      getVacationBalance(userId: $userId) {
        id
        userId
        totalDays
        usedDays
        pendingDays
        availableDays
        year
      }
    }
    `,
    { userId },
    token
  );
  return data.getVacationBalance;
}

export async function requestVacation(
  token: string,
  input: {
    userId: string;
    projectId?: string;
    startDate: string;
    endDate: string;
    businessDays: number;
    comment?: string;
  }
): Promise<VacationRequest> {
  const data = await projectGraphqlRequest<{ RequestVacation: VacationRequest }>(
    `
    mutation requestVacation($input: VacationRequestInput!) {
      requestVacation(input: $input) {
        id
        userId
        startDate
        endDate
        businessDays
        status
        comment
        createdAt
      }
    }
    `,
    { input },
    token
  );
  return data.requestVacation;
}

export async function cancelVacation(
  token: string,
  requestId: string
): Promise<VacationRequest> {
  const data = await projectGraphqlRequest<{ CancelVacation: VacationRequest }>(
    `
    mutation cancelVacation($requestId: String!) {
      cancelVacation(requestId: $requestId) {
        id
        status
      }
    }
    `,
    { requestId },
    token
  );
  return data.cancelVacation;
}

export async function getEffectiveSchedule(
  token: string,
  userId: string,
  projectId: string,
  date?: string
): Promise<{
  workDay: boolean;
  expectedStartTime: string | null;
  expectedEndTime: string | null;
  graceMinutes: number;
  absenceCutoffTime: string;
  timezone: string;
  shiftType: string | null;
}> {
  const data = await projectGraphqlRequest<{ getEffectiveSchedule: any }>(
    `
    query getEffectiveSchedule($userId: String!, $projectId: String!, $date: String) {
      getEffectiveSchedule(userId: $userId, projectId: $projectId, date: $date) {
        workDay
        expectedStartTime
        expectedEndTime
        graceMinutes
        absenceCutoffTime
        timezone
        shiftType
      }
    }
    `,
    { userId, projectId, date },
    token
  );
  return data.getEffectiveSchedule;
}

export async function getMyVacationEligibility(
  token: string,
  projectId: string
): Promise<VacationEligibility | null> {
  const data = await projectGraphqlRequest<{ getMyVacationEligibility: VacationEligibility }>(
    `
    query getMyVacationEligibility($projectId: String!) {
      getMyVacationEligibility(projectId: $projectId) {
        requiredDays
        daysElapsed
        isEligible
        joinDate
        daysRemaining
      }
    }
    `,
    { projectId },
    token
  );
  return data.getMyVacationEligibility;
}

