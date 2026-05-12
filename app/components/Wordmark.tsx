import { Fraunces } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function Wordmark({
  className = '',
  dotClassName = 'text-blue-500',
}: {
  className?: string;
  dotClassName?: string;
}) {
  return (
    <span className={`${fraunces.className} ${className}`}>
      blupin<span className={dotClassName}>.</span>
    </span>
  );
}
