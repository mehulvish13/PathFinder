import { Link } from "react-router-dom";

interface QuickAction {
  to: string;
  title: string;
  description: string;
  /** Build phase of the destination module — shown so the user knows the
   *  module is wired into routing but implemented later. */
  phase: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    to: "/roadmap",
    title: "Continue Roadmap",
    description: "Phases, milestones and matched resources.",
    phase: "Phase 8C",
  },
  {
    to: "/skills",
    title: "View Skills",
    description: "Mastery, gaps and milestone history.",
    phase: "Phase 8D",
  },
  {
    to: "/assessment",
    title: "Take Assessment",
    description: "Test a skill and update your mastery.",
    phase: "Phase 8E",
  },
  {
    to: "/tutor",
    title: "Ask AI Tutor",
    description: "Explanations grounded in your PathFinder state.",
    phase: "Phase 8F",
  },
];

/**
 * Navigation to the other PathFinder modules. The phase label is honest: these
 * routes exist, but their pages are still built in later phases.
 */
export function QuickActions() {
  return (
    <section className="card" aria-labelledby="quick-actions-title">
      <div className="section-header">
        <div>
          <div className="card__title" id="quick-actions-title">
            Quick actions
          </div>
          <div className="card__subtitle">
            Move between modules. Each opens its own PathFinder page.
          </div>
        </div>
      </div>

      <div className="grid grid--4">
        {QUICK_ACTIONS.map((action) => (
          <Link className="quick-tile" key={action.to} to={action.to}>
            <span className="quick-tile__title">{action.title}</span>
            <span className="quick-tile__description">{action.description}</span>
            <span className="badge badge--neutral">{action.phase}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}