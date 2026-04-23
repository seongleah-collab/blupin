import Link from 'next/link';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

type NavLink = { href: string; label: string };

const defaultLinks: NavLink[] = [
  { href: '/#how-it-works', label: 'how it works' },
  { href: '/#about', label: 'about' },
  { href: '/faq', label: 'faq' },
  { href: '/waitlist', label: 'join waitlist' },
];

export default function SiteNav({ links = defaultLinks }: { links?: NavLink[] }) {
  return (
    <nav className={`${inter.className} absolute top-0 left-0 right-0 z-50 w-full`}>
      <div className="w-full px-8 sm:px-12 py-6 flex items-center gap-10">
        <Link
          href="/"
          className="text-2xl font-medium lowercase tracking-tight text-white font-['Times_New_Roman'] drop-shadow-sm"
        >
          blupin<span className="text-blue-300">.</span>
        </Link>

        <div className="hidden sm:flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base text-white/90 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
