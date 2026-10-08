import { useState, useEffect } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { getGraphQLUrl } from "@/lib/api-host";

const GET_DASHBOARD_PM = `
  query getDashboardPM($fromDate: String, $toDate: String, $projectId: String, $userId: String) {
    getDashboardPM(fromDate: $fromDate, toDate: $toDate, projectId: $projectId, userId: $userId) {
      totalAttendances
      totalAbsences
      pendingJustifications
    }
  }
`;

interface Metrics {
  totalAttendances: number;
  totalAbsences: number;
  pendingJustifications: number;
}

interface UseDashboardPMProps {
  fromDate: string;
  toDate: string;
  projectId: string;
  userId?: string | null;
}

export function useDashboardPM({ fromDate, toDate, projectId, userId = null }: UseDashboardPMProps) {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<Metrics>({
    totalAttendances: 0,
    totalAbsences: 0,
    pendingJustifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(getGraphQLUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            query: GET_DASHBOARD_PM,
            variables: { fromDate, toDate, projectId, userId },
          }),
        });

        const json = await res.json();
        const data = json?.data?.getDashboardPM || {};

        setMetrics({
          totalAttendances: Number(data.totalAttendances) || 0,
          totalAbsences: Number(data.totalAbsences) || 0,
          pendingJustifications: Number(data.pendingJustifications) || 0,
        });
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        setError("Error al cargar los datos");
        setMetrics({ totalAttendances: 0, totalAbsences: 0, pendingJustifications: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fromDate, toDate, projectId, userId, token]);

  return { metrics, loading, error };
}
