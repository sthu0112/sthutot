import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Plus, Trash2, Sparkles, MessageCircle, CalendarCheck } from 'lucide-react'
import { askAI, loadThreads, saveThread, deleteThread, newThreadId, threadTitle, summarizeForBooking } from '../lib/aiChat'
import { specialtyBySlug } from '../data/content'
import { playClick } from '../utils/sound'

const GREETING = {
  role: 'assistant',
  content: 'Chào bạn, mình là trợ lý da liễu DermaCare. Để định hướng đúng, bạn cho mình biết độ tuổi của bạn và mô tả tình trạng da đang gặp nhé.',
  level: 'none',
  suggested_specialty: null,
  skintype: null,
  quick: [],
  source: 'offline',
}

const LEVEL_CARD = {
  green: { dot: 'bg-emerald-500', title: 'Có thể theo dõi', desc: 'Chưa thấy dấu hiệu cần khám ngay. Theo dõi và chăm sóc da phù hợp.' },
  yellow: { dot: 'bg-amber-500', title: 'Nên đặt lịch khám', desc: 'Có dấu hiệu nên được bác sĩ da liễu kiểm tra để xác định nguyên nhân.' },
  red: { dot: 'bg-red-500', title: 'Cần đánh giá y tế sớm', desc: 'Ưu tiên tìm kiếm chăm sóc y tế phù hợp thay vì tự theo dõi.' },
}

const SKIN_LABEL = {
  oily: 'Da dầu',
  dry: 'Da khô',
  combo: 'Da hỗn hợp',
  normal: 'Da thường',
  sensitive: 'Da dễ kích ứng',
}

const SKIN_DESC = {
  oily: 'Dễ bóng dầu, có thể dễ xuất hiện mụn.',
  dry: 'Có cảm giác căng, dễ khô hoặc bong tróc.',
  combo: 'Vùng chữ T dầu hơn, má có thể khô hoặc bình thường.',
  normal: 'Tương đối cân bằng, ít dầu thừa hay khô quá mức.',
  sensitive: 'Da nhạy cảm là đặc điểm phản ứng của da (có thể đi kèm da dầu/khô/hỗn hợp), dễ kích ứng với sản phẩm mới.',
}

function AssistantCards({ m, threadMessages }) {
  const lvl = m.level && LEVEL_CARD[m.level] ? LEVEL_CARD[m.level] : null
  const skin = m.skintype && SKIN_LABEL[m.skintype] ? m.skintype : null
  if (!lvl && !skin && !m.suggested_specialty) return null
  const vanDe = encodeURIComponent(summarizeForBooking(threadMessages))
  return (
    <div className="mt-2 space-y-2">
      {lvl && (
        <div className="rounded-2xl bg-snow border border-forest/15 p-3 text-forest">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <span className={`w-2.5 h-2.5 rounded-full ${lvl.dot}`} /> Mức độ: {lvl.title}
          </div>
          <div className="text-[13px] mt-1 opacity-80">{lvl.desc}</div>
        </div>
      )}
      {skin && (
        <div className="rounded-2xl bg-snow border border-forest/15 p-3 text-forest">
          <div className="text-[11px] uppercase tracking-wide opacity-60 font-medium">Loại da của bạn</div>
          <div className="text-[14px] font-medium mt-0.5">🧴 {SKIN_LABEL[skin]}</div>
          <div className="text-[13px] mt-0.5 opacity-80">{SKIN_DESC[skin]}</div>
          <Link to="/cam-nang" className="inline-block mt-1.5 text-[13px] font-medium underline underline-offset-4 decoration-[1.5px]">Tìm hiểu thêm trong Cẩm nang →</Link>
        </div>
      )}
      {(m.level === 'yellow' || m.level === 'red' || m.suggested_specialty) && (
        <Link
          to={`/dat-lich?chuyen-khoa=${m.suggested_specialty || ''}&van-de=${vanDe}`}
          onClick={() => playClick('tap')}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-pill bg-forest text-snow text-[13px] font-medium hover:opacity-90"
        >
          <CalendarCheck size={15} strokeWidth={1.5} /> Đặt lịch khám da liễu
        </Link>
      )}
    </div>
  )
}

