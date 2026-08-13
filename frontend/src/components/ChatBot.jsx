import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { t } from '../i18n'

const MODEL_BADGE = { ollama: '🦙 Llama', groq: '⚡ Groq', fallback: '📋 Built-in' }

export default function ChatBot({ lang }) {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t(lang, 'chatbot', 'greeting'), model: null },
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    setMessages([{ role: 'assistant', content: t(lang, 'chatbot', 'greeting'), model: null }])
  }, [lang])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages(prev => [...prev, { role: 'user', content: text, model: null }])
    setInput('')
    setLoading(true)
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const { data } = await axios.post('/api/chat', { message: text, language: lang, history })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, model: data.model }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'AI service unavailable right now.', model: 'fallback' }])
    }
    setLoading(false)
  }

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  const btnStyle = {
    position: 'fixed', bottom: 24, right: 24, zIndex: 60,
    width: 52, height: 52, borderRadius: '50%',
    background: 'var(--accent)', color: '#111',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, boxShadow: '0 4px 24px rgba(54,209,196,0.35)',
    transition: 'transform 0.18s, box-shadow 0.18s',
    fontFamily: 'inherit',
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)} style={btnStyle} title={t(lang, 'chatbot', 'title')}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(54,209,196,0.5)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 24px rgba(54,209,196,0.35)' }}
      >
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 60,
          width: 340, maxHeight: '70vh',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 24, boxShadow: '0 16px 50px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: '#1A3530', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(54,209,196,0.2)' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(54,209,196,0.15)', border: '1px solid rgba(54,209,196,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              🤖
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t(lang, 'chatbot', 'title')}</p>
              <p style={{ fontSize: 10, color: 'var(--accent)', opacity: 0.8 }}>Ollama · Groq · Open-source LLM</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '9px 13px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: 12, lineHeight: 1.55,
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                  color: m.role === 'user' ? '#111' : 'var(--text)',
                  border: m.role !== 'user' ? '1px solid var(--border)' : 'none',
                  fontWeight: m.role === 'user' ? 600 : 400,
                }}>
                  {m.content}
                  {m.role === 'assistant' && m.model && (
                    <span style={{ display: 'block', fontSize: 9.5, marginTop: 4, color: 'var(--muted)', opacity: 0.7 }}>
                      {MODEL_BADGE[m.model?.split('/')[0]] ?? m.model}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '9px 13px', borderRadius: '18px 18px 18px 4px', fontSize: 12, background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                  {t(lang, 'chatbot', 'thinking')}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t(lang, 'chatbot', 'placeholder')}
              rows={1}
              style={{ flex: 1, fontSize: 12, borderRadius: 14, padding: '8px 12px', resize: 'none', outline: 'none', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
            <button onClick={send} disabled={!input.trim() || loading} className="btn-teal" style={{ padding: '8px 14px', alignSelf: 'flex-end', fontSize: 12 }}>
              {t(lang, 'chatbot', 'send')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
