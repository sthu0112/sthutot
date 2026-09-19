import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Database, Image as ImageIcon, ClipboardList, Search, Users, Stethoscope, ArrowRight, Check, FileText, Activity, HeartPulse, Layers, Clock, Award, Lock, Baby, Smile, User, HeartHandshake, ChevronDown, Star, Phone, MessageCircle, CalendarCheck, Sparkles, ScanFace } from 'lucide-react'
import { useAuth, homeByRole } from '../contexts/AuthContext'
import { playClick } from '../utils/sound'
import { AIChatWidget } from './AIChat'
import { SPECIALTIES } from '../data/content'

function FeatureCard({ icon: Icon, title, desc, delay = 0, href = null, cta = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-stone rounded-2xl p-6 h-full hover:shadow-card transition-shadow"
    >
      <div className="w-10 h-10 rounded-full bg-forest text-snow flex items-center justify-center">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <h3 className="font-sans font-semibold text-forest mt-4 text-[18px] tracking-[-0.18px]">{title}</h3>
      <p className="font-sans text-[16px] text-pewter mt-1.5 leading-[1.5]">{desc}</p>
      {href && (
        <a href={href} className="inline-flex items-center gap-1 mt-3 font-sans text-[14px] font-medium text-forest underline underline-offset-4 decoration-[1.5px]">
          {cta || 'Dùng ngay'} <ArrowRight size={14} />
        </a>
      )}
    </motion.div>
  )
}

const AGE_GROUPS = [
  { icon: Baby, name: 'Bé 0–12 tuổi', desc: 'Viêm da cơ địa, chàm sữa, mẩn ngứa, thủy đậu. Nội dung dễ hiểu cho ba mẹ.', tag: 'Cho ba mẹ' },
  { icon: Smile, name: 'Teen 13–19 tuổi', desc: 'Mụn dậy thì, thâm sau mụn, viêm nang lông. Phác đồ nhẹ, ít kích ứng.', tag: 'Tuổi dậy thì' },
  { icon: User, name: 'Người lớn 20–59', desc: 'Mụn nội tiết, nám, viêm da tiếp xúc, rụng tóc. Soi da & theo dõi tái khám.', tag: 'Phổ biến nhất' },
  { icon: HeartHandshake, name: 'Ông bà 60+', desc: 'Khô da, ngứa mạn, dày sừng, tầm soát nốt ruồi. Chăm sóc nhẹ nhàng tại nhà.', tag: 'Tầm soát kỹ' },
]

const FAQS = [
  { q: 'Đặt lịch online mất bao lâu?', a: 'Khoảng 5 phút với 5 bước: chọn nhóm bệnh → bác sĩ & giờ → thông tin → tiền sử da → xác nhận. Bạn nhận thông báo ngay khi bác sĩ xác nhận.' },
  { q: 'Tôi có cần tạo tài khoản để đặt lịch không?', a: 'Không bắt buộc. Khách vẫn đặt được bằng họ tên + SĐT. Nhưng tạo tài khoản miễn phí giúp bạn theo dõi lịch realtime, nhận thông báo xác nhận và xem lại lịch sử khám.' },
  { q: 'Dữ liệu của tôi có an toàn không?', a: 'Có. Web dùng Supabase Auth + Row Level Security: chưa đăng nhập thì không đọc/ghi. Ảnh lưu ở bucket riêng tư luutruhoso, chỉ xem qua liên kết có hạn 1 giờ.' },
  { q: 'Có bao nhiêu khung giờ mỗi ngày?', a: '9 khung giờ: 08:00, 08:45, 09:30, 10:15, 13:30, 14:15, 15:00, 15:45, 16:30. Vui lòng chọn từ ngày mai để phòng khám sắp xếp.' },
  { q: 'Trợ lý AI có thay bác sĩ không?', a: 'Không. AI chỉ hỏi đáp và hướng dẫn chăm sóc tại nhà từ kho cẩm nang. Chẩn đoán và kê đơn phải do bác sĩ khám trực tiếp.' },
  { q: 'Tôi muốn xem lại lịch đã đặt?', a: 'Đăng nhập → trang Bệnh nhân sẽ thấy toàn bộ lịch (chờ xác nhận / đã xác nhận / đã khám xong). Hoặc gọi hotline 1900 6368 để được tra cứu.' },
]

