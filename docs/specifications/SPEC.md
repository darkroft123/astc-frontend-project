========================================================
FRONTEND JEFE DE PROYECTO - ESPECIFICACIÓN TÉCNICA
SISTEMA ASTC
========================================================

1. DESCRIPCIÓN GENERAL
--------------------------------------------------------
El frontend de Jefe de Proyecto (Project Manager Dashboard)
es el módulo de supervisión y control del sistema ASTC.

Este frontend permite al Project Manager:

- Supervisar asistencia del equipo
- Revisar faltas y justificaciones
- Analizar métricas del proyecto
- Gestionar alertas generadas por el sistema
- Crear y administrar proyectos
- Asignar usuarios a proyectos

Este módulo representa la capa de control operativo del sistema.
========================================================


2. RESPONSABILIDADES DEL SISTEMA
--------------------------------------------------------
El frontend del Project Manager es responsable de:

- Visualizar dashboard general del proyecto
- Consultar métricas de asistencia del equipo
- Gestionar alertas generadas por el sistema de asistencia
- Revisar detalle de cada usuario del proyecto
- Aprobar o rechazar justificaciones (vía backend)
- Crear nuevos proyectos
- Asignar usuarios a proyectos
- Navegar entre módulos de análisis

========================================================


3. ARQUITECTURA DEL FRONTEND
--------------------------------------------------------
Tecnología:

- Next.js (React - App Router)
- TypeScript
- TailwindCSS
- GraphQL Client
- Hooks personalizados (useDashboardPM)

Estructura:

DashboardView
    ↓
useDashboardPM (GraphQL Layer)
    ↓
Backend PM Service
    ↓
Resolvers GraphQL
    ↓
Database (Assistance + Alerts + Users)
========================================================


4. FLUJO DEL DASHBOARD PRINCIPAL
--------------------------------------------------------
1. PM ingresa al dashboard
2. Selecciona proyecto activo (GetAllProjects)
3. Selecciona rango de fechas (PeriodSelector)
4. Frontend ejecuta query GraphQL:
   GetDashboardPM(projectId, userId, fromDate, toDate)
5. Backend responde con métricas:
   - totalAttendances, totalAbsences, pendingJustifications
6. Se calcula attendanceRate (%)
7. Se renderiza dashboard con:

   Componentes:
   - 4 MetricCards con subtítulo y tendencia:
     - Asistencias (emerald) → "Días del equipo" / "Último periodo"
     - Faltas (rose)       → "Días ausentes" / "Histórico"
     - Pendientes (amber)  → "Por justificar" / "Revisión requerida"
     - Cumplimiento (blue) → "Tasa del equipo" / "Promedio actual"
   - UserProfileCard: avatar, nombre del PM, correo
   - GeneralSummaryCard: gráfico circular de % asistencia + leyenda
   - RecentActivityCard: actividad reciente de miembros del equipo
   - QuickActions 3x2 (6 botones):
     - Asistencias (/pm/asistencias)
     - Justificaciones (/pm/justificaciones)
     - Alertas (/pm/alertas)
     - Proyectos (/pm/proyectos)
     - Historial (/pm/historial-asistencias)
     - Horarios (/pm/asignacion-horarios)
   - Gráfico de barras (Recharts): Asistencias vs Faltas vs Pendientes
========================================================


5. MÓDULO DE PROYECTOS
--------------------------------------------------------
Este módulo permite:

- Listar proyectos existentes
- Crear nuevos proyectos
- Editar proyectos
- Asignar usuarios a proyectos

Flujo de creación:

1. PM selecciona "Crear Proyecto"
2. Ingresa:
   - Nombre del proyecto
   - Descripción
   - Fecha inicio / fin
3. Selecciona usuarios disponibles
4. Envía datos al backend
5. Backend guarda relación:
   project ↔ users
6. Se actualiza lista de proyectos
========================================================


6. MÓDULO DE ALERTAS
--------------------------------------------------------
El sistema muestra alertas generadas desde el backend:

Tipos de alertas:

- LOCATION_ANOMALY
- LATE_ATTENDANCE
- INVALID_IMAGE
- SUSPICIOUS_ACTIVITY

Flujo:

1. Assistance frontend genera alerta
2. Backend envía evento al PM service
3. PM frontend consulta lista de alertas
4. Se muestran en tiempo real o polling

Acciones del PM:

- Ver detalle de alerta
- Marcar como revisada
- Aprobar o escalar caso
========================================================


7. MÓDULO DE ASISTENCIA DEL EQUIPO
--------------------------------------------------------
Permite visualizar:

- Asistencias por usuario
- Faltas por usuario
- Historial completo
- Estadísticas por proyecto

Filtrado:

- por usuario
- por proyecto
- por fecha
- por estado
========================================================


8. MÓDULO DE JUSTIFICACIONES
--------------------------------------------------------
Rutas:
- /pm/justificaciones        → Lista de justificaciones del equipo
- /pm/justificaciones/{id}   → Detalle con revisión y acciones

Lista de justificaciones:
- Filtro default: ESTADO = "TODOS" (ve todas: pendientes, borradores, aprobadas, rechazadas, observación)
- Filtros: Proyecto, Usuario (nombres reales desde backoffice, no UUIDs), Estado, Período
- Métricas: TOTAL, PENDIENTES, APROBADAS, % APROBADAS
- Tabla: USUARIO (nombre) | MOTIVO | FECHA | ESTADO | ACCIONES
- Fecha muestra absenceDate como fallback cuando submittedAt es null
- Usuario muestra firstName lastName (resuelto vía getAllUsers)
- Acción: 👁 Ver detalle

