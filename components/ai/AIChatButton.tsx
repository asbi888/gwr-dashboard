'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { SparkleIcon } from './icons';
import AIChatPanel from './AIChatPanel';

export default function AIChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center z-[60] transition-all duration-300 shadow-lg ${
          open ? 'rotate-45 scale-90' : 'ai-chat-pulse hover:scale-110'
        }`}
        style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
        title="AI Assistant"
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <SparkleIcon className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Chat panel portal */}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[55]"
              onClick={() => setOpen(false)}
            />
            <AIChatPanel onClose={() => setOpen(false)} />
          </>,
          document.body
        )}
    </>
  );
}
