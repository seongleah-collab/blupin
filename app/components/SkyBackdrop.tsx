import Image from 'next/image';

export default function SkyBackdrop() {
  return (
    <div className="fixed inset-0 -z-10">
      <Image src="/sky.jpg" alt="" fill priority className="object-cover" />
      {/* punch up the saturation toward a brighter sky-blue */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300/30 via-sky-200/10 to-sky-100/20 mix-blend-soft-light" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/15 via-transparent to-sky-200/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(186,230,253,0.45),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-sky-900/10" />
    </div>
  );
}
