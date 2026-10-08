import type {
   Dashboard,
   Attendance,
   AttendancePage,
   Alert,
   AlertPage,
   Justification,
   JustificationPage,
   Absence,
   AbsencePage,
   Project,
   ProjectInput,
   ExportAttendanceResult,
   RegisterAttendanceInput,
   RegisterAttendanceOutput,
    ProjectMember,
    User,
    VacationRequest,
    VacationBalance,
    ShiftTemplate,
   
 } from "@/components/types/dashboard";

import { getGraphQLUrl } from "@/lib/api-host";

/* ================= UTILS ================= */

function safeJson(res: Response) {
  return res.text().then((text) => {
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      throw new Error("Respuesta JSON inválida del servidor");
    }
  });
}

/* ================= GRAPHQL CORE ================= */

type GraphQLResponse<T> = {
  data: T;
  errors?: { message: string }[];
};

export async function graphqlRequest<T>(
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

  const json: GraphQLResponse<T> = await safeJson(res);

  if (!res.ok || json?.errors) {
    throw new Error(json?.errors?.[0]?.message || "Error de GraphQL");
  }

  return json.data;
}

/* ================= RESPONSE TYPES ================= */

type GetDashboardPMResponse = {
  getDashboardPM: Dashboard;
};

type ListTeamAttendanceResponse = {
  listTeamAttendance: AttendancePage;
};

type ExportAttendanceResponse = {
  exportAttendance: ExportAttendanceResult;
};

type ListAttendanceAlertsResponse = {
  listAttendanceAlerts: AlertPage;
};

type ListJustificationsPMResponse = {
  listJustificationsPM: JustificationPage;
};

type ListTeamAbsencesResponse = {
  listTeamAbsences: AbsencePage;
};

type GetProjectByIdResponse = {
  getProjectById: Project;
};

type ApproveAlertResponse = {
  approveAlert: { id: string };
};

type RejectJustificationResponse = {
  rejectJustification: {
    id: string;
    status: string;
  };
};

type CreateProjectResponse = {
  createProject: {
    id: string;
    name: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    workStartTime: string;
    workEndTime: string;
    graceMinutes: number;
    absenceCutoffTime?: string;
    responsibleId?: string;
    createdAt: string;
  };
};

type DeleteProjectResponse = {
  DeleteProject: boolean;
};

/* ================= DASHBOARD ================= */

export async function getDashboardPM(
  token: string,
  projectId?: string,
  fromDate?: string,
  toDate?: string,
  userId?: string
): Promise<Dashboard> {
  const data = await graphqlRequest<GetDashboardPMResponse>(
    `
    query getDashboardPM(
      $projectId: String,
      $fromDate: String,
      $toDate: String,
      $userId: String
    ) {
      getDashboardPM(
        projectId: $projectId,
        fromDate: $fromDate,
        toDate: $toDate,
        userId: $userId
      ) {
        totalAttendances
        totalAbsences
        pendingJustifications
      }
    }
    `,
    { projectId, fromDate, toDate, userId },
    token
  );

  return data.getDashboardPM;
}

/* ================= TEAM ATTENDANCE ================= */

export async function listTeamAttendance(
  token: string,
  projectIdOrParams?: any,
  userId?: string | null,
  status?: string | null,
  fromDate?: string | null,
  toDate?: string | null,
  pageArg?: number,
  sizeArg?: number
) {
  let projectId: string | undefined;
  let page = 1;
  let size = 100;

  if (typeof projectIdOrParams === "object" && projectIdOrParams !== null) {
    projectId = projectIdOrParams.projectId;
    userId = projectIdOrParams.userId;
    status = projectIdOrParams.status;
    fromDate = projectIdOrParams.fromDate;
    toDate = projectIdOrParams.toDate;
    page = projectIdOrParams.page ?? 1;
    size = projectIdOrParams.size ?? 100;
  } else {
    projectId = projectIdOrParams;
    page = pageArg ?? 1;
    size = sizeArg ?? 100;
  }

  const data = await graphqlRequest<ListTeamAttendanceResponse>(
    `
    query listTeamAttendance(
      $page: Int!
      $size: Int!
      $projectId: String
      $userId: String
      $fromDate: String
      $toDate: String
      $status: String
    ) {
      listTeamAttendance(
        page: $page
        size: $size
        projectId: $projectId
        userId: $userId
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
          photoUrl
          latitude
          longitude
        }
        page
        size
        total
      }
    }
    `,
    {
      page,
      size,
      projectId: projectId || undefined,
      userId: userId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      status: status || undefined,
    },
    token
  );

  const res = data?.listTeamAttendance;
  return Array.isArray(res) ? res : (res?.items || []);
}

