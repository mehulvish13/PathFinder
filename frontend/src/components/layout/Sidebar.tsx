import { NavLink } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/roadmap", label: "Roadmap", icon: "◈" },
  { to: "/skills", label: "Skills", icon: "◆" },
  { to: "/assessment", label: "Assessment", icon: "✓" },
  { to: "/tutor", label: "AI Tutor", icon: "✎" },
];

export function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Primary">
      <div className="sidebar__brand">
        <div className="sidebar__brand-name">PathFinder</div>
        <div className="sidebar__brand-tagline">Personalized Learning Intelligence</div>
      </div>

      <div className="sidebar__section-label">Learning</div>

      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive ? "nav-link nav-link--active" : "nav-link"
          }
        >
          <span className="nav-link__icon" aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}

      <div className="sidebar__footer">
        Phase 8 — Frontend Foundation
      </div>
    </nav>
  );
}
