import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Cpu } from 'lucide-react';
import { api } from './api';

const START = [
  'What should I do next?',
  'Which documents are missing?',
  'Where is my application?',
  'Why do I need these approvals?',
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(START);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hello! I am your Avyra approval assistant. How can I help you today?' },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setMessages((m) => [...m, { from: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api('/assistant/chat', { method: 'POST', body: { message: msg } });
      setMessages((m) => [...m, { from: 'bot', text: res.reply }]);
      setSuggestions(res.suggestions || []);
    } catch (err) {
      setMessages((m) => [...m, { from: 'bot', text: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-[100] w-[calc(100vw-2rem)] sm:w-96 h-[32rem] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-emerald-900/10 flex flex-col overflow-hidden">
          <div className="bg-emerald-900 text-white px-4 py-3 flex items-center gap-2">
            <Cpu className="size-5 text-emerald-300" />
            <div>
              <p className="text-sm font-bold leading-tight">AI Approval Assistant</p>
              <p className="text-[11px] text-emerald-200/80">Demo AI &middot; answers from your data</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#f4faf6]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.from === 'user'
                      ? 'bg-emerald-800 text-white rounded-br-sm'
                      : 'bg-white text-emerald-950 border border-emerald-900/10 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-emerald-900/10 px-3 py-2 rounded-2xl text-sm text-emerald-900/60">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {suggestions.length > 0 && (
            <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-emerald-900/10 bg-white">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-1 transition disabled:opacity-60"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 p-3 border-t border-emerald-900/10 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about approvals, documents..."
              className="flex-1 h-10 px-3 rounded-lg border border-emerald-900/15 text-sm outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="size-10 flex items-center justify-center rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-4 sm:right-6 z-[100] size-14 rounded-full bg-emerald-800 text-white shadow-xl hover:bg-emerald-900 transition flex items-center justify-center"
        aria-label="Open assistant"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}