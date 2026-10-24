const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

process.env.ALLOW_PRIVATE_HOSTS = '1';
const { createApp } = require('../src/server');
const { closeBrowser } = require('../src/scanner');

const fixture = fs.readFileSync(path.join(__dirname, 'fixtures', 'bad.html'));

test('scans a page and exports reports', async (t) => {
  const site = http.createServer((req, res) => res.end(fixture)).listen(0);
  const app = createApp().listen(0);
  t.after(async () => { site.close(); app.close(); await closeBrowser(); });

  const base = `http://localhost:${app.address().port}`;
  const res = await fetch(`${base}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: `http://localhost:${site.address().port}/` }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  const ids = data.violations.map((v) => v.id);
  for (const id of ['image-alt', 'color-contrast', 'label', 'button-name', 'link-name', 'html-has-lang', 'document-title', 'meta-viewport']) {
    assert.ok(ids.includes(id), `expected ${id} in ${ids.join(', ')}`);
  }
  // Sorted most severe first, with plain-language fixes attached.
  const order = ['critical', 'serious', 'moderate', 'minor'];
  const ranks = data.violations.map((v) => order.indexOf(v.impact));
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
  const img = data.violations.find((v) => v.id === 'image-alt');
  assert.match(img.fix.fix, /alt attribute/);
  assert.deepEqual(img.wcag, ['1.1.1']);

  const html = await fetch(`${base}/api/report/${data.id}.html`);
  assert.equal(html.status, 200);
  assert.match(await html.text(), /Accessibility report/);

  const pdf = await fetch(`${base}/api/report/${data.id}.pdf`);
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get('content-type'), 'application/pdf');
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString(), '%PDF');
});
