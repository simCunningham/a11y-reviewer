const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { scan, getBrowser, closeBrowser } = require('./scanner');
const { renderReport } = require('./report');
const { validateUrl, UrlError } = require('./urlGuard');

const PORT = Number(process.env.PORT) || 3000;
const MAX_STORED_SCANS = 50;
const MAX_CONCURRENT_SCANS = Number(process.env.MAX_CONCURRENT_SCANS) || 2;

// Recent scans are kept in memory so their reports can be downloaded.
const scans = new Map();
let running = 0;

function store(result) {
  const id = crypto.randomUUID();
  scans.set(id, result);
  if (scans.size > MAX_STORED_SCANS) scans.delete(scans.keys().next().value);
  return id;
}

function slug(result) {
  const host = new URL(result.finalUrl).hostname.replace(/[^a-z0-9.-]/gi, '');
  return `a11y-report-${host}-${result.scannedAt.slice(0, 10)}`;
}

function createApp() {
  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use(express.static(path.join(__dirname, '..', 'dist')));

  app.post('/api/scan', async (req, res) => {
    let url;
    try {
      url = await validateUrl(req.body && req.body.url);
    } catch (err) {
      if (err instanceof UrlError) return res.status(400).json({ error: err.message });
      throw err;
    }
    if (running >= MAX_CONCURRENT_SCANS) {
      return res.status(429).json({ error: 'The scanner is busy. Try again in a few seconds.' });
    }
    running += 1;
    try {
      const result = await scan(url, { bestPractices: Boolean(req.body.bestPractices) });
      const id = store(result);
      res.json({ id, ...result });
    } catch (err) {
      console.error('Scan failed:', url, err.message);
      const msg = /timeout/i.test(err.message)
        ? 'The page took too long to load.'
        : /ERR_NAME_NOT_RESOLVED|ERR_CONNECTION|ERR_BLOCKED/i.test(err.message)
          ? 'The page could not be reached.'
          : 'The page could not be scanned.';
      res.status(502).json({ error: msg });
    } finally {
      running -= 1;
    }
  });

  app.get('/api/report/:id.html', (req, res) => {
    const result = scans.get(req.params.id);
    if (!result) return res.status(404).send('Report not found. Run the scan again.');
    res.setHeader('Content-Disposition', `attachment; filename="${slug(result)}.html"`);
    res.type('html').send(renderReport(result));
  });

  app.get('/api/report/:id.json', (req, res) => {
    const result = scans.get(req.params.id);
    if (!result) return res.status(404).json({ error: 'Report not found. Run the scan again.' });
    res.setHeader('Content-Disposition', `attachment; filename="${slug(result)}.json"`);
    res.json(result);
  });

  app.get('/api/report/:id.pdf', async (req, res) => {
    const result = scans.get(req.params.id);
    if (!result) return res.status(404).send('Report not found. Run the scan again.');
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      // JavaScript is not needed to render the report, so keep it off.
      await page.route('**/*', (route) => route.abort());
      await page.setContent(renderReport(result, { expandAll: true }), { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
      });
      res.setHeader('Content-Disposition', `attachment; filename="${slug(result)}.pdf"`);
      res.type('application/pdf').send(pdf);
    } finally {
      await page.close();
    }
  });

  return app;
}

if (require.main === module) {
  if (!fs.existsSync(path.join(__dirname, '..', 'dist', 'index.html'))) {
    console.warn('No built front end found in dist/. Run `npm run build` (or `npm start`, which builds first).');
  }
  const server = createApp().listen(PORT, () => {
    console.log(`Accessibility checker running at http://localhost:${PORT}`);
  });
  const shutdown = () => server.close(() => closeBrowser().then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { createApp };
