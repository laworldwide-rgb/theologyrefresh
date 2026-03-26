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

// ── Design tokens ─────────────────────────────────────────
const T = {
  bg:        '#faf7f2',
  bgSubtle:  '#eef3f9',
  bgMid:     '#dce6f0',
  slate:     '#3d5a7a',
  slateDark: '#2a3f58',
  slateDeep: '#1e3048',
  sage:      '#5b8a6a',
  sageLight: '#c0dac8',
  sky:       '#b8cfe8',
  skyLight:  '#e2ecf7',
  ink:       '#1e3048',
  inkMid:    '#4a5f72',
  inkLight:  '#6b7f94',
  border:    '#d0dcec',
  white:     '#ffffff',
}

// ── Level config ──────────────────────────────────────────
const LEVELS = {
  explorer: {
    label:       'Explorer',
    desc:        'New to faith and theology',
    pillBg:      T.skyLight,
    pillColor:   T.slate,
    pillBorder:  T.sky,
    btnBg:       T.bgSubtle,
    btnBorder:   `1px solid ${T.border}`,
    btnNameColor:T.slateDark,
    btnDescColor:T.inkMid,
    placeholder: 'Ask Prof. Lewis anything — no question is too basic…',
    welcome:     'Prof. Lewis is ready. Ask anything — there are no wrong questions here.',
    examples: [
      'What does it mean to be saved?',
      'Why do Christians go to church?',
      'Who wrote the Bible?',
      'Why do bad things happen if God is good?',
    ],
  },
  teacher: {
    label:       'Teacher',
    desc:        'Theologically literate',
    pillBg:      T.slate,
    pillColor:   T.skyLight,
    pillBorder:  T.slateDark,
    btnBg:       T.slate,
    btnBorder:   'none',
    btnNameColor:'#e8f0f9',
    btnDescColor:'#a8c0d8',
    placeholder: 'Ask Prof. Lewis anything…',
    welcome:     'Welcome back to the classroom. What are we working through today?',
    examples: [
      'Did the early church believe in the rapture?',
      'What is the difference between Law and Gospel?',
      'How do different traditions understand the Lord\'s Supper?',
    ],
  },
  scholar: {
    label:       'Scholar',
    desc:        'Advanced academic study',
    pillBg:      T.slateDeep,
    pillColor:   T.skyLight,
    pillBorder:  T.slate,
    btnBg:       T.sage,
    btnBorder:   'none',
    btnNameColor:'#e8f5ee',
    btnDescColor:'#c0dac8',
    placeholder: 'The floor is yours…',
    welcome:     'Colleague. What are we working on?',
    examples: [
      'What is the πίστις Χριστοῦ debate and where do you land?',
      'How does the LXX use of κύριος inform Pauline Christology?',
      'What is the significance of Qumran for understanding John\'s Gospel?',
    ],
  },
}

