import { useEffect, useRef, useState } from 'react';

export default function ScanForm({ onScan, scanning, error }) {
  const [url, setUrl] = useState('');
  const [bestPractices, setBestPractices] = useState(false);
  const inputRef = useRef(null);

  // Move focus back to the field whenever a new error appears.
  useEffect(() => {
    if (error) inputRef.current?.focus();
  }, [error]);

  function handleSubmit(e) {
    e.preventDefault();
    onScan(url.trim(), bestPractices);
  }

  return (
    <form className="scan-form" noValidate onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="url">Page URL</label>
        <div className="row">
          <input
            ref={inputRef}
            id="url"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'url-error' : undefined}
          />
          <button type="submit" disabled={scanning}>
            {scanning ? 'Scanning…' : 'Scan page'}
          </button>
        </div>
        {error && <p id="url-error" className="error">{error}</p>}
      </div>
      <div className="check">
        <input
          id="best"
          name="bestPractices"
          type="checkbox"
          checked={bestPractices}
          onChange={(e) => setBestPractices(e.target.checked)}
        />
        <label htmlFor="best">Also include best-practice rules (not required by WCAG)</label>
      </div>
    </form>
  );
}
