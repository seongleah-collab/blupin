'use client';

import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Fraunces } from 'next/font/google';
import { createClient } from '@/lib/supabase/client';
import Wordmark from '@/app/components/Wordmark';
import ThemeQuickToggle from '@/app/components/ThemeQuickToggle';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar, { ConversationListItem, SidebarUser } from './Sidebar';
import { severityHue } from '@/lib/severity';

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
});

type Message = { role: 'user' | 'assistant'; content: string };

function nameFromEmail(email: string | undefined | null): string {
  if (!email) return '';
  const local = email.split('@')[0] || '';
  const first = local.split(/[._-]/)[0] || local;
  return first.toLowerCase();
}

function renderInlineBold(text: string, keyStart: number): { nodes: React.ReactNode[]; nextKey: number } {
  const nodes: React.ReactNode[] = [];
  const regex = /\*\*([^*\n]+?)\*\*/g;
  let lastIndex = 0;
  let key = keyStart;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    nodes.push(
      <strong key={key++} className="font-semibold text-neutral-900 dark:text-neutral-50">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return { nodes, nextKey: key };
}

function renderAssistantContent(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\[severity:(\d+)\]\s*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const { nodes, nextKey } = renderInlineBold(content.slice(lastIndex, match.index), key);
      parts.push(...nodes);
      key = nextKey;
    }
    const n = parseInt(match[1], 10);
    const hue = severityHue(n);
    parts.push(
      <span
        key={key++}
        className="inline-flex items-center gap-1.5 align-middle mr-2 px-2.5 py-1 rounded-full border"
        style={{
          backgroundColor: `hsla(${hue}, 88%, 52%, 0.1)`,
          borderColor: `hsla(${hue}, 88%, 52%, 0.3)`,
        }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{
            backgroundColor: `hsl(${hue}, 88%, 52%)`,
            boxShadow: `0 0 8px hsla(${hue}, 88%, 52%, 0.8)`,
          }}
          aria-hidden
        />
        <span
          className="text-[11px] font-semibold tabular-nums tracking-wide"
          style={{ color: `hsl(${hue}, 70%, 32%)` }}
        >
          {n}/10
        </span>
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    const { nodes } = renderInlineBold(content.slice(lastIndex), key);
    parts.push(...nodes);
  }
  return parts.length > 0 ? parts : [content];
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'late night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'late night';
}

