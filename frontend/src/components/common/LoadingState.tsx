export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <div className="state__title">{message}</div>
    </div>
  );
}
