"use client";
import PageHeader from "@/components/layout/page-header";
import { ScheduleListView } from "@/features/pm/horarios/ScheduleListView";

export default function GestionHorariosPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto px-0 md:px-6 py-2 md:py-6">
        <PageHeader
          categoryTag={{ badge: "PANEL DE GESTIÓN", text: "Administración" }}
          title="Gestión de horarios"
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