/* ================= EXPORT ================= */

export async function exportAttendance(
  token: string,
  params: any
) {
  const data = await graphqlRequest<ExportAttendanceResponse>(
    `
    query exportAttendance(
      $projectId: String
      $userId: String
      $fromDate: String
      $toDate: String
      $status: String
    ) {
      exportAttendance(
        projectId: $projectId
        userId: $userId
        fromDate: $fromDate
        toDate: $toDate
        status: $status
      ) {
        fileName
        content
      }
    }
    `,
    params,
    token
  );

  return data.exportAttendance;
}

/* ================= ALERTS ================= */

export async function listAttendanceAlerts(
  token: string,
  params: any
) {
  const data = await graphqlRequest<ListAttendanceAlertsResponse>(
    `
    query listAttendanceAlerts(
      $page: Int!
      $size: Int!
      $status: String
      $type: String
      $fromDate: String
      $toDate: String
    ) {
      listAttendanceAlerts(
        page: $page
        size: $size
        status: $status
        type: $type
        fromDate: $fromDate
        toDate: $toDate
      ) {
        items {
          id
          type
          status
        }
        page
        size
        total
      }
    }
    `,
    params,
    token
  );

  return data.listAttendanceAlerts;
}

/* ================= JUSTIFICATIONS ================= */

export async function listJustificationsPM(
  token: string,
  params: any
) {
  const data = await graphqlRequest<ListJustificationsPMResponse>(
    `
    query listJustificationsPM(
      $page: Int!
      $size: Int!
      $userId: String
      $status: String
      $fromDate: String
      $toDate: String
    ) {
      listJustificationsPM(
        page: $page
        size: $size
        userId: $userId
        status: $status
        fromDate: $fromDate
        toDate: $toDate
      ) {
        items {
          id
          status
          submittedAt
        }
        page
        size
        total
      }
    }
    `,
    params,
    token
  );

  return data.listJustificationsPM;
}

/* ================= TEAM ABSENCES ================= */

