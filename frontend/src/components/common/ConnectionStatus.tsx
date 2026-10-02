import type { AsyncState } from "../../hooks/useAsync";
import type { HealthResponse } from "../../types/api";

interface ConnectionStatusProps {
  health: AsyncState<HealthResponse>;
}

/**
 * Renders connectivity based on an ACTUAL successful health request — never a
 * hardcoded "connected" label.
 */
export function ConnectionStatus({ health }: ConnectionStatusProps) {
  if (health.loading) {
    return (
      <span className="connection connection--checking">
        <span className="connection__dot" aria-hidden="true" />
        Checking backend…
      </span>
    );
  }

  if (health.error) {
    return (
      <span className="connection connection--error" title={health.error.message}>
        <span className="connection__dot" aria-hidden="true" />
        Backend unreachable
      </span>
    );
  }

  return (
    <span className="connection connection--ok">
      <span className="connection__dot" aria-hidden="true" />
      Backend connected
    </span>
  );
}
