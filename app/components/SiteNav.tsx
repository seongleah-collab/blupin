import Link from 'next/link';
import { Inter } from 'next/font/google';
import Wordmark from './Wordmark';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

type NavLink = { href: string; label: string };

const defaultLinks: NavLink[] = [
  { href: '/#how-it-works', label: 'how it works' },
  { href: '/pricing', label: 'pricing' },
  { href: '/#about', label: 'about' },
  { href: '/faq', label: 'faq' },
  { href: '/waitlist', label: 'join waitlist' },
];

export default function SiteNav({
  links = defaultLinks,
  rightLink,
}: {
  links?: NavLink[];
  rightLink?: NavLink;
}) {
  return (
    <nav className={`${inter.className} absolute top-0 left-0 right-0 z-50 w-full`}>
      <div className="w-full px-8 sm:px-12 py-6 flex items-center gap-10">
        <Link
          href="/"
          className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        >
          <Wordmark className="text-2xl font-medium tracking-tight" dotClassName="text-blue-200" />
        </Link>

        <div className="hidden sm:flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-medium text-white hover:text-white transition-colors drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {rightLink && (
          <Link
            href={rightLink.href}
            className="ml-auto px-5 py-2 rounded-full border border-white/60 text-base font-medium text-white hover:bg-white/15 transition-colors backdrop-blur-sm drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]"
          >
            {rightLink.label}
          </Link>
        )}
      </div>
    </nav>
  );
}
