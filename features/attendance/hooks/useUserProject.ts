"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { getMyProjects } from "@/app/services/assistance.service";

export interface Project {
  id: string;
  name: string;
  workStartTime?: string;
  workEndTime?: string;
  graceMinutes?: number;
  timezone?: string | null;
  holidays?: string[];
}

export const DEFAULT_MOCK_PROJECT: Project = {
  id: "proj-testo6",
  name: "testo6",
  workStartTime: "08:00",
  workEndTime: "17:00",
  graceMinutes: 15,
  timezone: "America/Lima",
  holidays: [],
};

let cachedProjects: Project[] = [DEFAULT_MOCK_PROJECT];
let cachedPromise: Promise<Project[]> | null = null;
let hasFetched = false;
let cachedToken: string | null = null;

export function useUserProject() {
  const { token, role, hydrated } = useAuth();
  const [projects, setProjects] = useState<Project[]>(cachedProjects.length > 0 ? cachedProjects : [DEFAULT_MOCK_PROJECT]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("selected_project_id");
      if (savedId) setSelectedProjectId(savedId);

      const handleProjectChange = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id");
        if (newId !== undefined) {
          setSelectedProjectId(newId);
        }
      };

      window.addEventListener("astc-project-changed", handleProjectChange);
      window.addEventListener("storage", handleProjectChange);
      return () => {
        window.removeEventListener("astc-project-changed", handleProjectChange);
        window.removeEventListener("storage", handleProjectChange);
      };
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      setLoadingProject(false);
      setProjects([DEFAULT_MOCK_PROJECT]);
      return;
    }

    if (cachedToken !== token) {
      cachedToken = token;
      cachedProjects = [DEFAULT_MOCK_PROJECT];
      cachedPromise = null;
      hasFetched = false;
    }

    if (hasFetched) {
      setProjects(cachedProjects.length > 0 ? cachedProjects : [DEFAULT_MOCK_PROJECT]);
      setLoadingProject(false);
      return;
    }

    if (!cachedPromise) {
      setLoadingProject(true);
      cachedPromise = getMyProjects(token)
        .then((data) => {
          cachedProjects = data && data.length > 0 ? data : [DEFAULT_MOCK_PROJECT];
          hasFetched = true;
          return cachedProjects;
        })
        .catch((err) => {
          console.warn("Backend project fetch failed, using fallback mock project:", err);
          cachedProjects = [DEFAULT_MOCK_PROJECT];
          hasFetched = true;
          return [DEFAULT_MOCK_PROJECT];
        });
    }

    cachedPromise.then((resolved) => {
      setProjects(resolved && resolved.length > 0 ? resolved : [DEFAULT_MOCK_PROJECT]);
      setLoadingProject(false);
    });
  }, [token, role, hydrated]);

  const selectProject = useCallback((id: string) => {
    setSelectedProjectId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_project_id", id);
      window.dispatchEvent(new CustomEvent("astc-project-changed", { detail: id }));
    }
  }, []);

  const project =
    selectedProjectId === "all"
      ? null
      : projects.find((p) => p.id === selectedProjectId) ||
        (projects.length > 0 ? projects[0] : DEFAULT_MOCK_PROJECT);

  return {
    project,
    projects: projects.length > 0 ? projects : [DEFAULT_MOCK_PROJECT],
    selectProject,
    selectedProjectId: selectedProjectId ?? (project?.id ?? DEFAULT_MOCK_PROJECT.id),
    loadingProject,
  };
}
