import { jsPDF } from 'jspdf'
import posthog from 'posthog-js'
import { inject as vercelInject } from '@vercel/analytics'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom/client'

// ── PostHog ──────────────────────────────────────────────
posthog.init('phc_PpClGEAn67NSz4zUz826djb5F9NoxfkNqQAwq1lcBox', {
  api_host: 'https://app.posthog.com',
  autocapture: false
})

// ── Vercel Analytics ─────────────────────────────────────
vercelInject()

function track(event, props = {}) {
  try { posthog.capture(event, props) } catch (_) {}
}
const h = React.createElement

// ── Design tokens — Reformed Modern ───────────────────────
const T = {
  bg:        '#faf7f2',   // parchment
  bgSubtle:  '#f0ece4',   // slightly deeper parchment for input area
  navy:      '#1e3a5c',   // header, active buttons, send
  navyDark:  '#142a44',   // hover states
  navyLight: '#2a4e78',   // secondary navy
  gold:      '#7ec8e3',   // RE accent (sky blue — keeps brand)
  ink:       '#0f1e2e',   // primary text
  inkMid:    '#3a5068',   // secondary text
  inkLight:  '#6a8090',   // placeholder / muted
  border:    '#ddd5c8',   // parchment-toned border
  cardBg:    '#ffffff',   // white cards
  white:     '#ffffff',
  userBubble:'#1e3a5c',
  botBubble: '#ffffff',
}

// ── Roman numerals per level ───────────────────────────────
const ROMAN = { explorer: 'I', teacher: 'II', scholar: 'III' }

// ── Level config ──────────────────────────────────────────
const LEVELS = {
  explorer: {
    label:        'Explorer',
    desc:         'New to faith and theology',
    pillBg:       'rgba(255,255,255,0.18)',
    pillColor:    '#ffffff',
    pillBorder:   'rgba(255,255,255,0.35)',
    placeholder:  'Ask Prof. Lewis anything — no question is too basic…',
    welcome:      'Prof. Lewis is ready. Ask anything — there are no wrong questions here.',
    examples: [
      'What does it mean to be saved?',
      'Why do Christians go to church?',
      'Who wrote the Bible?',
      'Why do bad things happen if God is good?',
    ],
  },
  teacher: {
    label:        'Teacher',
    desc:         'Theologically literate',
    pillBg:       'rgba(255,255,255,0.18)',
    pillColor:    '#ffffff',
    pillBorder:   'rgba(255,255,255,0.35)',
    placeholder:  'Ask Prof. Lewis anything…',
    welcome:      'Welcome back to the classroom. What are we working through today?',
    examples: [
      'Did the early church believe in the rapture?',
      'What is the difference between Law and Gospel?',
      'How do different traditions understand the Lord\'s Supper?',
    ],
  },
  scholar: {
    label:        'Scholar',
    desc:         'Advanced academic study',
    pillBg:       'rgba(255,255,255,0.18)',
    pillColor:    '#ffffff',
    pillBorder:   'rgba(255,255,255,0.35)',
    placeholder:  'The floor is yours…',
    welcome:      'Colleague. What are we working on?',
    examples: [
      'What is the πίστις Χριστοῦ debate and where do you land?',
      'How does the LXX use of κύριος inform Pauline Christology?',
      'What is the significance of Qumran for understanding John\'s Gospel?',
    ],
  },
}

