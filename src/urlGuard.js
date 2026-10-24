// Stops the scanner from being pointed at the server's own network (SSRF).
// Set ALLOW_PRIVATE_HOSTS=1 to scan localhost or intranet sites during local development.

const dns = require('node:dns').promises;
const net = require('node:net');

function allowPrivate() {
  return process.env.ALLOW_PRIVATE_HOSTS === '1';
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const lower = ip.toLowerCase();
  if (lower.startsWith('::ffff:')) return isPrivateIp(lower.slice(7));
  return (
    lower === '::' || lower === '::1' ||
    lower.startsWith('fc') || lower.startsWith('fd') ||
    lower.startsWith('fe80') || lower.startsWith('ff')
  );
}

function normalizeUrl(input) {
  let raw = String(input || '').trim();
  if (!raw) throw new UrlError('Enter a URL to scan.');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = 'https://' + raw;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new UrlError('That does not look like a valid URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UrlError('Only http and https URLs can be scanned.');
  }
  return url;
}

async function isHostAllowed(hostname) {
  if (allowPrivate()) return true;
  const host = hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) return false;
  if (net.isIP(host)) return !isPrivateIp(host);
  try {
    const addrs = await dns.lookup(host, { all: true });
    return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

async function validateUrl(input) {
  const url = normalizeUrl(input);
  if (!(await isHostAllowed(url.hostname))) {
    throw new UrlError('That address is private or could not be found, so it cannot be scanned.');
  }
  return url.href;
}

class UrlError extends Error {}

module.exports = { validateUrl, isHostAllowed, isPrivateIp, normalizeUrl, UrlError };
