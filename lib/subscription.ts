import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';

export type SubscriptionTier = 'free' | 'day' | 'week' | 'monthly' | 'yearly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export type Subscription = {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startedAt?: Timestamp;
  expiresAt?: Timestamp | null;
  autoRenew: boolean;
  paymentMethod?: 'mtn' | 'airtel' | 'card' | 'paypal' | null;
  lastPaymentId?: string;
  cancelAt?: Timestamp | null;
};

export async function getUserSubscription(userId: string): Promise<Subscription> {
  const snapshot = await getAdminDb().collection('users').doc(userId).get();
  const subscription = snapshot.data()?.subscription as Partial<Subscription> | undefined;
  return {
    tier: subscription?.tier || 'free',
    status: subscription?.status || 'active',
    autoRenew: subscription?.autoRenew ?? false,
    expiresAt: subscription?.expiresAt ?? null,
    paymentMethod: subscription?.paymentMethod ?? null,
    lastPaymentId: subscription?.lastPaymentId,
    startedAt: subscription?.startedAt,
    cancelAt: subscription?.cancelAt ?? null,
  };
}

export async function hasAccess(userId: string) {
  const subscription = await getUserSubscription(userId);
  if (subscription.tier === 'lifetime' && subscription.status === 'active') return { isPremium: true, subscription, daysLeft: 9999 };
  const expiresAt = subscription.expiresAt?.toDate() || null;
  const active = subscription.status === 'active' && subscription.tier !== 'free' && (!expiresAt || expiresAt > new Date());
  if (!active && subscription.status === 'active' && expiresAt && expiresAt <= new Date()) {
    await getAdminDb().collection('users').doc(userId).update({ 'subscription.status': 'expired', updatedAt: FieldValue.serverTimestamp() });
  }
  return { isPremium: active, subscription: active ? subscription : { ...subscription, status: 'expired' as const }, daysLeft: active && expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : 0 };
}

export function subscriptionExpiry(tier: SubscriptionTier, start = new Date()): Date | null {
  if (tier === 'lifetime') return null;
  const days = tier === 'day' ? 1 : tier === 'week' ? 7 : tier === 'monthly' ? 30 : tier === 'yearly' ? 365 : 0;
  return new Date(start.getTime() + days * 86400000);
}
