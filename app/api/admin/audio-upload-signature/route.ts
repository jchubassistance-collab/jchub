import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { slug } = await request.json();
    if (typeof slug !== 'string' || !/^[a-z0-9-]{1,80}$/.test(slug)) {
      return NextResponse.json({ success: false, error: 'Identifiant du livre invalide.' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: 'Cloudinary n’est pas configuré.' }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'jchub/books/audio';
    const publicId = `${slug}-full`;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, public_id: publicId },
      apiSecret
    );

    return NextResponse.json({
      success: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      publicId,
      signature,
    });
  } catch (error) {
    console.error('Erreur signature upload audio:', error);
    return NextResponse.json({ success: false, error: 'Session invalide ou expirée.' }, { status: 401 });
  }
}
