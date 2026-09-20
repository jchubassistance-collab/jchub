export function hasGeminiConfig() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function analyzePdfLayout(buffer: Buffer): Promise<string | null> {
  if (!hasGeminiConfig()) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY!)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'Analyse ce PDF pour guider une conversion Word editable. Retourne uniquement un JSON compact avec pages, hasTables, hasColumns, hasImages et headings.',
            },
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: buffer.toString('base64'),
              },
            },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini a répondu ${response.status}.`);
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return payload.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}
