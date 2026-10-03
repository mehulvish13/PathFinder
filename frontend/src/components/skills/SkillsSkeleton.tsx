/**
 * Structured placeholders mirroring the skills workspace layout.
 */

function Block({ height = 14, width = "100%" }: { height?: number; width?: string }) {
  return (
    <div className="skeleton" style={{ height, width }} aria-hidden="true" />
  );
}

export function SkillsSkeleton() {
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

      <div className="grid grid--2" style={{ marginTop: 16 }}>
        <div className="card" aria-hidden="true">
          <Block height={16} width="35%" />
          <div className="stack" style={{ marginTop: 14 }}>
            <Block height={44} />
            <Block height={44} />
            <Block height={44} />
          </div>
        </div>
        <div className="card" aria-hidden="true">
          <Block height={18} width="40%" />
          <div className="stack" style={{ marginTop: 14 }}>
            <Block height={12} />
            <Block height={60} />
            <Block height={40} width="70%" />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }} aria-hidden="true">
        <Block height={16} width="30%" />
        <div className="stack" style={{ marginTop: 14 }}>
          <Block height={12} />
          <Block height={12} width="80%" />
        </div>
      </div>
    </div>
  );
}
