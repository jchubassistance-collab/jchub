import test from 'node:test';
import assert from 'node:assert/strict';
import { clientIpFromHeaders, isCloudflareIp, isValidIp } from '../lib/client-ip.ts';

const headers = (values) => ({ get: (name) => values[name] ?? null });

test('les adresses de Cloudflare sont reconnues, en IPv4 comme en IPv6', () => {
  assert.equal(isCloudflareIp('104.16.0.1'), true);
  assert.equal(isCloudflareIp('172.71.255.254'), true);
  assert.equal(isCloudflareIp('2606:4700:10::6816:1'), true);
  assert.equal(isCloudflareIp('2a06:98c7:ffff::1'), true);
  assert.equal(isCloudflareIp('::ffff:162.158.1.2'), true);
  assert.equal(isCloudflareIp('104.24.0.0'), true);
  assert.equal(isCloudflareIp('104.28.0.0'), false);
  assert.equal(isCloudflareIp('76.76.21.21'), false);
  assert.equal(isCloudflareIp('2a06:98d0::1'), false);
  assert.equal(isCloudflareIp('pas une ip'), false);
});

test('les adresses mal formées sont refusées', () => {
  for (const value of ['1.2.3', '1.2.3.256', '1::2::3', '12345::1', 'abc', '', '1.2.3.4.5']) assert.equal(isValidIp(value), false, value);
  for (const value of ['1.2.3.4', '::1', '2001:db8::8a2e:370:7334', '::ffff:10.0.0.1']) assert.equal(isValidIp(value), true, value);
});

test('l’IP du visiteur venant de Cloudflare est celle que Cloudflare transmet', () => {
  assert.equal(clientIpFromHeaders(headers({ 'x-real-ip': '162.158.10.20', 'cf-connecting-ip': '41.202.1.9' })), '41.202.1.9');
});

test('une requête envoyée directement à Vercel ne peut pas choisir son IP', () => {
  assert.equal(clientIpFromHeaders(headers({ 'x-real-ip': '198.51.100.7', 'cf-connecting-ip': '1.2.3.4' })), '198.51.100.7');
  assert.equal(clientIpFromHeaders(headers({ 'cf-connecting-ip': '1.2.3.4' })), '');
  assert.equal(clientIpFromHeaders(headers({ 'x-real-ip': '162.158.10.20', 'cf-connecting-ip': 'n’importe quoi' })), '162.158.10.20');
});
