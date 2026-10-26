"use client";

import { Folder, Search, ChevronRight, RefreshCw } from "lucide-react";

interface ScheduleFiltersProps {
  projectFilter: string;
  setProjectFilter: (val: string) => void;
  projectOptions: { id: string; name: string }[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ScheduleFilters({
  projectFilter,
  setProjectFilter,
  projectOptions,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  isLoading,
  onRefresh,
}: ScheduleFiltersProps) {
  return (
    <>
      {/* Desktop View (1 Row) */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 items-end pt-1">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Buscar */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Buscar
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Usuario o proyecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Tipo de horario */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Tipo de horario
          </label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="ALL" className="bg-card text-foreground">Todos</option>
              <option value="WITH_OVERRIDE" className="bg-card text-foreground">Personalizados</option>
              <option value="WITHOUT_OVERRIDE" className="bg-card text-foreground">Del proyecto</option>
              <option value="NO_PROJECT" className="bg-card text-foreground">Sin proyecto</option>
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Action: Actualizar button */}
        <div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full h-10 px-4 rounded-xl border border-border bg-background/50 hover:bg-background text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Mobile only */}
      <div className="md:hidden rounded-2xl border border-border bg-card/60 p-4 space-y-3.5 shadow-sm">
        {/* Proyecto */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Proyecto
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Buscar */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Buscar
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Usuario o proyecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Tipo de horario + Refresh */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Tipo de horario
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="ALL" className="bg-card text-foreground">Todos</option>
                <option value="WITH_OVERRIDE" className="bg-card text-foreground">Personalizados</option>
                <option value="WITHOUT_OVERRIDE" className="bg-card text-foreground">Del proyecto</option>
                <option value="NO_PROJECT" className="bg-card text-foreground">Sin proyecto</option>
              </select>
              <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="w-10 h-10 rounded-xl border border-border bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
