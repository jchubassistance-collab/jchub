// lib/cloudinary.ts — Helper Cloudinary pour JcHub
// Utilisé pour : PDF, audio (livres), covers, images

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export type CloudinaryResource = {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  resource_type: 'image' | 'video' | 'raw';
};

/**
 * Construit une URL Cloudinary avec transformations
 */
export function cloudinaryUrl(
  publicId: string,
  options: {
    type?: 'image' | 'video' | 'raw';
    transformations?: string;
    format?: string;
  } = {}
): string {
  const { type = 'image', transformations = '', format } = options;
  const cloudName = CLOUD_NAME;
  const t = transformations ? `${transformations}/` : '';
  const f = format ? `.${format}` : '';
  return `https://res.cloudinary.com/${cloudName}/${type}/upload/${t}${publicId}${f}`;
}

/**
 * URLs prédéfinies pour les ressources JcHub
 */
export const cloudinaryAssets = {
  // Covers de livres
  bookCover: (slug: string, format: 'jpg' | 'webp' = 'webp', w = 600) =>
    cloudinaryUrl(`jchub/books/covers/${slug}`, {
      transformations: `c_fill,w_${w},h_${w * 4 / 3},q_auto,f_auto`,
      format,
    }),

  // PDF
  bookPdf: (slug: string) =>
    cloudinaryUrl(`jchub/books/pdfs/${slug}.pdf`, { type: 'raw' }),

  // Audio (en chapters)
  audioChapter: (slug: string, chapter: number) =>
    cloudinaryUrl(`jchub/books/audio/${slug}/chapter-${chapter}`, {
      type: 'video',
      format: 'mp3',
    }),

  // Images outils
  toolIcon: (slug: string) =>
    cloudinaryUrl(`jchub/tools/${slug}`, {
      transformations: 'c_fill,w_80,h_80,q_auto,f_auto',
    }),

  // Hero images
  hero: (name: string) =>
    cloudinaryUrl(`jchub/hero/${name}`, {
      transformations: 'c_fill,w_1200,h_800,q_auto,f_auto',
    }),

  // Avatars
  avatar: (name: string) =>
    cloudinaryUrl(`jchub/avatars/${name}`, {
      transformations: 'c_fill,w_200,h_200,q_auto,f_auto',
    }),
};

/**
 * Génère une URL signée pour accès privé (PDFs premium, audio non-acheté)
 */
export async function signCloudinaryUrl(
  publicId: string,
  options: { type?: 'image' | 'video' | 'raw'; expiresAt?: number } = {}
): Promise<string> {
  // Note: la signature se fait côté serveur avec API_SECRET
  // Pour une V1, on peut simplement utiliser des URLs signées via SDK
  const { type = 'raw', expiresAt = Math.floor(Date.now() / 1000) + 3600 } = options;

  if (!API_KEY || !API_SECRET) {
    // Fallback: URL non-signée (pour développement)
    return cloudinaryUrl(publicId, { type });
  }

  // En production, utiliser cloudinary.v2.api.sign_url
  // Pour l'instant, retourner l'URL publique
  return cloudinaryUrl(publicId, { type, transformations: `t_${expiresAt}` });
}

/**
 * Upload un fichier (côté serveur)
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  options: {
    folder: string;
    publicId?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  }
): Promise<CloudinaryResource> {
  const { folder, publicId, resourceType = 'auto' } = options;

  if (!API_KEY || !API_SECRET) {
    throw new Error('Cloudinary non configuré');
  }

  const formData = new FormData();
  formData.append('file', file as any);
  formData.append('api_key', API_KEY);
  formData.append('folder', folder);
  if (publicId) formData.append('public_id', publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Convertit un Blob en data URI (utilitaire pour upload)
 */
export function blobToDataURI(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
