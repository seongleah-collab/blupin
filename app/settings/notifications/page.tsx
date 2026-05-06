'use client';

import { useEffect, useState } from 'react';
import { SectionHeader, Status, type SaveState } from '../_components/SectionHeader';

type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return buf;
}

export default function NotificationsPage() {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [minSeverity, setMinSeverity] = useState(8);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === 'undefined') return;
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (!supported) {
        setPermission('unsupported');
        setLoading(false);
        return;
      }
      setPermission(Notification.permission as PermissionState);

      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        const sub = await reg?.pushManager.getSubscription();
        if (!cancelled) setSubscribed(!!sub);
        // Self-heal: browser may hold a subscription whose DB row was pruned
        // (404/410 from push service, key rotation, etc). Re-upsert silently
        // so the server side catches up.
        if (sub) {
          const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
          if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
            fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: json.endpoint,
                keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
                userAgent: navigator.userAgent,
              }),
            }).catch(() => {});
          }
        }
      } catch {
        // ignore
      }

      try {
        const res = await fetch('/api/push/preferences');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.preferences) {
            setEnabled(data.preferences.web_push_enabled ?? true);
            setMinSeverity(data.preferences.min_severity ?? 8);
          }
        }
      } catch {
        // ignore
      }

      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enablePush() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== 'granted') {
        throw new Error('notification permission denied — re-enable it in your browser settings');
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('VAPID public key missing — add NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env.local');

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(vapidKey),
      });

      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('subscription missing required keys');
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) {
        // Roll back the browser-side subscription so the UI doesn't lie
        // about being subscribed when the server has no row.
        await sub.unsubscribe().catch(() => {});
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `subscribe failed: ${res.status}`);
      }
      setSubscribed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function savePrefs(next: { web_push_enabled?: boolean; min_severity?: number }) {
    setState('saving');
    setError(null);
    try {
      const res = await fetch('/api/push/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `save failed: ${res.status}`);
      }
      setState('saved');
      setTimeout(() => setState('idle'), 1500);
    } catch (err: any) {
      setError(err.message);
      setState('error');
    }
  }

  async function sendTest() {
    setTestStatus('sending…');
    try {
      let res = await fetch('/api/push/test', { method: 'POST' });
      let data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `failed: ${res.status}`);

      // If the server has no row but the browser does, resync once and retry.
      if (data.sent === 0) {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        const sub = await reg?.pushManager.getSubscription();
        const json = sub?.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined;
        if (json?.endpoint && json.keys?.p256dh && json.keys?.auth) {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: json.endpoint,
              keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
              userAgent: navigator.userAgent,
            }),
          });
          res = await fetch('/api/push/test', { method: 'POST' });
          data = await res.json();
          if (!res.ok) throw new Error(data.error ?? `failed: ${res.status}`);
        }
      }

      setTestStatus(data.sent > 0 ? `sent to ${data.sent} device${data.sent === 1 ? '' : 's'}` : 'no devices subscribed');
      setTimeout(() => setTestStatus(null), 4000);
    } catch (err: any) {
      setTestStatus(`error: ${err.message}`);
    }
  }

  return (
    <section>
      <SectionHeader
        title="notifications"
        description="get pinged the moment a real threat lands — so you don’t have to keep checking the feed."
        status={<Status state={state} error={error} />}
      />

      {loading ? (
        <div className="text-[13px] text-neutral-500 dark:text-neutral-400">loading…</div>
      ) : permission === 'unsupported' ? (
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
          this browser doesn’t support web push notifications. try chrome, edge, firefox, or safari 16+.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] font-medium">browser push notifications</div>
                <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {subscribed
                    ? 'this device will get a notification when a high-severity event lands.'
                    : 'turn on to get OS notifications on this device. on iphone, add blupin to your home screen first.'}
                </div>
              </div>
              {subscribed ? (
                <button
                  type="button"
                  onClick={disablePush}
                  disabled={busy}
                  className="shrink-0 px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-[13px] hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors disabled:opacity-40"
                >
                  turn off on this device
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enablePush}
                  disabled={busy || permission === 'denied'}
                  className="shrink-0 px-3 py-1.5 rounded-md bg-neutral-900 dark:bg-neutral-200 text-white dark:text-neutral-900 text-[13px] font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {permission === 'denied' ? 'blocked in browser' : 'enable on this device'}
                </button>
              )}
            </div>
            {permission === 'denied' && (
              <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-3">
                notifications are blocked for this site. open your browser’s site settings, allow notifications for blupin, then refresh.
              </div>
            )}
            {subscribed && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={sendTest}
                  className="text-[12px] underline text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  send test notification
                </button>
                {testStatus && (
                  <span className="text-[12px] text-neutral-500 dark:text-neutral-400">{testStatus}</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => {
                  const v = e.target.checked;
                  setEnabled(v);
                  savePrefs({ web_push_enabled: v });
                }}
                className="w-4 h-4 accent-neutral-900 dark:accent-neutral-200"
              />
              <span className="text-[13px]">push notifications enabled</span>
            </label>

            <div>
              <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-1.5">
                minimum severity to ping me ({minSeverity}/10)
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={minSeverity}
                onChange={(e) => setMinSeverity(parseInt(e.target.value, 10))}
                onMouseUp={() => savePrefs({ min_severity: minSeverity })}
                onTouchEnd={() => savePrefs({ min_severity: minSeverity })}
                className="w-full max-w-sm accent-neutral-900 dark:accent-neutral-200"
              />
              <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
                {minSeverity >= 9
                  ? 'only the most urgent threats — drop-everything territory.'
                  : minSeverity >= 7
                  ? 'real threats only. recommended for most founders.'
                  : minSeverity >= 5
                  ? 'every relevant move, including watch-list updates.'
                  : 'noisy — you’ll get pinged for nearly everything.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
