interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while contacting the backend.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state state--error" role="alert">
      <div className="state__icon" aria-hidden="true">
        ⚠
      </div>
      <div className="state__title">{title}</div>
      <div>{message}</div>
      {onRetry ? (
        <button type="button" className="button" onClick={onRetry} style={{ marginTop: 8 }}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