// ── Styles — Reformed Modern ──────────────────────────────
const S = {
  app: {
    display: 'flex', flexDirection: 'column',
    height: '100dvh', maxWidth: 480,
    margin: '0 auto', background: T.bg,
    position: 'relative', overflow: 'hidden',
  },

  // Header — solid navy
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    background: T.navy,
    flexShrink: 0, zIndex: 10,
  },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: 12 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  wordmark: {
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 17, fontWeight: 700,
    color: '#ffffff', letterSpacing: -0.3,
    userSelect: 'none', cursor: 'pointer',
  },
  wordmarkRE: { color: '#7ec8e3' },

  pill: () => ({
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 11, fontWeight: 700,
    letterSpacing: 1, textTransform: 'uppercase',
    padding: '5px 13px', borderRadius: 20,
    background: 'rgba(255,255,255,0.15)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.3)',
    cursor: 'pointer', transition: 'background 0.15s',
  }),

  iconBtn: {
    width: 34, height: 34, borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.25)',
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s', flexShrink: 0,
  },

  // Level selector
  levelScreen: {
    flex: 1, display: 'flex', flexDirection: 'column',
    padding: '32px 22px 40px', background: T.bg,
    overflowY: 'auto',
  },
  levelKicker: {
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: 3,
    textTransform: 'uppercase', color: T.navy,
    borderLeft: `4px solid ${T.navy}`,
    paddingLeft: 10, marginBottom: 14,
  },
  levelHeadingLine: {
    fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
    fontSize: 32, fontWeight: 700,
    color: T.ink, lineHeight: 1.15, marginBottom: 4,
  },
  levelSub: {
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 15, fontWeight: 400,
    color: T.inkLight, marginBottom: 28, marginTop: 6,
  },
  levelButtons: { display: 'flex', flexDirection: 'column', gap: 12 },

  lvlBtn: (key, isActive) => ({
    width: '100%', padding: '18px 20px',
    borderRadius: 12, border: 'none',
    background: isActive ? T.navy : T.cardBg,
    cursor: 'pointer', textAlign: 'left',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 14,
    boxShadow: isActive
      ? '0 6px 24px rgba(30,58,92,0.35)'
      : '0 2px 8px rgba(15,30,46,0.08)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  }),
  lvlBtnLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  lvlBtnRoman: (isActive) => ({
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 28, fontWeight: 700,
    color: isActive ? 'rgba(255,255,255,0.35)' : T.border,
    flexShrink: 0, width: 32, textAlign: 'center',
    lineHeight: 1,
  }),
  lvlBtnName: (isActive) => ({
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 18, fontWeight: 700,
    color: isActive ? '#ffffff' : T.ink,
    display: 'block', marginBottom: 3,
  }),
  lvlBtnDesc: (isActive) => ({
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 13, fontWeight: 400,
    color: isActive ? 'rgba(255,255,255,0.6)' : T.inkLight,
    display: 'block',
  }),
  lvlBtnChevron: (isActive) => ({
    fontSize: 22, color: isActive ? 'rgba(255,255,255,0.4)' : T.border,
    flexShrink: 0,
  }),

  // Chat area
  chatArea: {
    flex: 1, overflowY: 'auto',
    padding: '18px 16px',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  systemNote: {
    fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
    fontSize: 18, fontStyle: 'italic',
    color: T.inkLight, textAlign: 'center',
    padding: '4px 16px 12px', lineHeight: 1.55,
  },
  switchNotice: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 16px', background: T.navy,
    borderRadius: 20, alignSelf: 'center',
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
    textTransform: 'uppercase', color: '#ffffff',
    flexShrink: 0, opacity: 0.85,
  },
  switchDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#7ec8e3', flexShrink: 0,
  },

  // Bubbles
  bubbleRow: (role) => ({
    display: 'flex', flexDirection: 'column',
    alignItems: role === 'user' ? 'flex-end' : 'flex-start',
  }),
  bubbleSender: (role) => ({
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: 5,
    paddingLeft: 4, paddingRight: 4,
    color: role === 'user' ? T.navy : T.inkMid,
  }),
  bubble: (role) => ({
    maxWidth: '85%',
    padding: '14px 18px',
    borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    fontFamily: "'Libre Baskerville', 'Georgia', serif",
    fontSize: 15, fontWeight: 400, lineHeight: 1.75,
    background: role === 'user' ? T.userBubble : T.cardBg,
    color: role === 'user' ? '#ffffff' : T.ink,
    border: role === 'user' ? 'none' : `2px solid ${T.border}`,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    boxShadow: role === 'user'
      ? '0 4px 16px rgba(30,58,92,0.25)'
      : '0 2px 8px rgba(15,30,46,0.07)',
  }),

  // Typing indicator
  typingDot: (delay) => ({
    width: 8, height: 8, borderRadius: '50%',
    background: T.inkLight,
    animation: 'bounce 1.2s infinite',
    animationDelay: delay,
  }),

  // Example questions
  examplesWrap: {
    display: 'flex', flexDirection: 'column', gap: 10,
    padding: '4px 0',
  },
  exampleBtn: {
    background: T.cardBg,
    border: `2px solid ${T.border}`,
    borderRadius: 12, padding: '13px 18px',
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 15, fontWeight: 500,
    color: T.inkMid, cursor: 'pointer',
    textAlign: 'left', transition: 'border-color 0.15s, background 0.15s',
    alignSelf: 'stretch', lineHeight: 1.4,
  },

  // Toolbar + input
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 16px 10px', flexShrink: 0,
  },
  toolbarBtn: {
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: 1,
    textTransform: 'uppercase', color: T.inkMid,
    background: T.cardBg, border: `2px solid ${T.border}`,
    borderRadius: 8, padding: '7px 14px',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'background 0.15s, border-color 0.15s',
  },
  inputRow: {
    background: T.bgSubtle, borderTop: `2px solid ${T.border}`,
    padding: '12px 16px', display: 'flex',
    gap: 10, alignItems: 'flex-end', flexShrink: 0,
  },
  textarea: {
    flex: 1, background: T.cardBg,
    border: `2px solid ${T.border}`, borderRadius: 12,
    padding: '11px 18px',
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 15, fontWeight: 400, color: T.ink,
    resize: 'none', outline: 'none', maxHeight: 120,
    lineHeight: 1.5, overflowY: 'auto',
  },
  sendBtn: (disabled) => ({
    width: 44, height: 44, borderRadius: 12,
    background: disabled ? T.border : T.navy,
    border: 'none', color: '#ffffff', fontSize: 18,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.15s',
    boxShadow: disabled ? 'none' : '0 4px 12px rgba(30,58,92,0.3)',
  }),

  // Modal
  modalOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(15,30,46,0.6)',
    display: 'flex', alignItems: 'flex-end',
    zIndex: 100,
  },
  modalSheet: {
    background: T.cardBg,
    borderRadius: '20px 20px 0 0',
    padding: '20px 24px 48px',
    width: '100%',
    boxShadow: '0 -8px 40px rgba(15,30,46,0.2)',
    maxHeight: '80vh', overflowY: 'auto',
  },
  modalHandle: {
    width: 40, height: 5, background: T.border,
    borderRadius: 3, margin: '0 auto 22px',
  },
  modalTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 20, fontWeight: 700, color: T.ink, marginBottom: 14,
  },
  modalBody: {
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 14, fontWeight: 400, color: T.inkMid,
    lineHeight: 1.75, marginBottom: 18,
  },
  modalCopy: {
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 11, color: T.inkLight,
    borderTop: `1px solid ${T.border}`, paddingTop: 16,
  },

  // A2HS
  a2hsBanner: {
    position: 'absolute', bottom: 90, left: 16, right: 16,
    background: T.navy, color: '#ffffff',
    borderRadius: 14, padding: '14px 18px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 8px 32px rgba(15,30,46,0.4)', zIndex: 50,
  },
  a2hsText: {
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.85)',
  },
  a2hsBtn: {
    fontFamily: "'DM Sans', 'Lato', sans-serif",
    fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
    background: '#7ec8e3', color: T.navy,
    border: 'none', borderRadius: 8,
    padding: '7px 16px', cursor: 'pointer',
    flexShrink: 0, marginLeft: 12,
  },
}

