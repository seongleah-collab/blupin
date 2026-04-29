export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function Status({ state, error }: { state: SaveState; error: string | null }) {
  if (state === 'saving') return <span className="text-[12px] text-neutral-500">saving…</span>;
  if (state === 'saved') return <span className="text-[12px] text-green-600">saved</span>;
  if (state === 'error') return <span className="text-[12px] text-red-600">{error ?? 'error'}</span>;
  return null;
}

export function SectionHeader({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-5">
      <div>
        <h2 className="text-[15px] font-medium">{title}</h2>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>
      </div>
      {status}
    </header>
  );
}