const TESTIMONIALS = [
  { name: 'Chị Minh Anh, 26t — Mụn viêm', text: 'Đặt lịch 5 phút, bác sĩ xác nhận trong 15 phút. Timeline tái khám rõ ràng, ảnh lưu riêng tư nên yên tâm.', stars: 5 },
  { name: 'Anh Hoàng Nam, 34t — Viêm da cơ địa', text: 'Tôi thích phần tiền sử da hỏi rất kỹ. Bác sĩ đúng chuyên khoa nên đỡ phải kể lại nhiều lần.', stars: 5 },
  { name: 'Cô Phương Thảo, 52t — Nám', text: 'Cẩm nang viết dễ hiểu, AI trả lời nhanh. Lớn tuổi như tôi vẫn dùng được, chữ to rõ ràng.', stars: 5 },
]

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="bg-white border border-forest/10 rounded-2xl overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="font-sans font-semibold text-[15px] text-forest">{q}</span>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-4 font-sans text-[14px] text-pewter leading-relaxed">{a}</div>}
    </div>
  )
}

export default function Landing() {
  const { isAuthenticated, role } = useAuth()
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="min-h-screen w-full max-w-none bg-snow text-forest overflow-x-clip font-sans">
      {/* PROMO BANNER — full */}
      <div className="w-full bg-snow border-b border-forest/10">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-10 flex items-center justify-center gap-2 text-[12px] font-sans font-medium uppercase tracking-wide text-center">
          <span className="px-2 py-[6px] rounded-pill bg-lime text-forest text-[12px] font-sans font-medium leading-none">Mới</span>
          <span className="font-sans">Đặt lịch online — xác nhận trong 15 phút</span>
          <Link to="/dat-lich" className="underline underline-offset-4 decoration-[1.5px] font-sans">Đặt ngay →</Link>
        </div>
      </div>

      {/* NAV — full */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 w-full bg-snow/95 backdrop-blur border-b border-forest/10"
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-sans font-semibold tracking-tight text-[18px]">DermaCare</span>
            <span className="w-2 h-2 rounded-full bg-forest" />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[15px] font-sans text-forest whitespace-nowrap">
            <a href="#tong-quan" className="hover:opacity-70">Tổng quan</a>
            <a href="#chuyen-khoa" className="hover:opacity-70">Chuyên khoa</a>
            <a href="#do-tuoi" className="hover:opacity-70">Độ tuổi</a>
            <a href="#tinh-nang" className="hover:opacity-70">Tính năng</a>
            <a href="#faq" className="hover:opacity-70">Hỏi đáp</a>
            <Link to="/dat-lich" className="hover:opacity-70">Đặt lịch</Link>
            <a href="/soi-da" className="hover:opacity-70">Soi da</a>
            <Link to="/tro-ly-ai" className="hover:opacity-70">Hỏi AI</Link>
            <Link to="/cam-nang" className="hover:opacity-70">Cẩm nang</Link>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to={homeByRole(role)} onClick={() => playClick('tap')} className="px-6 py-4 rounded-pill bg-forest text-snow text-[16px] font-sans hover:opacity-90">Vào trang của tôi</Link>
            ) : (
              <>
                <Link to="/login" onClick={() => playClick('tap')} className="hidden sm:inline-flex px-6 py-4 rounded-pill bg-snow border-[1.5px] border-forest text-forest text-[16px] font-sans hover:opacity-80">Đăng nhập</Link>
                <Link to="/register" onClick={() => playClick('tap')} className="px-6 py-4 rounded-pill bg-forest text-snow text-[16px] font-sans hover:opacity-90">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* HERO — full */}
      <section className="relative w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 pt-16 pb-16 md:pt-24 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.6 }}
                className="inline-flex items-center gap-2 text-[12px] font-sans font-medium px-2 py-[6px] rounded-pill bg-lime text-forest"
              >
                Phòng khám & bệnh viện da liễu
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-sans font-semibold text-[40px] md:text-[48px] leading-[1.1] tracking-[-0.72px] mt-6"
              >
                Làn da khỏe,<br />bắt đầu từ một lịch hẹn.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.6 }}
                className="font-sans text-[16px] leading-[1.5] text-forest mt-6 max-w-[560px]"
              >
                DermaCare là web app cho bác sĩ da liễu: mã hồ sơ <span className="font-mono font-light">DERM-YYYY-XXXXXX</span> duy nhất,
                thăm khám có cấu trúc, hình ảnh tổn thương lưu riêng tư — và đặt lịch online xác nhận trong 15 phút.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.6 }}
                className="flex flex-wrap gap-4 mt-8"
              >
                <Link to="/dat-lich" onClick={() => playClick('success')} className="inline-flex items-center gap-2 px-6 py-4 rounded-pill bg-forest text-snow text-[16px] font-sans hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  Đặt lịch khám <ArrowRight size={16} strokeWidth={1.5} />
                </Link>
                <Link to="/login" onClick={() => playClick('tap')} className="inline-flex items-center gap-2 px-6 py-4 rounded-pill bg-snow border-[1.5px] border-forest text-forest text-[16px] font-sans hover:opacity-80 hover:scale-[1.02] active:scale-[0.98] transition-transform">Xem demo</Link>
                <a href="/soi-da" onClick={() => playClick('success')} className="inline-flex items-center gap-2 px-8 py-5 rounded-pill bg-lime text-forest text-[18px] font-sans font-semibold shadow-lg hover:opacity-90 hover:scale-[1.03] active:scale-[0.98] transition-transform"><ScanFace size={20} strokeWidth={2} /> Soi da AI</a>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-[14px] font-sans text-pewter"
              >
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} strokeWidth={1.5} /> RLS bảo vệ dữ liệu</span>
                <span className="inline-flex items-center gap-1.5"><Lock size={15} strokeWidth={1.5} /> Lưu trữ riêng tư</span>
                <span className="inline-flex items-center gap-1.5"><Award size={15} strokeWidth={1.5} /> Nhật ký kiểm tra</span>
              </motion.div>
            </div>

            {/* Preview card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: [0, -7, 0] }}
              transition={{ opacity: { delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }, y: { delay: 1.2, duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
              className="relative lg:pl-6"
            >
              <div className="bg-stone rounded-[32px] p-4">
                <div className="bg-snow rounded-2xl overflow-hidden">
                  <div className="h-9 bg-stone flex items-center gap-1.5 px-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-ash" /><span className="w-2.5 h-2.5 rounded-full bg-ash" /><span className="w-2.5 h-2.5 rounded-full bg-sage" />
                    <span className="ml-3 font-mono font-light text-[12px] text-pewter">dermacare/patients/DERM-2026-000001</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-forest text-snow flex items-center justify-center font-sans font-medium">N</div>
                      <div>
                        <div className="font-sans text-[16px] font-medium">Nguyễn Minh Anh</div>
                        <div className="font-mono font-light text-[12px] text-pewter">DERM-2026-000001 · Nữ · 26 tuổi</div>
                      </div>
                      <span className="ml-auto px-2 py-[6px] rounded-pill bg-lime text-forest text-[12px] font-sans font-medium">Hoạt động</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="rounded-2xl bg-stone p-3 text-center">
                        <div className="font-sans text-[24px] font-light tracking-[-0.48px]">3</div><div className="font-sans text-[12px] text-pewter">Lần khám</div>
                      </div>
                      <div className="rounded-2xl bg-stone p-3 text-center">
                        <div className="font-sans text-[24px] font-light tracking-[-0.48px]">2</div><div className="font-sans text-[12px] text-pewter">Ảnh</div>
                      </div>
                      <div className="rounded-2xl bg-stone p-3 text-center">
                        <div className="font-sans text-[24px] font-light tracking-[-0.48px]">DERM</div><div className="font-sans text-[12px] text-pewter">Mã duy nhất</div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-stone overflow-hidden">
                      <div className="px-3 py-2 font-sans text-[12px] font-medium">Timeline — 2026-08-10 → 2026-08-24 → 2026-09-12</div>
                      <div className="p-3 flex gap-2">
                        <svg viewBox="0 0 80 56" className="w-20 h-14 rounded-lg bg-forest" role="img" aria-label="Ảnh quét soi da mẫu">
                          <ellipse cx="40" cy="30" rx="20" ry="24" fill="none" stroke="#d3fa99" strokeWidth="1.6" strokeDasharray="4 3" />
                          <circle cx="33" cy="26" r="2.2" fill="#f87171" />
                          <circle cx="46" cy="33" r="2.8" fill="#f87171" />
                          <circle cx="40" cy="42" r="1.8" fill="#c084fc" />
                          <rect x="29" y="21" width="9" height="9" fill="none" stroke="#f87171" strokeWidth="1.4" />
                          <rect x="41" y="28" width="11" height="11" fill="none" stroke="#f87171" strokeWidth="1.4" />
                        </svg>
                        <svg viewBox="0 0 80 56" className="w-20 h-14 rounded-lg bg-forest" role="img" aria-label="Biểu đồ kết quả mẫu">
                          <circle cx="24" cy="28" r="14" fill="none" stroke="#d3fa99" strokeWidth="5" strokeDasharray="52 36" transform="rotate(-90 24 24)" />
                          <circle cx="24" cy="28" r="14" fill="none" stroke="#f87171" strokeWidth="5" strokeDasharray="18 70" strokeDashoffset="-52" transform="rotate(-90 24 24)" />
                          <rect x="44" y="14" width="28" height="6" rx="3" fill="#d3fa99" />
                          <rect x="44" y="25" width="20" height="6" rx="3" fill="#5eead4" />
                          <rect x="44" y="36" width="24" height="6" rx="3" fill="#f0fdf4" opacity="0.7" />
                        </svg>
                        <div className="flex-1 font-sans text-[14px]"><span className="font-medium">Mụn trứng cá trung bình</span><br /><span className="text-pewter">Adapalene + Doxycycline</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* TỔNG QUAN — cùng 1 font với web (Inter / Be Vietnam Pro) */}
          <div id="tong-quan" className="mt-16 md:mt-20 scroll-mt-24">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-sans font-semibold text-forest leading-[1.15] tracking-tight text-[clamp(24px,4vw,44px)]"
            >
              Mọi thứ bạn cần — gọn nhẹ
            </motion.h2>
            <p className="font-sans text-[15px] text-pewter mt-2">Cùng một font chữ với toàn web — rõ ràng, dễ đọc trên mọi thiết bị.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {[
                { k: 'Chuyên khoa', v: '8 nhóm bệnh da', d: 'Mụn, viêm da, nám, nấm...' },
                { k: 'Độ tuổi', v: 'Bé → ông bà', d: 'Nội dung theo từng lứa tuổi' },
                { k: 'Đặt lịch', v: '5 phút online', d: '9 khung giờ mỗi ngày' },
                { k: 'Đồng hành', v: 'AI + Cẩm nang', d: 'Hỏi đáp và chăm sóc tại nhà' },
              ].map((s, i) => (
                <motion.div
                  key={s.k}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-2xl border border-forest/10 p-5 cursor-default hover:shadow-card transition-shadow"
                >
                  <div className="font-sans text-[12px] uppercase tracking-[0.12em] text-pewter">{s.k}</div>
                  <div className="font-sans font-semibold text-forest text-[22px] leading-snug mt-2">{s.v}</div>
                  <div className="font-sans text-[13px] text-pewter mt-1">{s.d}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CHUYÊN KHOA — 8 nhóm, bấm để đặt lịch đúng nhóm */}
      <section id="chuyen-khoa" className="w-full bg-white border-y border-forest/10 scroll-mt-20">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="font-sans text-[12px] uppercase tracking-wide text-pewter font-medium">Chuyên khoa</div>
              <h2 className="font-sans font-semibold text-[32px] md:text-[36px] leading-[1.1] tracking-tight mt-2">8 nhóm bệnh da — đặt đúng bác sĩ</h2>
              <p className="font-sans text-[15px] text-pewter mt-2">Bấm vào nhóm bệnh để đặt lịch, web tự gợi ý bác sĩ đúng chuyên môn.</p>
            </div>
            <Link to="/dat-lich" className="inline-flex items-center gap-2 px-5 py-3 rounded-pill bg-forest text-snow font-sans text-[14px] shrink-0">Đặt lịch ngay <ArrowRight size={15} /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {SPECIALTIES.map((s, i) => (
              <motion.div key={s.slug} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}>
                <Link to={`/dat-lich?chuyen-khoa=${s.slug}`} onClick={() => playClick('tap')} className="block h-full bg-snow border border-forest/10 rounded-2xl p-5 hover:border-forest/30 hover:shadow-card transition">
                  <div className="w-9 h-9 rounded-full bg-lime text-forest flex items-center justify-center"><Sparkles size={16} /></div>
                  <div className="font-sans font-semibold text-[16px] mt-3 leading-snug">{s.name}</div>
                  <div className="font-sans text-[13px] text-pewter mt-1 leading-relaxed">{s.diseases.slice(0, 3).join(' • ')}</div>
                  <div className="font-sans text-[13px] font-medium mt-3 underline underline-offset-4">Đặt nhóm này →</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ĐỘ TUỔI — Bé → ông bà */}
      <section id="do-tuoi" className="w-full scroll-mt-20">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-20">
          <div className="font-sans text-[12px] uppercase tracking-wide text-pewter font-medium">Độ tuổi</div>
          <h2 className="font-sans font-semibold text-[32px] md:text-[36px] leading-[1.1] tracking-tight mt-2">Bé → ông bà, nội dung theo từng lứa tuổi</h2>
          <p className="font-sans text-[15px] text-pewter mt-2">Mỗi lứa tuổi có cách hỏi bệnh, phác đồ và cẩm nang riêng.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {AGE_GROUPS.map((g, i) => {
              const Icon = g.icon
              return (
                <motion.div key={g.name} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.06 }} className="bg-stone rounded-2xl p-6 h-full">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-forest text-snow flex items-center justify-center"><Icon size={18} /></div>
                    <span className="px-2 py-1 rounded-pill bg-lime text-forest font-sans text-[11px] font-medium">{g.tag}</span>
                  </div>
                  <div className="font-sans font-semibold text-[17px] mt-4">{g.name}</div>
                  <div className="font-sans text-[14px] text-pewter mt-1.5 leading-relaxed">{g.desc}</div>
                  <div className="flex gap-2 mt-4">
                    <Link to="/dat-lich" className="flex-1 text-center px-3 py-2.5 rounded-xl bg-forest text-snow font-sans text-[13px] font-medium">Đặt lịch</Link>
                    <Link to="/cam-nang" className="flex-1 text-center px-3 py-2.5 rounded-xl bg-snow border border-forest/20 font-sans text-[13px] font-medium">Cẩm nang</Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* THỐNG KÊ NHANH — full */}
      <section className="w-full bg-forest text-snow">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { v: '8', l: 'Nhóm bệnh da chuyên sâu' },
            { v: '9', l: 'Khung giờ khám mỗi ngày' },
            { v: '15′', l: 'Xác nhận lịch trung bình' },
            { v: '4', l: 'Nhóm tuổi được chăm sóc' },
          ].map((s) => (
            <div key={s.l} className="text-center lg:text-left">
              <div className="font-sans font-semibold text-[36px] leading-none text-lime">{s.v}</div>
              <div className="font-sans text-[14px] opacity-80 mt-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES — full */}
      <section id="tinh-nang" className="w-full scroll-mt-20">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="font-sans text-[12px] uppercase tracking-wide text-pewter font-medium">Tính năng</div>
            <h2 className="font-sans font-semibold text-[32px] md:text-[36px] leading-[1.1] tracking-tight mt-3">Mọi thứ phòng khám cần — không rườm rà</h2>
            <p className="font-sans text-[16px] text-pewter mt-3 leading-[1.5]">Thiết kế tối giản, thao tác nhanh với bàn phím và tìm kiếm bằng mã hồ sơ.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            <FeatureCard icon={ClipboardList} title="Hồ sơ & mã duy nhất" desc="Tự sinh DERM-YYYY-XXXXXX, không trùng, sao chép 1 chạm, tìm kiếm tức thì." delay={0.05} />
            <FeatureCard icon={Activity} title="Thăm khám có cấu trúc" desc="Lý do, triệu chứng, khám da, chẩn đoán, điều trị, tái khám — đầy đủ." delay={0.1} />
            <FeatureCard icon={ScanFace} title="Soi da AI" desc="Chụp 3 góc mặt, AI khoanh vùng mụn — thâm — sắc tố, đối chứng đa góc trước khi kết luận." delay={0.15} href="/soi-da" cta="Quét da ngay" />
            <FeatureCard icon={Search} title="Tìm kiếm toàn cục" desc="Ctrl+K tìm bằng mã/tên/SĐT, ưu tiên mã hồ sơ chính xác." delay={0.05} />
            <FeatureCard icon={Users} title="Phân quyền" desc="admin/doctor/patient + RLS ở DB, không chỉ frontend." delay={0.1} />
            <FeatureCard icon={FileText} title="Xuất & in" desc="In PDF hồ sơ, kiểm tra quyền trước khi xuất." delay={0.15} />
          </div>

          {/* Tra cứu nhanh — không lộ dữ liệu người khác */}
          <div className="mt-10 rounded-[24px] bg-stone p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <div className="font-sans font-semibold text-[20px] flex items-center gap-2"><CalendarCheck size={20} /> Đã đặt lịch rồi?</div>
              <div className="font-sans text-[14px] text-pewter mt-1">Đăng nhập để xem trạng thái realtime: chờ xác nhận → đã xác nhận → đã khám xong.</div>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link to={isAuthenticated ? homeByRole(role) : '/login'} className="inline-flex items-center gap-2 px-6 py-3 rounded-pill bg-forest text-snow font-sans text-[14px]">Xem lịch của tôi <ArrowRight size={15} /></Link>
              <a href="tel:19006368" className="inline-flex items-center gap-2 px-6 py-3 rounded-pill bg-snow border-[1.5px] border-forest font-sans text-[14px]"><Phone size={15} /> 1900 6368</a>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY — dark full */}
      <section id="security" className="w-full bg-forest text-snow">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-sans font-medium px-2 py-[6px] rounded-pill bg-lime text-forest"><ShieldCheck size={14} strokeWidth={1.5} /> Bảo mật là tính năng số 1</div>
            <h2 className="font-sans font-semibold text-[32px] md:text-[36px] leading-[1.1] tracking-tight mt-4">An toàn dữ liệu nhạy cảm</h2>
            <p className="font-sans text-[16px] mt-4 leading-[1.5] opacity-90">Kho lưu trữ luôn riêng tư, RLS bật mọi bảng, nhật ký kiểm tra không cho người dùng thường sửa.</p>
            <ul className="mt-8 space-y-3 font-sans text-[16px]">
              {[
                'Xác thực + RLS — chưa đăng nhập = không đọc/ghi',
                'Lưu trữ riêng tư + liên kết 1 giờ — không công khai vĩnh viễn',
                'Mã hồ sơ an toàn đồng thời với khóa tư vấn',
                'Xóa mềm + hộp xác nhận — chống xóa nhầm',
              ].map((t) => (
                <li key={t} className="flex gap-3"><Check size={16} strokeWidth={1.5} className="shrink-0 mt-1" /> {t}</li>
              ))}
            </ul>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-snow rounded-2xl text-forest p-6"
          >
            <div className="flex items-center gap-2 font-sans font-medium text-[18px] tracking-tight"><ShieldCheck size={18} strokeWidth={1.5} /> Dữ liệu của bạn được bảo vệ</div>
            <div className="mt-4 space-y-2">
              {[
                { icon: Lock, t: 'Tài khoản riêng tư', d: 'Đăng nhập mới xem được hồ sơ của chính mình.' },
                { icon: ImageIcon, t: 'Ảnh da khóa kín', d: 'Kho riêng tư, link xem tự hết hạn sau 1 giờ.' },
                { icon: ClipboardList, t: 'Hồ sơ đúng người', d: 'Chỉ bác sĩ điều trị và bạn xem được.' },
                { icon: Check, t: 'Mọi lượt xem đều ghi lại', d: 'Ai mở hồ sơ cũng để lại nhật ký kiểm tra.' },
              ].map((r) => (
                <div key={r.t} className="rounded-xl bg-stone px-4 py-3 flex items-start gap-3">
                  <span className="w-8 h-8 shrink-0 rounded-full bg-forest text-snow flex items-center justify-center"><r.icon size={15} strokeWidth={1.5} /></span>
                  <span><span className="block font-sans font-semibold text-[14px]">{r.t}</span><span className="block font-sans text-[13px] text-pewter mt-0.5">{r.d}</span></span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-lime text-forest px-4 py-3 font-sans text-[13px] font-medium">Không bán, không chia sẻ dữ liệu của bạn cho bên thứ ba.</div>
          </motion.div>
        </div>
      </section>

      {/* WORKFLOW — full */}
      <section id="workflow" className="w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-24">
          <div className="font-sans text-[12px] uppercase tracking-wide text-pewter font-medium">Quy trình</div>
          <h2 className="font-sans font-semibold text-[32px] md:text-[36px] leading-[1.1] tracking-tight mt-3">3 bước — từ tiếp nhận đến tái khám</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[
              { n: '01', t: 'Tạo hồ sơ', d: 'Nhập họ tên, SĐT, tiền sử da liễu → hệ thống sinh DERM-... tự động.', icon: Layers },
              { n: '02', t: 'Thăm khám & lưu ảnh', d: 'Ghi chẩn đoán, phác đồ, tải ảnh vào đúng lượt khám — riêng tư.', icon: HeartPulse },
              { n: '03', t: 'Theo dõi & tái khám', d: 'Timeline, lọc cần tái khám, in PDF khi cần.', icon: Clock },
            ].map((s) => {
              const Icon = s.icon
              return (
                <motion.div key={s.n} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="bg-stone rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-[6px] rounded-pill bg-forest text-snow font-sans text-[12px] font-medium">{s.n}</div>
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <div className="font-sans font-semibold text-[18px] tracking-tight mt-4">{s.t}</div>
                  <div className="font-sans text-[16px] text-pewter mt-1 leading-[1.5]">{s.d}</div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ĐÁNH GIÁ — full */}
      <section className="w-full bg-stone/60 border-y border-forest/10">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-20">
          <div className="font-sans text-[12px] uppercase tracking-wide text-pewter font-medium">Đánh giá</div>
          <h2 className="font-sans font-semibold text-[32px] md:text-[36px] tracking-tight mt-2">Bệnh nhân nói gì?</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-forest/10 p-6">
                <div className="flex gap-1 text-lime">{Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={15} fill="currentColor" className="text-forest" />)}</div>
                <p className="font-sans text-[15px] mt-3 leading-relaxed">“{t.text}”</p>
                <div className="font-sans text-[13px] text-pewter font-medium mt-4">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — full */}
      <section id="faq" className="w-full scroll-mt-20">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 md:py-24 grid lg:grid-cols-[1fr_1.4fr] gap-10">
          <div>
            <div className="font-sans text-[12px] uppercase tracking-wide text-pewter font-medium">Hỏi đáp</div>
            <h2 className="font-sans font-semibold text-[32px] md:text-[36px] tracking-tight mt-2">Câu hỏi thường gặp</h2>
            <p className="font-sans text-[15px] text-pewter mt-3">Không thấy câu trả lời? Hỏi AI hoặc gọi hotline.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/tro-ly-ai" className="inline-flex items-center gap-2 px-5 py-3 rounded-pill bg-forest text-snow font-sans text-[14px]"><MessageCircle size={15} /> Hỏi AI</Link>
              <a href="tel:19006368" className="inline-flex items-center gap-2 px-5 py-3 rounded-pill border-[1.5px] border-forest font-sans text-[14px]"><Phone size={15} /> 1900 6368</a>
            </div>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} open={openFaq === i} onToggle={() => { playClick('tap'); setOpenFaq(openFaq === i ? -1 : i) }} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA — full */}
      <section className="w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 pb-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full rounded-[32px] bg-forest text-snow p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between"
          >
            <div>
              <div className="font-sans font-semibold text-[30px] md:text-[34px] leading-[1.1]">Sẵn sàng cho làn da khỏe?</div>
              <div className="font-sans text-[16px] mt-2 opacity-90">Đặt lịch trong 5 phút, xác nhận trong 15 phút. 9 khung giờ mỗi ngày.</div>
            </div>
            <div className="flex flex-wrap gap-4 shrink-0">
              <Link to="/dat-lich" onClick={() => playClick('success')} className="px-6 py-4 rounded-pill bg-snow text-forest font-sans text-[16px] hover:opacity-90">Đặt lịch khám</Link>
              <Link to="/register" onClick={() => playClick('tap')} className="px-6 py-4 rounded-pill bg-transparent border-[1.5px] border-snow text-snow font-sans text-[16px] hover:opacity-80">Tạo tài khoản</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER — full */}
      <footer className="w-full bg-forest text-snow">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 pt-10 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55 }}
            className="flex flex-col md:flex-row md:items-center gap-4 justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-lime text-forest flex items-center justify-center"><Stethoscope size={19} strokeWidth={1.5} /></div>
              <div>
                <div className="font-sans font-semibold tracking-tight text-[18px]">DermaCare</div>
                <div className="font-sans text-[13px] opacity-70">Làn da khỏe, bắt đầu từ một lịch hẹn.</div>
              </div>
            </div>
            <div className="flex items-center gap-2 font-sans text-[14px]">
              <span className="tracking-[0.2em] text-lime">★★★★★</span>
              <span className="opacity-80">Được phòng khám da liễu tin dùng · Hotline 1900 6368</span>
            </div>
          </motion.div>

          <div className="border-t border-snow/15 mt-6 pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { h: 'Khám bệnh', links: [['Đặt lịch khám', '/dat-lich'], ['Soi da AI', '/soi-da'], ['Hỏi AI trước khi đặt', '/tro-ly-ai'], ['Cẩm nang da', '/cam-nang'], ['Lịch của tôi', '/benh-nhan']] },
              { h: 'Tài liệu', links: [['Tổng quan', '#tong-quan'], ['Chuyên khoa', '#chuyen-khoa'], ['Độ tuổi', '#do-tuoi'], ['Hỏi đáp', '#faq']] },
              { h: 'Tài khoản', links: [['Đăng nhập', '/login'], ['Đăng ký', '/register'], ['Trang bác sĩ', '/bac-si']] },
              { h: 'Liên hệ', links: [['Hotline: 1900 6368', 'tel:19006368'], ['Về trang chủ', '/'], ['Đặt lịch khám', '/dat-lich']] },
            ].map((col, ci) => (
              <motion.div
                key={col.h}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: ci * 0.06 }}
              >
                <div className="font-sans text-[12px] uppercase tracking-[0.14em] font-medium opacity-90">{col.h}</div>
                <ul className="mt-3 space-y-2.5 font-sans text-[14px]">
                  {col.links.map(([label, to]) => (
                    <li key={label}>
                      {to.startsWith('#') ? (
                        <a href={to} className="opacity-70 hover:opacity-100">{label}</a>
                      ) : to.startsWith('tel:') ? (
                        <a href={to} className="opacity-70 hover:opacity-100">{label}</a>
                      ) : to.startsWith('/soi-da') ? (
                        <a href={to} className="opacity-70 hover:opacity-100">{label}</a>
                      ) : (
                        <Link to={to} className="opacity-70 hover:opacity-100">{label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="border-t border-snow/15 mt-6 pt-4 flex items-center justify-between gap-3">
            <div className="font-sans text-[12px] opacity-60">© 2026 DermaCare — Thông tin đặt lịch được bảo mật</div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex font-sans text-[12px] px-3 py-1.5 rounded-pill border border-snow/25 opacity-80">Tiếng Việt</span>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-10 h-10 rounded-full bg-snow text-forest flex items-center justify-center hover:opacity-90" aria-label="Về đầu trang">↑</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Nút nổi mobile + hotline */}
      <div className="fixed bottom-4 inset-x-4 z-40 md:hidden">
        <Link to="/dat-lich" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-forest text-snow font-sans font-semibold text-[15px] shadow-xl">Đặt lịch khám — 5 phút <ArrowRight size={16} /></Link>
      </div>
      <a href="tel:19006368" className="hidden md:flex fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-forest text-snow items-center justify-center shadow-xl hover:opacity-90" aria-label="Gọi hotline"><Phone size={18} /></a>

      <AIChatWidget />
    </div>
  )
}
