import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MessageCircle, X } from 'lucide-react'
import AIChatPanel from '../components/AIChatPanel'
import { playClick } from '../utils/sound'

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[360px] max-w-[calc(100vw-40px)]">
          <AIChatPanel compact />
        </div>
      )}
      <button
        onClick={() => { playClick('tap'); setOpen((o) => !o) }}
        className="h-14 px-5 rounded-pill bg-forest text-snow flex items-center gap-2 text-[15px] hover:opacity-90"
        aria-label="Trợ lý AI"
      >
        {open ? <X size={18} strokeWidth={1.5} /> : <MessageCircle size={18} strokeWidth={1.5} />}
        {open ? 'Đóng' : 'Hỏi AI về da'}
      </button>
    </div>
  )
}

export default function AIChatPage() {
  return (
    <div className="min-h-screen bg-snow">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6 md:py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[14px] text-pewter hover:text-forest"><ArrowLeft size={15} /> Về trang chủ</Link>
        <h1 className="font-light text-[32px] md:text-[40px] leading-[1.1] tracking-[-0.4px] mt-3">Trợ lý da liễu AI</h1>
        <p className="text-[16px] text-pewter mt-2">Kể triệu chứng — AI gợi ý hướng xử lý và chuyên khoa phù hợp, bấm là qua trang đặt lịch luôn.</p>
        <div className="mt-5">
          <AIChatPanel />
        </div>
      </div>
    </div>
  )
}
