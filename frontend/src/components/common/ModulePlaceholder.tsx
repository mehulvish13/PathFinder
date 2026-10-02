import { PageHeader } from "./PageHeader";

interface ModulePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  phase: string;
  capabilities: string[];
}

/**
 * Clearly marks a module that is wired into routing but implemented in a later
 * phase. No fake data — only intended scope is listed.
 */
export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  phase,
  capabilities,
}: ModulePlaceholderProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="card placeholder-module">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="card__title">Coming in {phase}</div>
          <span className="badge badge--info">Planned</span>
        </div>
        <p className="card__subtitle">
          This route is registered and the shared app shell is ready. The
          functionality below is not implemented yet.
        </p>
        <ul className="placeholder-list">
          {capabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
