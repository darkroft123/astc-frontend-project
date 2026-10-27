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

let cachedProjects: Project[] = [];
let cachedPromise: Promise<Project[]> | null = null;
let hasFetched = false;
let cachedToken: string | null = null;

export function useUserProject() {
  const { token, role, hydrated } = useAuth();
  const [projects, setProjects] = useState<Project[]>(cachedProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [loadingProject, setLoadingProject] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("selected_project_id");
      if (savedId) {
        setSelectedProjectId(savedId);
      } else {
        setSelectedProjectId("all");
      }

      const handleProjectChange = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        const newId = customEvent.detail ?? localStorage.getItem("selected_project_id") ?? "all";
        setSelectedProjectId(newId);
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
      setProjects([]);
      return;
    }

    if (cachedToken !== token) {
      cachedToken = token;
      cachedProjects = [];
      cachedPromise = null;
      hasFetched = false;
    }

    if (hasFetched) {
      setProjects(cachedProjects);
      setLoadingProject(false);
      return;
    }

    if (!cachedPromise) {
      setLoadingProject(true);
      cachedPromise = getMyProjects(token)
        .then((data) => {
          cachedProjects = data || [];
          hasFetched = true;
          return cachedProjects;
        })
        .catch((err) => {
          console.warn("Backend project fetch failed:", err);
          cachedProjects = [];
          hasFetched = true;
          return [];
        });
    }

    cachedPromise.then((resolved) => {
      const list = resolved || [];
      setProjects(list);
      setLoadingProject(false);
      if (typeof window !== "undefined") {
        const curr = localStorage.getItem("selected_project_id");
        if (!curr) {
          localStorage.setItem("selected_project_id", "all");
          localStorage.setItem("selected_project_name", "Todos los proyectos");
          setSelectedProjectId("all");
        } else if (curr !== "all" && list.length > 0 && !list.some((p: any) => p.id === curr)) {
          // If stored project no longer exists in user's projects, reset to "all"
          localStorage.setItem("selected_project_id", "all");
          localStorage.setItem("selected_project_name", "Todos los proyectos");
          setSelectedProjectId("all");
        }
      }
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
    selectedProjectId === "all" || !selectedProjectId
      ? null
      : projects.find((p) => p.id === selectedProjectId) || null;

  return {
    project,
    projects,
    selectProject,
    selectedProjectId: selectedProjectId || "all",
    loadingProject,
  };
}
