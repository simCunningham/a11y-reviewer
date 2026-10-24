const { chromium } = require('playwright');
const axeSource = require('axe-core').source;
const axeVersion = require('axe-core/package.json').version;
const { getFix, IMPACT_ORDER, SEVERITY_ORDER, SEVERITY_FOR_IMPACT } = require('./fixes');
const { isHostAllowed } = require('./urlGuard');

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const MAX_NODES_PER_RULE = 50;
const NAV_TIMEOUT_MS = 30000;

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    // Honor the standard proxy variables so scans work behind a corporate proxy.
    const bypass = ['localhost', '127.0.0.1', process.env.NO_PROXY || process.env.no_proxy].filter(Boolean).join(',');
    browserPromise = chromium.launch(proxy ? { proxy: { server: proxy, bypass } } : {});
    browserPromise.catch(() => { browserPromise = null; });
  }
  return browserPromise;
}

async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    browserPromise = null;
    if (browser) await browser.close();
  }
}

// 'wcag143' -> '1.4.3'
function wcagCriteria(tags) {
  return tags
    .filter((t) => /^wcag\d{3,4}$/.test(t))
    .map((t) => {
      const d = t.slice(4);
      return `${d[0]}.${d[1]}.${d.slice(2)}`;
    });
}

function wcagLevel(tags) {
  if (tags.some((t) => /^wcag2\d?aaa$/.test(t))) return 'AAA';
  if (tags.some((t) => /^wcag2\d?aa$/.test(t))) return 'AA';
  if (tags.some((t) => /^wcag2\d?a$/.test(t))) return 'A';
  if (tags.includes('best-practice')) return 'Best practice';
  return '';
}

function simplifyRule(rule) {
  return {
    id: rule.id,
    severity: SEVERITY_FOR_IMPACT[rule.impact] || 'low',
    axeImpact: rule.impact || 'minor',
    help: rule.help,
    description: rule.description,
    helpUrl: rule.helpUrl,
    wcag: wcagCriteria(rule.tags),
    level: wcagLevel(rule.tags),
    fix: getFix(rule),
    totalNodes: rule.nodes.length,
    nodes: rule.nodes.slice(0, MAX_NODES_PER_RULE).map((n) => ({
      target: n.target.map((t) => (Array.isArray(t) ? t.join(' >>> ') : t)).join(' '),
      html: n.html,
      failureSummary: n.failureSummary || '',
    })),
  };
}

function byImpact(a, b) {
  return (
    SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
    IMPACT_ORDER.indexOf(a.axeImpact) - IMPACT_ORDER.indexOf(b.axeImpact) ||
    b.totalNodes - a.totalNodes
  );
}

async function scan(url, { bestPractices = false } = {}) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: false,
  });
  const hostCache = new Map();

  // Block any request (including redirects and subresources) to private addresses.
  await context.route('**/*', async (route) => {
    let host;
    try {
      host = new URL(route.request().url()).hostname;
    } catch {
      return route.continue();
    }
    if (!/^https?:/.test(route.request().url())) return route.continue();
    if (!hostCache.has(host)) hostCache.set(host, isHostAllowed(host));
    return (await hostCache.get(host)) ? route.continue() : route.abort('blockedbyclient');
  });

  try {
    const page = await context.newPage();
    const response = await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS });
    // Give client-rendered pages a moment to settle without hanging on chatty ones.
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    await page.addScriptTag({ content: axeSource });
    const tags = bestPractices ? [...WCAG_TAGS, 'best-practice'] : WCAG_TAGS;
    const results = await page.evaluate(
      (runTags) => window.axe.run(document, { runOnly: { type: 'tag', values: runTags }, resultTypes: ['violations', 'incomplete'] }),
      tags,
    );

    const violations = results.violations.map(simplifyRule).sort(byImpact);
    const needsReview = results.incomplete.map(simplifyRule).sort(byImpact);
    const summary = { high: 0, medium: 0, low: 0 };
    for (const v of violations) summary[v.severity] += 1;

    return {
      url,
      finalUrl: page.url(),
      httpStatus: response ? response.status() : null,
      title: await page.title(),
      scannedAt: new Date().toISOString(),
      engine: `axe-core ${axeVersion}`,
      standard: bestPractices ? 'WCAG 2.2 A & AA + best practices' : 'WCAG 2.2 A & AA',
      summary: {
        ...summary,
        rulesFailed: violations.length,
        elementsAffected: violations.reduce((n, v) => n + v.totalNodes, 0),
        rulesPassed: results.passes.length,
        needsReview: needsReview.length,
      },
      violations,
      needsReview,
    };
  } finally {
    await context.close();
  }
}

module.exports = { scan, closeBrowser, getBrowser, wcagCriteria, wcagLevel };
