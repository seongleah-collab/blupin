import webpush from 'web-push';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let configured = false;
function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:hi@blupin.app';
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)');
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
};

export async function notifyUser(
  userId: string,
  payload: PushPayload,
  opts: { minSeverity?: number; severity?: number } = {}
): Promise<{ sent: number; pruned: number }> {
  configure();
  const db = admin();

  const { data: pref } = await db
    .from('notification_preferences')
    .select('web_push_enabled, min_severity')
    .eq('user_id', userId)
    .maybeSingle();

  const enabled = pref?.web_push_enabled ?? true;
  const minSev = pref?.min_severity ?? 8;
  if (!enabled) return { sent: 0, pruned: 0 };
  if (typeof opts.severity === 'number' && opts.severity < minSev) {
    return { sent: 0, pruned: 0 };
  }

  const { data: subs, error } = await db
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) throw error;
  if (!subs || subs.length === 0) return { sent: 0, pruned: 0 };

  const json = JSON.stringify(payload);
  let sent = 0;
  let pruned = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          json
        );
        sent++;
        await db
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', s.id);
      } catch (err: any) {
        // 404/410 = subscription is dead, drop it. anything else = transient.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.from('push_subscriptions').delete().eq('id', s.id);
          pruned++;
        } else {
          console.error('[notifyUser] push failed', err?.statusCode, err?.body || err?.message);
        }
      }
    })
  );

  return { sent, pruned };
}
