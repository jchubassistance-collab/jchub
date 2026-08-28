import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

   const adminDb = getAdminDb();

const [users, books, transactions] = await Promise.all([
  adminDb.collection('users').get(),
  adminDb.collection('books').get(),
  adminDb.collection('transactions').get(),
]);

    const totalRevenue = transactions.docs.reduce(
      (total, transaction) => total + Number(transaction.data().amount || 0),
      0
    );

    const totalViews = books.docs.reduce(
      (total, book) => total + Number(book.data().views || 0),
      0
    );
    const totalDownloads = books.docs.reduce(
      (total, book) => total + Number(book.data().downloads || 0),
      0
    );

    const recentUsers = users.docs
      .map((user) => {
        const data = user.data();
        return {
          uid: user.id,
          email: data.email || '',
          createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
          createdAtMillis: data.createdAt?.toMillis?.() ?? 0,
        };
      })
      .filter((user) => user.email)
      .sort((a, b) => b.createdAtMillis - a.createdAtMillis)
      .slice(0, 5)
      .map(({ createdAtMillis: _createdAtMillis, ...user }) => user);

    return NextResponse.json({
      totalUsers: users.size,
      totalBooks: books.size,
      totalTransactions: transactions.size,
      totalRevenue,
      totalViews,
      totalDownloads,
      recentUsers,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: 'Accès administrateur requis.' }, { status });
  }
}
