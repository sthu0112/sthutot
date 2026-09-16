import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Stethoscope, ArrowRight, Check, Calendar, Clock, Phone,
  ShieldCheck, Heart, Eye, Users, Sparkles, FileText, Activity,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { playClick } from '../utils/sound'
import { SPECIALTIES, ABOUT_TIMELINE, FALLBACK_DOCTORS } from '../data/content'
import { listDoctors, saveContact } from '../lib/bookingStore'
import { useToast } from '../components/Toast'

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
}

function SpecIcon({ slug }) {
  const cls = 'text-emerald-600'
  if (slug.includes('mun')) return <Sparkles size={18} className={cls} />
  if (slug.includes('viem')) return <ShieldCheck size={18} className={cls} />
  if (slug.includes('sac')) return <Eye size={18} className={cls} />
  if (slug.includes('vay')) return <Activity size={18} className={cls} />
  if (slug.includes('nhiem')) return <FileText size={18} className={cls} />
  if (slug.includes('toc')) return <Users size={18} className={cls} />
  if (slug.includes('tre')) return <Heart size={18} className={cls} />
  return <Stethoscope size={18} className={cls} />
}

function AboutTimeline() {
  return (
    <section id="gioi-thieu" className="bg-white">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Breadcrumb nhỏ */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] text-emerald-500">
          DERMACARE / GIỚI THIỆU
        </motion.div>
        <motion.h2
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-display font-extrabold tracking-tight text-slate-900 text-4xl md:text-5xl mt-3 leading-[1.05]"
        >
          Hành trình xây dựng nền tảng
        </motion.h2>
        <motion.p {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="text-slate-500 mt-3 max-w-2xl text-[15px] leading-7">
          DermaCare là web đặt lịch khám da liễu: bệnh nhân mô tả đúng vấn đề da, hệ thống gợi ý đúng
          bác sĩ chuyên khoa, lịch hẹn và thông báo được đồng bộ tức thì cho cả ba vai trò.
        </motion.p>

        {/* Vertical timeline */}
        <div className="relative mt-10 md:mt-14">
          {/* trục dọc */}
          <div className="absolute left-[7px] md:left-[9px] top-2 bottom-2 w-px bg-slate-200" aria-hidden />
          <div className="space-y-8 md:space-y-10">
            {ABOUT_TIMELINE.map((m, i) => (
              <motion.div
                key={m.no}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="relative pl-10 md:pl-14"
              >
                {/* chấm tròn xanh nhạt đè lên đường kẻ */}
                <span
                  className={`absolute left-0 top-1.5 w-[15px] h-[15px] md:w-[19px] md:h-[19px] rounded-full border-2 ${
                    m.highlight ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.15)]' : 'bg-emerald-100 border-emerald-400'
                  }`}
                />
                <div className={`text-3xl md:text-4xl font-extrabold tracking-tight ${m.highlight ? 'text-slate-900' : 'text-slate-300'}`}>
                  {m.no}
                </div>
                <div className={`font-bold mt-1 text-lg md:text-xl ${m.highlight ? 'text-slate-900' : 'text-gray-400'}`}>{m.title}</div>
                <div className={`inline-flex items-center gap-1.5 text-xs mt-1.5 ${m.highlight ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  <Calendar size={13} /> {m.date}
                  {m.highlight && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold tracking-wide">MỚI NHẤT</span>
                  )}
                </div>
                <p className={`text-sm leading-6 mt-2 max-w-2xl ${m.highlight ? 'text-slate-600' : 'text-gray-400'}`}>{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  const { isAuthenticated, role, homeByRole } = useAuth()
  const toast = useToast()
  const [doctors, setDoctors] = useState(FALLBACK_DOCTORS)
  const [contact, setContact] = useState({ full_name: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    listDoctors().then((d) => { if (d?.length) setDoctors(d) }).catch(() => {})
  }, [])

  async function submitContact(e) {
    e.preventDefault()
    if (!contact.full_name.trim()) return toast.push('Vui lòng nhập họ tên', 'error')
    if (!/^(0|\+84)[0-9]{9,10}$/.test(contact.phone.replace(/[\s.]/g, ''))) return toast.push('Số điện thoại chưa đúng', 'error')
    if (contact.message.trim().length < 10) return toast.push('Vui lòng mô tả rõ hơn (≥10 ký tự)', 'error')
    setSending(true)
    try {
      await saveContact({ full_name: contact.full_name.trim(), phone: contact.phone.trim(), message: contact.message.trim() })
      toast.push('Đã gửi liên hệ — DermaCare sẽ gọi lại sớm', 'success')
      setContact({ full_name: '', phone: '', message: '' })
    } catch (err) {
      toast.push(err.message || 'Gửi thất bại', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-sans">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><Stethoscope size={16} /></div>
            <div className="font-extrabold tracking-tight text-[15px]">DERMACARE</div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#gioi-thieu" className="hover:text-slate-900">Giới thiệu</a>
            <a href="#chuyen-khoa" className="hover:text-slate-900">Chuyên khoa</a>
            <a href="#bac-si" className="hover:text-slate-900">Bác sĩ</a>
            <a href="#lien-he" className="hover:text-slate-900">Liên hệ</a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to={homeByRole(role)} onClick={() => playClick('tap')} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
                Vào trang của tôi
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => playClick('tap')} className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium hover:bg-slate-50">Đăng nhập</Link>
                <Link to="/dat-lich" onClick={() => playClick('tap')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">Đặt lịch ngay</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO — đã xóa dòng "dùng thử", title dày nhưng nhẹ nhàng */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 pt-10 pb-10 md:pt-16 md:pb-14">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-extrabold tracking-tight text-slate-900 text-[34px] leading-[1.08] sm:text-[44px] md:text-[54px]"
              >
                Làn da khỏe,
                <br />
                bắt đầu từ một{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">lịch hẹn.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.6 }}
                className="text-slate-600 mt-4 text-[15px] leading-7 max-w-[540px]"
              >
                Kể triệu chứng da của bạn trong 2 phút — DermaCare gợi ý đúng bác sĩ chuyên khoa,
                xác nhận lịch nhanh và nhắc bạn trước giờ khám. Nhẹ nhàng, riêng tư, không chờ đợi.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 mt-6"
              >
                <Link to="/dat-lich" onClick={() => playClick('success')} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-[0_10px_30px_rgba(16,185,129,0.30)]">
                  Đặt lịch khám <ArrowRight size={16} />
                </Link>
                <a href="#chuyen-khoa" onClick={() => playClick('tap')} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold hover:bg-slate-50">
                  Xem 8 chuyên khoa
                </a>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-xs text-slate-500"
              >
                <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-emerald-600" /> Mở cửa 8:00 – 17:30 (T2 – T7)</span>
                <span className="inline-flex items-center gap-1.5"><Phone size={14} className="text-emerald-600" /> Hotline 1900 6368</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> Thông tin riêng tư</span>
              </motion.div>
            </div>

            {/* Card xem trước lịch hẹn — gọn, responsive */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="bg-white rounded-[24px] border border-slate-200 shadow-xl overflow-hidden">
                <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="text-sm font-bold">Phiếu đặt lịch</div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">Xác nhận trong 15 phút</span>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  {[
                    ['Chuyên khoa', 'Mụn trứng cá & Sẹo mụn'],
                    ['Bác sĩ gợi ý', 'BS. CKI Trần Mai Anh'],
                    ['Thời gian', 'Thứ 4 • 09:30'],
                    ['Trạng thái', 'Đã tiếp nhận ✓'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-semibold text-slate-900 text-right">{v}</span>
                    </div>
                  ))}
                  <Link to="/dat-lich" className="block text-center py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-100">
                    Tạo phiếu của bạn →
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* GIỚI THIỆU */}
      <AboutTimeline />

      {/* CHUYÊN KHOA — 8 nhóm */}
      <section id="chuyen-khoa" className="bg-[#FAFAF9] border-y border-slate-100">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 md:py-16">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] text-emerald-500">
            DERMACARE / CHUYÊN KHOA
          </motion.div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <motion.h2 {...fadeUp} transition={{ duration: 0.55 }} className="font-display font-extrabold tracking-tight text-3xl md:text-4xl mt-2">
              Tám nhóm điều trị chuyên sâu
            </motion.h2>
            <motion.p {...fadeUp} transition={{ duration: 0.5 }} className="text-slate-500 text-sm max-w-md">
              Chọn đúng nhóm bệnh ngay từ đầu — hệ thống tự gợi ý bác sĩ phù hợp khi bạn đặt lịch.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-8">
            {SPECIALTIES.map((s, i) => (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-emerald-200 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <SpecIcon slug={s.slug} />
                </div>
                <div className="font-bold mt-3 text-[15px] leading-snug">{s.name}</div>
                <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{s.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {s.diseases.slice(0, 3).map((d) => (
                    <span key={d} className="text-[11px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{d}</span>
                  ))}
                </div>
                <Link to={`/dat-lich?chuyen-khoa=${s.slug}`} className="inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 mt-4 hover:gap-2 transition-all">
                  Đặt lịch nhóm này <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ĐỘI NGŨ BÁC SĨ — dữ liệu động, logic */}
      <section id="bac-si" className="bg-white">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 md:py-16">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] text-emerald-500">
            DERMACARE / ĐỘI NGŨ BÁC SĨ
          </motion.div>
          <motion.h2 {...fadeUp} transition={{ duration: 0.55 }} className="font-display font-extrabold tracking-tight text-3xl md:text-4xl mt-2">
            Bác sĩ đúng chuyên môn cho từng làn da
          </motion.h2>
          <motion.p {...fadeUp} transition={{ duration: 0.5 }} className="text-slate-500 mt-2 text-sm max-w-2xl leading-6">
            Danh sách tự cập nhật từ hệ thống — tài khoản bác sĩ do quản trị cấp và hiển thị realtime tại đây.
            Đặt lịch sẽ được gợi ý đúng bác sĩ theo nhóm bệnh bạn chọn.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-8">
            {doctors.map((d, i) => (
              <motion.div
                key={d.user_id || d.full_name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-extrabold">
                  {d.full_name?.replace('BS. ', '').charAt(0) || 'B'}
                </div>
                <div className="font-bold mt-3">{d.full_name}</div>
                <div className="text-xs font-semibold text-emerald-700 mt-1">{d.specialty}</div>
                {d.experience && <div className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1"><Check size={12} className="text-emerald-500" /> {d.experience}</div>}
                {d.bio && <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">{d.bio}</p>}
                <Link
                  to={`/dat-lich?bac-si=${encodeURIComponent(d.full_name)}&chuyen-khoa=${d.specialty_slug || ''}`}
                  className="mt-4 block text-center py-2.5 rounded-xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-800"
                >
                  Đặt lịch với bác sĩ
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QUY TRÌNH ĐẶT LỊCH */}
      <section className="bg-slate-900 text-white overflow-hidden">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 md:py-16 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] text-emerald-400">DERMACARE / ĐẶT LỊCH</div>
            <h2 className="font-display font-extrabold tracking-tight text-3xl md:text-4xl mt-2">Đặt lịch trong 2 phút</h2>
            <p className="text-slate-300 mt-3 text-sm leading-6">Mỗi bước đều bắt buộc điền đủ thông tin mới qua tiếp — để bác sĩ hiểu đúng da bạn trước giờ khám.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                'Bước 1–2: Chọn nhóm bệnh & bác sĩ, ngày giờ phù hợp',
                'Bước 3: Điền thông tin cá nhân (họ tên, SĐT, ngày sinh)',
                'Bước 4: Khai tiền sử da — chọn Có/Không, nếu Có phải ghi rõ',
                'Bước 5: Xác nhận — nhận thông báo thành công, bác sĩ nhận lịch ngay',
              ].map((t) => (
                <li key={t} className="flex gap-2"><Check size={16} className="text-emerald-400 shrink-0 mt-0.5" /> {t}</li>
              ))}
            </ul>
            <Link to="/dat-lich" className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400">
              Bắt đầu đặt lịch <ArrowRight size={16} />
            </Link>
          </div>
          <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="bg-white rounded-2xl text-slate-900 p-5 sm:p-6">
            <div className="flex items-center gap-2 font-bold"><Calendar size={18} className="text-emerald-600" /> Lịch mẫu tuần này</div>
            <div className="mt-4 space-y-2 text-sm">
              {[['Thứ 3 • 08:00', 'BS. CKI Trần Mai Anh', 'Còn 3 chỗ'], ['Thứ 4 • 09:30', 'BS. CKI Nguyễn Hoàng Nam', 'Còn 5 chỗ'], ['Thứ 6 • 15:00', 'BS. CKII Lê Phương Thảo', 'Còn 2 chỗ']].map(([a, b, c]) => (
                <div key={a} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                  <div><div className="font-semibold">{a}</div><div className="text-xs text-slate-500">{b}</div></div>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold whitespace-nowrap">{c}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* LIÊN HỆ — không địa chỉ */}
      <section id="lien-he" className="bg-white">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 md:py-16 grid lg:grid-cols-2 gap-8">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] text-emerald-500">DERMACARE / LIÊN HỆ</div>
            <h2 className="font-display font-extrabold tracking-tight text-3xl md:text-4xl mt-2">Cần tư vấn? Nhắn là có người gọi lại</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><Phone size={18} /></div>
                <div><div className="font-bold">Hotline 1900 6368</div><div className="text-slate-500 text-xs">8:00 – 17:30, Thứ 2 – Thứ 7</div></div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Clock size={18} /></div>
                <div><div className="font-bold">Phản hồi trong 15 phút</div><div className="text-slate-500 text-xs">Trong giờ làm việc, kể cả đặt lịch online</div></div>
              </div>
            </div>
          </div>
          <form onSubmit={submitContact} className="bg-slate-50 border border-slate-200 rounded-[24px] p-5 sm:p-6 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">HỌ VÀ TÊN *</span>
              <input value={contact.full_name} onChange={(e) => setContact({ ...contact, full_name: e.target.value })} placeholder="Nguyễn Thị Thư" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">SỐ ĐIỆN THOẠI *</span>
              <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="0901234567" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-widest text-slate-500">BẠN CẦN HỖ TRỢ GÌ? *</span>
              <textarea value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} rows={4} placeholder="VD: Da mình nổi mụn viêm 2 tuần nay, muốn đặt lịch bác sĩ chuyên mụn…" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
            </label>
            <button disabled={sending} className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50">
              {sending ? 'Đang gửi…' : 'Gửi liên hệ'}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER — gọn, không địa chỉ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center"><Stethoscope size={16} /></div>
            <div>
              <div className="font-extrabold tracking-tight text-sm">DERMACARE</div>
              <div className="text-xs text-slate-500">Làn da khỏe, bắt đầu từ một lịch hẹn.</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">© 2026 DermaCare • Hotline 1900 6368 • Thông tin đặt lịch được bảo mật</div>
        </div>
      </footer>
    </div>
  )
}