export async function listTeamAbsences(
  token: string,
  params: {
    page: number;
    size: number;
    projectId?: string | null;
    userId?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
    type?: string | null;
    justified?: boolean | null;
  }
) {
  const data = await graphqlRequest<ListTeamAbsencesResponse>(
    `
    query listTeamAbsences(
      $page: Int!
      $size: Int!
      $projectId: String
      $userId: String
      $fromDate: String
      $toDate: String
      $type: String
      $justified: Boolean
    ) {
      listTeamAbsences(
        page: $page
        size: $size
        projectId: $projectId
        userId: $userId
        fromDate: $fromDate
        toDate: $toDate
        type: $type
        justified: $justified
      ) {
        items {
          id
          userId
          projectId
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
    params as Record<string, unknown>,
    token
  );

  return data.listTeamAbsences;
}

/* ================= PROJECT ================= */

export async function getProjectById(
  token: string,
  id: string
) {
  const data = await graphqlRequest<GetProjectByIdResponse>(
    `
    query getProjectById($id: String!) {
      getProjectById(id: $id) {
        id
        name
        description
        status
        startDate
        endDate
        budget
        currency
        workStartTime
        workEndTime
        graceMinutes
        absenceCutoffTime
        vacationEligibilityDays
        holidays
        timezone
        responsibleId
        createdAt
        members {
          userId
          role
          user {
            username
            firstName
            lastName
          }
        }
      }
    }
    `,
    { id },
    token
  );

  return data.getProjectById;
}

/* ================= MUTATIONS ================= */

export async function approveAlert(
  token: string,
  alertId: string
) {
  const data = await graphqlRequest<ApproveAlertResponse>(
    `
    mutation approveAlert($alertId: String!) {
      approveAlert(alertId: $alertId) {
        id
      }
    }
    `,
    { alertId },
    token
  );

  return data.approveAlert;
}

export async function cancelAlert(
  token: string,
  alertId: string
) {
  const data = await graphqlRequest<{ cancelAlert: { id: string } }>(
    `
    mutation cancelAlert($alertId: String!) {
      cancelAlert(alertId: $alertId) {
        id
      }
    }
    `,
    { alertId },
    token
  );

  return data.cancelAlert;
}

export async function approveJustification(
  token: string,
  justificationId: string,
  comment?: string
) {
  const data = await graphqlRequest<{ approveJustification: { id: string; status: string } }>(
    `
    mutation approveJustification($justificationId: String!, $comment: String) {
      approveJustification(justificationId: $justificationId, comment: $comment) {
        id
        status
      }
    }
    `,
    { justificationId, comment: comment || "Aprobado por el Jefe de Proyecto" },
    token
  );

  return data.approveJustification;
}

export async function rejectJustification(
  token: string,
  justificationId: string,
  comment: string
) {
  const data = await graphqlRequest<RejectJustificationResponse>(
    `
    mutation rejectJustification($justificationId: String!, $comment: String!) {
      rejectJustification(justificationId: $justificationId, comment: $comment) {
        id
        status
      }
    }
    `,
    { justificationId, comment },
    token
  );

  return data.rejectJustification;
}

/* ================= CREATE PROJECT (FIXED) ================= */
export async function createProject(
  token: string,
  input: ProjectInput
) {
  const data = await graphqlRequest<CreateProjectResponse>(
    `
    mutation createProject($input: ProjectInput!) {
      createProject(input: $input) {
        id
        name
        description
        status
        startDate
        endDate
        workStartTime
        workEndTime
        graceMinutes
        absenceCutoffTime
        vacationEligibilityDays
        holidays
        timezone
        responsibleId
        createdAt
      }
    }
    `,
    { input },
    token
  );

  return data.createProject;
}

/* ================= DELETE PROJECT ================= */
export async function deleteProject(
  token: string,
  id: string
) {
  const data = await graphqlRequest<DeleteProjectResponse>(
    `
    mutation deleteProject($id: String!) {
      deleteProject(id: $id)
    }
    `,
    { id },
    token
  );

  return data.deleteProject;
}

/* ================= GET PROJECTS (WITH SEARCH) ================= */

type GetAllProjectsResponse = {
  getAllProjects: Project[];
};
export async function getAllProjects(
  token: string
) {
  const data = await graphqlRequest<GetAllProjectsResponse>(
    `
    query getAllProjects {
      getAllProjects {
        id
        name
        description
        status
        startDate
        endDate
        budget
        currency
        workStartTime
        workEndTime
        graceMinutes
        absenceCutoffTime
        vacationEligibilityDays
        holidays
        timezone
        shiftType
        responsibleId
        latitude
        longitude
        createdAt
        members {
          userId
          role
          user {
            username
            firstName
            lastName
            email
          }
        }
      }
    }
    `,
    {},
    token
  );

  return data.getAllProjects;
}

/* ================= SCHEDULE OVERRIDES ================= */

type ListScheduleOverridesResponse = {
  listScheduleOverrides: Array<{
    id: string;
    userId: string;
    projectId: string;
    workStartTime: string;
    workEndTime: string;
    graceMinutes: number;
  }>;
};

export async function listHolidays(token: string, targetId: string, year: number) {
  const query = `
    query($targetId: String!, $year: Int!) {
      listholidays(targetId: $targetId, year: $year) {
        id
        type
        targetId
        date
        name
      }
    }
  `;
  const data = await graphqlRequest(query, { targetId, year }, token);
  return data.listholidays;
}

export async function createHoliday(token: string, input: any) {
  const mutation = `
    mutation($input: HolidayInput!) {
      createHoliday(input: $input) {
        id
        type
        targetId
        date
        name
      }
    }
  `;
  const data = await graphqlRequest(mutation, { input }, token);
  return data.createHoliday;
}

export async function bulkCreateHolidays(token: string, targetId: string | null, dates: string[], name: string, type?: string) {
  const mutation = `
    mutation($targetId: String, $dates: [Date]!, $name: String, $type: String) {
      bulkcreateholidays(targetId: $targetId, dates: $dates, name: $name, type: $type) {
        id
        type
        targetId
        date
        name
      }
    }
  `;
  const data = await graphqlRequest(mutation, { targetId, dates, name, type }, token);
  return data.bulkcreateholidays;
}

export async function deleteHoliday(token: string, id: string) {
  const mutation = `
    mutation($id: String!) {
      deleteHoliday(id: $id)
    }
  `;
  const data = await graphqlRequest(mutation, { id }, token);
  return data.deleteHoliday;
}

export async function deleteAllHolidays(token: string, targetId: string | null, type: string) {
  const mutation = `
    mutation($targetId: String, $type: String) {
      deleteAllHolidays(targetId: $targetId, type: $type)
    }
  `;
  const data = await graphqlRequest(mutation, { targetId, type }, token);
  return data.deleteAllHolidays;
}

// ================= COLLECTIONS =================

export type CollectionItemOutput = {
  id: string;
  collectionId: string;
  date: string;
  name: string;
};

export type CollectionOutput = {
  id: string;
  name: string;
  scope: string;
  ownerId?: string;
  createdAt: string;
  items: CollectionItemOutput[];
};

export async function getGlobalCollections(token: string): Promise<CollectionOutput[]> {
  const query = `
    query {
      getGlobalCollections {
        id
        name
        scope
        ownerId
        createdAt
        items {
          id
          collectionId
          date
          name
        }
      }
    }
  `;
  const data = await graphqlRequest<any>(query, {}, token);
  return data.getGlobalCollections;
}

export async function getCollectionsForProject(token: string, projectId: string): Promise<CollectionOutput[]> {
  const query = `
    query($projectId: String!) {
      getCollectionsForProject(projectId: $projectId) {
        id
        name
        scope
        ownerId
        createdAt
        items {
          id
          collectionId
          date
          name
        }
      }
    }
  `;
  const data = await graphqlRequest<any>(query, { projectId }, token);
  return data.getCollectionsForProject;
}

export interface CollectionItemInput {
  date: string;
  name?: string;
}

export async function createCollection(
  token: string,
  input: { name: string; scope: string; ownerId?: string },
  items: CollectionItemInput[]
): Promise<CollectionOutput> {
  const mutation = `
    mutation($input: CollectionInput!, $items: [CollectionItemInput]) {
      createCollection(input: $input, items: $items) {
        id
        name
        scope
        ownerId
        createdAt
      }
    }
  `;
  const data = await graphqlRequest<any>(mutation, { input, items }, token);
  return data.createCollection;
}

export async function deleteCollection(token: string, id: string): Promise<boolean> {
  const mutation = `
    mutation($id: String!) {
      deleteCollection(id: $id)
    }
  `;
  const data = await graphqlRequest<any>(mutation, { id }, token);
  return data.deleteCollection;
}

export async function deleteCollectionItem(token: string, id: string): Promise<boolean> {
  const mutation = `
    mutation($id: String!) {
      deleteCollectionItem(id: $id)
    }
  `;
  const data = await graphqlRequest<any>(mutation, { id }, token);
  return data.deleteCollectionItem;
}

export async function addDatesToCollection(
  token: string,
  collectionId: string,
  dates: string[],
  name: string
): Promise<boolean> {
  const mutation = `
    mutation($collectionId: String!, $dates: [Date]!, $name: String) {
      addDatesToCollection(collectionId: $collectionId, dates: $dates, name: $name)
    }
  `;
  const data = await graphqlRequest<any>(mutation, { collectionId, dates, name }, token);
  return data.addDatesToCollection;
}

export async function linkProjectToCollection(token: string, projectId: string, collectionId: string): Promise<boolean> {
  const mutation = `
    mutation($projectId: String!, $collectionId: String!) {
      linkProjectToCollection(projectId: $projectId, collectionId: $collectionId)
    }
  `;
  const data = await graphqlRequest<any>(mutation, { projectId, collectionId }, token);
  return data.linkProjectToCollection;
}

export async function unlinkProjectFromCollection(token: string, projectId: string, collectionId: string): Promise<boolean> {
  const mutation = `
    mutation($projectId: String!, $collectionId: String!) {
      unlinkProjectFromCollection(projectId: $projectId, collectionId: $collectionId)
    }
  `;
  const data = await graphqlRequest<any>(mutation, { projectId, collectionId }, token);
  return data.unlinkProjectFromCollection;
}

export async function getAdminSetting(token: string, key: string): Promise<string | null> {
  const query = `
    query($key: String!) {
      getAdminSetting(key: $key)
    }
  `;
  try {
    const data = await graphqlRequest<any>(query, { key }, token);
    return data.getAdminSetting || null;
  } catch (e) {
    return null;
  }
}

export async function updateAdminSetting(token: string, key: string, value: string): Promise<boolean> {
  const mutation = `
    mutation($key: String!, $value: String!) {
      updateAdminSetting(key: $key, value: $value)
    }
  `;
  const data = await graphqlRequest<any>(mutation, { key, value }, token);
  return data.updateAdminSetting;
}

export async function listScheduleOverrides(
  token: string,
  projectId?: string | null,
  userId?: string | null
) {
  const data = await graphqlRequest<ListScheduleOverridesResponse>(
    `
    query listScheduleOverrides($projectId: String, $userId: String) {
      listScheduleOverrides(projectId: $projectId, userId: $userId) {
        id
        userId
        projectId
        workStartTime
        workEndTime
        graceMinutes
        shiftType
        rotationWorkDays
        rotationRestDays
        rotationShiftStartTime
        rotationShiftEndTime
        timezone
        absenceCutoffTime
      }
    }
    `,
    { projectId: projectId || null, userId: userId || null },
    token
  );

  return data.listScheduleOverrides;
}

type GetProjectMembersResponse = {
  getProjectMembers: ProjectMember[];
};

export async function getProjectMembers(
  token: string,
  projectId: string
): Promise<ProjectMember[]> {
  const data = await graphqlRequest<GetProjectMembersResponse>(
    `
    query getProjectMembers($projectId: String!) {
      getProjectMembers(projectId: $projectId) {
        id
        projectId
        userId
        role
        createdAt
        hasCustomSchedule
        user {
          id
          username
          email
          firstName
          lastName
          avatarUrl
          roleCode
          roleName
        }
      }
    }
    `,
    { projectId },
    token
  );

  return data.getProjectMembers;
}

type GetAllUsersResponse = {
  listUsers: User[];
};

export async function getAllUsers(token: string): Promise<User[]> {
  const data = await graphqlRequest<GetAllUsersResponse>(
    `
    query ListUsers {
      listUsers {
        id
        username
        email
        firstName
        lastName
        avatarUrl
        roleId
        roleCode
        roleName
      }
    }
    `,
    {},
    token
  );

  return data.listUsers;
}

type GetUserResponse = {
  listUsers: User[];
};

export async function getUserById(token: string, id: string): Promise<User | null> {
  try {
    const data = await graphqlRequest<GetUserResponse>(
      `
      query ListUsers {
        listUsers {
          id
          username
          email
          firstName
          lastName
          avatarUrl
          roleCode
          roleName
        }
      }
      `,
      {},
      token
    );
    return data.listUsers.find((u) => u.id === id) || null;
  } catch {
    return null;
  }
}

type ListProjectManagersResponse = {
  listProjectManagers: User[];
};

export async function listProjectManagers(token: string): Promise<User[]> {
  const data = await graphqlRequest<ListProjectManagersResponse>(
    `
    query ListProjectManagers {
      listProjectManagers {
        id
        username
        email
        firstName
        lastName
        avatarUrl
        roleId
        roleCode
        roleName
      }
    }
    `,
    {},
    token
  );

  return data.listProjectManagers;
}

type ListTeamMembersResponse = {
  listTeamMembers: User[];
};

export async function listTeamMembers(token: string): Promise<User[]> {
  const data = await graphqlRequest<ListTeamMembersResponse>(
    `
    query ListTeamMembers {
      listTeamMembers {
        id
        username
        email
        firstName
        lastName
        avatarUrl
        roleId
        roleCode
        roleName
      }
    }
    `,
    {},
    token
  );

  return data.listTeamMembers;
}

export async function assignProjectMembers(
  token: string,
  projectId: string,
  userIds: string[],
  role: string = "TEAM_MEMBER"
) {
  const results = [];
  for (const userId of userIds) {
    const result = await addProjectMember(token, projectId, userId, role);
    results.push(result);
  }
  return results;
}

export async function addProjectMember(
  token: string,
  projectId: string,
  userId: string,
  role: string = "TEAM_MEMBER"
) {
  const data = await graphqlRequest<{ AddProjectMember: any }>(
    `
    mutation addProjectMember($input: ProjectMemberInput!) {
      addProjectMember(input: $input) {
        id
        projectId
        userId
      }
    }
    `,
    { input: { projectId, userId, role } },
    token
  );
  return data.addProjectMember;
}

export async function deleteProjectMember(
  token: string,
  id: string
) {
  const data = await graphqlRequest<{ DeleteProjectMember: boolean }>(
    `
    mutation deleteProjectMember($id: String!) {
      deleteProjectMember(id: $id)
    }
    `,
    { id },
    token
  );
  return data.deleteProjectMember;
}

export async function updateProject(
  token: string,
  id: string,
  input: ProjectInput
) {
  const data = await graphqlRequest<{
    UpdateProject: Project;
  }>(
    `
    mutation updateProject($id: String!, $input: ProjectInput!) {
      updateProject(id: $id, input: $input) {
        id
        name
        description
        status
        startDate
        endDate
        budget
        currency
        workStartTime
        workEndTime
        graceMinutes
        absenceCutoffTime
        vacationEligibilityDays
        holidays
        timezone
        responsibleId
        createdAt
      }
    }
    `,
    { id, input },
    token
  );

  return data.updateProject;
}

/* ================= SCHEDULE MUTATIONS ================= */

export async function assignSchedule(
  token: string,
  userId: string,
  projectId: string,
  workStartTime: string,
  workEndTime: string,
  graceMinutes: number = 10
) {
  const data = await graphqlRequest<{ AssignSchedule: any }>(
    `
    mutation assignSchedule($input: ScheduleInput!) {
      assignSchedule(input: $input) {
        id
        userId
        projectId
        workStartTime
        workEndTime
        graceMinutes
      }
    }
    `,
    { input: { userId, projectId, workStartTime, workEndTime, graceMinutes } },
    token
  );
  return data.assignSchedule;
}

export async function deleteSchedule(
  token: string,
  userId: string,
  projectId: string
) {
  const data = await graphqlRequest<{ DeleteSchedule: boolean }>(
    `
    mutation deleteSchedule($userId: String!, $projectId: String!) {
      deleteSchedule(userId: $userId, projectId: $projectId)
    }
    `,
    { userId, projectId },
    token
  );
  return data.deleteSchedule;
}

/* ================= SHIFT TEMPLATES ================= */

type ListShiftTemplatesResponse = {
  listShiftTemplates: ShiftTemplate[];
};

type CreateShiftTemplateResponse = {
  createShiftTemplate: ShiftTemplate;
};

export async function listShiftTemplates(
  token: string,
  projectId?: string
): Promise<ShiftTemplate[]> {
  const data = await graphqlRequest<ListShiftTemplatesResponse>(
    `
    query listShiftTemplates($projectId: String) {
      listShiftTemplates(projectId: $projectId) {
        id
        projectId
        name
        shiftType
        workStartTime
        workEndTime
        graceMinutes
        mondayStart
        mondayEnd
        tuesdayStart
        tuesdayEnd
        wednesdayStart
        wednesdayEnd
        thursdayStart
        thursdayEnd
        fridayStart
        fridayEnd
        saturdayStart
        saturdayEnd
        sundayStart
        sundayEnd
        rotationWorkDays
        rotationRestDays
        rotationShiftStartTime
        rotationShiftEndTime
        validFrom
        validUntil
        absenceCutoffTime
        timezone
      }
    }
    `,
    { projectId },
    token
  );
  return data.listShiftTemplates;
}

export async function createShiftTemplate(
  token: string,
  input: {
    projectId: string;
    name: string;
    shiftType: string;
    workStartTime?: string;
    workEndTime?: string;
    graceMinutes?: number;
    mondayStart?: string;
    mondayEnd?: string;
    tuesdayStart?: string;
    tuesdayEnd?: string;
    wednesdayStart?: string;
    wednesdayEnd?: string;
    thursdayStart?: string;
    thursdayEnd?: string;
    fridayStart?: string;
    fridayEnd?: string;
    saturdayStart?: string;
    saturdayEnd?: string;
    sundayStart?: string;
    sundayEnd?: string;
    rotationWorkDays?: number;
    rotationRestDays?: number;
    rotationShiftStartTime?: string;
    rotationShiftEndTime?: string;
    validFrom?: string;
    validUntil?: string;
    absenceCutoffTime?: string;
    timezone?: string;
  }
): Promise<ShiftTemplate> {
  const data = await graphqlRequest<CreateShiftTemplateResponse>(
    `
    mutation createShiftTemplate($input: ShiftTemplateInput!) {
      createShiftTemplate(input: $input) {
        id
        name
        shiftType
      }
    }
    `,
    { input },
    token
  );
  return data.createShiftTemplate;
}

export async function deleteShiftTemplate(
  token: string,
  id: string
): Promise<boolean> {
  const data = await graphqlRequest<{ DeleteShiftTemplate: boolean }>(
    `
    mutation deleteShiftTemplate($id: String!) {
      deleteShiftTemplate(id: $id)
    }
    `,
    { id },
    token
  );
  return data.deleteShiftTemplate;
}

/* ================= VACATIONS ================= */

type ListVacationsResponse = {
  listVacations: VacationRequest[];
};

type GetVacationBalanceResponse = {
  getVacationBalance: VacationBalance;
};

type RequestVacationResponse = {
  requestVacation: VacationRequest;
};

type ApproveVacationResponse = {
  approveVacation: VacationRequest;
};

type RejectVacationResponse = {
  rejectVacation: VacationRequest;
};

export async function listVacations(
  token: string,
  userId?: string,
  status?: string
): Promise<VacationRequest[]> {
  const data = await graphqlRequest<ListVacationsResponse>(
    `
    query listVacations($userId: String, $status: String) {
      listVacations(userId: $userId, status: $status) {
        id
        userId
        projectId
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
    { userId, status },
    token
  );
  return data.listVacations;
}

export async function getVacationBalance(
  token: string,
  userId: string
): Promise<VacationBalance> {
  const data = await graphqlRequest<GetVacationBalanceResponse>(
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
  const data = await graphqlRequest<RequestVacationResponse>(
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

export async function approveVacation(
  token: string,
  requestId: string,
  discountDays?: number
): Promise<VacationRequest> {
  const data = await graphqlRequest<ApproveVacationResponse>(
    `
    mutation approveVacation($requestId: String!, $discountDays: Int) {
      approveVacation(requestId: $requestId, discountDays: $discountDays) {
        id
        status
        reviewedBy
        reviewedAt
      }
    }
    `,
    { requestId, discountDays: discountDays || 0 },
    token
  );
  return data.approveVacation;
}

export async function rejectVacation(
  token: string,
  requestId: string,
  comment: string
): Promise<VacationRequest> {
  const data = await graphqlRequest<RejectVacationResponse>(
    `
    mutation rejectVacation($requestId: String!, $comment: String!) {
      rejectVacation(requestId: $requestId, comment: $comment) {
        id
        status
        reviewedBy
        reviewedAt
      }
    }
    `,
    { requestId, comment },
    token
  );
  return data.rejectVacation;
}

export async function cancelVacation(
  token: string,
  requestId: string
): Promise<VacationRequest> {
  const data = await graphqlRequest<RequestVacationResponse>(
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
