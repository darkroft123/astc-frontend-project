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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState<boolean>(!hasFetched);

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
          console.error("Error fetching user projects in useUserProject hook:", err);
          cachedProjects = [];
          hasFetched = true;
          return [];
        });
    }

    cachedPromise.then((resolved) => {
      setProjects(resolved);
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
        (projects.length > 0 ? projects[0] : null);

  return {
    project,
    projects,
    selectProject,
    selectedProjectId: selectedProjectId ?? (project?.id ?? null),
    loadingProject,
  };
}
