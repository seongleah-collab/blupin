'use client';

import Wordmark from '@/app/components/Wordmark';

export type ConversationListItem = {
  id: string;
  title: string | null;
  updated_at: string;
};

function formatGroup(updatedAt: string): string {
  const d = new Date(updatedAt);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return 'today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'yesterday';
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return 'previous 7 days';
  if (diffDays < 30) return 'previous 30 days';
  return 'older';
}

const GROUP_ORDER = ['today', 'yesterday', 'previous 7 days', 'previous 30 days', 'older'];

export default function Sidebar({
  conversations,
  activeId,
  collapsed,
  onToggle,
  onNewChat,
  onSelect,
  onDelete,
}: {
  conversations: ConversationListItem[];
  activeId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (collapsed) {
    return (
      <aside className="h-screen w-12 border-r border-neutral-200 bg-neutral-50 flex flex-col items-center py-4 gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggle}
          aria-label="open sidebar"
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-neutral-200 text-neutral-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onNewChat}
          aria-label="new chat"
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-neutral-200 text-neutral-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </aside>
    );
  }

  const grouped = new Map<string, ConversationListItem[]>();
  for (const c of conversations) {
    const g = formatGroup(c.updated_at);
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(c);
  }

  return (
    <aside className="h-screen w-64 border-r border-neutral-200 bg-neutral-50 flex flex-col shrink-0">
      <div className="px-3 py-3 flex items-center justify-between">
        <Wordmark className="text-base font-medium tracking-tight text-neutral-900 px-2" />
        <button
          type="button"
          onClick={onToggle}
          aria-label="collapse sidebar"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-200 text-neutral-500"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-neutral-800 hover:bg-neutral-200 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          new chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <div className="px-3 py-6 text-[12px] text-neutral-400 text-center">
            no past chats yet
          </div>
        ) : (
          GROUP_ORDER.filter((g) => grouped.has(g)).map((g) => (
            <div key={g} className="mt-3 first:mt-1">
              <div className="px-3 pb-1 text-[11px] uppercase tracking-wide text-neutral-400">
                {g}
              </div>
              <ul>
                {grouped.get(g)!.map((c) => {
                  const isActive = c.id === activeId;
                  return (
                    <li key={c.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => onSelect(c.id)}
                        className={`w-full text-left pl-3 pr-8 py-2 rounded-lg text-[13px] truncate transition-colors ${
                          isActive
                            ? 'bg-neutral-200 text-neutral-900'
                            : 'text-neutral-700 hover:bg-neutral-200/70'
                        }`}
                        title={c.title ?? 'untitled chat'}
                      >
                        {c.title ?? 'untitled chat'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('delete this chat?')) onDelete(c.id);
                        }}
                        aria-label="delete chat"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-neutral-300/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}
