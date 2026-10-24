# Accessibility Checker

A small web app that checks a web page against **WCAG 2.2 (levels A and AA)**.
Enter a URL and it:

1. Loads the page in a real headless browser (Chromium via Playwright), so JavaScript-rendered content is tested.
2. Runs [axe-core](https://github.com/dequelabs/axe-core), the open-source accessibility engine behind Lighthouse and Accessibility Insights.
3. Lists failures grouped by severity (critical, high, medium, low), each with the WCAG criterion, a plain-language "why it matters", a "how to fix" with an example, and the exact elements affected.
4. Lists items that need manual review (things axe cannot decide on its own).
5. Exports the report as **PDF**, **HTML**, or raw **JSON**.

Severity follows axe-core's four impact levels, renamed: **Critical** = critical, **High** = serious, **Medium** = moderate, **Low** = minor. The original axe impact is kept as `axeImpact` in the JSON.

Automated testing finds roughly a third to half of real accessibility problems, so the report says so and points people to manual checks.

## Run it

Requires Node 18+.

```bash
npm install          # also downloads Chromium for Playwright
npm start            # http://localhost:3000
```

If the browser download was skipped, run `npx playwright install chromium`.

### Settings

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port to listen on |
| `MAX_CONCURRENT_SCANS` | `2` | Scans allowed at once; extra requests get a "busy" message |
| `ALLOW_PRIVATE_HOSTS` | off | Set to `1` to scan `localhost` or intranet sites (local development only) |
| `HTTPS_PROXY` / `NO_PROXY` | unset | Used by the headless browser if set |

## API

- `POST /api/scan` with `{ "url": "https://example.com", "bestPractices": false }` returns the scan result and an `id`.
- `GET /api/report/:id.pdf`, `.html`, `.json` download the report. The last 50 scans are kept in memory.

## Security

Because the server visits whatever URL it is given, it refuses private, loopback and link-local addresses
(including cloud metadata endpoints), and blocks any redirect or subresource request that resolves to one.

## Project layout

```
src/server.js    Express app and routes
src/scanner.js   Playwright + axe-core scan, result shaping
src/fixes.js     Plain-language explanations and fixes per axe rule
src/report.js    Standalone HTML report (also rendered to PDF)
src/urlGuard.js  URL validation and private-address blocking
public/          The front end (plain HTML, CSS and JS)
test/            node:test tests, including a deliberately broken fixture page
```

## Tests

```bash
npm test
```
