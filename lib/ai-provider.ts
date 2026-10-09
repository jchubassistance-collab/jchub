import 'server-only';

export type AiProvider = 'gemini' | 'openai' | 'openrouter' | 'deepseek' | 'ollama';

const supportedProviders: AiProvider[] = ['gemini', 'openai', 'openrouter', 'deepseek', 'ollama'];

type GenerationOptions = {
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
};

function readProvider(value: string | undefined): AiProvider | null {
  const normalized = value?.trim().toLowerCase();
  return supportedProviders.find((provider) => provider === normalized) || null;
}

export function getPrimaryAiProvider(): AiProvider {
  return readProvider(process.env.AI_PROVIDER) || 'gemini';
}

export function getFallbackAiProviders(): AiProvider[] {
  const configured = process.env.AI_FALLBACK_PROVIDER;
  const values = configured === undefined ? ['openai', 'openrouter', 'deepseek'] : configured.split(',');
  return Array.from(new Set(values.map(readProvider).filter((provider): provider is AiProvider => provider !== null)));
}

async function generateWithGemini(prompt: string, options: GenerationOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY est manquante.');
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.4,
        ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(options.timeoutMs ?? 45_000),
  });
  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(data.error?.message || `Gemini a répondu ${response.status}.`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini n’a renvoyé aucun contenu.');
  return text;
}

async function generateWithOllama(prompt: string, options: GenerationOptions): Promise<string> {
  const baseUrl = (process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL?.trim() || 'llama3.2';
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      ...(options.jsonMode ? { format: 'json' } : {}),
      options: { temperature: options.temperature ?? 0.4 },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(options.timeoutMs ?? 90_000),
  });
  const data = await response.json() as { response?: string; error?: string };
  if (!response.ok) throw new Error(data.error || `Ollama a répondu ${response.status}.`);
  if (!data.response) throw new Error('Ollama n’a renvoyé aucun contenu.');
  return data.response;
}

async function generateWithChatCompletions(
  provider: Exclude<AiProvider, 'gemini' | 'ollama'>,
  prompt: string,
  options: GenerationOptions,
): Promise<string> {
  const configuration = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY?.trim(),
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      url: 'https://api.openai.com/v1/chat/completions',
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY?.trim(),
      model: process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o',
      url: 'https://openrouter.ai/api/v1/chat/completions',
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY?.trim() || process.env.DEEPSEEK_API?.trim(),
      model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat',
      url: 'https://api.deepseek.com/chat/completions',
    },
  }[provider];
  if (!configuration.apiKey) {
    const variable = provider === 'deepseek' ? 'DEEPSEEK_API_KEY (ou DEEPSEEK_API)' : `${provider.toUpperCase()}_API_KEY`;
    throw new Error(`${variable} est manquante.`);
  }

  const response = await fetch(configuration.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${configuration.apiKey}`,
      ...(provider === 'openrouter' ? {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev',
        'X-Title': 'JcHub',
      } : {}),
    },
    body: JSON.stringify({
      model: configuration.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? 0.4,
      ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(options.timeoutMs ?? 45_000),
  });
  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
    error?: string | { message?: string };
  };
  if (!response.ok) {
    const error = typeof data.error === 'string' ? data.error : data.error?.message;
    throw new Error(error || `${provider} a répondu ${response.status}.`);
  }
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${provider} n’a renvoyé aucun contenu.`);
  return text;
}

export function generateWithAiProvider(
  provider: AiProvider,
  prompt: string,
  options: GenerationOptions = {},
): Promise<string> {
  if (provider === 'gemini') return generateWithGemini(prompt, options);
  if (provider === 'ollama') return generateWithOllama(prompt, options);
  return generateWithChatCompletions(provider, prompt, options);
}
