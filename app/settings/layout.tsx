import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Wordmark from '@/app/components/Wordmark';
import SettingsNav from './_components/SettingsNav';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="px-6 py-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
        <Link href="/chat" className="flex items-center gap-2">
          <Wordmark className="text-base font-medium tracking-tight text-neutral-900 dark:text-neutral-100" />
        </Link>
        <Link
          href="/chat"
          className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          back to chat
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl mb-2 leading-tight">
          your settings
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-[14px]">
          update what blupin knows about you and who you&apos;re watching.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-12">
          <SettingsNav />
          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}
