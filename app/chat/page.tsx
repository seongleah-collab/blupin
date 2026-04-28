'use client';

import { useState, useRef, useEffect } from 'react';
import { Fraunces } from 'next/font/google';
import { createClient } from '@/lib/supabase/client';

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

function severityColor(n: number): string {
  const clamped = Math.max(1, Math.min(10, n));
  // hsl hue: 50 (yellow) at 1 → 0 (red) at 10
  const hue = 50 - ((clamped - 1) * 50) / 9;
  return `hsl(${hue}, 88%, 50%)`;
}

function renderAssistantContent(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\[severity:(\d+)\]\s*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
    }
    const n = parseInt(match[1], 10);
    parts.push(
      <span key={key++} className="inline-flex items-center gap-2 align-middle mr-1">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: severityColor(n), boxShadow: `0 0 8px ${severityColor(n)}55` }}
          aria-hidden
        />
        <span className="text-[12px] font-semibold text-neutral-700 tabular-nums">{n}/10</span>
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [greeting, setGreeting] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setGreeting(timeGreeting());
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
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
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

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
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`request failed: ${res.status}`);
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
    <form
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="relative w-full rounded-3xl border border-neutral-200 bg-white shadow-[0_2px_24px_-12px_rgba(0,0,0,0.15)] focus-within:border-neutral-400 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ask blupin…"
          disabled={isStreaming}
          rows={1}
          className="w-full resize-none bg-transparent px-5 pt-4 pb-14 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:opacity-60 leading-relaxed"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          aria-label="send"
          className="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
    <div className="flex flex-col h-screen bg-white text-neutral-900">
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

      <header className="px-6 py-4 flex items-center">
        <span className="text-sm font-semibold tracking-tight text-neutral-900">blupin</span>
      </header>

      {isEmpty ? (
        <main className="flex-1 flex flex-col items-center justify-center px-6 blu-pane">
          <div className="w-full max-w-2xl flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl text-neutral-900 leading-tight mb-4">
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
            <p className="text-base text-neutral-500 mb-10 max-w-md leading-relaxed">
              {companyName
                ? <>here&apos;s what&apos;s moving in <span className="text-neutral-700 font-medium">{companyName}</span>&apos;s space — ask me anything.</>
                : <>here&apos;s what&apos;s moving in your space — ask me anything.</>}
            </p>
            <div className="w-full">{composer}</div>
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              {[
                'what should i pay attention to today?',
                companyName ? `who's the biggest threat to ${companyName}?` : "who's the biggest threat this week?",
                'what did my competitors ship recently?',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  disabled={isStreaming}
                  className="px-4 py-2 rounded-full border border-neutral-200 text-[13px] text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        ? 'ml-auto bg-neutral-100 text-neutral-900 px-4 py-2.5 rounded-2xl max-w-[85%] w-fit'
                        : 'text-neutral-900 whitespace-pre-wrap leading-relaxed'
                    }`}
                  >
                    {isAssistantStreamingNow ? (
                      <span className="inline-flex items-center gap-1.5 py-1.5">
                        <span className="blu-dot w-1.5 h-1.5 rounded-full bg-neutral-400" style={{ animationDelay: '0s' }} />
                        <span className="blu-dot w-1.5 h-1.5 rounded-full bg-neutral-400" style={{ animationDelay: '0.15s' }} />
                        <span className="blu-dot w-1.5 h-1.5 rounded-full bg-neutral-400" style={{ animationDelay: '0.3s' }} />
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

          <div className="bg-white">
            <div className="max-w-2xl mx-auto px-6 pb-6 pt-2">{composer}</div>
          </div>
        </>
      )}
    </div>
  );
}
