"use client";
import ScheduleForm from "@/components/dashboard/projects/assignaments/Schedule-form";

export default function AssignSchedulePage() {
  return (
    <div className="min-h-screen bg-muted/50 p-4">
      <ScheduleForm mode="create" />
    </div>
  );
}
