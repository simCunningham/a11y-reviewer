// Renders a scan result as a standalone, printable HTML report.

const IMPACT_LABEL = { critical: 'Critical', serious: 'Serious', moderate: 'Moderate', minor: 'Minor' };

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ruleSection(rule, kind) {
  const nodes = rule.nodes
    .map(
      (n) => `
        <li>
          <code class="sel">${esc(n.target)}</code>
          <pre><code>${esc(n.html)}</code></pre>
          ${n.failureSummary ? `<p class="summary">${esc(n.failureSummary).replace(/\n/g, '<br>')}</p>` : ''}
        </li>`,
    )
    .join('');
  const more = rule.totalNodes > rule.nodes.length
    ? `<p class="note">Showing ${rule.nodes.length} of ${rule.totalNodes} elements.</p>`
    : '';
  const wcag = rule.wcag.length ? `WCAG ${rule.wcag.join(', ')}` : '';
  return `
    <section class="rule impact-${esc(rule.impact)}" aria-labelledby="${kind}-${esc(rule.id)}">
      <h3 id="${kind}-${esc(rule.id)}">
        <span class="badge">${esc(IMPACT_LABEL[rule.impact] || rule.impact)}</span>
        ${esc(rule.help)}
      </h3>
      <p class="meta">Rule <code>${esc(rule.id)}</code>${wcag ? ` · ${esc(wcag)}` : ''}${rule.level ? ` · Level ${esc(rule.level)}` : ''} · ${rule.totalNodes} element${rule.totalNodes === 1 ? '' : 's'}</p>
      <dl>
        <dt>Why it matters</dt><dd>${esc(rule.fix.why)}</dd>
        <dt>How to fix</dt><dd>${esc(rule.fix.fix)}</dd>
        ${rule.fix.example ? `<dt>Example</dt><dd><pre><code>${esc(rule.fix.example)}</code></pre></dd>` : ''}
      </dl>
      <p><a href="${esc(rule.helpUrl)}">Full guidance for ${esc(rule.id)}</a></p>
      <details>
        <summary>Affected elements (${rule.totalNodes})</summary>
        <ol class="nodes">${nodes}</ol>
        ${more}
      </details>
    </section>`;
}

function renderReport(result, { expandAll = false } = {}) {
  const s = result.summary;
  const date = new Date(result.scannedAt);
  const groups = ['critical', 'serious', 'moderate', 'minor']
    .map((impact) => {
      const rules = result.violations.filter((v) => v.impact === impact);
      if (!rules.length) return '';
      return `<h2 id="h-${impact}">${IMPACT_LABEL[impact]} (${rules.length})</h2>${rules.map((r) => ruleSection(r, 'v')).join('')}`;
    })
    .join('');

  let html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility report: ${esc(result.title || result.url)}</title>
<style>
  :root { --fg:#1a1a1a; --muted:#555; --bg:#fff; --line:#d0d0d0; --code:#f4f4f4;
          --critical:#a4001d; --serious:#b34700; --moderate:#7a5d00; --minor:#33577a; }
  * { box-sizing: border-box; }
  body { font: 16px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--fg); background: var(--bg); margin: 0; }
  main { max-width: 960px; margin: 0 auto; padding: 32px 20px 64px; }
  h1 { font-size: 1.8rem; margin: 0 0 4px; }
  h2 { margin-top: 2.2em; border-bottom: 2px solid var(--line); padding-bottom: 4px; }
  h3 { font-size: 1.1rem; margin: 0 0 4px; display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
  a { color: #0050b3; }
  .meta, .note, .sub { color: var(--muted); font-size: .92rem; margin: 0 0 8px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin: 20px 0; padding: 0; list-style: none; }
  .cards li { border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
  .cards .n { display: block; font-size: 1.8rem; font-weight: 700; }
  .rule { border: 1px solid var(--line); border-left-width: 6px; border-radius: 6px; padding: 16px; margin: 16px 0; break-inside: avoid-page; }
  .impact-critical { border-left-color: var(--critical); } .impact-critical .badge { background: var(--critical); }
  .impact-serious { border-left-color: var(--serious); } .impact-serious .badge { background: var(--serious); }
  .impact-moderate { border-left-color: var(--moderate); } .impact-moderate .badge { background: var(--moderate); }
  .impact-minor { border-left-color: var(--minor); } .impact-minor .badge { background: var(--minor); }
  .badge { color: #fff; font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 2px 8px; border-radius: 4px; }
  dl { margin: 8px 0; } dt { font-weight: 700; margin-top: 8px; } dd { margin: 2px 0 0; }
  pre { background: var(--code); padding: 8px 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; font-size: .85rem; margin: 6px 0; }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; }
  .sel { font-size: .85rem; word-break: break-all; }
  .summary { font-size: .9rem; color: var(--muted); }
  .nodes li { margin-bottom: 12px; }
  details summary { cursor: pointer; font-weight: 600; }
  .callout { background: #eef4fb; border: 1px solid #b6cde8; border-radius: 6px; padding: 12px 16px; margin: 16px 0; }
  @media print { a { color: inherit; } main { padding: 0; } .rule { page-break-inside: avoid; } }
</style>
</head>
<body>
<main>
  <h1>Accessibility report</h1>
  <p class="sub"><a href="${esc(result.finalUrl)}">${esc(result.finalUrl)}</a>${result.title ? ` · ${esc(result.title)}` : ''}</p>
  <p class="sub">Scanned ${esc(date.toUTCString())} · ${esc(result.standard)} · ${esc(result.engine)}</p>

  <h2 id="h-summary">Summary</h2>
  <ul class="cards">
    <li><span class="n">${s.rulesFailed}</span> rules failed</li>
    <li><span class="n">${s.elementsAffected}</span> elements affected</li>
    <li><span class="n" style="color:var(--critical)">${s.critical}</span> critical</li>
    <li><span class="n" style="color:var(--serious)">${s.serious}</span> serious</li>
    <li><span class="n" style="color:var(--moderate)">${s.moderate}</span> moderate</li>
    <li><span class="n" style="color:var(--minor)">${s.minor}</span> minor</li>
    <li><span class="n">${s.rulesPassed}</span> rules passed</li>
    <li><span class="n">${s.needsReview}</span> need manual review</li>
  </ul>
  <div class="callout">
    <strong>About this report.</strong> Automated testing finds roughly a third to half of accessibility problems.
    A clean result does not mean the page is fully accessible. Also check keyboard-only navigation, screen reader
    behavior, zoom to 200%, captions, and the clarity of content and error messages by hand.
  </div>

  ${result.violations.length ? groups : '<h2>Failures</h2><p>No automated failures were found.</p>'}

  ${result.needsReview.length ? `<h2 id="h-review">Needs manual review (${result.needsReview.length})</h2>
  <p class="meta">axe could not decide these automatically, often because of background images, overlapping elements, or content it cannot see. Check each one by hand.</p>
  ${result.needsReview.map((r) => ruleSection(r, 'r')).join('')}` : ''}
</main>
</body>
</html>`;

  if (expandAll) html = html.replace(/<details>/g, '<details open>');
  return html;
}

module.exports = { renderReport, esc };
