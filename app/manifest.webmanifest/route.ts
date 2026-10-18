import { webManifestResponse } from '@/lib/web-manifest';

export function GET() {
  return webManifestResponse('fr');
}