// ── Styles (object → inline) ──────────────────────────────
const S = {
  // App shell
  app: {
    display: 'flex', flexDirection: 'column',
    height: '100dvh', maxWidth: 480,
    margin: '0 auto', background: T.bg,
    position: 'relative', overflow: 'hidden',
  },

  // Header
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: T.bg,
    borderBottom: `1px solid ${T.border}`,
    flexShrink: 0, zIndex: 10,
  },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: 10 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 6 },
  wordmark: {
    fontFamily: "'Cormorant SC', serif",
    fontSize: 16, fontWeight: 500,
    color: T.slateDeep, letterSpacing: 0.5,
    userSelect: 'none',
  },
  wordmarkRE: { color: T.slate },

  pill: (lvl) => ({
    fontFamily: "'Lato', sans-serif",
    fontSize: 9, fontWeight: 700,
    letterSpacing: 2, textTransform: 'uppercase',
    padding: '3px 10px', borderRadius: 20,
    background: LEVELS[lvl].pillBg,
    color: LEVELS[lvl].pillColor,
    border: `1px solid ${LEVELS[lvl].pillBorder}`,
    cursor: 'pointer', transition: 'opacity 0.15s',
  }),

  iconBtn: {
    width: 30, height: 30, borderRadius: '50%',
    border: `1px solid ${T.border}`,
    background: T.bgSubtle, color: T.inkMid,
    fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s', flexShrink: 0,
  },

  // Level selector screen
  levelScreen: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '32px 28px 48px', background: T.bg,
    overflowY: 'auto',
  },
  levelHeadingLine: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 26, fontWeight: 300, fontStyle: 'italic',
    color: T.ink, textAlign: 'center',
    lineHeight: 1.25, marginBottom: 4,
  },
  levelSub: {
    fontFamily: "'Lato', sans-serif",
    fontSize: 12, fontWeight: 300,
    color: T.inkLight, textAlign: 'center',
    marginTop: 8, marginBottom: 36,
  },
  levelButtons: { display: 'flex', flexDirection: 'column', gap: 12, width: '100%' },

  lvlBtn: (key) => ({
    width: '100%', padding: '16px 20px',
    borderRadius: 12,
    background: LEVELS[key].btnBg,
    border: LEVELS[key].btnBorder,
    cursor: 'pointer', textAlign: 'left',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: key !== 'explorer' ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
  }),
  lvlBtnName: (key) => ({
    fontFamily: "'Cormorant SC', serif",
    fontSize: 15, fontWeight: 500, letterSpacing: 1,
    color: LEVELS[key].btnNameColor, display: 'block', marginBottom: 2,
  }),
  lvlBtnDesc: (key) => ({
    fontFamily: "'Lato', sans-serif",
    fontSize: 11, fontWeight: 300,
    color: LEVELS[key].btnDescColor, display: 'block', opacity: 0.8,
  }),
  lvlBtnArrow: (key) => ({
    fontSize: 16, color: LEVELS[key].btnDescColor, opacity: 0.5, flexShrink: 0,
  }),

  // Chat area
  chatArea: {
    flex: 1, overflowY: 'auto',
    padding: '16px 14px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  systemNote: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 17, fontStyle: 'italic',
    color: T.inkMid, textAlign: 'center',
    padding: '4px 24px 16px', lineHeight: 1.5,
  },
  switchNotice: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 14px', background: T.skyLight,
    borderRadius: 20, alignSelf: 'center',
    border: `1px solid ${T.sky}`,
    fontFamily: "'Lato', sans-serif",
    fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.slate,
    flexShrink: 0,
  },
  switchDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: T.slate, flexShrink: 0,
  },

  // Bubbles
  bubbleRow: (role) => ({
    display: 'flex', flexDirection: 'column',
    alignItems: role === 'user' ? 'flex-end' : 'flex-start',
  }),
  bubbleSender: (role) => ({
    fontFamily: "'Cormorant SC', serif",
    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: 4, paddingLeft: 4, paddingRight: 4,
    color: role === 'user' ? T.slate : T.sage,
  }),
  bubble: (role) => ({
    maxWidth: '82%',
    padding: '10px 14px',
    borderRadius: role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
    fontFamily: "'Lato', sans-serif",
    fontSize: 13, fontWeight: 400, lineHeight: 1.65,
    background: role === 'user' ? T.slate : T.bgSubtle,
    color: role === 'user' ? '#e8f0f9' : T.ink,
    border: role === 'user' ? 'none' : `1px solid ${T.border}`,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  }),

  // Typing indicator
  typingDot: (delay) => ({
    width: 7, height: 7, borderRadius: '50%',
    background: T.inkLight,
    animation: 'bounce 1.2s infinite',
    animationDelay: delay,
  }),

  // Example questions
  examplesWrap: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '4px 0',
  },
  exampleBtn: {
    background: T.bgSubtle,
    border: `1px solid ${T.border}`,
    borderRadius: 20, padding: '8px 16px',
    fontFamily: "'Lato', sans-serif",
    fontSize: 13, fontWeight: 400,
    color: T.inkMid, cursor: 'pointer',
    textAlign: 'left', transition: 'background 0.15s',
    alignSelf: 'flex-start',
  },

  // Toolbar + input
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '0 14px 8px', flexShrink: 0,
  },
  toolbarBtn: {
    fontFamily: "'Lato', sans-serif",
    fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
    textTransform: 'uppercase', color: T.inkMid,
    background: T.bgSubtle, border: `1px solid ${T.border}`,
    borderRadius: 20, padding: '5px 11px',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'background 0.15s',
  },
  inputRow: {
    background: T.bgSubtle, borderTop: `1px solid ${T.border}`,
    padding: '10px 14px', display: 'flex',
    gap: 10, alignItems: 'flex-end', flexShrink: 0,
  },
  textarea: {
    flex: 1, background: T.white,
    border: `1px solid ${T.border}`, borderRadius: 20,
    padding: '9px 16px', fontFamily: "'Lato', sans-serif",
    fontSize: 13, fontWeight: 300, color: T.ink,
    resize: 'none', outline: 'none', maxHeight: 120,
    lineHeight: 1.5, overflowY: 'auto',
  },
  sendBtn: (disabled) => ({
    width: 36, height: 36, borderRadius: '50%',
    background: disabled ? T.border : T.slate,
    border: 'none', color: T.white, fontSize: 16,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.15s',
    boxShadow: disabled ? 'none' : '0 2px 8px rgba(61,90,122,0.3)',
  }),

  // Modal
  modalOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(30,48,72,0.55)',
    display: 'flex', alignItems: 'flex-end',
    zIndex: 100,
  },
  modalSheet: {
    background: T.white,
    borderRadius: '20px 20px 0 0',
    padding: '20px 24px 40px',
    width: '100%',
    boxShadow: '0 -8px 40px rgba(30,48,72,0.2)',
    maxHeight: '80vh', overflowY: 'auto',
  },
  modalHandle: {
    width: 36, height: 4, background: T.border,
    borderRadius: 2, margin: '0 auto 20px',
  },
  modalTitle: {
    fontFamily: "'Cormorant SC', serif",
    fontSize: 14, letterSpacing: 2, color: T.slateDeep, marginBottom: 12,
  },
  modalBody: {
    fontFamily: "'Lato', sans-serif",
    fontSize: 12, fontWeight: 300, color: T.inkMid,
    lineHeight: 1.75, marginBottom: 16,
  },
  modalCopy: {
    fontFamily: "'Lato', sans-serif",
    fontSize: 10, color: T.inkLight, letterSpacing: 0.5,
    borderTop: `1px solid ${T.border}`, paddingTop: 14,
  },

  // A2HS
  a2hsBanner: {
    position: 'absolute', bottom: 80, left: 14, right: 14,
    background: T.slateDeep, color: T.skyLight,
    borderRadius: 12, padding: '12px 16px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 50,
  },
  a2hsText: {
    fontFamily: "'Lato', sans-serif",
    fontSize: 12, fontWeight: 300, color: T.skyLight,
  },
  a2hsBtn: {
    fontFamily: "'Lato', sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: 1,
    background: T.slate, color: T.white,
    border: 'none', borderRadius: 20,
    padding: '6px 14px', cursor: 'pointer',
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
      // Header (no pill yet)
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

      // Level selector
      h('div', { style: S.levelScreen },
        h('div', { style: S.levelHeadingLine }, 'Refresh your theology.'),
        h('div', { style: S.levelHeadingLine }, 'Refresh your knowledge.'),
        h('div', { style: S.levelHeadingLine }, 'Refresh your faith.'),
        h('p',   { style: S.levelSub }, 'Choose your level to begin.'),
        h('div', { style: S.levelButtons },
          Object.keys(LEVELS).map(key =>
            h('button', {
              key,
              style: S.lvlBtn(key),
              onClick: () => chooseLevel(key),
              onMouseEnter: e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)' },
              onMouseLeave: e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = key !== 'explorer' ? '0 4px 20px rgba(0,0,0,0.15)' : 'none' },
            },
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
                h('span', { style: S.lvlBtnName(key) }, LEVELS[key].label),
                h('span', { style: S.lvlBtnDesc(key) }, LEVELS[key].desc),
              ),
              h('span', { style: S.lvlBtnArrow(key) }, '→'),
            )
          )
        )
      ),

      // About modal
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
  const cfg = LEVELS[currentLevel]

  return h('div', { style: { position: 'relative' } },
    h('button', {
      style: S.pill(currentLevel),
      onClick: () => setOpen(o => !o),
      title: 'Switch level',
    }, cfg.label),

    open && h('div', {
      style: {
        position: 'absolute', top: '110%', left: 0,
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 12, padding: 8,
        boxShadow: '0 8px 32px rgba(30,48,72,0.18)',
        zIndex: 200, minWidth: 180,
      }
    },
      Object.keys(LEVELS).map(key =>
        h('button', {
          key,
          style: {
            width: '100%', textAlign: 'left',
            padding: '9px 12px', borderRadius: 8,
            border: 'none',
            background: key === currentLevel ? T.bgSubtle : 'transparent',
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: 1,
          },
          onClick: () => { onSwitch(key); setOpen(false) },
          onMouseEnter: e => { if (key !== currentLevel) e.currentTarget.style.background = T.bgSubtle },
          onMouseLeave: e => { if (key !== currentLevel) e.currentTarget.style.background = 'transparent' },
        },
          h('span', {
            style: {
              fontFamily: "'Cormorant SC', serif",
              fontSize: 13, fontWeight: 500, letterSpacing: 1,
              color: T.slateDeep,
            }
          }, LEVELS[key].label),
          h('span', {
            style: {
              fontFamily: "'Lato', sans-serif",
              fontSize: 10, fontWeight: 300, color: T.inkLight,
            }
          }, LEVELS[key].desc),
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
