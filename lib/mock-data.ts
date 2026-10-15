// ==========================================
// CENTRAL MOCK DATA FOR LOCAL DEVELOPMENT
// ==========================================

export const MOCK_USER_PM = {
  id: "pm-001",
  sub: "pm-001",
  email: "jefeproyecto@astc.joyit.io",
  username: "jefeproyecto-x",
  firstName: "Carlos",
  lastName: "Mamani",
  role: "PROJECT_MANAGER",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  exp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days valid
};

export const MOCK_PROJECTS = [
  {
    id: "proj-103",
    name: "gestion de asistencia",
    code: "GDA",
    workStartTime: "08:00:00",
    workEndTime: "17:00:00",
    graceMinutes: 10,
    timezone: "America/Lima",
    vacationEligibilityDays: 30,
    holidays: ["2026-10-08"],
    members: [
      { userId: "user-002b", createdAt: "2026-01-01" },
    ],
  },
  {
    id: "proj-101",
    name: "testo6",
    code: "TEST06",
    workStartTime: "08:00:00",
    workEndTime: "17:00:00",
    graceMinutes: 10,
    timezone: "America/Lima",
    vacationEligibilityDays: 30,
    holidays: ["2026-10-08", "2026-11-01", "2026-12-25"],
    members: [
      { userId: "user-002", createdAt: "2026-01-10" },
      { userId: "user-003", createdAt: "2026-01-01" },
      { userId: "pm-001", createdAt: "2026-02-01" },
    ],
  },
  {
    id: "proj-102",
    name: "proyecto testeo",
    code: "TESTEO",
    workStartTime: "08:00:00",
    workEndTime: "17:00:00",
    graceMinutes: 10,
    timezone: "America/Lima",
    vacationEligibilityDays: 30,
    holidays: ["2026-10-08"],
    members: [
      { userId: "pm-001", shiftType: "4x4", createdAt: "2026-01-01" },
      { userId: "user-004", createdAt: "2026-03-01" },
    ],
  },
];

export const MOCK_USERS = [
  {
    id: "pm-001",
    firstName: "jefeproyecto-x",
    lastName: "",
    username: "jefeproyecto-x",
    email: "pm@astc.com",
    role: "PROJECT_MANAGER",
    roleCode: "PROJECT_MANAGER",
  },
  {
    id: "user-002",
    firstName: "carlos",
    lastName: "mamani",
    username: "carlos123",
    email: "mamanigutierrezcarlos123@gmail.com",
    role: "TEAM_MEMBER",
    roleCode: "TEAM_MEMBER",
  },
  {
    id: "user-002b",
    firstName: "carlos",
    lastName: "mamani",
    username: "carlos-mamani-2",
    email: "mamanigutierrezcarlos2123@gmail.com",
    role: "TEAM_MEMBER",
    roleCode: "TEAM_MEMBER",
  },
  {
    id: "user-003",
    firstName: "user",
    lastName: "carlos",
    username: "user-carlos",
    email: "user@astc.com",
    role: "TEAM_MEMBER",
    roleCode: "TEAM_MEMBER",
  },
  {
    id: "user-004",
    firstName: "Ana",
    lastName: "Reyes",
    username: "ana.reyes",
    email: "ana@astc.com",
    role: "TEAM_MEMBER",
    roleCode: "TEAM_MEMBER",
  },
  {
    id: "user-005",
    firstName: "David",
    lastName: "Gomez",
    username: "david.gomez",
    email: "david@astc.com",
    role: "TEAM_MEMBER",
    roleCode: "TEAM_MEMBER",
  },
];

export const MOCK_TODAY_ATTENDANCE = {
  id: "att-today-001",
  userId: "pm-001",
  projectId: "proj-101",
  date: "2026-09-02",
  checkIn: "08:52:00",
  checkOut: null as string | null,
  status: "EARLY",
};

export const MOCK_DASHBOARD_PM = {
  totalAttendances: 142,
  totalAbsences: 6,
  pendingJustifications: 3,
  porcentajeAsistencia: 94.2,
};

