import type { TrendCandidate } from '@/lib/content-sources';

const TOPIC_TERMS = /\b(cyber|cybersecurity|security|openai|chatgpt|informatique|computer|computing|technology|technologie|software|logiciel|developer|developpeur|cloud|ai|ia)\b/i;
const IMPORTANT_TERMS = /\b(cve-\d{4}-\d+|zero[- ]day|ransomware|cyberattack|breach|data leak|fuite de donnees|faille|vulnerabilite|critical|critique|outage|panne|major|landmark|breakthrough|announces?|acquisition|billion|regulation|reglementation|law|loi|incident)\b/i;
const STOP_WORDS = new Set(['about', 'after', 'agent', 'article', 'avec', 'before', 'comme', 'dans', 'from', 'have', 'into', 'issue', 'leurs', 'mais', 'more', 'pour', 'sans', 'that', 'this', 'their', 'those', 'through', 'under', 'using', 'what', 'when', 'with', 'your', 'openai', 'cybersecurity', 'informatique', 'computer', 'computing', 'technology', 'technologie', 'software', 'logiciel', 'developer', 'developpeur', 'cloud', 'security', 'securite']);

function normalize(text: string) {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function words(text: string) {
  return new Set(normalize(text).match(/[a-z0-9-]{4,}/g)?.filter((word) => !STOP_WORDS.has(word)) || []);
}

function host(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

export function assessEditorialImportance(sources: TrendCandidate[], articleText: string) {
  const articleTokens = words(articleText);
  for (const source of sources) {
    const text = normalize(`${source.title} ${source.summary}`);
    if (!TOPIC_TERMS.test(text) || !IMPORTANT_TERMS.test(text)) continue;
    const tokens = words(text);
    if (!Array.from(tokens).some((token) => articleTokens.has(token))) continue;
    const corroborating = sources.filter((other) => {
      if (other.source === source.source || !host(other.url) || host(other.url) === host(source.url)) return false;
      const otherText = normalize(`${other.title} ${other.summary}`);
      if (!TOPIC_TERMS.test(otherText) || !IMPORTANT_TERMS.test(otherText)) return false;
      const otherTokens = words(otherText);
      let overlap = 0;
      tokens.forEach((token) => { if (otherTokens.has(token)) overlap += 1; });
      return overlap >= 2;
    });
    const sourceCount = new Set([host(source.url), ...corroborating.map((item) => host(item.url))].filter(Boolean)).size;
    if (sourceCount >= 2) {
      return { autoPublish: true, sourceCount, reason: `Important IT story confirmed by ${sourceCount} separate trend sources.` };
    }
  }
  return { autoPublish: false, sourceCount: 0, reason: 'IT topic without enough corroboration; admin review required.' };
}
