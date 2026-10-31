export async function runScan(url, bestPractices) {
  let res;
  try {
    res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, bestPractices }),
    });
  } catch {
    throw new Error('Could not reach the scanner. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

export const reportUrl = (id, ext) => `/api/report/${id}.${ext}`;
