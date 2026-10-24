const test = require('node:test');
const assert = require('node:assert');
const { isPrivateIp, normalizeUrl, validateUrl } = require('../src/urlGuard');

test('flags private and loopback addresses', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '::1', 'fd00::1', '::ffff:127.0.0.1']) {
    assert.equal(isPrivateIp(ip), true, ip);
  }
  for (const ip of ['8.8.8.8', '93.184.216.34', '2606:4700::1111']) {
    assert.equal(isPrivateIp(ip), false, ip);
  }
});

test('adds https:// when the scheme is missing', () => {
  assert.equal(normalizeUrl('example.com').href, 'https://example.com/');
});

test('rejects non-http schemes and private hosts', async () => {
  delete process.env.ALLOW_PRIVATE_HOSTS;
  await assert.rejects(validateUrl('file:///etc/passwd'), /http and https/);
  await assert.rejects(validateUrl('http://localhost:3000'), /private/);
  await assert.rejects(validateUrl('http://169.254.169.254/latest/meta-data'), /private/);
  await assert.rejects(validateUrl(''), /Enter a URL/);
});
