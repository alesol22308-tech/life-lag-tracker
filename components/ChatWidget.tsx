'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { useTranslations } from 'next-intl';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

const CHAT_OPEN_KEY = 'life-lag-chat-open';

export default function ChatWidget() {
  const t = useTranslations('chat');
  const isOnline = useOnlineStatus();
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
  } = useChat({
    api: '/api/chat',
  });

  useEffect(() => {
    const stored = sessionStorage.getItem(CHAT_OPEN_KEY);
    if (stored !== null) {
      setOpen(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CHAT_OPEN_KEY, JSON.stringify(open));
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleOpen = () => setOpen((prev) => !prev);

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-[400px] z-[100] flex flex-col rounded-2xl border border-cardBorder bg-card shadow-glowSm backdrop-blur-sm max-h-[70vh]"
          role="dialog"
          aria-label={t('title')}
        >
          <div className="flex items-center justify-between p-3 border-b border-cardBorder">
            <h2 className="text-lg font-semibold text-text0">{t('title')}</h2>
            <button
              type="button"
              onClick={toggleOpen}
              className="p-2 rounded-lg text-text1 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
              aria-label={t('close')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!isOnline ? (
            <div className="p-4 text-center text-text2 text-sm">{t('offline')}</div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
                {messages.length === 0 && (
                  <p className="text-text2 text-sm">{t('placeholder')}</p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        m.role === 'user'
                          ? 'bg-black/10 dark:bg-white/10 text-text0'
                          : 'bg-black/5 dark:bg-white/5 text-text1 border border-cardBorder'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {typeof m.content === 'string'
                          ? m.content
                          : Array.isArray(m.content)
                            ? (m.content as { type: string; text?: string }[]).map((part) => (part.type === 'text' ? part.text : null)).filter(Boolean).join('')
                            : ''}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-2 bg-black/5 dark:bg-white/5 border border-cardBorder text-text2 text-sm">
                      {t('loading')}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div className="px-4 pb-2">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error.message || t('error')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    className="text-xs underline text-text2 mt-1"
                  >
                    {t('retry')}
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-3 border-t border-cardBorder">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder={t('inputPlaceholder')}
                    disabled={!isOnline || isLoading}
                    className="flex-1 rounded-xl border border-cardBorder bg-bg0 px-4 py-2.5 text-text0 text-sm placeholder:text-text2 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!isOnline || isLoading || !input.trim()}
                    className="rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 text-text0 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 disabled:opacity-50"
                  >
                    {t('send')}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 z-[99] w-14 h-14 rounded-full bg-card border border-cardBorder shadow-glowSm flex items-center justify-center text-text0 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
        aria-label={open ? t('close') : t('title')}
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </>
  );
}
