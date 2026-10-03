/**
 * Structured placeholders mirroring the roadmap layout, so the page never
 * renders partial phases while backend responses are still in flight.
 */

function Block({ height = 14, width = "100%" }: { height?: number; width?: string }) {
  return (
    <div className="skeleton" style={{ height, width }} aria-hidden="true" />
  );
}

export function RoadmapSkeleton() {
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
        <div className="card" aria-hidden="true">
          <Block height={16} width="30%" />
          <div className="stack" style={{ marginTop: 14 }}>
            <Block height={12} />
            <Block height={12} width="70%" />
          </div>
        </div>
      </div>

      {Array.from({ length: 2 }).map((_, index) => (
        <div className="card" style={{ marginTop: 16 }} key={index} aria-hidden="true">
          <Block height={18} width="35%" />
          <div style={{ marginTop: 12 }}>
            <Block height={12} width="80%" />
          </div>
          <div className="stack" style={{ marginTop: 14 }}>
            <Block height={60} />
            <Block height={60} />
          </div>
        </div>
      ))}
    </div>
  );
}