// ── Helpers ───────────────────────────────────────────────
function parseMarkdown(text) {
  // Bold, italic, links, bullet points — minimal renderer
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#3d5a7a">$1</a>')
    .replace(/^•\s(.+)$/gm, '<li style="margin-left:16px;margin-bottom:2px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, s => `<ul style="margin:6px 0">${s}</ul>`)
}

function BubbleContent({ text }) {
  const html = parseMarkdown(text)
  return h('span', {
    dangerouslySetInnerHTML: { __html: html }
  })
}

function TypingIndicator() {
  return h('div', { style: { ...S.bubble('bot'), display: 'flex', gap: 6, alignItems: 'center', padding: '12px 16px' } },
    h('style', {}, `@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`),
    h('div', { style: S.typingDot('0s') }),
    h('div', { style: S.typingDot('0.2s') }),
    h('div', { style: S.typingDot('0.4s') }),
  )
}

// ── PDF Export ────────────────────────────────────────────
function exportPDF(messages, level) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const margin = 60
  const pageW = doc.internal.pageSize.getWidth()
  const maxW = pageW - margin * 2
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(30, 48, 72)
  doc.text('Theology RE-fresh', margin, y)
  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 127, 148)
  doc.text(`Level: ${LEVELS[level].label} · ${new Date().toLocaleDateString()}`, margin, y)
  y += 30

  doc.setDrawColor(208, 220, 236)
  doc.line(margin, y, pageW - margin, y)
  y += 20

  messages.forEach(msg => {
    const isUser = msg.role === 'user'
    const sender = isUser ? 'You' : 'Prof. Lewis'
    const clean = msg.content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(isUser ? 61 : 91, isUser ? 90 : 138, isUser ? 122 : 106)
    doc.text(sender.toUpperCase(), margin, y)
    y += 14

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(30, 48, 72)
    const lines = doc.splitTextToSize(clean, maxW)
    lines.forEach(line => {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 15
    })
    y += 12
  })

  doc.setFontSize(8)
  doc.setTextColor(180, 180, 180)
  doc.text('© 2025 Ellery Aguayo · Theology RE-fresh · A ministry of Emerald City Sanctuary', margin, doc.internal.pageSize.getHeight() - 30)
  doc.save(`theology-refresh-${level}-${Date.now()}.pdf`)
  track('pdf_exported', { level })
}

