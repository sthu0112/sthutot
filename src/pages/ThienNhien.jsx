import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Apple, Leaf, AlertTriangle, CalendarCheck, MessageCircle, Check, X } from 'lucide-react'
import { FOODS, NATURALS } from '../data/dinhDuong'
import { playClick } from '../utils/sound'

function FoodCard({ f, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }} whileTap={{ scale: 0.97 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
      className="bg-white border border-forest/10 rounded-[24px] overflow-hidden hover:shadow-card transition-shadow"
    >
      <div className="relative">
        <img src={f.img} alt={f.ten} loading="lazy" className="w-full h-44 object-cover" />
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-[12px] font-bold ${f.nen ? 'bg-lime text-forest' : 'bg-red-600 text-white'}`}>
          {f.nen ? <><Check size={13} /> NÊN ĂN</> : <><X size={13} /> HẠN CHẾ</>}
        </span>
      </div>
      <div className="p-5">
        <div className="font-semibold text-[17px]">{f.ten}</div>
        <p className="text-[14px] text-pewter mt-1.5 leading-[1.6]"><b className="text-forest">Vì sao:</b> {f.viSao}</p>
        <p className="text-[12px] text-pewter mt-2">Nguồn: {f.nguon}</p>
      </div>
    </motion.div>
  )
}

function NaturalCard({ n, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }} whileTap={{ scale: 0.97 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45, delay: (i % 2) * 0.07 }}
      className="bg-white border border-forest/10 rounded-[24px] overflow-hidden hover:shadow-card transition-shadow"
    >
      <img src={n.img} alt={n.ten} loading="lazy" className="w-full h-52 object-cover" />
      <div className="p-5 sm:p-6">
        <div className="font-semibold text-[19px]">{n.ten}</div>
        <div className="mt-3">
          <div className="text-[13px] font-bold uppercase tracking-wide text-teal-700">Công dụng</div>
          <p className="text-[14px] text-pewter mt-1 leading-[1.6]">{n.congDung}</p>
        </div>
        <div className="mt-3">
          <div className="text-[13px] font-bold uppercase tracking-wide text-teal-700">Hiệu quả thực tế</div>
          <p className="text-[14px] text-pewter mt-1 leading-[1.6]">{n.hieuQua}</p>
        </div>
        <div className="mt-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
          <div className="text-[13px] font-bold uppercase tracking-wide text-emerald-800">Tự làm tại nhà</div>
          <ol className="mt-1.5 space-y-1.5 text-[14px] list-decimal pl-5">
            {n.cachLam.map((s, j) => <li key={j}>{s}</li>)}
          </ol>
        </div>
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[13px] text-amber-900 flex gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" /><span><b>Lưu ý:</b> {n.luuY}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function ThienNhien() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') === 'thien' ? 'thien' : 'an')
  const [filter, setFilter] = useState('all')
  const shown = filter === 'all' ? FOODS : FOODS.filter((f) => (filter === 'nen') === f.nen)

  return (
    <div className="min-h-screen w-full bg-snow text-forest font-sans">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[14px] text-pewter hover:text-forest"><ArrowLeft size={15} /> Về trang chủ</Link>
        <div className="text-[12px] uppercase tracking-wide text-pewter font-medium mt-4">DermaCare / Dinh dưỡng &amp; Thiên nhiên</div>
        <h1 className="font-semibold text-[32px] md:text-[40px] leading-[1.1] tracking-tight mt-2">Ăn gì, đắp gì cho da?</h1>
        <p className="text-[16px] text-pewter mt-3 max-w-3xl leading-[1.6]">
          Chia rõ 2 nhóm: <b>đồ ăn</b> (nên ăn / hạn chế + vì sao) và <b>liệu pháp thiên nhiên</b> (công dụng + cách tự làm).
          Tất cả đều là biện pháp hỗ trợ, không thay thuốc hay chỉ định bác sĩ.
        </p>

        <div className="flex gap-2 mt-6">
          {[
            ['an', '🍽️ Dinh dưỡng (món ăn)'],
            ['thien', '🌿 Thiên nhiên (tự làm)'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => { playClick('tap'); setTab(k) }}
              className={`px-6 py-3.5 rounded-pill text-[15px] font-semibold transition active:scale-95 ${tab === k ? 'bg-forest text-snow' : 'bg-white border-[1.5px] border-forest text-forest hover:opacity-80'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'an' && (
          <>
            <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
              {[['all', 'Tất cả'], ['nen', 'Nên ăn'], ['hanche', 'Hạn chế']].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => { playClick('tap'); setFilter(k) }}
                  className={`px-4 py-2 rounded-pill text-[13px] font-medium border whitespace-nowrap active:scale-95 transition-transform ${filter === k ? 'bg-forest text-snow border-forest' : 'bg-snow border-forest/20'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {shown.map((f, i) => <FoodCard key={f.key} f={f} i={i} />)}
            </div>
          </>
        )}

        {tab === 'thien' && (
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {NATURALS.map((n, i) => <NaturalCard key={n.key} n={n} i={i} />)}
          </div>
        )}

        <p className="text-[12px] text-pewter mt-8">Ảnh minh họa: Wikimedia Commons (miễn phí bản quyền). Món ăn/liệu pháp chỉ hỗ trợ — da bất thường kéo dài nên đi khám.</p>

        <div className="mt-6 rounded-[32px] bg-forest text-snow p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
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
