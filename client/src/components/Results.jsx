import { useEffect, useRef, useState } from 'react';
import RuleCard from './RuleCard.jsx';
import Summary from './Summary.jsx';
import { reportUrl } from '../api.js';
import { SEVERITIES, LABEL } from '../severity.js';

export default function Results({ data }) {
  const headingRef = useRef(null);
  const [shown, setShown] = useState(() => new Set(SEVERITIES));

  // Send keyboard and screen reader users straight to the new results.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function toggle(sev) {
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }

  const groups = SEVERITIES.map((sev) => ({ sev, rules: data.violations.filter((r) => r.severity === sev) }))
    .filter((g) => g.rules.length);

  return (
    <section aria-labelledby="results-heading">
      <h2 id="results-heading" tabIndex={-1} ref={headingRef}>Results</h2>
      <p className="meta">
        <a href={data.finalUrl} target="_blank" rel="noopener noreferrer">{data.finalUrl}</a>
        {data.title ? ` · ${data.title}` : ''} · {data.standard} · {data.engine}
      </p>

      <Summary summary={data.summary} />

      <div className="actions" role="group" aria-label="Download report">
        <a className="btn" href={reportUrl(data.id, 'pdf')}>Download PDF report</a>
        <a className="btn secondary" href={reportUrl(data.id, 'html')}>Download HTML report</a>
        <a className="btn secondary" href={reportUrl(data.id, 'json')}>Download raw JSON</a>
      </div>

      <p className="callout">
        <strong>Note:</strong> automated tests find roughly a third to half of accessibility problems. Also test
        with a keyboard only, a screen reader, and at 200% zoom.
      </p>

      <fieldset className="filters">
        <legend>Show severity</legend>
        {SEVERITIES.map((sev) => (
          <label key={sev}>
            <input type="checkbox" checked={shown.has(sev)} onChange={() => toggle(sev)} /> {LABEL[sev]}
          </label>
        ))}
      </fieldset>

      {groups.length === 0 ? (
        <>
          <h2>Failures</h2>
          <p className="empty">No automated failures were found. Check the manual review items and test by hand too.</p>
        </>
      ) : (
        groups.map(({ sev, rules }) => (
          <div key={sev} className="group" hidden={!shown.has(sev)}>
            <h2>{LABEL[sev]} ({rules.length})</h2>
            {rules.map((rule) => <RuleCard key={rule.id} rule={rule} idPrefix="v" />)}
          </div>
        ))
      )}

      {data.needsReview.length > 0 && (
        <>
          <h2>Needs manual review ({data.needsReview.length})</h2>
          <p className="meta">
            axe could not decide these automatically, often because of background images or overlapping content.
            Check each one by hand.
          </p>
          {data.needsReview.map((rule) => <RuleCard key={rule.id} rule={rule} idPrefix="r" />)}
        </>
      )}
    </section>
  );
}