// ── Main App ──────────────────────────────────────────────
function App() {
  const [level,       setLevel]       = useState(() => localStorage.getItem('tr-level') || null)
  const [messages,    setMessages]    = useState([])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [showAbout,   setShowAbout]   = useState(false)
  const [deferredA2H, setDeferredA2H] = useState(null)
  const [showA2H,     setShowA2H]     = useState(false)
  const [switchNote,  setSwitchNote]  = useState(null) // { from, to } for inline notice
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  // PWA install prompt
  useEffect(() => {
    const handler = e => { e.preventDefault(); setDeferredA2H(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (deferredA2H && messages.length >= 3) setShowA2H(true)
  }, [deferredA2H, messages.length])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Persist level
  useEffect(() => {
    if (level) {
      localStorage.setItem('tr-level', level)
    } else {
      localStorage.removeItem('tr-level')
    }
  }, [level])

  const chooseLevel = useCallback((key) => {
    track('level_selected', { level: key })
    setLevel(key)
    setMessages([])
    setSwitchNote(null)
  }, [])

  const switchLevel = useCallback((key) => {
    if (key === level) return
    track('level_switched', { from: level, to: key })
    setSwitchNote({ from: LEVELS[level].label, to: LEVELS[key].label, insertAfter: messages.length })
    setLevel(key)
  }, [level, messages.length])

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)
    track('message_sent', { level, words: trimmed.split(' ').length })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, level })
      })
      const data = await res.json()
      const reply = data?.content?.[0]?.text || 'Something went wrong — please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      track('message_received', { level })
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please check your connection and try again." }])
    } finally {
      setLoading(false)
    }
  }, [input, messages, loading, level])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  const handleTextareaInput = useCallback((e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }, [])

  const newConversation = useCallback(() => {
    setMessages([])
    setSwitchNote(null)
    track('new_conversation', { level })
  }, [level])

  const installA2H = useCallback(async () => {
    if (!deferredA2H) return
    deferredA2H.prompt()
    const { outcome } = await deferredA2H.userChoice
    track('a2h_prompt', { outcome })
    setShowA2H(false)
    setDeferredA2H(null)
  }, [deferredA2H])

  // ── Level selector ────────────────────────────────────
  if (!level) {
    return h('div', { style: S.app },
      h('div', { style: S.header },
        h('div', { style: S.headerLeft },
          h('div', { style: S.wordmark },
            'Theology ', h('span', { style: S.wordmarkRE }, 'RE'), '-fresh'
          )
        ),
        h('div', { style: S.headerRight },
          h('button', { style: S.iconBtn, onClick: () => setShowAbout(true), title: 'About' }, 'ⓘ'),
        )
      ),

      h('div', { style: S.levelScreen },
        h('div', { style: S.levelKicker }, 'Choose your level'),
        h('div', { style: S.levelHeadingLine }, 'Refresh your'),
        h('div', { style: { ...S.levelHeadingLine, color: T.navy, marginBottom: 0 } }, 'theology.'),
        h('p', { style: S.levelSub }, 'Prof. Lewis meets you where you are.'),
        h('div', { style: S.levelButtons },
          Object.keys(LEVELS).map((key, idx) => {
            const isActive = idx === 1 // Teacher highlighted by default as example
            return h('button', {
              key,
              style: S.lvlBtn(key, false),
              onClick: () => chooseLevel(key),
              onMouseEnter: e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,58,92,0.2)'
              },
              onMouseLeave: e => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,30,46,0.08)'
              },
            },
              h('div', { style: S.lvlBtnLeft },
                h('span', { style: S.lvlBtnRoman(false) }, ROMAN[key]),
                h('div', {},
                  h('span', { style: S.lvlBtnName(false) }, LEVELS[key].label),
                  h('span', { style: S.lvlBtnDesc(false) }, LEVELS[key].desc),
                )
              ),
              h('span', { style: S.lvlBtnChevron(false) }, '›'),
            )
          })
        )
      ),

      showAbout && h(AboutModal, { onClose: () => setShowAbout(false) }),
    )
  }

  // ── Chat screen ────────────────────────────────────────
  const cfg = LEVELS[level]
  const hasMessages = messages.length > 0

  // Build message list with optional switch notice injected
  const messageItems = []
  messages.forEach((msg, i) => {
    // Insert switch notice before the first message after the switch
    if (switchNote && i === switchNote.insertAfter) {
      messageItems.push(
        h('div', { key: 'switch-notice', style: S.switchNotice },
          h('div', { style: S.switchDot }),
          `Switched to ${switchNote.to} · conversation continues`
        )
      )
    }
    const isUser = msg.role === 'user'
    const role = isUser ? 'user' : 'bot'
    messageItems.push(
      h('div', { key: i, style: S.bubbleRow(role) },
        h('div', { style: S.bubbleSender(role) }, isUser ? 'You' : 'Prof. Lewis'),
        h('div', { style: S.bubble(role) },
          h(BubbleContent, { text: msg.content })
        )
      )
    )
  })

  // Typing indicator at end if loading
  if (loading) {
    messageItems.push(
      h('div', { key: 'typing', style: S.bubbleRow('bot') },
        h('div', { style: S.bubbleSender('bot') }, 'Prof. Lewis'),
        h(TypingIndicator)
      )
    )
  }

  return h('div', { style: S.app },
    // ── Header ─────────────────────────────────────────
    h('div', { style: S.header },
      h('div', { style: S.headerLeft },
        h('div', {
          style: { ...S.wordmark, cursor: 'pointer' },
          onClick: () => { setLevel(null); setMessages([]); setSwitchNote(null); track('home_clicked') },
          title: 'Back to level selector',
        },
          'Theology ', h('span', { style: S.wordmarkRE }, 'RE'), '-fresh'
        ),
        // Level pill — opens level switcher popover
        h(LevelSwitcher, { currentLevel: level, onSwitch: switchLevel }),
      ),
      h('div', { style: S.headerRight },
        hasMessages && h('button', {
          style: S.iconBtn,
          title: 'Save conversation as PDF',
          onClick: () => exportPDF(messages, level),
        }, '↓'),
        h('button', {
          style: S.iconBtn,
          title: 'About',
          onClick: () => { setShowAbout(true); track('about_opened') },
        }, 'ⓘ'),
      )
    ),

    // ── Chat area ───────────────────────────────────────
    h('div', { style: S.chatArea },
      !hasMessages
        ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 28 } },
            h('p', { style: S.systemNote }, cfg.welcome),
            h('div', { style: S.examplesWrap },
              cfg.examples.map((q, i) =>
                h('button', {
                  key: i,
                  style: { ...S.exampleBtn, fontWeight: 400, fontSize: 13, color: T.inkMid },
                  onClick: () => sendMessage(q),
                  onMouseEnter: e => { e.currentTarget.style.background = T.skyLight },
                  onMouseLeave: e => { e.currentTarget.style.background = T.bgSubtle },
                }, q)
              )
            )
          )
        : messageItems,
      h('div', { ref: bottomRef })
    ),

    // ── Toolbar — only show when conversation has started ─
    hasMessages && h('div', { style: S.toolbar },
      h('button', {
        style: S.toolbarBtn,
        onClick: newConversation,
        onMouseEnter: e => { e.currentTarget.style.background = T.skyLight; e.currentTarget.style.color = T.slate },
        onMouseLeave: e => { e.currentTarget.style.background = T.bgSubtle; e.currentTarget.style.color = T.inkMid },
      }, '＋ New Conversation'),
    ),

    // ── Input ───────────────────────────────────────────
    h('div', { style: S.inputRow },
      h('textarea', {
        ref: textareaRef,
        rows: 1,
        style: S.textarea,
        placeholder: cfg.placeholder,
        value: input,
        onInput: handleTextareaInput,
        onChange: e => setInput(e.target.value),
        onKeyDown: handleKeyDown,
        disabled: loading,
      }),
      h('button', {
        style: S.sendBtn(!input.trim() || loading),
        onClick: () => sendMessage(),
        disabled: !input.trim() || loading,
      }, '↑')
    ),

    // ── Modals / overlays ───────────────────────────────
    showAbout && h(AboutModal, { onClose: () => setShowAbout(false) }),
    showA2H && h(A2HBanner, {
      onInstall: installA2H,
      onDismiss: () => setShowA2H(false),
    }),
  )
}

