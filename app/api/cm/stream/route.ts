import { NextRequest } from 'next/server';
import { requireCm } from '@/lib/admin-auth';
import { cmError } from '@/lib/cm-server';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    await requireCm(request);

    let closeStream: (() => void) | undefined;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        let closed = false;
        const subscriptions: Array<() => void> = [];
        const send = (value: string) => {
          if (!closed) controller.enqueue(encoder.encode(value));
        };
        const notify = () => send('event: update\ndata: {}\n\n');
        const close = () => {
          if (closed) return;
          closed = true;
          clearInterval(heartbeat);
          subscriptions.forEach(unsubscribe => unsubscribe());
          try { controller.close(); } catch { /* Stream already closed by the client. */ }
        };
        closeStream = close;

        send('retry: 3000\nevent: ready\ndata: {}\n\n');
        const heartbeat = setInterval(() => send(': keep-alive\n\n'), 20000);
        const db = getAdminDb();
        for (const collection of ['cmReports', 'cmEditorial', 'cmKits']) {
          subscriptions.push(db.collection(collection).onSnapshot(notify, () => {
            send('event: refresh\ndata: {}\n\n');
          }));
        }
        request.signal.addEventListener('abort', close, { once: true });
      },
      cancel() { closeStream?.(); },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'private, no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return cmError(error);
  }
}
