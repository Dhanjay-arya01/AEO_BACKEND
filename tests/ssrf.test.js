import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateUrlForSsrf } from '../src/utils/ssrf.util.js';

describe('SSRF Protection Validator', () => {
  test('rejects localhost', async () => {
    await assert.rejects(
      async () => await validateUrlForSsrf('http://localhost:3000/api'),
      (err) => err.statusCode === 400 && err.message.includes('localhost')
    );
  });

  test('rejects loopback IPv4 (127.0.0.1)', async () => {
    await assert.rejects(
      async () => await validateUrlForSsrf('http://127.0.0.1:8080'),
      (err) => err.statusCode === 400 && err.message.includes('private or restricted')
    );
  });

  test('rejects link-local cloud metadata (169.254.169.254)', async () => {
    await assert.rejects(
      async () => await validateUrlForSsrf('http://169.254.169.254/latest/meta-data/'),
      (err) => err.statusCode === 400 && err.message.includes('private or restricted')
    );
  });

  test('rejects private RFC1918 IPv4 (192.168.1.100)', async () => {
    await assert.rejects(
      async () => await validateUrlForSsrf('http://192.168.1.100/admin'),
      (err) => err.statusCode === 400 && err.message.includes('private or restricted')
    );
  });

  test('rejects private RFC1918 IPv4 (10.0.0.5)', async () => {
    await assert.rejects(
      async () => await validateUrlForSsrf('http://10.0.0.5:5000'),
      (err) => err.statusCode === 400 && err.message.includes('private or restricted')
    );
  });

  test('rejects unsafe protocol (ftp://)', async () => {
    await assert.rejects(
      async () => await validateUrlForSsrf('ftp://example.com/file'),
      (err) => err.statusCode === 400 && err.message.includes('Unsafe protocol')
    );
  });

  test('rejects embedded credentials', async () => {
    await assert.rejects(
      async () => await validateUrlForSsrf('https://admin:password@example.com'),
      (err) => err.statusCode === 400 && err.message.includes('embedded credentials')
    );
  });

  test('accepts valid public domain (google.com)', async () => {
    const result = await validateUrlForSsrf('https://google.com');
    assert.equal(result.domain, 'google.com');
    assert.equal(result.normalizedUrl, 'https://google.com');
  });
});