// ── Level Switcher Popover ────────────────────────────────
function LevelSwitcher({ currentLevel, onSwitch }) {
  const [open, setOpen] = useState(false)

  return h('div', { style: { position: 'relative' } },
    h('button', {
      style: S.pill(),
      onClick: () => setOpen(o => !o),
      title: 'Switch level',
    }, LEVELS[currentLevel].label),

    open && h('div', {
      style: {
        position: 'absolute', top: '110%', left: 0,
        background: T.cardBg,
        border: `2px solid ${T.border}`,
        borderRadius: 12, padding: 8,
        boxShadow: '0 12px 40px rgba(15,30,46,0.2)',
        zIndex: 200, minWidth: 200,
      }
    },
      Object.keys(LEVELS).map(key =>
        h('button', {
          key,
          style: {
            width: '100%', textAlign: 'left',
            padding: '11px 14px', borderRadius: 8,
            border: 'none',
            background: key === currentLevel ? T.navy : 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'background 0.1s',
          },
          onClick: () => { onSwitch(key); setOpen(false) },
          onMouseEnter: e => { if (key !== currentLevel) e.currentTarget.style.background = '#f0ece4' },
          onMouseLeave: e => { if (key !== currentLevel) e.currentTarget.style.background = 'transparent' },
        },
          h('span', {
            style: {
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 16, fontWeight: 700,
              color: key === currentLevel ? 'rgba(255,255,255,0.4)' : T.border,
              width: 20, flexShrink: 0,
            }
          }, ROMAN[key]),
          h('div', {},
            h('span', {
              style: {
                fontFamily: "'DM Sans', 'Lato', sans-serif",
                fontSize: 14, fontWeight: 700,
                color: key === currentLevel ? '#ffffff' : T.ink,
                display: 'block',
              }
            }, LEVELS[key].label),
            h('span', {
              style: {
                fontFamily: "'DM Sans', 'Lato', sans-serif",
                fontSize: 11, fontWeight: 400,
                color: key === currentLevel ? 'rgba(255,255,255,0.55)' : T.inkLight,
              }
            }, LEVELS[key].desc),
          )
        )
      ),
      // Dismiss on outside click
      h('div', {
        style: { position: 'fixed', inset: 0, zIndex: -1 },
        onClick: () => setOpen(false),
      })
    )
  )
}

