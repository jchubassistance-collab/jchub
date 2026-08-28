// lib/gemini.ts — Helper Gemini AI pour extraction de métadonnées
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-exp';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type BookMetadata = {
  title: string;
  author: string;
  description: string;
  longDescription: string;
  category: string;
  tags: string[];
  language: string;
  estimatedAudioHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalChapters: number;
  suggestedRights: 'public_domain' | 'cc_by' | 'cc_by_sa' | 'cc_by_nc' | 'cc_by_nc_sa' | 'original';
};

/**
 * Extrait les métadonnées d'un livre à partir d'un échantillon de texte via Gemini AI
 */
export async function extractBookMetadata(textSample: string, existingInfo: any = {}): Promise<BookMetadata> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY non configurée');
  }

  const prompt = `Tu es un expert en librairie technique. Analyse cet extrait de livre et extrais les métadonnées au format JSON strict.

MÉTADONNÉES PDF DÉJÀ DISPONIBLES (utilise-les si pertinentes) :
${JSON.stringify(existingInfo, null, 2)}

EXTRAIT DU LIVRE (premières pages) :
"""
${textSample.slice(0, 6000)}
"""

Retourne UNIQUEMENT un objet JSON avec cette structure exacte (pas de markdown, pas de commentaires) :
{
  "title": "Titre complet du livre",
  "author": "Nom de l'auteur principal",
  "description": "Description courte en 1-2 phrases (max 200 caractères)",
  "longDescription": "Description détaillée en 3-5 phrases pour la page détail",
  "category": "Catégorie parmi : 'Web Dev', 'Mobile', 'Data & IA', 'Cybersécurité', 'Cloud', 'DevOps', 'Design UI/UX', 'Histoire / Sciences', 'Business', 'Autre'",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "language": "fr" ou "en",
  "estimatedAudioHours": nombre_décimal_heures_estimé_pour_lecture_audio (ex: 7.5),
  "difficulty": "beginner" | "intermediate" | "advanced",
  "totalChapters": nombre_entier_estimé_de_chapitres,
  "suggestedRights": "public_domain" | "cc_by" | "cc_by_sa" | "cc_by_nc" | "cc_by_nc_sa" | "original"
}

Si l'auteur n'est pas clair, mets "Auteur inconnu". Si tu ne peux pas déterminer la catégorie, mets "Autre".`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Réponse Gemini vide');
    }

    // Parser le JSON (au cas où Gemini ajoute des ```json)
    const jsonText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const metadata = JSON.parse(jsonText) as BookMetadata;

    return metadata;
  } catch (error: any) {
    console.error('Erreur Gemini:', error);
    throw new Error(`Échec de l'analyse IA: ${error.message}`);
  }
}

/**
 * Génère une description marketing pour un livre
 */
export async function generateBookDescription(title: string, author: string, category: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `${title} par ${author}. Un ouvrage de référence sur ${category}.`;
  }

  const prompt = `Génère une description marketing courte (max 150 caractères) pour ce livre :
- Titre : ${title}
- Auteur : ${author}
- Catégorie : ${category}

La description doit être vendeuse, en français, et donner envie de l'acheter.`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || `${title} par ${author}`;
  } catch {
    return `${title} par ${author}`;
  }
}
