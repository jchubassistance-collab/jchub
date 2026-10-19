/**
 * Visitor IP used by the rate limits and daily quotas. jchub.dev goes through Cloudflare, but
 * Vercel also answers requests sent to it directly: cf-connecting-ip is therefore trusted only
 * when the connection itself comes from Cloudflare. Otherwise anyone could send another value
 * with each request and get around every limit. x-real-ip is written by Vercel from the
 * connection and cannot be forged by the visitor.
 */

// https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6 (checked 2026-10-19).
const CLOUDFLARE_RANGES = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
  '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
  '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
  '2a06:98c0::/29', '2c0f:f248::/32',
];

/** IPv4 as four bytes, or null. */
function parseIpv4(value: string): number[] | null {
  const parts = value.split('.');
  if (parts.length !== 4 || !parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return null;
  return parts.map(Number);
}

/** IPv6 as sixteen bytes (an embedded IPv4 included), or null. */
function parseIpv6(value: string): number[] | null {
  if (!value.includes(':') || !/^[0-9a-f:.]+$/i.test(value)) return null;
  let text = value;
  let tail: number[] = [];
  if (text.includes('.')) {
    const lastColon = text.lastIndexOf(':');
    const ipv4 = parseIpv4(text.slice(lastColon + 1));
    if (!ipv4) return null;
    tail = ipv4;
    text = `${text.slice(0, lastColon + 1)}0:0`;
  }
  const halves = text.split('::');
  if (halves.length > 2) return null;
  const toGroups = (part: string) => (part ? part.split(':') : []);
  const head = toGroups(halves[0]);
  const rest = halves.length === 2 ? toGroups(halves[1]) : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 1) return null;
  const groups = [...head, ...Array.from({ length: halves.length === 2 ? missing : 0 }, () => '0'), ...rest];
  if (!groups.every((group) => /^[0-9a-f]{1,4}$/i.test(group))) return null;
  const bytes = groups.flatMap((group) => {
    const number = parseInt(group, 16);
    return [number >> 8, number & 0xff];
  });
  if (tail.length) bytes.splice(12, 4, ...tail);
  return bytes;
}

/** The address as bytes: 4 for IPv4, 16 for IPv6. An IPv4-mapped IPv6 address counts as IPv4. */
function parseIp(value: string): number[] | null {
  const ipv4 = parseIpv4(value);
  if (ipv4) return ipv4;
  const ipv6 = parseIpv6(value);
  if (ipv6 && ipv6.slice(0, 10).every((byte) => byte === 0) && ipv6[10] === 0xff && ipv6[11] === 0xff) return ipv6.slice(12);
  return ipv6;
}

function inRange(address: number[], range: string): boolean {
  const [network, prefixText] = range.split('/');
  const base = parseIp(network);
  const prefix = Number(prefixText);
  if (!base || base.length !== address.length) return false;
  for (let bit = 0; bit < prefix; bit += 1) {
    const byte = bit >> 3;
    const mask = 0x80 >> (bit & 7);
    if ((address[byte] & mask) !== (base[byte] & mask)) return false;
  }
  return true;
}

export function isValidIp(value: string): boolean {
  return parseIp(value) !== null;
}

export function isCloudflareIp(value: string): boolean {
  const address = parseIp(value);
  return Boolean(address && CLOUDFLARE_RANGES.some((range) => inRange(address, range)));
}

/** The visitor's IP, or an empty string when the request carries none. */
export function clientIpFromHeaders(headers: { get(name: string): string | null }): string {
  const peer = headers.get('x-real-ip')?.trim() ?? '';
  if (peer && isCloudflareIp(peer)) {
    const visitor = headers.get('cf-connecting-ip')?.trim() ?? '';
    if (visitor && isValidIp(visitor)) return visitor;
  }
  return peer && isValidIp(peer) ? peer : '';
}
