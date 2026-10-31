import { useState } from 'react';
import ScanForm from './components/ScanForm.jsx';
import Results from './components/Results.jsx';
import { runScan } from './api.js';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function App() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);

  async function handleScan(url, bestPractices) {
    setError('');
    if (!url) {
      setError('Enter a URL to scan.');
      return;
    }
    setScanning(true);
    setStatus('Scanning the page. This usually takes 5 to 20 seconds.');
    try {
      const data = await runScan(url, bestPractices);
      const s = data.summary;
      setStatus(`Scan complete: ${plural(s.rulesFailed, 'rule')} failed across ${plural(s.elementsAffected, 'element')}.`);
      setResult(data);
    } catch (err) {
      setStatus('');
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <header className="site-header">
        <div className="wrap">
          <p className="brand">Accessibility Checker</p>
        </div>
      </header>

      <main id="main" className="wrap">
        <h1>Check a page against WCAG 2.2</h1>
        <p className="lede">
          Enter a web address. We load the page in a real browser, run the axe-core accessibility rules for
          WCAG 2.2 levels A and AA, and explain each failure in plain language with how to fix it.
        </p>

        <ScanForm onScan={handleScan} scanning={scanning} error={error} />

        <p className="status" role="status" aria-live="polite">{status}</p>

        {result && <Results key={result.id} data={result} />}
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <p>
            Powered by <a href="https://github.com/dequelabs/axe-core">axe-core</a>. Results are a starting point,
            not a certification.
          </p>
        </div>
      </footer>
    </>
  );
}
