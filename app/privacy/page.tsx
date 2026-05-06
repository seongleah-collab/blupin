import Link from 'next/link';
import { Inter, Source_Serif_4 } from 'next/font/google';
import Wordmark from '@/app/components/Wordmark';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

const lastUpdated = 'May 6, 2026';

export const metadata = {
  title: 'privacy · blupin',
  description: 'how blupin handles your data.',
};

export default function PrivacyPage() {
  return (
    <div className={`${inter.className} min-h-dvh bg-neutral-50 text-neutral-900 antialiased tracking-[-0.01em]`}>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-neutral-200/70">
        <div className="max-w-3xl mx-auto h-14 px-5 flex items-center justify-between">
          <Link href="/" aria-label="blupin home" className="flex items-center text-neutral-900">
            <Wordmark className="text-2xl font-medium" dotClassName="text-sky-400" />
          </Link>
          <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900 transition">
            ← back home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-16 sm:py-24">
        <p className="text-sm text-neutral-400 mb-3">last updated · {lastUpdated}</p>
        <h1 className={`${sourceSerif.className} text-4xl sm:text-5xl font-medium tracking-[-0.02em] leading-[1.05] mb-6`}>
          privacy.
        </h1>
        <p className="text-base text-neutral-600 leading-relaxed mb-12 max-w-2xl">
          this is a plain-english summary of what blupin collects, why we collect it, and who else
          touches it. if anything here is unclear, email <a href="mailto:hi@blupin.app" className="underline underline-offset-2">hi@blupin.app</a>.
        </p>

        <Section title="what we collect">
          <ul className="space-y-2">
            <li><strong>account info</strong> — your email address and password (passwords are hashed by our auth provider; we never see them in plain text). if you sign in with google, we also receive your name and profile picture.</li>
            <li><strong>company info you give us</strong> — your company name, a one-line description, and the competitor names you tell us to watch.</li>
            <li><strong>chat history</strong> — messages you send to the blupin co-pilot, so you can pick up where you left off across devices.</li>
            <li><strong>push subscription tokens</strong> — only if you opt in to browser notifications. these let us deliver alerts and contain no personal data on their own.</li>
            <li><strong>billing</strong> — stripe stores your card. we store a stripe customer id, your plan, and your billing status. we never see card numbers.</li>
            <li><strong>basic logs</strong> — request paths, error traces, and timestamps, used to keep the service running.</li>
          </ul>
        </Section>

        <Section title="what we don’t collect">
          <ul className="space-y-2">
            <li>marketing or behavior trackers. there are no third-party analytics scripts on this site.</li>
            <li>your code, files, or anything from your computer.</li>
            <li>data about people who haven’t signed up.</li>
          </ul>
        </Section>

        <Section title="who else touches your data">
          <ul className="space-y-2">
            <li><strong>supabase</strong> — stores your account, company, competitors, and chat history.</li>
            <li><strong>anthropic</strong> — receives your chat messages and competitor context to generate responses. anthropic does not train on api traffic.</li>
            <li><strong>stripe</strong> — handles all payment data.</li>
            <li><strong>vercel</strong> — hosts the app and its logs.</li>
            <li><strong>web push providers (google, apple, mozilla)</strong> — deliver browser notifications you opt into.</li>
          </ul>
          <p className="mt-3">we don’t sell your data, and we don’t share it with anyone outside this list.</p>
        </Section>

        <Section title="cookies">
          <p>we use a small number of cookies for authentication only — they keep you signed in. no advertising, no cross-site tracking.</p>
        </Section>

        <Section title="your rights">
          <p>you can:</p>
          <ul className="space-y-2 mt-2">
            <li>see and edit everything we know about your company in <Link href="/settings" className="underline underline-offset-2">settings</Link>.</li>
            <li>delete your account at any time — email <a href="mailto:hi@blupin.app" className="underline underline-offset-2">hi@blupin.app</a> and we’ll wipe your row from the database within 7 days.</li>
            <li>export your data on request.</li>
          </ul>
        </Section>

        <Section title="changes">
          <p>we’ll update this page when our practices change and revise the date at the top. for material changes, we’ll also email you.</p>
        </Section>

        <Section title="contact">
          <p>questions, bug reports, or data requests: <a href="mailto:hi@blupin.app" className="underline underline-offset-2">hi@blupin.app</a>.</p>
        </Section>
      </main>

      <footer className="px-5 py-10 border-t border-neutral-200/70 bg-white">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-neutral-400">
          <span>© {new Date().getFullYear()} blupin.</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-neutral-700 transition">privacy</Link>
            <Link href="/terms" className="hover:text-neutral-700 transition">terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-6 border-t border-neutral-200/70 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-medium text-neutral-900 mb-3 tracking-[-0.01em]">{title}</h2>
      <div className="text-base text-neutral-600 leading-relaxed">{children}</div>
    </section>
  );
}
