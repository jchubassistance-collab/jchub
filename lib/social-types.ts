export const SOCIAL_PLATFORMS = ['linkedin', 'facebook', 'github'] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];
export type PublicationStatus = 'DRAFT' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';

export type PublicationCopy = {
  linkedin: string;
  facebook: string;
  github: string;
};

export type SocialSource = {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  imageUrl?: string;
  tags: string[];
  category: string;
  author: string;
  publishedAt?: string;
};

export type SocialSettings = {
  linkedinEnabled: boolean;
  facebookEnabled: boolean;
  githubEnabled: boolean;
  autoPublish: boolean;
  dryRun: boolean;
  timezone: string;
};

export type PublicationRecord = {
  id: string;
  sourceContentId: string;
  sourceTitle: string;
  sourceDescription: string;
  sourceUrl: string;
  platform: SocialPlatform;
  destination: string;
  content: string;
  contentHash: string;
  status: PublicationStatus;
  createdAt?: string;
  updatedAt?: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  externalId?: string | null;
  externalUrl?: string | null;
  error?: string | null;
  errorCode?: string | null;
  retryCount: number;
  lastAttemptAt?: string | null;
  dryRun?: boolean;
  imageUrl?: string;
};

export function validatePlatformText(platform: SocialPlatform, text: string): string | null {
  if (!text.trim()) return 'Le contenu ne peut pas être vide.';
  const limits: Record<SocialPlatform, number> = { linkedin: 3000, facebook: 63206, github: 20000 };
  if (text.length > limits[platform]) return `Le contenu dépasse la limite configurée pour ${platform}.`;
  return null;
}
