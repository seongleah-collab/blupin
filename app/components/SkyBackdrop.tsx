import Image from 'next/image';

export default function SkyBackdrop() {
  return (
    <div className="fixed inset-0 -z-10">
      <Image src="/sky.jpg" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/50 via-purple-300/30 to-blue-200/40 mix-blend-soft-light" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-purple-500/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(199,210,254,0.35),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-indigo-950/15" />
    </div>
  );
}
