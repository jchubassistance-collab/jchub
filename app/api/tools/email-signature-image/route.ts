import { randomUUID } from 'node:crypto';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { NextRequest, NextResponse } from 'next/server';
import { apiMessage } from '@/lib/api-messages';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { enforceRateLimit } from '@/lib/rate-limit';
import { reportUserError } from '@/lib/user-error';
import { withReport } from '@/lib/reports/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** The browser already shrinks the image to 240 px: anything far bigger did not come from the tool. */
const MAX_BYTES = 1_000_000;
const MAX_SIZE = 240;
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

/**
 * Hosts the photo or logo of an e-mail signature. Mail clients only show images reachable at a
 * public https address, so the image stays online for as long as the signature is used.
 */
export const POST = withReport(async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'email-signature-image', 10, 60 * 60_000);
  if (limited) return limited;

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES + 10_000) {
    return NextResponse.json({ error: apiMessage(request, 'L’image est trop lourde (1 Mo au maximum).') }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  let kind: FormDataEntryValue | null;
  try {
    const form = await request.formData();
    file = form.get('file');
    kind = form.get('kind');
  } catch {
    return NextResponse.json({ error: apiMessage(request, 'Image invalide.') }, { status: 400 });
  }
  if (!(file instanceof File) || !ACCEPTED_TYPES.has(file.type)) {
    return NextResponse.json({ error: apiMessage(request, 'Image invalide.') }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: apiMessage(request, 'L’image est trop lourde (1 Mo au maximum).') }, { status: 413 });
  }

  // Redrawn here: only real pixels are stored, without the file's metadata (GPS position…).
  let encoded: Buffer;
  try {
    const image = await loadImage(Buffer.from(await file.arrayBuffer()));
    if (kind === 'photo') {
      // Cut round here: classic Outlook ignores border-radius and would show a square photo.
      const side = Math.min(image.width, image.height);
      const size = Math.min(MAX_SIZE, side);
      const canvas = createCanvas(size, size);
      const context = canvas.getContext('2d');
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      context.clip();
      context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
      encoded = canvas.toBuffer('image/png');
    } else {
      const scale = Math.min(1, MAX_SIZE / Math.max(image.width, image.height));
      const canvas = createCanvas(Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      encoded = canvas.toBuffer('image/png');
    }
  } catch {
    return NextResponse.json({ error: apiMessage(request, 'Image invalide.') }, { status: 400 });
  }

  try {
    const uploaded = await uploadToCloudinary(encoded, { folder: 'jchub/email-signatures', publicId: randomUUID(), resourceType: 'image' });
    return NextResponse.json({ url: uploaded.secure_url });
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: apiMessage(request, 'Impossible d’enregistrer l’image pour le moment. Colle plutôt l’adresse d’une image déjà en ligne.') }, { status: 503 });
  }
});
