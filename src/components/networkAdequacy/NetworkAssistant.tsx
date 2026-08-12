'use client';

/**
 * Network Adequacy analyst copilot (increment NA-5).
 *
 * Conversational assistant for a payer/state analyst: ask to analyze or validate
 * network adequacy, get grounded answers from the engine (via the BFF), and
 * follow suggested next steps. Deterministic -- works with no API key.
 */
import { useState } from 'react';
import { postJson } from '@/lib/client/bff';

interface AssistantResponse {
  intent: string;
  text: string;
  suggestions?: string[];
  visualizationUpdates?: { focusState?: string; focusCounties?: string[] };
}

interface Msg {
  role: 'user' | 'assistant';
  text: string;
  intent?: string;
}

const STARTERS = [
  "Show the Medicaid pediatric baseline for Maria's state",
  'Prioritize the worst behavioral-health gaps in South Dakota',
  'Validate Oglala Lakota Pediatrics Medicaid against CMS standards',
  'Recommend augmentation for Fulton Mental Health Medicaid',
];

export function NetworkAssistant({
  defaultState,
  onFocus,
}: {
  defaultState?: string;
  onFocus?: (u: { focusState?: string; focusCounties?: string[] }) => void;
}): React.ReactElement {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  async function send(query: string): Promise<void> {
    const q = query.trim();
    if (!q || sending) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setSending(true);
    const r = await postJson<AssistantResponse>('/api/network-adequacy', {
      query: q,
      defaultState,
    });
    if (r.ok && r.data) {
      setMessages((m) => [...m, { role: 'assistant', text: r.data!.text, intent: r.data!.intent }]);
      if (r.data.visualizationUpdates && onFocus) onFocus(r.data.visualizationUpdates);
      setSuggestions(r.data.suggestions ?? []);
    } else {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: r.error?.issue?.[0]?.diagnostics ?? 'The assistant could not answer that.',
        },
      ]);
    }
    setSending(false);
  }

  const [suggestions, setSuggestions] = useState<string[]>([]);

  return (
    <section
      className="flex flex-col rounded-lg border border-slate-300"
      aria-label="Network adequacy assistant"
    >
      <header className="border-b border-slate-200 p-3">
        <h2 className="text-sm font-semibold">Network Adequacy Copilot</h2>
        <p className="text-xs text-slate-500">
          Ask to analyze or validate adequacy. Answers are grounded in the engine; recommendations
          are human-gated.
        </p>
      </header>

      <div className="max-h-96 space-y-3 overflow-y-auto p-3" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Try one of these:</p>
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="block w-full rounded border border-slate-200 p-2 text-left text-sm text-blue-700 hover:bg-slate-50"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
              <span
                className={`inline-block whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                {m.text}
              </span>
            </div>
          ))
        )}
        {sending ? <p className="text-xs text-slate-400">Analyzing...</p> : null}
      </div>

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 p-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-blue-700 hover:bg-slate-50"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="flex gap-2 border-t border-slate-200 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
          placeholder="Ask about network adequacy..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Ask the network adequacy assistant"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
