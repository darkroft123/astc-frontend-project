"use client";
import { HolidayPMListView } from "@/features/pm/holidays/HolidayPMListView";

export default function FeriadosPMPage() {
  return (
    <div className="min-h-screen bg-muted/50 py-4">
      <div className="max-w-7xl mx-auto px-4">

        <div className="mt-4">
          <HolidayPMListView />
        </div>
      </div>
    </div>
  );
}
