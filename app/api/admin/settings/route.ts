import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { hasFirebaseAdminConfig } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function service(name: string, configured: boolean, detail: string) {
  return { name, configured, detail };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const aiProvider = process.env.AI_PROVIDER?.trim().toLowerCase() || 'gemini';
    const aiConfigured = aiProvider === 'ollama'
      ? Boolean(process.env.OLLAMA_BASE_URL?.trim())
      : Boolean(process.env.GEMINI_API_KEY?.trim());
    const aiDetail = aiProvider === 'ollama'
      ? (aiConfigured ? `Ollama · ${process.env.OLLAMA_MODEL || 'llama3.2'}` : 'OLLAMA_BASE_URL manquant')
      : (aiConfigured ? `Gemini · ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}` : 'GEMINI_API_KEY manquante');
    const gaConfigured = Boolean(process.env.GA4_PROPERTY_ID?.trim() && (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL) && (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY));
    const services = [
      service('Authentification Firebase', Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA3D7qN9MgnJsBuoMIcNho_09Ctq19FFmU') && Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'jchub-devs'), 'Configuration Firebase client du projet JcHub'),
      service('Cloud Firestore (Admin)', hasFirebaseAdminConfig(), hasFirebaseAdminConfig() ? 'Compte de service configuré' : 'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY requis'),
      service('Agent IA', aiConfigured, aiDetail),
      service('Google Analytics 4', gaConfigured, gaConfigured ? `Propriété ${process.env.GA4_PROPERTY_ID}` : 'Propriété et identifiants du compte de service requis'),
      service('Cloudinary', Boolean((process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) && (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) !== 'demo' && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET), 'Téléversement des guides PDF'),
      service('Brevo', Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL), 'E-mails et newsletter'),
    ];
    return NextResponse.json({ services, checkedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: status === 403 ? 'Accès refusé.' : 'Authentification administrateur requise.' }, { status });
  }
}
