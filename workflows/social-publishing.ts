import { publishPublication, prepareSocialPublications } from '@/lib/publishing-agent';

async function prepareStep(sourceContentId: string) {
  'use step';
  return prepareSocialPublications(sourceContentId);
}

async function publishStep(publicationId: string, allowManualRetry: boolean, confirmUnknownRetry: boolean) {
  'use step';
  return publishPublication(publicationId, allowManualRetry, confirmUnknownRetry);
}

export async function runSocialPreparation(sourceContentId: string) {
  'use workflow';
  return prepareStep(sourceContentId);
}

export async function runSocialPublication(publicationId: string, allowManualRetry = false, confirmUnknownRetry = false) {
  'use workflow';
  return publishStep(publicationId, allowManualRetry, confirmUnknownRetry);
}