// ── About Modal ───────────────────────────────────────────
function AboutModal({ onClose }) {
  return h('div', { style: S.modalOverlay, onClick: onClose },
    h('div', {
      style: S.modalSheet,
      onClick: e => e.stopPropagation(),
    },
      h('div', { style: S.modalHandle }),
      h('p', { style: S.modalTitle }, 'About Theology RE-fresh'),
      h('p', { style: S.modalBody },
        'Theology RE-fresh is an educational tool designed to help you explore Christian theology and biblical concepts at your level. Content is provided for informational and educational purposes only and should not be considered official doctrinal teaching, pastoral counseling, or authoritative theological guidance.\n\n' +
        'Prof. Lewis is a fictional guide and does not represent a real person, church, or denomination. This app uses artificial intelligence to generate responses, which may not always reflect precise theological positions or denominational standards. While we strive for accuracy, responses may be incomplete or contain errors. Users are encouraged to consult Scripture, qualified clergy, or trusted theological sources.\n\n' +
        'Use of this app is at your own discretion.'
      ),
      h('button', {
        style: {
          ...S.toolbarBtn,
          marginBottom: 16,
          display: 'block',
        },
        onClick: onClose,
      }, 'Close'),
      h('p', { style: S.modalCopy },
        '© 2025 Ellery Aguayo · Theology RE-fresh is a ministry of Emerald City Sanctuary'
      ),
    )
  )
}

// ── Add to Home Screen Banner ─────────────────────────────
function A2HBanner({ onInstall, onDismiss }) {
  return h('div', { style: S.a2hsBanner },
    h('span', { style: S.a2hsText }, 'Add to your home screen for the full experience'),
    h('div', { style: { display: 'flex', gap: 8, flexShrink: 0 } },
      h('button', { style: S.a2hsBtn, onClick: onInstall }, 'Add'),
      h('button', {
        style: { ...S.a2hsBtn, background: 'transparent', color: T.inkLight },
        onClick: onDismiss,
      }, '✕'),
    )
  )
}

// ── Mount ─────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(h(App))
