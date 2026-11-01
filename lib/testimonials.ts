import 'server-only';

import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

export type Testimonial = { id: string; name: string; message: string; rating: number; imageUrl: string };

/** Cropped, re-encoded delivery URL: smaller than the original and free of its EXIF data. */
export function testimonialAvatarUrl(secureUrl: string): string | null {
  try {
    const url = new URL(secureUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || !url.pathname.includes('/image/upload/')) return null;
    url.pathname = url.pathname.replace('/image/upload/', '/image/upload/c_fill,g_face,w_160,h_160,q_auto,f_auto/');
    return url.toString();
  } catch {
    return null;
  }
}

/** The `testimonials` collection only holds entries an admin published from the inbox. */
export async function getPublishedTestimonials(limit = 6): Promise<Testimonial[]> {
  if (!hasFirebaseAdminConfig()) return [];
  try {
    const snapshot = await getAdminDb().collection('testimonials').orderBy('createdAt', 'desc').limit(limit).get();
    return snapshot.docs.flatMap((document) => {
      const data = document.data();
      const name = typeof data.name === 'string' ? data.name.trim().slice(0, 120) : '';
      const message = typeof data.message === 'string' ? data.message.trim().slice(0, 5000) : '';
      const rating = Number(data.rating);
      let imageUrl = '';
      try {
        const image = new URL(String(data.imageUrl || ''));
        if (image.protocol === 'https:' && image.hostname === 'res.cloudinary.com') imageUrl = image.toString();
      } catch { /* Omit malformed URLs. */ }
      if (!name || !message || !imageUrl || !Number.isInteger(rating) || rating < 1 || rating > 5) return [];
      return [{ id: document.id, name, message, imageUrl, rating }];
    });
  } catch (error) {
    console.error('Testimonials load failed:', error);
    return [];
  }
}