export default function ChatPage() {
  // useSearchParams() requires a Suspense boundary during static
  // generation in Next 15+ — without it the build bails out. wrap
  // the inner client tree so prerender succeeds.
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-white dark:bg-black" />}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      // swallow — sidebar just stays as-is
    }
  }, []);

  useEffect(() => {
    setGreeting(timeGreeting());
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserEmail(user.email ?? null);
      const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
      const metaName = (meta.full_name || meta.name || '').split(' ')[0]?.toLowerCase();
      setFirstName(metaName || nameFromEmail(user.email));
      const { data } = await supabase
        .from('user_companies')
        .select('company_name')
        .eq('id', user.id)
        .single();
      if (data?.company_name) setCompanyName(data.company_name);
    });
    refreshConversations();

    fetch('/api/chat/suggestions')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(data.suggestions.slice(0, 3));
        }
      })
      .catch(() => {});
  }, [refreshConversations]);

  useEffect(() => {
    // deep-link from /feed: ?event=<id> pre-fills the textarea with a
    // contextual question pulled from the event so the founder can
    // edit and send. we strip the param afterward so refresh doesn't
    // overwrite their in-progress draft.
    const eventId = searchParams.get('event');
    if (!eventId) return;
    let cancelled = false;
    fetch(`/api/events?id=${encodeURIComponent(eventId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.event) return;
        const e = data.event as { potential_competitor_name: string | null; title: string; source: string };
        const who = e.potential_competitor_name || 'this competitor';
        const cleanTitle = e.title.replace(/^r\/[A-Za-z0-9_]+\s*[:\-–—|·]?\s*/i, '').trim();
        setInput(`what should i do about ${who}'s "${cleanTitle}" — saw it on ${e.source}.`);
        textareaRef.current?.focus();
        const url = new URL(window.location.href);
        url.searchParams.delete('event');
        window.history.replaceState({}, '', url.toString());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  function startNewChat() {
    if (isStreaming) return;
    setActiveConvoId(null);
    setMessages([]);
    setInput('');
  }

  async function loadConversation(id: string) {
    if (isStreaming || id === activeConvoId) return;
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setActiveConvoId(id);
      setMessages(
        (data.messages ?? []).map((m: { role: 'user' | 'assistant'; content: string }) => ({
          role: m.role,
          content: m.content,
        }))
      );
    } catch {
      // ignore
    }
  }

  async function deleteConversation(id: string) {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvoId === id) {
        setActiveConvoId(null);
        setMessages([]);
      }
    } catch {
      // ignore
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          conversationId: activeConvoId,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`request failed: ${res.status}`);
      }

      const returnedConvoId = res.headers.get('X-Conversation-Id');
      if (returnedConvoId && returnedConvoId !== activeConvoId) {
        setActiveConvoId(returnedConvoId);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: next[next.length - 1].content + text,
          };
          return next;
        });
      }
    } catch (err: any) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: `[error: ${err.message}]`,
        };
        return next;
      });
    } finally {
      setIsStreaming(false);
      refreshConversations();
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  const composer = (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative w-full rounded-3xl glass-pill-card transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ask blupin…"
          disabled={isStreaming}
          rows={1}
          className="w-full resize-none bg-transparent px-5 pt-4 pb-14 text-[15px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none disabled:opacity-60 leading-relaxed"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          aria-label="send"
          className="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-neutral-900 dark:bg-neutral-200 text-white dark:text-neutral-900 flex items-center justify-center hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </button>
      </div>
    </form>
  );

  return (
    <div className="relative flex h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 overflow-hidden">
      <div aria-hidden className="glass-ambient">
        <span className="orb" />
      </div>

      <div className="relative z-10 flex flex-1 min-w-0">
      <style>{`
        @keyframes blu-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blu-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes blu-typing {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40%           { opacity: 1;    transform: translateY(-2px); }
        }
        .blu-msg       { animation: blu-fade-up 0.45s ease-out both; }
        .blu-pane      { animation: blu-fade-up 0.6s  ease-out both; }
        .blu-pane-soft { animation: blu-fade-in 0.4s  ease-out both; }
        .blu-dot       { animation: blu-typing 1.2s ease-in-out infinite both; }
      `}</style>

      <Sidebar
        conversations={conversations}
        activeId={activeConvoId}
        collapsed={sidebarCollapsed}
        user={{ email: userEmail, displayName: firstName || null } satisfies SidebarUser}
        activeView="chat"
        onToggle={() => setSidebarCollapsed((v) => !v)}
        onNewChat={startNewChat}
        onSelect={loadConversation}
        onDelete={deleteConversation}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-4 flex items-center justify-between">
          {sidebarCollapsed ? (
            <Wordmark className="text-base font-medium tracking-tight text-neutral-900 dark:text-neutral-100" />
          ) : (
            <span />
          )}
          <ThemeQuickToggle />
        </header>

        {isEmpty ? (
          <main className="flex-1 flex flex-col items-center justify-center px-6 blu-pane">
            <div className="w-full max-w-2xl flex flex-col items-center text-center">
              <h1 className="text-4xl md:text-5xl text-neutral-900 dark:text-neutral-100 leading-tight mb-4">
                {greeting && (
                  <>
                    good {greeting},{' '}
                    <span className={`${fraunces.className} italic font-medium`}>
                      {firstName || 'founder'}
                    </span>
                    .
                  </>
                )}
              </h1>
              <p className="text-base text-neutral-500 dark:text-neutral-400 mb-10 max-w-md leading-relaxed">
                {companyName
                  ? <>here&apos;s what&apos;s moving in <span className="text-neutral-700 dark:text-neutral-200 font-medium">{companyName}</span>&apos;s space — ask me anything.</>
                  : <>here&apos;s what&apos;s moving in your space — ask me anything.</>}
              </p>
              <div className="w-full">{composer}</div>
              <div className="mt-8 flex flex-wrap gap-2 justify-center">
                {(suggestions ?? [
                  'what should i pay attention to today?',
                  companyName ? `who's the biggest threat to ${companyName}?` : "who's the biggest threat this week?",
                  'what did my competitors ship recently?',
                ]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    disabled={isStreaming}
                    className="px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-[13px] text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </main>
        ) : (
          <>
            <main className="flex-1 overflow-y-auto blu-pane-soft">
              <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
                {messages.map((m, i) => {
                  const isAssistantStreamingNow =
                    m.role === 'assistant' && !m.content && isStreaming && i === messages.length - 1;
                  return (
                    <div
                      key={i}
                      className={`blu-msg ${
                        m.role === 'user'
                          ? 'ml-auto bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-4 py-2.5 rounded-2xl max-w-[85%] w-fit'
                          : 'text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed'
                      }`}
                    >
                      {isAssistantStreamingNow ? (
                        <span className="inline-flex items-center gap-1.5 py-1.5">
                          <span className="blu-dot w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '0s' }} />
                          <span className="blu-dot w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '0.15s' }} />
                          <span className="blu-dot w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '0.3s' }} />
                        </span>
                      ) : m.role === 'assistant' ? (
                        renderAssistantContent(m.content)
                      ) : (
                        m.content
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </main>

            <div>
              <div className="max-w-2xl mx-auto px-6 pb-6 pt-2">{composer}</div>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
