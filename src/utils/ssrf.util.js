import dns from 'dns/promises';
import { ApiError } from './apiError.util.js';

/**
 * Checks if an IPv4 address is in private, loopback, link-local, or reserved ranges.
 */
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // invalid is treated as unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 100.64.0.0/10 (Carrier grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata like 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 (IETF)
  if (a === 192 && b === 0 && parts[2] === 0) return true;
  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (Network benchmark)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && parts[2] === 113) return true;
  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 (Reserved)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in private, loopback, link-local, or reserved ranges.
 */
function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();

  // Loopback / Unspecified
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.substring(7);
    if (ipv4Part.includes('.')) {
      return isPrivateIPv4(ipv4Part);
    }
  }

  // Unique local addresses (fc00::/7)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-local addresses (fe80::/10)
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true;
  }

  return false;
}

/**
 * Validates a website URL against SSRF attacks.
 * Verifies syntax, allowed protocols, and performs DNS resolution to block private IP spaces.
 * 
 * @param {string} rawUrl - The URL string to validate
 * @returns {Promise<{ normalizedUrl: string, domain: string }>}
 */
export async function validateUrlForSsrf(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw ApiError.badRequest('A valid website URL is required.');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    throw ApiError.badRequest('Invalid URL format. Must include protocol (e.g., https://example.com).');
  }

  // 1. Strict protocol validation
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw ApiError.badRequest(`Unsafe protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.`);
  }

  // 2. Reject credentials in URL
  if (parsed.username || parsed.password) {
    throw ApiError.badRequest('URLs containing embedded credentials are not allowed.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Reject localhost and reserved domain suffixes
  const blockedHostnames = ['localhost', 'localhost.localdomain', 'ip6-localhost', 'ip6-loopback'];
  if (blockedHostnames.includes(hostname)) {
    throw ApiError.badRequest('Requests to localhost are rejected for security.');
  }

  const blockedSuffixes = ['.local', '.internal', '.localhost', '.onion', '.test', '.example', '.invalid'];
  if (blockedSuffixes.some((suffix) => hostname.endsWith(suffix))) {
    throw ApiError.badRequest(`Domains ending with private or test TLDs are rejected.`);
  }

  // 4. DNS resolution to prevent DNS-rebinding and private destination SSRF
  let resolvedAddresses = [];
  try {
    resolvedAddresses = await dns.lookup(hostname, { all: true });
  } catch (dnsErr) {
    throw ApiError.badRequest(`Unable to resolve destination domain "${hostname}": ${dnsErr.message}`);
  }

  if (!resolvedAddresses || resolvedAddresses.length === 0) {
    throw ApiError.badRequest(`Destination host "${hostname}" could not be reached or resolved.`);
  }

  for (const { address, family } of resolvedAddresses) {
    if (family === 4 && isPrivateIPv4(address)) {
      throw ApiError.badRequest(
        `Destination "${hostname}" resolves to a private or restricted IPv4 address (${address}).`
      );
    }
    if (family === 6 && isPrivateIPv6(address)) {
      throw ApiError.badRequest(
        `Destination "${hostname}" resolves to a private or restricted IPv6 address (${address}).`
      );
    }
  }

  return {
    normalizedUrl: parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname) + parsed.search,
    domain: hostname,
  };
}

export default {
  validateUrlForSsrf,
};
