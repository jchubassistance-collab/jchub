import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { SIGNATURE_ACCENTS, SIGNATURE_TEMPLATES, SOCIAL_NETWORKS, socialIconUrl, buildSignatureHtml, buildSignatureText, emptySignature, safeImageUrl, safeWebUrl } from '../lib/email-signature.ts';

const labels = { phone: 'Tél.', mobile: 'Mobile', email: 'E-mail', website: 'Site' };
const site = 'https://jchub.dev';

function signature(overrides = {}) {
  return { ...emptySignature(), name: 'Awa Mbemba', company: 'Atelier', ...overrides, socials: { ...emptySignature().socials, ...overrides.socials } };
}

test('les adresses web gardent http(s), complètent un domaine nu et refusent le reste', () => {
  assert.equal(safeWebUrl('atelier.com'), 'https://atelier.com/');
  assert.equal(safeWebUrl('http://atelier.com/a'), 'http://atelier.com/a');
  assert.equal(safeWebUrl('javascript:alert(1)'), '');
  assert.equal(safeWebUrl('data:text/html,x'), '');
  assert.equal(safeWebUrl('  '), '');
  assert.equal(safeImageUrl('http://atelier.com/a.png'), '');
  assert.equal(safeImageUrl('https://atelier.com/a.png'), 'https://atelier.com/a.png');
});

test('chaque modèle échappe le texte saisi et écarte les liens dangereux', () => {
  const data = signature({
    name: '<script>alert(1)</script>', title: 'Dev "senior"', company: 'A&B',
    website: 'javascript:alert(1)', socials: { x: 'javascript:alert(1)', linkedin: 'linkedin.com/in/awa' },
    image: 'https://cdn.test/a.png" onerror="alert(1)',
  });
  for (const template of SIGNATURE_TEMPLATES) {
    const html = buildSignatureHtml({ ...data, template }, labels, site);
    assert.doesNotMatch(html, /<script|javascript:|" onerror=/i, template);
    assert.match(html, /&lt;script&gt;/, template);
    assert.match(html, /A&amp;B/, template);
    assert.match(html, /href="https:\/\/linkedin\.com\/in\/awa"/, template);
  }
});

test('la signature est en tableaux à styles en ligne, sans classes ni images intégrées', () => {
  const html = buildSignatureHtml(signature({ image: 'https://cdn.test/a.png', phone: '+242 06 555 12 34', email: 'awa@atelier.com' }), labels, site);
  assert.match(html, /^<table /);
  assert.doesNotMatch(html, /class=|display:\s*flex|data:image/);
  assert.match(html, /<img src="https:\/\/cdn\.test\/a\.png"[^>]*width="80"/);
  assert.match(html, /href="tel:\+242065551234"/);
  assert.match(html, /href="mailto:awa@atelier\.com"/);
});

test('une couleur invalide revient à la couleur par défaut, une image http est ignorée', () => {
  const html = buildSignatureHtml(signature({ accent: 'red;background:url(x)', image: 'http://cdn.test/a.png' }), labels, site);
  assert.doesNotMatch(html, /url\(x\)|<img/);
  assert.match(html, /#2563eb/);
});

test('le bouton n’apparaît qu’avec un texte et un lien valide', () => {
  assert.doesNotMatch(buildSignatureHtml(signature({ ctaText: 'RDV', ctaUrl: '' }), labels, site), /RDV/);
  assert.match(buildSignatureHtml(signature({ ctaText: 'RDV', ctaUrl: 'cal.com/awa' }), labels, site), /href="https:\/\/cal\.com\/awa"[^>]*>RDV</);
});

test('la version texte reprend les coordonnées et la mention', () => {
  const text = buildSignatureText(signature({ title: 'Gérante', email: 'awa@atelier.com', disclaimer: 'Confidentiel' }), labels);
  assert.equal(text, '--\nAwa Mbemba\nGérante · Atelier\nE-mail awa@atelier.com\n\nConfidentiel');
});

test('les réseaux s’affichent en icônes PNG du site, présentes pour chaque couleur', () => {
  const html = buildSignatureHtml(signature({ accent: '#0f766e', socials: { linkedin: 'linkedin.com/in/awa', github: 'github.com/awa' } }), labels, site);
  assert.match(html, /<a href="https:\/\/linkedin\.com\/in\/awa"[^>]*><img src="https:\/\/jchub\.dev\/email-signature\/linkedin-0f766e\.png" alt="LinkedIn" width="24" height="24"/);
  assert.match(html, /github-0f766e\.png/);
  assert.doesNotMatch(html, /facebook/);
  for (const accent of SIGNATURE_ACCENTS) {
    for (const network of SOCIAL_NETWORKS) {
      const file = new URL(`../public${new URL(socialIconUrl(site, network, accent)).pathname}`, import.meta.url);
      assert.ok(existsSync(file), `${network} ${accent}`);
    }
  }
});
