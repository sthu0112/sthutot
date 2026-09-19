import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Apple, Leaf, AlertTriangle, BookOpen, CalendarCheck, MessageCircle } from 'lucide-react'
import { NATURAL_CARE } from '../data/thienNhien'
import { playClick } from '../utils/sound'

export default function ThienNhien() {
  return (
    <div className="min-h-screen w-full bg-snow text-forest font-sans">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[14px] text-pewter hover:text-forest"><ArrowLeft size={15} /> Về trang chủ</Link>
        <div className="text-[12px] uppercase tracking-wide text-pewter font-medium mt-4">DermaCare / Dinh dưỡng &amp; Thiên nhiên</div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="font-semibold text-[32px] md:text-[40px] leading-[1.1] tracking-tight mt-2"
        >
          Chăm sóc da từ mâm cơm &amp; thiên nhiên
        </motion.h1>
        <p className="text-[16px] text-pewter mt-3 max-w-3xl leading-[1.6]">
          Ăn gì, đắp gì hỗ trợ từng nhóm bệnh da — <b>mỗi cách đều ghi rõ nguồn y tế uy tín</b>.
          Đây là biện pháp hỗ trợ, không thay thuốc hay chỉ định bác sĩ.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-10">
          {NATURAL_CARE.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.07 }}
              className="bg-white border border-forest/10 rounded-[24px] p-6 hover:shadow-card transition-shadow"
            >
              <div className="inline-flex px-2 py-[6px] rounded-pill bg-lime text-forest text-[12px] font-medium">{c.nhom}</div>
              <div className="mt-4 space-y-4 text-[14px] leading-[1.6]">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-[15px]"><Apple size={16} /> Ăn uống hỗ trợ</div>
                  <ul className="mt-1.5 space-y-1.5 text-pewter list-disc pl-5">
                    {c.anUong.map((t, j) => <li key={j}>{t}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 font-semibold text-[15px]"><Leaf size={16} /> Thiên nhiên có nguồn gốc</div>
                  <ul className="mt-1.5 space-y-1.5 text-pewter list-disc pl-5">
                    {c.thienNhien.map((t, j) => <li key={j}>{t}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[13px] text-amber-900 flex gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" /><span><b>Lưu ý:</b> {c.luuY}</span>
                </div>
                <div className="text-[12px] text-pewter flex gap-1.5 items-start">
                  <BookOpen size={13} className="shrink-0 mt-0.5" />
                  <span><b>Nguồn:</b> {c.nguon.join(' · ')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 rounded-[32px] bg-forest text-snow p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <div className="font-light text-[24px]">Ăn đúng, đắp đúng vẫn chưa đủ?</div>
            <div className="text-[15px] opacity-80 mt-1">Để bác sĩ xem da trực tiếp hoặc hỏi AI định hướng nhóm bệnh.</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/tro-ly-ai" className="inline-flex items-center gap-2 px-6 py-3 rounded-pill bg-snow text-forest text-[15px]"><MessageCircle size={16} /> Hỏi AI</Link>
            <Link to="/dat-lich" className="inline-flex items-center gap-2 px-6 py-3 rounded-pill border-[1.5px] border-snow text-[15px]"><CalendarCheck size={16} /> Đặt lịch</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
