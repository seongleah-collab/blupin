'use client';

import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    // Add empty assistant message we'll stream into
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

  return (
    <div className="flex flex-col h-screen bg-[#fafaf9] text-neutral-900">
      <header className="px-6 py-4 border-b border-neutral-200">
        <h1 className="text-lg font-medium">blupin</h1>
        <p className="text-xs text-neutral-500">your competitive intelligence co-pilot</p>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="text-neutral-500 text-sm leading-relaxed">
              <p className="mb-3">hey. ask me anything about your competitive landscape.</p>
              <p className="mb-1 text-xs uppercase tracking-wide text-neutral-400">try:</p>
              <ul className="space-y-1">
                <li>— what&apos;s the biggest threat this week?</li>
                <li>— tell me about the most relevant competitor</li>
                <li>— what should I pay attention to?</li>
              </ul>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`${
                m.role === 'user'
                  ? 'ml-auto bg-neutral-900 text-white px-4 py-2.5 rounded-2xl max-w-[85%] w-fit'
                  : 'text-neutral-800 whitespace-pre-wrap leading-relaxed'
              }`}
            >
              {m.content || (m.role === 'assistant' && isStreaming ? '…' : '')}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </main>

      <form onSubmit={handleSubmit} className="border-t border-neutral-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ask blupin…"
            disabled={isStreaming}
            className="flex-1 bg-neutral-100 rounded-full px-5 py-2.5 text-sm outline-none focus:bg-neutral-200 transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="bg-neutral-900 text-white rounded-full px-5 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            send
          </button>
        </div>
      </form>
    </div>
  );
}