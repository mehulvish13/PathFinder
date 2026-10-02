import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback; receives a reset callback. */
  fallback?: (reset: () => void) => ReactNode;
  /** Label used to scope the error message. */
  scope?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Final safety net for render-time errors (e.g. a malformed API payload that
 * slips past the API client). Keeps the app shell and navigation usable instead
 * of showing a blank white screen, and satisfies the requirement that API
 * problems must never crash the whole React tree.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep the console signal without taking down the UI.
    console.error("PathFinder UI error boundary caught an error:", error, info);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(this.reset);

    const scope = this.props.scope ? ` in ${this.props.scope}` : "";
    return (
      <ErrorState
        title={`Something went wrong${scope}`}
        message={
          error.message ||
          "An unexpected error occurred while rendering this view."
        }
        onRetry={this.reset}
      />
    );
  }
}
