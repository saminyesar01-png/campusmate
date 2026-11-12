import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, AlertCircle, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChatBox({ scheduleData, hasSchedule }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your CampusMate AI assistant. Ask me anything about your today's classes, lab rooms, credits, deadlines, or math and academic problems!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Suggested prompt chips
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
        throw new Error(data.error || 'Failed to get a response from CampusMate AI.');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || "I didn't receive an answer. Please try again." },
      ]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your connection.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${err.message || 'Error communicating with AI assistant. Please try again in a moment.'}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // If student hasn't uploaded or added an advising slip yet
  if (!hasSchedule) {
    return (
      <div className="card" style={{ padding: '28px', textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            color: '#818cf8',
          }}
        >
          <Bot size={26} />
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px', color: '#ffffff' }}>
          CampusMate AI Academic Assistant
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', maxWidth: '480px', margin: '0 auto 16px' }}>
          Upload your advising slip to activate your AI schedule assistant. It will answer questions about your rooms, lab timings, payment deadlines, and course credits!
        </p>
        <Link to="/student/advising" className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', fontSize: '13px' }}>
          <BookOpen size={16} />
          <span>Add Advising Slip</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12), rgba(17, 24, 39, 0.6))',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              CampusMate AI Assistant
            </h3>
            <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              Schedule & Math Solver Active
            </span>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                role: 'assistant',
                content: "Chat cleared! How can I help you with your classes, rooms, or study problems today?",
              },
            ])
          }
          className="btn btn-secondary"
          style={{ fontSize: '11px', padding: '4px 10px' }}
          title="Clear chat history"
        >
          Clear
        </button>
      </div>

      {/* Message List */}
      <div
        style={{
          padding: '18px 20px',
          maxHeight: '380px',
          minHeight: '220px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Bot size={16} />
                </div>
              )}

              <div
                style={{
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: isUser
                    ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                    : m.isError
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'var(--surface-card)',
                  color: isUser ? '#ffffff' : m.isError ? '#f87171' : 'var(--text)',
                  border: isUser
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : m.isError
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid var(--border)',
                  fontSize: '13.5px',
                  lineHeight: '1.55',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                {m.content}
              </div>

              {isUser && (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bot size={16} />
            </div>
            <div
              style={{
                padding: '8px 14px',
                borderRadius: '14px 14px 14px 2px',
                background: 'var(--surface-card)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                fontSize: '13px',
              }}
            >
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>CampusMate AI is thinking…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          padding: '4px 20px 10px',
          scrollbarWidth: 'none',
        }}
      >
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            disabled={loading}
            style={{
              whiteSpace: 'nowrap',
              fontSize: '11.5px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '9999px',
              padding: '4px 12px',
              color: '#a5b4fc',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Error alert if any */}
      {error && (
        <div
          style={{
            margin: '0 20px 10px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-low)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Waiting for answer…' : 'Ask about your schedule or a math problem…'}
          disabled={loading}
          style={{
            flex: 1,
            background: 'var(--surface-input)',
            border: '1px solid var(--border)',
            borderRadius: '9999px',
            padding: '10px 18px',
            color: 'var(--text)',
            fontSize: '13.5px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{
            borderRadius: '9999px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: loading || !input.trim() ? 0.5 : 1,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          <Send size={15} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Send</span>
        </button>
      </form>
    </div>
  );
}