export const MOCK_ATTENDANCES_LIST = [
  {
    id: "att-1",
    userId: "user-002",
    userName: "Carlos Mamani",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    projectId: "proj-101",
    projectName: "testo6",
    date: "2026-10-14",
    checkIn: "08:52",
    checkOut: "09:07",
    status: "ASISTENCIA",
  },
  {
    id: "att-2",
    userId: "pm-001",
    userName: "jefeproyecto-x",
    userEmail: "pm@astc.com",
    projectId: "proj-102",
    projectName: "proyecto testeo",
    date: "2026-10-14",
    checkIn: "08:00",
    checkOut: "17:00",
    status: "ASISTENCIA",
  },
  {
    id: "att-3",
    userId: "user-003",
    userName: "user-carlos",
    userEmail: "user@astc.com",
    projectId: "proj-101",
    projectName: "testo6",
    date: "2026-10-14",
    checkIn: "11:28",
    checkOut: "13:59",
    status: "TARDE",
  },
];

export const MOCK_ALERTS_LIST = [
  {
    id: "5dc39f2c-7b14-41aa-a511-399b38bbdcf9",
    type: "ASISTENCIA_TARDE",
    status: "PENDING",
    message: "Análisis completado sin anomalías",
    detailMessage: "Análisis completado sin anomalías. El marcaje de entrada se registró después de la hora de inicio del turno (08:00).",
    projectId: "proj-101",
    projectName: "testo6",
    userId: "user-002",
    userName: "carlos mamani",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    createdAt: "2026-09-02T08:52:00.000Z",
    latitude: -12.0184,
    longitude: -77.0818,
    district: "Condevilla Señor",
    delayMinutes: 52,
  },
  {
    id: "6ef40a3d-8c25-42bb-b622-400c49cceea0",
    type: "ASISTENCIA_TARDE",
    status: "PENDING",
    message: "Análisis completado sin anomalías",
    detailMessage: "Análisis completado sin anomalías. El marcaje de entrada se registró después de la hora de inicio del turno (08:00).",
    projectId: "proj-101",
    projectName: "testo6",
    userId: "user-002",
    userName: "carlos mamani",
    userEmail: "mamanigutierrezcarlos123@gmail.com",
    createdAt: "2026-09-01T08:45:00.000Z",
    latitude: -12.0184,
    longitude: -77.0818,
    district: "Condevilla Señor",
    delayMinutes: 45,
  },
];

export const MOCK_JUSTIFICATIONS_LIST = [
  {
    id: "just-001",
    usuario: "Carlos Mamani",
    usuarioId: "user-002",
    motivo: "Cita médica comprobada",
    fecha: "2026-10-12",
    estado: "PENDIENTE",
    descripcion: "Cita de control odontológico programada en EsSalud.",
    proyecto: "test06",
    submittedAt: "2026-10-12T14:30:00Z",
  },
];

export const MOCK_VACATIONS_LIST = [
  {
    id: "vac-001",
    userId: "pm-001",
    startDate: "2026-11-15",
    endDate: "2026-11-30",
    businessDays: 12,
    status: "PENDIENTE",
    reason: "Vacaciones pendientes del periodo 2025-2026",
    createdAt: "2026-10-01",
  },
];

export const MOCK_SCHEDULES = [
  {
    id: "sched-001",
    name: "Turno Regular 40h",
    shiftType: "REGULAR",
    expectedStartTime: "08:00:00",
    expectedEndTime: "17:00:00",
    graceMinutes: 10,
  },
  {
    id: "sched-002",
    name: "Turno Rotativo 4x4",
    shiftType: "ROTATING",
    expectedStartTime: "07:00:00",
    expectedEndTime: "19:00:00",
    graceMinutes: 15,
  },
];

