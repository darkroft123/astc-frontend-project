"use client";
import { Suspense } from "react";
import { HorarioCreationView } from "@/features/pm/creacion-horarios/HorarioCreationView";

export default function CreacionHorariosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Cargando...</div>}>
      <HorarioCreationView />
    </Suspense>
  );
}
