# Frontend Project (Project Manager UI)

Frontend para el rol Project Manager del sistema ASTC - dashboard de supervisión y gestión de proyectos.

## Stack Tecnológico

- Next.js 14+ (React - App Router)
- TypeScript
- TailwindCSS
- GraphQL Client
- Recharts (gráficos)

## Descripción

El frontend de Project Manager es el módulo de supervisión y control del sistema ASTC. Permite:

- Supervisar asistencia del equipo
- Revisar faltas y justificaciones
- Analizar métricas del proyecto
- Gestionar alertas generadas por el sistema
- Crear y administrar proyectos
- Asignar usuarios a proyectos

**Puerto:** 3001

## Arquitectura

```
frontend-project/
├── app/
│   └── pm/
│       ├── page.tsx              # Dashboard principal
│       ├── asistencias/          # Asistencias del equipo
│       ├── justificaciones/      # Justificaciones del equipo
│       ├── alertas/              # Alertas del sistema
│       ├── proyectos/            # Gestión de proyectos
│       ├── historial-asistencias/ # Historial con fotos
│       └── asignacion-horarios/  # Asignación de horarios
├── features/
├── components/
├── hooks/
├── lib/
└── app/services/
    └── project.assistance.service.ts  # Servicio GraphQL
```

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/pm` | Dashboard principal |
| `/pm/asistencias` | Asistencias del equipo |
| `/pm/justificaciones` | Lista de justificaciones |
| `/pm/justificaciones/[id]` | Detalle con revisión |
| `/pm/alertas` | Alertas del sistema |
| `/pm/proyectos` | Gestión de proyectos |
| `/pm/historial-asistencias` | Historial con fotos |
| `/pm/asignacion-horarios` | Asignación de horarios |

## Funcionalidades

### Dashboard
- Métricas: Asistencias, faltas, pendientes, % cumplimiento
- QuickActions 3x2: Asistencias, Justificaciones, Alertas, Proyectos, Historial, Horarios
- Gráfico de barras (Recharts)
- Actividad reciente del equipo

### Gestión de Justificaciones
- Lista con filtros: proyecto, usuario, estado, período
- Detalle con PDF preview
- Acciones: Aprobar, Rechazar, Solicitar Observación

### Gestión de Proyectos
- CRUD de proyectos
- Asignación de miembros
- Configuración de horarios

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `NODE_OPTIONS` | Opciones de memoria Node.js |

## Ejecución Local

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build
```

## Docker

```bash
# Puerto mapeado: 3001:3000
docker compose up -d frontend-project
```

## Integraciones

- **Gateway (Apollo)**: Consumo de GraphQL
- **project-assistance-service**: Datos de proyectos
- **backoffice-service**: Resolución de nombres
- **MinIO**: Visualización de fotos y documentos
