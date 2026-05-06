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
  title: 'terms · blupin',
  description: 'the agreement between you and blupin.',
};

export default function TermsPage() {
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
          terms.
        </h1>
        <p className="text-base text-neutral-600 leading-relaxed mb-12 max-w-2xl">
          plain-english terms for using blupin. by signing up you agree to these. if you don’t, don’t use the product.
        </p>

        <Section title="what blupin is">
          <p>blupin is an ai-powered competitive intelligence tool. we watch public sources (product hunt, hacker news, reddit, and similar) and surface launches and updates that may affect your product. we are not a research firm, a legal advisor, or a financial advisor — our outputs are guidance, not professional advice.</p>
        </Section>

        <Section title="your account">
          <ul className="space-y-2">
            <li>you’re responsible for keeping your password (or your linked google account) secure.</li>
            <li>one account per person. don’t share credentials.</li>
            <li>you must be old enough to enter a binding contract in your jurisdiction. if you’re a minor, a parent or guardian must agree on your behalf.</li>
            <li>tell us if you suspect your account has been accessed without your permission.</li>
          </ul>
        </Section>

        <Section title="acceptable use">
          <p>don’t:</p>
          <ul className="space-y-2 mt-2">
            <li>resell, sub-license, or redistribute the product or its outputs without permission.</li>
            <li>scrape, reverse-engineer, or attempt to disrupt the service.</li>
            <li>use blupin to harass, defame, or impersonate any person or company.</li>
            <li>use the product for anything illegal.</li>
          </ul>
          <p className="mt-3">we may suspend or terminate accounts that violate these rules.</p>
        </Section>

        <Section title="ai outputs">
          <p>blupin uses large language models to score and respond. these models can be wrong, biased, or out of date. you should verify anything important before acting on it. we don’t guarantee that outputs are accurate, complete, or timely, and we’re not liable for decisions you make based on them.</p>
        </Section>

        <Section title="subscriptions and billing">
          <ul className="space-y-2">
            <li>paid plans start with a 7-day free trial. you’ll need to enter a payment method to begin.</li>
            <li>at the end of the trial, your card is charged the listed monthly price unless you cancel first.</li>
            <li>you can cancel anytime from <Link href="/settings/account" className="underline underline-offset-2">settings</Link>. cancellation takes effect at the end of the current billing period.</li>
            <li>we don’t offer refunds for partial months unless required by law.</li>
            <li>prices may change with at least 30 days notice for existing subscribers.</li>
          </ul>
        </Section>

        <Section title="service availability">
          <p>blupin is provided “as is.” we aim for high uptime but we don’t guarantee any particular availability or response time. we may change, suspend, or discontinue parts of the product at any time.</p>
        </Section>

        <Section title="your content">
          <p>your company description, competitor list, and chat messages remain yours. you grant us a limited license to use them to operate the service for you (e.g., to send your messages to our ai model and to display your data back to you). we don’t train models on your data and we don’t use it to advertise to anyone.</p>
        </Section>

        <Section title="termination">
          <p>you can stop using blupin at any time. we may suspend or close accounts that violate these terms or that pose a risk to the service or other users. on termination, we stop billing you and remove your access; data deletion follows the timeline in our <Link href="/privacy" className="underline underline-offset-2">privacy policy</Link>.</p>
        </Section>

        <Section title="limitation of liability">
          <p>to the fullest extent allowed by law, blupin and its operators are not liable for indirect, incidental, or consequential damages, or for lost profits, lost data, or business interruption arising out of your use of the product. our total liability for any claim is limited to the amount you paid us in the 12 months before the claim.</p>
        </Section>

        <Section title="changes to these terms">
          <p>we may update these terms over time. for material changes, we’ll notify you by email and update the date at the top. continuing to use blupin after a change means you accept the new terms.</p>
        </Section>

        <Section title="contact">
          <p>questions about these terms: <a href="mailto:hi@blupin.app" className="underline underline-offset-2">hi@blupin.app</a>.</p>
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
