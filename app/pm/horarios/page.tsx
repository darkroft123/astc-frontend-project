"use client";
import PageHeader from "@/components/layout/page-header";
import { ScheduleListView } from "@/features/pm/horarios/ScheduleListView";

export default function GestionHorariosPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <PageHeader
          categoryTag={{ badge: "JEFE DE PROYECTO", text: "Panel de Gestión" }}
          title="Gestión de Horarios"
          description="Visualiza y administra los diferentes horarios creados en tus proyectos."
          showPeriodSelector={false}
        />
        <div className="mt-6">
          <ScheduleListView />
        </div>
      </div>
    </div>
  );
}
