'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboardData } from '@/lib/data-context';
import {
  getRevenueLastWeek,
  getMostExpensiveSupplier,
  getChickenOrderRecommendation,
  getMonthComparison,
  getTopMenuItems,
  type ChatAnswer,
} from '@/lib/ai-insights';
import AIBadge from './AIBadge';
import { SparkleIcon } from './icons';

interface Message {
  role: 'user' | 'ai';
  content: string;
  highlights?: ChatAnswer['highlights'];
}

const SUGGESTED_QUESTIONS = [
  { label: 'Revenue last week?', key: 'revenue_week' },
  { label: 'Most expensive supplier?', key: 'top_supplier' },
  { label: 'Chicken order needed?', key: 'chicken_order' },
  { label: 'This month vs last?', key: 'month_compare' },
  { label: 'Top menu items?', key: 'top_menu' },
];

function computeAnswer(key: string, data: NonNullable<ReturnType<typeof useDashboardData>['data']>): ChatAnswer {
  switch (key) {
    case 'revenue_week': return getRevenueLastWeek(data);
    case 'top_supplier': return getMostExpensiveSupplier(data);
    case 'chicken_order': return getChickenOrderRecommendation(data);
    case 'month_compare': return getMonthComparison(data);
    case 'top_menu': return getTopMenuItems(data);
    default: return { text: 'I can help you analyze your business data. Try one of the suggested questions!' };
  }
}

export default function AIChatPanel({ onClose }: { onClose: () => void }) {
  const { data } = useDashboardData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleQuestion = (label: string, key: string) => {
    if (!data || typing) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: label }]);
    setTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const answer = computeAnswer(key, data);
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: answer.text, highlights: answer.highlights },
      ]);
      setTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[520px] bg-white rounded-2xl shadow-2xl z-[60] flex flex-col overflow-hidden ai-chat-panel">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
      >
        <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
          <SparkleIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">AI Assistant</span>
            <span className="px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-semibold text-white">BETA</span>
          </div>
          <p className="text-[10px] text-white/70">Powered by your business data</p>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
            >
              <SparkleIcon className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-semibold text-navy mb-1">Ask me about your business</p>
            <p className="text-[11px] text-gray-400 max-w-[250px]">
              I analyze your real-time data to provide instant answers about revenue, expenses, inventory, and more.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div
                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mr-2 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
              >
                <SparkleIcon className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={`max-w-[280px] rounded-2xl px-3.5 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary/10 text-navy'
                  : 'bg-gray-50 text-gray-700'
              }`}
            >
              <p className="text-xs leading-relaxed">{msg.content}</p>
              {msg.highlights && msg.highlights.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.highlights.map((h, j) => (
                    <div key={j} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                      <span className="text-[10px] text-gray-500">{h.label}</span>
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: h.color || '#1B2559' }}
                      >
                        {h.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div
              className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mr-2"
              style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
            >
              <SparkleIcon className="w-3 h-3 text-white" />
            </div>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-400 ai-typing-dot" />
              <span className="w-2 h-2 rounded-full bg-gray-400 ai-typing-dot" />
              <span className="w-2 h-2 rounded-full bg-gray-400 ai-typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      <div className="px-4 py-2 border-t border-gray-100 flex-shrink-0">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q.key}
              onClick={() => handleQuestion(q.label, q.key)}
              disabled={typing || !data}
              className="px-2.5 py-1 border border-primary/20 text-primary text-[10px] font-medium rounded-full hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {q.label}
            </button>
          ))}
        </div>
        {/* Disabled input (visual only) */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <input
            type="text"
            placeholder="Ask about your business data..."
            disabled
            className="flex-1 bg-transparent text-xs text-gray-400 placeholder-gray-300 outline-none cursor-not-allowed"
          />
          <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
