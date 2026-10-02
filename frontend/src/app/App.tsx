import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { LearnerProvider } from "./LearnerContext";
import { appRoutes } from "./routes";

export default function App() {
  return (
    <BrowserRouter>
      <LearnerProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {appRoutes.map(({ path, component: Page }) => (
              <Route key={path} path={path} element={<Page />} />
            ))}
            {/* Unknown paths fall back to the dashboard rather than a blank screen. */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </LearnerProvider>
    </BrowserRouter>
  );
}
