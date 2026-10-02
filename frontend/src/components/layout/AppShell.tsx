import { useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { api } from "../../services/api";
import { useAsync } from "../../hooks/useAsync";
import type { HealthResponse } from "../../types/api";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/roadmap": "Roadmap",
  "/skills": "Skills",
  "/assessment": "Assessment",
  "/tutor": "AI Tutor",
};

/**
 * Persistent shell: sidebar + header + routed content. Connectivity is proven
 * by a real /health request, not by a hardcoded label.
 */
export function AppShell() {
  const location = useLocation();
  const health = useAsync<HealthResponse>(
    useCallback((signal: AbortSignal) => api.getHealth(signal), []),
    [],
  );

  const title = TITLES[location.pathname] ?? "PathFinder";

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header title={title} health={health} />
        <main className="content">
          {/* Scoped boundary: a render error in one page leaves the shell usable. */}
          <ErrorBoundary key={location.pathname} scope={title}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
