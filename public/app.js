(() => {
  const IMPACTS = ['critical', 'serious', 'moderate', 'minor'];
  const LABEL = { critical: 'Critical', serious: 'Serious', moderate: 'Moderate', minor: 'Minor' };

  const form = document.getElementById('scan-form');
  const input = document.getElementById('url');
  const best = document.getElementById('best');
  const btn = document.getElementById('scan-btn');
  const err = document.getElementById('url-error');
  const status = document.getElementById('status');
  const results = document.getElementById('results');
  const heading = document.getElementById('results-heading');
  const filters = document.querySelector('.filters');

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function showError(msg) {
    err.textContent = msg;
    err.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }

  function clearError() {
    err.hidden = true;
    err.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function ruleHtml(rule, kind) {
    const wcag = rule.wcag.length ? ` · WCAG ${esc(rule.wcag.join(', '))}` : '';
    const level = rule.level ? ` · Level ${esc(rule.level)}` : '';
    const nodes = rule.nodes.map((n) => `
      <li>
        <code class="sel">${esc(n.target)}</code>
        <pre><code>${esc(n.html)}</code></pre>
        ${n.failureSummary ? `<p class="meta">${esc(n.failureSummary).replace(/\n/g, '<br>')}</p>` : ''}
      </li>`).join('');
    const more = rule.totalNodes > rule.nodes.length ? `<p class="meta">Showing ${rule.nodes.length} of ${rule.totalNodes}. The JSON download has the same list.</p>` : '';
    return `
      <section class="rule impact-${esc(rule.impact)}" data-impact="${esc(rule.impact)}" aria-labelledby="${kind}-${esc(rule.id)}">
        <h3 id="${kind}-${esc(rule.id)}"><span class="badge">${esc(LABEL[rule.impact] || rule.impact)}</span> ${esc(rule.help)}</h3>
        <p class="meta">Rule <code>${esc(rule.id)}</code>${wcag}${level} · ${rule.totalNodes} element${rule.totalNodes === 1 ? '' : 's'}</p>
        <dl>
          <dt>Why it matters</dt><dd>${esc(rule.fix.why)}</dd>
          <dt>How to fix</dt><dd>${esc(rule.fix.fix)}</dd>
          ${rule.fix.example ? `<dt>Example</dt><dd><pre><code>${esc(rule.fix.example)}</code></pre></dd>` : ''}
        </dl>
        <p><a href="${esc(rule.helpUrl)}" target="_blank" rel="noopener">Full guidance for ${esc(rule.id)}<span class="visually-hidden"> (opens in a new tab)</span></a></p>
        <details>
          <summary>Affected elements (${rule.totalNodes})</summary>
          <ol class="nodes">${nodes}</ol>${more}
        </details>
      </section>`;
  }

  function render(data) {
    const s = data.summary;
    document.getElementById('results-meta').innerHTML =
      `<a href="${esc(data.finalUrl)}" target="_blank" rel="noopener">${esc(data.finalUrl)}</a>` +
      `${data.title ? ` · ${esc(data.title)}` : ''} · ${esc(data.standard)} · ${esc(data.engine)}`;

    const card = (n, label, color) => `<li><span class="n"${color ? ` style="color:var(--${color})"` : ''}>${n}</span> ${label}</li>`;
    document.getElementById('cards').innerHTML = [
      card(s.rulesFailed, 'rules failed'),
      card(s.elementsAffected, 'elements affected'),
      ...IMPACTS.map((i) => card(s[i], i, i)),
      card(s.rulesPassed, 'rules passed'),
      card(s.needsReview, 'need manual review'),
    ].join('');

    document.getElementById('dl-pdf').href = `/api/report/${data.id}.pdf`;
    document.getElementById('dl-html').href = `/api/report/${data.id}.html`;
    document.getElementById('dl-json').href = `/api/report/${data.id}.json`;

    const v = document.getElementById('violations');
    if (!data.violations.length) {
      v.innerHTML = '<h2>Failures</h2><p class="empty">No automated failures were found. Check the manual review items and test by hand too.</p>';
    } else {
      v.innerHTML = IMPACTS.map((impact) => {
        const rules = data.violations.filter((r) => r.impact === impact);
        if (!rules.length) return '';
        return `<div class="group" data-impact="${impact}"><h2>${LABEL[impact]} (${rules.length})</h2>${rules.map((r) => ruleHtml(r, 'v')).join('')}</div>`;
      }).join('');
    }

    const r = document.getElementById('review');
    r.innerHTML = data.needsReview.length
      ? `<h2>Needs manual review (${data.needsReview.length})</h2>
         <p class="meta">axe could not decide these automatically, often because of background images or overlapping content. Check each one by hand.</p>
         ${data.needsReview.map((rule) => ruleHtml(rule, 'r')).join('')}`
      : '';

    filters.querySelectorAll('input').forEach((cb) => { cb.checked = true; });
    results.hidden = false;
    heading.focus();
  }

  filters.addEventListener('change', () => {
    const shown = new Set([...filters.querySelectorAll('input:checked')].map((cb) => cb.value));
    document.querySelectorAll('#violations .group').forEach((g) => { g.hidden = !shown.has(g.dataset.impact); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const url = input.value.trim();
    if (!url) return showError('Enter a URL to scan.');

    btn.disabled = true;
    btn.textContent = 'Scanning…';
    status.textContent = 'Scanning the page. This usually takes 5 to 20 seconds.';
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, bestPractices: best.checked }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        status.textContent = '';
        return showError(data.error || 'Something went wrong. Try again.');
      }
      const s = data.summary;
      status.textContent = `Scan complete: ${s.rulesFailed} rule${s.rulesFailed === 1 ? '' : 's'} failed across ${s.elementsAffected} element${s.elementsAffected === 1 ? '' : 's'}.`;
      render(data);
    } catch {
      status.textContent = '';
      showError('Could not reach the scanner. Check your connection and try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Scan page';
    }
  });
})();
