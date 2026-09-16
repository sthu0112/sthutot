import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Trash2, Sparkles } from 'lucide-react'
import { askAI, loadHistory, saveHistory, clearHistory } from '../lib/aiChat'
import { specialtyBySlug } from '../data/content'
import { playClick } from '../utils/sound'

const GREETING = {
  role: 'assistant',
  content: 'Chào bạn, mình là trợ lý da liễu DermaCare. Kể triệu chứng da của bạn (vị trí, màu sắc, ngứa hay đau, bao lâu rồi) để mình gợi ý hướng xử lý và chuyên khoa phù hợp nhé.',
  suggested_specialty: null,
  source: 'offline',
}

export default function AIChatPanel({ compact = false }) {
  const [messages, setMessages] = useState(() => {
    const h = loadHistory()
    return h.length ? h : [GREETING]
  })
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    saveHistory(messages)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    playClick('tap')
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const res = await askAI(next.filter((m) => m.role === 'user' || m.role === 'assistant').map(({ role, content }) => ({ role, content })))
      playClick('success')
      setMessages([...next, { role: 'assistant', content: res.reply, suggested_specialty: res.suggested_specialty, source: res.source }])
    } catch {
      playClick('error')
      setMessages([...next, { role: 'assistant', content: 'Mạng đang bận, bạn thử lại sau ít phút nhé.', suggested_specialty: null, source: 'offline' }])
    } finally {
      setBusy(false)
    }
  }

  function clear() {
    playClick('pop')
    clearHistory()
    setMessages([GREETING])
  }

  return (
    <div className={`flex flex-col bg-snow ${compact ? 'h-[480px]' : 'h-[calc(100vh-220px)] min-h-[480px]'} rounded-[32px] border border-forest/10 overflow-hidden`}>
      <div className="flex items-center gap-2 px-5 py-4 bg-forest text-snow">
        <Sparkles size={17} strokeWidth={1.5} />
        <div className="font-medium text-[16px]">Trợ lý da liễu AI</div>
        <button onClick={clear} className="ml-auto p-2 rounded-full hover:opacity-70" aria-label="Xóa hội thoại"><Trash2 size={15} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 text-[14px] leading-[1.5] ${m.role === 'user' ? 'bg-forest text-snow rounded-2xl rounded-br-md' : 'bg-stone text-forest rounded-2xl rounded-bl-md'}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.role === 'assistant' && m.suggested_specialty && (
                <Link
                  to={`/dat-lich?chuyen-khoa=${m.suggested_specialty}`}
                  onClick={() => playClick('tap')}
                  className="mt-2 inline-block px-3 py-2 rounded-pill bg-lime text-forest text-[12px] font-medium"
                >
                  Đặt lịch {specialtyBySlug(m.suggested_specialty)?.name || ''} →
                </Link>
              )}
              {m.role === 'assistant' && m.source === 'offline' && i > 0 && (
                <div className="text-[11px] opacity-60 mt-1">Chế độ offline — AI đầy đủ cần cấu hình key</div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-stone rounded-2xl rounded-bl-md px-4 py-3 text-[14px] flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-forest animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-forest animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-forest animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="p-3 border-t border-forest/10 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="VD: mặt nổi mụn viêm đỏ 2 tuần, hơi đau…"
          className="flex-1 px-4 py-3 rounded-pill bg-stone text-[14px] text-forest placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-forest/30"
        />
        <button type="submit" disabled={busy || !input.trim()} className="w-12 h-12 shrink-0 rounded-full bg-forest text-snow flex items-center justify-center hover:opacity-90 disabled:opacity-40" aria-label="Gửi">
          <Send size={17} strokeWidth={1.5} />
        </button>
      </form>
      <div className="px-5 pb-3 text-[11px] text-pewter">AI chỉ tư vấn sơ bộ, không thay thế khám trực tiếp.</div>
    </div>
  )
}
