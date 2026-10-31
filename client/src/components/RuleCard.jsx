import { LABEL } from '../severity.js';

export default function RuleCard({ rule, idPrefix }) {
  const headingId = `${idPrefix}-${rule.id}`;
  return (
    <section className={`rule sev-${rule.severity}`} aria-labelledby={headingId}>
      <h3 id={headingId}>
        <span className="badge">{LABEL[rule.severity] || rule.severity}</span> {rule.help}
      </h3>
      <p className="meta">
        Rule <code>{rule.id}</code>
        {rule.wcag.length > 0 && ` · WCAG ${rule.wcag.join(', ')}`}
        {rule.level && ` · Level ${rule.level}`}
        {` · ${rule.totalNodes} element${rule.totalNodes === 1 ? '' : 's'}`}
      </p>
      <dl>
        <dt>Why it matters</dt>
        <dd>{rule.fix.why}</dd>
        <dt>How to fix</dt>
        <dd>{rule.fix.fix}</dd>
        {rule.fix.example && (
          <>
            <dt>Example</dt>
            <dd><pre><code>{rule.fix.example}</code></pre></dd>
          </>
        )}
      </dl>
      <p>
        <a href={rule.helpUrl} target="_blank" rel="noopener noreferrer">
          Full guidance for {rule.id}<span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </p>
      <details>
        <summary>Affected elements ({rule.totalNodes})</summary>
        <ol className="nodes">
          {rule.nodes.map((n, i) => (
            <li key={i}>
              <code className="sel">{n.target}</code>
              <pre><code>{n.html}</code></pre>
              {n.failureSummary && <p className="meta node-summary">{n.failureSummary}</p>}
            </li>
          ))}
        </ol>
        {rule.totalNodes > rule.nodes.length && (
          <p className="meta">Showing {rule.nodes.length} of {rule.totalNodes}. The JSON download has the same list.</p>
        )}
      </details>
    </section>
  );
}
