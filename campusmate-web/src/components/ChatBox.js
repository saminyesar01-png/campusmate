import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, AlertCircle, X, MessageSquare, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChatBox({ scheduleData, hasSchedule }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your CampusMate AI assistant. Ask me about your classes today, lab rooms, credits, fee deadlines, or any math and study problems!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll when messages change or while loading
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const suggestedPrompts = [
    'What classes do I have today?',
    'Which room is my lab in?',
    'How many credits do I have?',
    'Solve 2x + 10 = 26',
  ];

  async function handleSend(promptText) {
    const textToSend = (promptText || input).trim();
    if (!textToSend || loading) return;

    setError(null);
    const userMsg = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          schedule: scheduleData,
          clientDate: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get a response.');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || "I couldn't generate an answer. Please try again." },
      ]);
    } catch (err) {
      setError(err.message || 'Network error.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${err.message || 'Error communicating with AI assistant.'}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="floating-chat-container">
      {/* ── 1. Floating Circular Trigger Button ── */}
      {!isOpen && (
        <button
          className="floating-chat-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open CampusMate AI"
        >
          <div className="floating-chat-icon-pulse">
            <Sparkles size={20} />
          </div>
          <span className="floating-chat-trigger-label">CampusMate AI</span>
          <span className="floating-chat-online-badge" />
        </button>
      )}

      {/* ── 2. Floating Chat Modal Box (In Corner) ── */}
      {isOpen && (
        <div className="floating-chat-card">
          {/* Header */}
          <div className="floating-chat-header">
            <div className="floating-chat-header-title">
              <div className="floating-chat-avatar">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="floating-chat-name">CampusMate AI</h4>
                <span className="floating-chat-status">
                  <span className="status-dot-green" />
                  Online • Schedule & Math Solver
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() =>
                  setMessages([
                    {
                      role: 'assistant',
                      content: 'Chat cleared! How can I help you today?',
                    },
                  ])
                }
                className="chat-btn-ghost"
                title="Clear chat"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="chat-btn-close"
                title="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="floating-chat-body">
            {!hasSchedule && (
              <div className="chat-no-schedule-banner">
                <Bot size={22} color="#a78bfa" />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '12.5px', color: '#f5f3ff' }}>
                    No Advising Slip Added Yet
                  </p>
                  <p style={{ margin: '2px 0 6px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Add your slip to let the AI answer questions about your rooms and routine!
                  </p>
                  <Link to="/student/advising" className="chat-link-advising">
                    <BookOpen size={12} />
                    <span>Upload Advising Slip →</span>
                  </Link>
                </div>
              </div>
            )}

            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  className={`chat-bubble-row ${isUser ? 'chat-bubble-user-row' : 'chat-bubble-ai-row'}`}
                >
                  {!isUser && (
                    <div className="chat-avatar-mini">
                      <Bot size={14} />
                    </div>
                  )}

                  <div
                    className={`chat-bubble ${
                      isUser
                        ? 'chat-bubble-user'
                        : m.isError
                        ? 'chat-bubble-error'
                        : 'chat-bubble-ai'
                    }`}
                  >
                    {m.content}
                  </div>

                  {isUser && (
                    <div className="chat-avatar-mini user">
                      <User size={14} />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="chat-bubble-row chat-bubble-ai-row">
                <div className="chat-avatar-mini">
                  <Bot size={14} />
                </div>
                <div className="chat-bubble chat-bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>CampusMate AI is thinking…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="floating-chat-chips">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="floating-chat-chip"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="chat-error-row">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="floating-chat-input-form"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={loading ? 'Waiting for answer…' : 'Ask about classes, rooms, math…'}
              disabled={loading}
              className="floating-chat-input"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="floating-chat-send-btn"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
