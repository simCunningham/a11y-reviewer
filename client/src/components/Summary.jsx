import { SEVERITIES } from '../severity.js';

function Card({ n, label, severity }) {
  return (
    <li>
      <span className="n" style={severity ? { color: `var(--${severity})` } : undefined}>{n}</span> {label}
    </li>
  );
}

export default function Summary({ summary: s }) {
  return (
    <ul className="cards">
      <Card n={s.rulesFailed} label="rules failed" />
      <Card n={s.elementsAffected} label="elements affected" />
      {SEVERITIES.map((sev) => <Card key={sev} n={s[sev]} label={sev} severity={sev} />)}
      <Card n={s.rulesPassed} label="rules passed" />
      <Card n={s.needsReview} label="need manual review" />
    </ul>
  );
}
