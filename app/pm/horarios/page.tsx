"use client";
import PageHeader from "@/components/layout/page-header";
import { ScheduleListView } from "@/features/pm/horarios/ScheduleListView";

export default function GestionHorariosPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 space-y-6">
        <PageHeader
          categoryTag={{ badge: "PANEL DE GESTIÓN", text: "Administración" }}
          title="Gestión de horarios"
          description="Visualiza y administra los diferentes horarios creados en tus proyectos."
          showPeriodSelector={false}
        />
        <div>
          <ScheduleListView />
        </div>
      </div>
    </div>
  );
}
