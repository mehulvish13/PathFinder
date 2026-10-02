import type { ComponentType } from "react";
import Dashboard from "../pages/Dashboard";
import Roadmap from "../pages/Roadmap";
import Skills from "../pages/Skills";
import Assessment from "../pages/Assessment";
import Tutor from "../pages/Tutor";

export interface AppRoute {
  /** Path relative to the app shell. */
  path: string;
  /** Page component rendered inside <Outlet />. */
  component: ComponentType;
  /** Human label used in navigation/header. */
  label: string;
}

/**
 * Single source of truth for the routed modules. The root path redirects to
 * /dashboard (see App.tsx). Modules marked as placeholders are implemented in
 * later phases.
 */
export const appRoutes: AppRoute[] = [
  { path: "/dashboard", component: Dashboard, label: "Dashboard" },
  { path: "/roadmap", component: Roadmap, label: "Roadmap" },
  { path: "/skills", component: Skills, label: "Skills" },
  { path: "/assessment", component: Assessment, label: "Assessment" },
  { path: "/tutor", component: Tutor, label: "AI Tutor" },
];
