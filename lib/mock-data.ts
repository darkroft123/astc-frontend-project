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
    id: "proj-101",
    name: "test06",
    code: "TEST06",
    workStartTime: "08:00:00",
    workEndTime: "17:00:00",
    graceMinutes: 10,
    timezone: "America/Lima",
    vacationEligibilityDays: 30,
    holidays: ["2026-10-08", "2026-11-01", "2026-12-25"],
    members: [
      { userId: "pm-001", createdAt: "2026-01-01" },
      { userId: "user-002", createdAt: "2026-01-10" },
      { userId: "user-003", createdAt: "2026-02-01" },
    ],
  },
  {
    id: "proj-102",
    name: "Proyecto Alfa",
    code: "ALFA",
    workStartTime: "09:00:00",
    workEndTime: "18:00:00",
    graceMinutes: 15,
    timezone: "America/Lima",
    vacationEligibilityDays: 30,
    holidays: ["2026-10-08"],
    members: [
      { userId: "pm-001", createdAt: "2026-01-01" },
      { userId: "user-004", createdAt: "2026-03-01" },
    ],
  },
];

export const MOCK_TODAY_ATTENDANCE = {
  id: "att-today-001",
  userId: "pm-001",
  projectId: "proj-101",
  date: new Date().toISOString().split("T")[0],
  checkIn: "08:04:15",
  checkOut: null,
  status: "ASISTENCIA",
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
    projectName: "test06",
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
    projectName: "test06",
    date: "2026-10-14",
    checkIn: "11:28",
    checkOut: "13:59",
    status: "TARDE",
  },
];

export const MOCK_ALERTS_LIST = [
  {
    id: "alert-001",
    tipo: "UBICACION",
    descripcion: "Marcaje fuera del radio permitido (a 450m del punto asignado)",
    proyecto: "test06",
    fecha: "2026-10-14",
    hora: "08:52",
    ubicacionDetectada: "San Martín de Porres",
    estado: "PENDIENTE",
    usuario: {
      id: "user-002",
      nombre: "Carlos Mamani",
      email: "mamanigutierrezcarlos123@gmail.com",
      rol: "COLABORADOR",
    },
    coordenadas: { lat: -12.0184, lng: -77.0818 },
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