Detalle de justificación:
- Info del usuario:
  - Nombre del usuario (resuelto)
  - Fecha de la falta (absenceDate)
  - Tipo de falta (absenceType: FALTA, TARDE, MEDICAL, etc.)
  - Fecha de envío (submittedAt)
  - Fecha de revisión (reviewedAt)
- Motivo completo de la justificación
- Documento adjunto:
  - Botón "Previsualizar" → expande panel con:
    - <iframe> para PDFs (visor nativo del navegador)
    - <img> para imágenes (JPG, PNG, etc.)
  - Botón "Descargar" → abre en nueva pestaña
- Panel de comentarios + textarea (cuando está pendiente)
- Botones de acción (cuando status = SUBMITTED):
  - "Solicitar Observación" (requiere comentario)
  - "Rechazar"
  - "Aprobar Justificación"

Estados del badge:
- SUBMITTED   → PENDIENTE (azul)
- PENDING     → BORRADOR (ámbar)
- OBSERVATION → EN OBSERVACIÓN (naranja)
- APPROVED    → APROBADA (esmeralda)
- REJECTED    → RECHAZADA (rojo)

9. MÓDULO DE HISTORIAL DE ASISTENCIA
--------------------------------------------------------
Ruta: /pm/historial-asistencias

- Lista paginada con filtros: proyecto, usuario, estado, período
- Métricas: TOTAL REGISTROS, PRESENTES, FALTAS, % ASISTENCIA
- Tabla: USUARIO | FECHA | ENTRADA | SALIDA | ESTADO | HORA | FOTO
- Columna FOTO: thumbnail de 64x64 con lightbox al hacer clic
  - Si la URL contiene "test.com" → muestra "Sin foto"
  - Si la imagen falla → onError oculta el thumbnail
- Datos desde: ListTeamAttendance (GraphQL con photoUrl)
========================================================


10. GESTIÓN DE PROYECTOS (DETALLE)
--------------------------------------------------------
Entidad principal:

- Project
- ProjectUser (relación muchos a muchos)

Operaciones:

- CREATE PROJECT
- UPDATE PROJECT
- DELETE PROJECT
- ASSIGN USERS
- REMOVE USERS

Regla:
Un usuario puede pertenecer a múltiples proyectos.
========================================================


11. UI DEL SISTEMA
--------------------------------------------------------
Pantallas principales:

- Dashboard principal PM (métricas + QuickActions 3x2 + gráfico)
- Lista de proyectos (CRUD + asignar miembros)
- Detalle de proyecto (horarios, miembros, ubicación)
- Alertas del sistema (listado + detalle con severidad)
- Asistencias del equipo (registro + gestión + historial con fotos)
- Justificaciones (lista con nombres de usuario + detalle con PDF preview)
- Asignación de horarios (ScheduleManagementView)
- Historial de asistencia (fotos con lightbox)

Componentes:

- MetricCard (5 colores: emerald, rose, amber, violet, blue)
- QuickActions (3x2 grid en PM)
- GeneralSummaryCard (gráfico circular de %)
- RecentActivityCard (actividad reciente del equipo)
- PeriodSelector (filtro de fechas)
- DataTable (tabla genérica con paginación)
- SubMetricCard (métricas pequeñas con color)
- StatusBadge (badge de estado con color por tipo)

12. INTEGRACIONES DEL FRONTEND
--------------------------------------------------------
- project-assistance-service (port 8083) → GraphQL principal PM
- backoffice-service (port 8084) → resolución de nombres de usuario (getAllUsers)
- MinIO (port 9010) → visualización de fotos y documentos (presigned URLs)
========================================================


12. FLUJO GLOBAL DEL SISTEMA
--------------------------------------------------------
LOGIN FRONTEND
      ↓
AUTH SERVICE (JWT)
      ↓
PROJECT MANAGER FRONTEND
      ↓
GRAPHQL PM SERVICE
      ↓
CONSULTA MULTISERVICIO:
   - Assistance Service
   - Alerts Table
   - Users Service
      ↓
VISUALIZACIÓN + GESTIÓN
========================================================


13. REGLAS DE NEGOCIO
--------------------------------------------------------
- Solo PROJECT_MANAGER puede acceder a este frontend
- Solo puede ver proyectos asignados
- No puede modificar usuarios globales (solo asignarlos)
- Todas las alertas deben ser auditables
- Toda acción queda registrada en backend
========================================================


14. SEGURIDAD
--------------------------------------------------------
- JWT obligatorio en todas las requests
- Validación de rol PROJECT_MANAGER
- Sin token → acceso bloqueado
- Sin proyecto asignado → no muestra datos
========================================================


15. CARACTERÍSTICAS TÉCNICAS
--------------------------------------------------------
- SSR / Client Components (Next.js)
- GraphQL queries centralizadas
- Hooks reutilizables (useDashboardPM)
- Arquitectura modular por dominio
- Separación frontend/backend total
========================================================


16. EVENTOS DEL SISTEMA (IMPORTANTE)
--------------------------------------------------------
Eventos generados:

- attendance.created
- absence.registered
- justification.submitted
- alert.generated

Estos eventos alimentan:

- PM dashboard
- alert system
- reporting module
========================================================


FIN DEL DOCUMENTO
========================================================