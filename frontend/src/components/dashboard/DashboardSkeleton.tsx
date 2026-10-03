/**
 * Structured placeholders used while dashboard data is loading. They mirror the
 * real section layout so the page never renders half of a dashboard while the
 * backend responses are still in flight.
 */

function Block({ height = 14, width = "100%" }: { height?: number; width?: string }) {
  return (
    <div
      className="skeleton"
      style={{ height, width }}
      aria-hidden="true"
    />
  );
}

function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card" aria-hidden="true">
      <Block height={16} width="40%" />
      <div className="stack" style={{ marginTop: 14 }}>
        {Array.from({ length: lines }).map((_, index) => (
          <Block key={index} height={12} width={index === lines - 1 ? "60%" : "100%"} />
        ))}
      </div>
    </div>
  );
}

/** Full-body skeleton used for the first load of the dashboard. */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="grid grid--4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="stat" key={index} aria-hidden="true">
            <Block height={10} width="55%" />
            <div style={{ marginTop: 10 }}>
              <Block height={22} width="40%" />
            </div>
            <div style={{ marginTop: 8 }}>
              <Block height={10} width="75%" />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <CardSkeleton lines={4} />
      </div>
      <div style={{ marginTop: 16 }}>
        <CardSkeleton lines={5} />
      </div>
      <div className="grid grid--2" style={{ marginTop: 16 }}>
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>
      <div style={{ marginTop: 16 }}>
        <CardSkeleton lines={3} />
      </div>
    </div>
  );
}

/** Skeleton for the roadmap-dependent sections only (progress already loaded). */
export function DashboardPathSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <CardSkeleton lines={4} />
      <div style={{ marginTop: 16 }}>
        <CardSkeleton lines={5} />
      </div>
      <div className="grid grid--2" style={{ marginTop: 16 }}>
        <CardSkeleton lines={4} />
      </div>
      <div style={{ marginTop: 16 }}>
        <CardSkeleton lines={3} />
      </div>
    </div>
  );
}