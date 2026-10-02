import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = "○", title, message, action }: EmptyStateProps) {
  return (
    <div className="state" role="status">
      <div className="state__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="state__title">{title}</div>
      {message ? <div>{message}</div> : null}
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );
}