export default function AIChatPanel({ compact = false }) {
  const [threads, setThreads] = useState(() => loadThreads())
  const [activeId, setActiveId] = useState(() => loadThreads()[0]?.id || null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const bottomRef = useRef(null)

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId],
  )
  const messages = active?.messages?.length ? active.messages : [GREETING]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  function persist(nextThreads, nextActiveId) {
    setThreads(nextThreads)
    if (nextActiveId !== undefined) setActiveId(nextActiveId)
  }

  function startNew() {
    playClick('tap')
    const id = newThreadId()
    const th = { id, title: 'Đoạn chat mới', messages: [{ ...GREETING }], updatedAt: new Date().toISOString() }
    saveThread(th)
    persist([th, ...loadThreads().filter((t) => t.id !== id)], id)
    setShowHistory(false)
  }

  async function sendText(text) {
    const content = text.trim()
    if (!content || busy) return
    playClick('tap')
    let th = active
    if (!th) {
      th = { id: newThreadId(), title: 'Đoạn chat mới', messages: [], updatedAt: new Date().toISOString() }
    }
    const base = th.messages.length ? th.messages : [{ ...GREETING }]
    const next = [...base, { role: 'user', content }]
    const updated = { ...th, title: threadTitle(next), messages: next }
    saveThread(updated)
    persist(loadThreads(), updated.id)
    setInput('')
    setBusy(true)
    try {
      const res = await askAI(next.map(({ role, content }) => ({ role, content })))
      playClick('success')
      const done = {
        ...updated,
        title: threadTitle(next),
        messages: [...next, { role: 'assistant', content: res.reply, level: res.level, suggested_specialty: res.suggested_specialty, skintype: res.skintype, quick: res.quick, sources: res.sources, source: res.source }],
      }
      saveThread(done)
      persist(loadThreads(), done.id)
    } catch {
      playClick('error')
      const done = { ...updated, messages: [...next, { role: 'assistant', content: 'Mạng đang bận, bạn thử lại sau ít phút nhé.', level: 'none', suggested_specialty: null, skintype: null, quick: [], sources: [], source: 'offline' }] }
      saveThread(done)
      persist(loadThreads(), done.id)
    } finally {
      setBusy(false)
    }
  }

  function remove(id) {
    playClick('pop')
    deleteThread(id)
    const rest = loadThreads()
    persist(rest, rest[0]?.id || null)
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  const quick = !busy && lastAssistant?.quick?.length ? lastAssistant.quick : []

  return (
    <div className={`flex flex-col bg-snow ${compact ? 'h-[520px]' : 'h-[calc(100vh-230px)] min-h-[500px]'} rounded-[32px] border border-forest/10 overflow-hidden`}>
      <div className="flex items-center gap-2 px-5 py-4 bg-forest text-snow">
        <Sparkles size={17} strokeWidth={1.5} />
        <div className="font-medium text-[16px]">Trợ lý da liễu AI</div>
        <button onClick={() => { playClick('tap'); setShowHistory((s) => !s) }} className="ml-auto p-2 rounded-full hover:opacity-70" aria-label="Lịch sử tư vấn"><MessageCircle size={15} /></button>
        <button onClick={startNew} className="p-2 rounded-full hover:opacity-70" aria-label="Đoạn chat mới"><Plus size={15} /></button>
      </div>

      {showHistory && (
        <div className="max-h-40 overflow-y-auto border-b border-forest/10 bg-stone px-3 py-2 space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-pewter font-medium px-2 pt-1">Lịch sử tư vấn</div>
          {threads.length === 0 && <div className="text-[13px] text-pewter px-2 pb-1">Chưa có đoạn nào.</div>}
          {threads.map((t) => (
            <div key={t.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-[13px] ${t.id === active?.id ? 'bg-snow font-medium' : 'hover:bg-snow/60'}`}>
              <button onClick={() => { playClick('tap'); setActiveId(t.id); setShowHistory(false) }} className="flex-1 text-left truncate">{t.title}</button>
              <button onClick={() => remove(t.id)} className="p-1 text-pewter hover:text-forest" aria-label="Xóa"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] px-4 py-3 text-[14px] leading-[1.5] ${m.role === 'user' ? 'bg-forest text-snow rounded-2xl rounded-br-md' : 'bg-stone text-forest rounded-2xl rounded-bl-md'}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.role === 'assistant' && m.authExpired && (
                <Link to="/login" className="inline-flex items-center justify-center gap-2 w-full mt-2 py-2.5 rounded-pill bg-forest text-snow text-[13px] font-medium hover:opacity-90">
                  Đăng nhập lại
                </Link>
              )}
              {m.role === 'assistant' && Array.isArray(m.sources) && m.sources.length > 0 && (
                <div className="mt-1.5 text-[11px] opacity-70">Dựa trên: {m.sources.join(' · ')}</div>
              )}
              {m.role === 'assistant' && <AssistantCards m={m} threadMessages={messages} />}
              {m.role === 'assistant' && m.source === 'offline' && i > 0 && !m.authExpired && (
                <div className="text-[11px] opacity-60 mt-1">
                  {m.offlineReason === 'timeout' && 'Mạng chậm quá — bạn bấm gửi lại giúp mình nhé'}
                  {m.offlineReason === 'config' && 'Chế độ offline — AI đầy đủ cần cấu hình key'}
                  {(!m.offlineReason || m.offlineReason === 'busy') && 'AI đang bận, thử lại sau 1–2 phút nhé'}
                </div>
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

      {quick.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button key={q} onClick={() => sendText(q)} className="px-3 py-2 rounded-pill bg-stone border border-forest/20 text-[13px] font-medium hover:bg-lime">{q}</button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); sendText(input) }} className="p-3 border-t border-forest/10 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="VD: em 15 tuổi, trán nổi nhiều mụn đỏ…"
          className="flex-1 px-4 py-3 rounded-pill bg-stone text-[14px] text-forest placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-forest/30"
        />
        <button type="submit" disabled={busy || !input.trim()} className="w-12 h-12 shrink-0 rounded-full bg-forest text-snow flex items-center justify-center hover:opacity-90 disabled:opacity-40" aria-label="Gửi">
          <Send size={17} strokeWidth={1.5} />
        </button>
      </form>
      <div className="px-5 pb-3 text-[11px] text-pewter">Thông tin chỉ tham khảo, không thay thế khám trực tiếp.</div>
    </div>
  )
}

export function specialtyName(slug) {
  return specialtyBySlug(slug)?.name || ''
}
