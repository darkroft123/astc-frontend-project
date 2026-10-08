export type Period =
  | "today"
  | "thisweek"
  | "month"
  | "currentperiod"
  | "3months"
  | "6months"
  | "9months"
  | "total"
  | "custom";

export interface DateRange {
  fromDate: string;
  toDate: string;
  label: string;
  period: Period;
}

export interface Dashboard {
  totalAttendances: number;
  totalAbsences: number;
  pendingJustifications: number;
}

/* 🔥 ALINEADO AL BACKEND */
export type AttendanceStatus =
  | "PRESENTE"
  | "FALTA"
  | "TARDE";

export interface AttendanceItem {
  id: string;
  userId: string;
  date: string;
  status: AttendanceStatus;
  projectId: string;
}

export interface AttendancePage {
  items: AttendanceItem[];
  page: number;
  size: number;
  total: number;
}

export interface RegisterAttendanceInput {
  projectId: string | null;
  latitude: number;
  longitude: number;
  photoUrl: string;
}

export interface RegisterAttendanceOutput {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  status: AttendanceStatus;
}
export type JustificationStatus =
  | "PENDING"
  | "SUBMITTED"
  | "OBSERVATION"
  | "APPROVED"
  | "REJECTED";

export interface JustificationItem {
  id: string;
  absenceId: string;
  userId: string;
  description: string;
  documentUrl: string | null;
  status: JustificationStatus;
  comment: string | null;
  submittedAt: string;
}

export interface JustificationPage {
  items: JustificationItem[];
  page: number;
  size: number;
  total: number;
}
export interface AbsenceItem {
  id: string;
  date: string;
  type: string;
  justified: boolean;
}

export interface AbsencePage {
  items: AbsenceItem[];
  page: number;
  size: number;
  total: number;
}

/* ================= VACATIONS ================= */

export interface VacationRequest {
  id: string;
  userId: string;
  projectId?: string;
  startDate: string;
  endDate: string;
  businessDays: number;
  status: string;
  comment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface VacationBalance {
  id?: string;
  userId: string;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  year: number;
}

export interface VacationEligibility {
  requiredDays: number;
  daysElapsed: number;
  isEligible: boolean;
  joinDate: string | null;
  daysRemaining: number;
}

export interface ExportAttendanceResult {
  fileName: string;
  content: string;
}