export const MOCK_COLLECTIONS = [
  {
    id: "col-001",
    name: "reretesteo",
    scope: "GLOBAL",
    ownerId: "proj-101",
    createdAt: "2026-09-01T00:00:00Z",
    items: [
      { id: "item-1", collectionId: "col-001", date: "2026-09-12", name: "reretesteo" },
      { id: "item-2", collectionId: "col-001", date: "2026-09-17", name: "reretesteo" },
      { id: "item-3", collectionId: "col-001", date: "2026-09-23", name: "reretesteo" },
    ],
  },
  {
    id: "col-002",
    name: "feriados",
    scope: "GLOBAL",
    ownerId: "proj-101",
    createdAt: "2026-09-01T00:00:00Z",
    items: [
      { id: "item-4", collectionId: "col-002", date: "2026-05-01", name: "Día del Trabajo" },
      { id: "item-5", collectionId: "col-002", date: "2026-07-28", name: "Fiestas Patrias" },
      { id: "item-6", collectionId: "col-002", date: "2026-07-29", name: "Fiestas Patrias" },
    ],
  },
  {
    id: "col-003",
    name: "feriados2",
    scope: "GLOBAL",
    ownerId: "proj-101",
    createdAt: "2026-09-01T00:00:00Z",
    items: [
      { id: "item-7", collectionId: "col-003", date: "2026-08-30", name: "Santa Rosa de Lima" },
      { id: "item-8", collectionId: "col-003", date: "2026-10-08", name: "Combate de Angamos" },
      { id: "item-9", collectionId: "col-003", date: "2026-11-01", name: "Todos los Santos" },
      { id: "item-10", collectionId: "col-003", date: "2026-12-25", name: "Navidad" },
    ],
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif-01",
    notificationCode: "AST00012",
    title: "Justificación enviada",
    body: "Hola mamanigutierrezcarlos123, se ha recibido su justificación para la ausencia del día 2026-09-02. ID: 8432261f-e26a. Estado: Enviado. Será revisada a la brevedad.",
    icon: null,
    color: null,
    actionLink: "/justificaciones",
    read: false,
    createdAt: "2026-09-02T10:30:00.000Z",
  },
  {
    id: "notif-02",
    notificationCode: "AST00012",
    title: "Justificación enviada",
    body: "Hola mamanigutierrezcarlos123, se ha recibido su justificación para la ausencia del día 2026-09-02. ID: 8432261f-e26a. Estado: Borrador. Será revisada a la brevedad.",
    icon: null,
    color: null,
    actionLink: "/justificaciones",
    read: false,
    createdAt: "2026-09-02T09:15:00.000Z",
  },
  {
    id: "notif-03",
    notificationCode: "AST00009",
    title: "Salida temprana",
    body: "Hola mamanigutierrezcarlos123, se ha registrado su salida temprana el día 2026-09-02. Estado: Salida temprana. Proyecto: 2454b982-751d. Recuerde cumplir su horario.",
    icon: null,
    color: null,
    actionLink: "/asistencias",
    read: false,
    createdAt: "2026-09-02T08:00:00.000Z",
  },
  {
    id: "notif-04",
    notificationCode: "AST00012",
    title: "Justificación enviada",
    body: "Hola mamanigutierrezcarlos123, se ha recibido su justificación para la ausencia del día 2026-09-02. ID: 8432261f-e26a. Estado: Enviado. Será revisada a la brevedad.",
    icon: null,
    color: null,
    actionLink: "/justificaciones",
    read: false,
    createdAt: "2026-09-02T07:45:00.000Z",
  },
  ...Array.from({ length: 24 }).map((_, i) => ({
    id: `notif-${i + 5}`,
    notificationCode: i % 2 === 0 ? "AST00012" : "AST00009",
    title: i % 2 === 0 ? "Justificación enviada" : "Salida temprana",
    body: i % 2 === 0
      ? `Hola mamanigutierrezcarlos123, se ha recibido su justificación para la ausencia del día 2026-09-0${(i % 5) + 1}. ID: ${Math.random().toString(16).substring(2, 10)}. Estado: Enviado. Será revisada a la brevedad.`
      : `Hola mamanigutierrezcarlos123, se ha registrado su salida temprana el día 2026-09-0${(i % 5) + 1}. Estado: Salida temprana. Recuerde cumplir su horario.`,
    icon: null,
    color: null,
    actionLink: i % 2 === 0 ? "/justificaciones" : "/asistencias",
    read: false,
    createdAt: `2026-09-02T0${Math.max(1, 7 - (i % 6))}:00:00.000Z`,
  })),
];
