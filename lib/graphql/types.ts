// GraphQL Types for Project Manager Module

export type AttendanceStatus = 'ASISTENCIA' | 'FALTA' | 'TARDE' | 'JUSTIFICADO'
export type JustificationStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
export type AlertStatus = 'PENDIENTE' | 'APROBADA' | 'CANCELADA'

export interface User {
  id: string
  nombre: string
  email: string
  rol: string
  avatar?: string
}

export interface Project {
  id: string
  nombre: string
  codigo: string
}

export interface AttendanceRecord {
  id: string
  fecha: string
  proyecto: string
  usuario: string
  estado: AttendanceStatus
  justificacion?: string
  registrado: string
  foto?: string
  localizacion?: string
}

export interface AbsenceByPeriod {
  semana: string
  faltas: number
}

export interface AbsenceByGroup {
  proyecto: string
  faltas: number
}

export interface DashboardMetrics {
  totalAsistencias: number
  totalFaltas: number
  totalJustificacionesPendientes: number
  porcentajeAsistencia: number
}

export interface DashboardPM {
  usuario: User
  periodo: string
  proyecto: Project
  metricas: DashboardMetrics
  faltasPorPeriodo: AbsenceByPeriod[]
  faltasPorGrupo: AbsenceByGroup[]
}

export interface TeamAttendanceFilters {
  proyectoId?: string
  periodo?: string
  usuarioId?: string
}

export interface TeamAttendanceResponse {
  total: number
  asistencias: number
  faltas: number
  porcentajeAsistencia: number
  registros: AttendanceRecord[]
  pagination: Pagination
}

export interface Pagination {
  page: number
  size: number
  total: number
}

export interface LocationAlert {
  id: string
  tipo: string
  descripcion: string
  proyecto: string
  fecha: string
  hora: string
  ubicacionDetectada: string
  estado: AlertStatus
  usuario: User
  coordenadas?: {
    lat: number
    lng: number
  }
}

export interface AlertsListResponse {
  alertas: LocationAlert[]
  pagination: Pagination
}

export interface Justification {
  id: string
  usuario: string
  usuarioId: string
  motivo: string
  fecha: string
  estado: JustificationStatus
  descripcion?: string
  documentoAdjunto?: {
    nombre: string
    url: string
    tipo: string
  }
  comentarios?: Comment[]
  proyecto: string
}

export interface Comment {
  id: string
  usuario: string
  texto: string
  fecha: string
}

export interface JustificationsListResponse {
  justificaciones: Justification[]
  pagination: Pagination
}

// GraphQL Operation Response Types
export interface GetDashboardPMResponse {
  data: {
    getDashboardPM: DashboardPM
  }
}

export interface ListTeamAttendanceResponse {
  data: {
    listTeamAttendance: TeamAttendanceResponse
  }
}

export interface ListAttendanceAlertsResponse {
  data: {
    listAttendanceAlerts: AlertsListResponse
  }
}

export interface GetAlertDetailResponse {
  data: {
    getAlertDetail: LocationAlert
  }
}

export interface ListJustificationsPMResponse {
  data: {
    listJustificationsPM: JustificationsListResponse
  }
}

export interface GetJustificationDetailPMResponse {
  data: {
    getJustificationDetailPM: Justification
  }
}

export interface MutationResponse {
  data: {
    success: boolean
    message: string
  }
}
