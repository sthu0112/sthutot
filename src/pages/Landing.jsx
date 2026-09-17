import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Database, Image as ImageIcon, ClipboardList, Search, Users, Stethoscope, ArrowRight, Check, FileText, Activity, HeartPulse, Layers, Clock, Award, Lock } from 'lucide-react'
import { useAuth, homeByRole } from '../contexts/AuthContext'
import { playClick } from '../utils/sound'
import { AIChatWidget } from './AIChat'

function FeatureCard({ icon: Icon, title, desc, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-stone rounded-2xl p-6"
    >
      <div className="w-10 h-10 rounded-full bg-forest text-snow flex items-center justify-center">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <h3 className="font-medium text-forest mt-4 text-[18px] tracking-[-0.18px]">{title}</h3>
      <p className="text-[16px] text-pewter mt-1.5 leading-[1.5]">{desc}</p>
    </motion.div>
  )
}

export default function Landing() {
  const { isAuthenticated, role } = useAuth()

  return (
    <div className="min-h-screen bg-snow text-forest overflow-x-clip">
      {/* PROMO BANNER */}
      <div className="bg-snow border-b border-forest/10">
        <div className="max-w-[1200px] mx-auto px-6 h-10 flex items-center justify-center gap-2 text-[12px] font-medium uppercase tracking-wide">
          <span className="px-2 py-[6px] rounded-pill bg-lime text-forest text-[12px] font-medium leading-none">Mới</span>
          <span>Đặt lịch online — xác nhận trong 15 phút</span>
          <Link to="/dat-lich" className="underline underline-offset-4 decoration-[1.5px]">Đặt ngay →</Link>
        </div>
      </div>

      {/* NAV */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 bg-snow"
      >
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium tracking-tight text-[18px]">DermaCare</span>
            <span className="w-2 h-2 rounded-full bg-forest" />
          </div>
          <nav className="hidden md:flex items-center gap-8 text-[16px] text-forest">
            <a href="#features" className="hover:opacity-70">Tính năng</a>
            <a href="#security" className="hover:opacity-70">Bảo mật</a>
            <a href="#workflow" className="hover:opacity-70">Quy trình</a>
            <Link to="/dat-lich" className="hover:opacity-70">Đặt lịch</Link>
            <Link to="/tro-ly-ai" className="hover:opacity-70">Hỏi AI</Link>
            <Link to="/cam-nang" className="hover:opacity-70">Cẩm nang</Link>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to={homeByRole(role)} onClick={() => playClick('tap')} className="px-6 py-4 rounded-pill bg-forest text-snow text-[16px] hover:opacity-90">Vào trang của tôi</Link>
            ) : (
              <>
                <Link to="/login" onClick={() => playClick('tap')} className="hidden sm:inline-flex px-6 py-4 rounded-pill bg-snow border-[1.5px] border-forest text-forest text-[16px] hover:opacity-80">Đăng nhập</Link>
                <Link to="/register" onClick={() => playClick('tap')} className="px-6 py-4 rounded-pill bg-forest text-snow text-[16px] hover:opacity-90">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section className="relative">
        <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-16 md:pt-24 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.6 }}
                className="inline-flex items-center gap-2 text-[12px] font-medium px-2 py-[6px] rounded-pill bg-lime text-forest"
              >
                Phòng khám & bệnh viện da liễu
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-light text-[40px] md:text-[48px] leading-[1.1] tracking-[-0.72px] mt-6"
              >
                Làn da khỏe,<br />bắt đầu từ một lịch hẹn.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.6 }}
                className="text-[16px] leading-[1.5] text-forest mt-6 max-w-[560px]"
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
                <Link to="/dat-lich" onClick={() => playClick('success')} className="inline-flex items-center gap-2 px-6 py-4 rounded-pill bg-forest text-snow text-[16px] hover:opacity-90">
                  Đặt lịch khám <ArrowRight size={16} strokeWidth={1.5} />
                </Link>
                <Link to="/login" onClick={() => playClick('tap')} className="inline-flex items-center gap-2 px-6 py-4 rounded-pill bg-snow border-[1.5px] border-forest text-forest text-[16px] hover:opacity-80">Xem demo</Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-[14px] text-pewter"
              >
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} strokeWidth={1.5} /> RLS bảo vệ dữ liệu</span>
                <span className="inline-flex items-center gap-1.5"><Lock size={15} strokeWidth={1.5} /> Lưu trữ riêng tư</span>
                <span className="inline-flex items-center gap-1.5"><Award size={15} strokeWidth={1.5} /> Nhật ký kiểm tra</span>
              </motion.div>
            </div>

            {/* Preview card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
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
                      <div className="w-10 h-10 rounded-full bg-forest text-snow flex items-center justify-center font-medium">N</div>
                      <div>
                        <div className="text-[16px] font-medium">Nguyễn Minh Anh</div>
                        <div className="font-mono font-light text-[12px] text-pewter">DERM-2026-000001 · Nữ · 26 tuổi</div>
                      </div>
                      <span className="ml-auto px-2 py-[6px] rounded-pill bg-lime text-forest text-[12px] font-medium">Hoạt động</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="rounded-2xl bg-stone p-3 text-center">
                        <div className="text-[24px] font-light tracking-[-0.48px]">3</div><div className="text-[12px] text-pewter">Lần khám</div>
                      </div>
                      <div className="rounded-2xl bg-stone p-3 text-center">
                        <div className="text-[24px] font-light tracking-[-0.48px]">2</div><div className="text-[12px] text-pewter">Ảnh</div>
                      </div>
                      <div className="rounded-2xl bg-stone p-3 text-center">
                        <div className="text-[24px] font-light tracking-[-0.48px]">DERM</div><div className="text-[12px] text-pewter">Mã duy nhất</div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-stone overflow-hidden">
                      <div className="px-3 py-2 text-[12px] font-medium">Timeline — 2026-08-10 → 2026-08-24 → 2026-09-12</div>
                      <div className="p-3 flex gap-2">
                        <div className="w-20 h-14 rounded-lg bg-frosted" />
                        <div className="w-20 h-14 rounded-lg bg-frosted" />
                        <div className="flex-1 text-[14px]"><span className="font-medium">Mụn trứng cá trung bình</span><br /><span className="text-pewter">Adapalene + Doxycycline</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* TỔNG QUAN — thẻ thông tin thuần túy (không click), headline serif 1 dòng */}
          <div className="mt-16 md:mt-20">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif font-semibold text-forest whitespace-nowrap leading-[1.15] text-[clamp(22px,5.4vw,60px)]"
            >
              Mọi thứ bạn cần — gọn nhẹ
            </motion.h2>
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
                  className="bg-white rounded-2xl border border-forest/10 p-5 cursor-default"
                >
                  <div className="text-[12px] uppercase tracking-[0.12em] text-pewter">{s.k}</div>
                  <div className="font-serif font-semibold text-forest text-[22px] leading-snug mt-2">{s.v}</div>
                  <div className="text-[13px] text-pewter mt-1">{s.d}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <div className="text-[12px] uppercase tracking-wide text-pewter font-medium">Tính năng</div>
          <h2 className="font-light text-[36px] md:text-[40px] leading-[1.1] tracking-[-0.4px] mt-3">Mọi thứ phòng khám cần — không rườm rà</h2>
          <p className="text-[16px] text-pewter mt-3 leading-[1.5]">Thiết kế tối giản, thao tác nhanh với bàn phím và tìm kiếm bằng mã hồ sơ.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-10">
          <FeatureCard icon={ClipboardList} title="Hồ sơ & mã duy nhất" desc="Tự sinh DERM-YYYY-XXXXXX, không trùng, sao chép 1 chạm, tìm kiếm tức thì." delay={0.05} />
          <FeatureCard icon={Activity} title="Thăm khám có cấu trúc" desc="Lý do, triệu chứng, khám da, chẩn đoán, điều trị, tái khám — đầy đủ." delay={0.1} />
          <FeatureCard icon={ImageIcon} title="Hình ảnh riêng tư" desc="JPG/PNG/WEBP/PDF ≤8MB, lưu đúng lượt khám với liên kết có thời hạn." delay={0.15} />
          <FeatureCard icon={Search} title="Tìm kiếm toàn cục" desc="Ctrl+K tìm bằng mã/tên/SĐT, ưu tiên mã hồ sơ chính xác." delay={0.05} />
          <FeatureCard icon={Users} title="Phân quyền" desc="admin/doctor/patient + RLS ở DB, không chỉ frontend." delay={0.1} />
          <FeatureCard icon={FileText} title="Xuất & in" desc="In PDF hồ sơ, kiểm tra quyền trước khi xuất." delay={0.15} />
        </div>
      </section>

      {/* SECURITY — dark section */}
      <section id="security" className="bg-forest text-snow">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-medium px-2 py-[6px] rounded-pill bg-lime text-forest"><ShieldCheck size={14} strokeWidth={1.5} /> Bảo mật là tính năng số 1</div>
            <h2 className="font-light text-[36px] md:text-[40px] leading-[1.1] tracking-[-0.4px] mt-4">An toàn dữ liệu nhạy cảm</h2>
            <p className="text-[16px] mt-4 leading-[1.5] opacity-90">Kho lưu trữ luôn riêng tư, RLS bật mọi bảng, nhật ký kiểm tra không cho người dùng thường sửa.</p>
            <ul className="mt-8 space-y-3 text-[16px]">
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
            <div className="flex items-center gap-2 font-medium text-[18px] tracking-[-0.18px]"><Database size={18} strokeWidth={1.5} /> Lược đồ dữ liệu</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {['profiles', 'patients', 'visits', 'patient_images', 'attachments', 'audit_logs'].map((t) => (
                <div key={t} className="rounded-lg bg-stone px-3 py-2.5 font-mono font-light text-[12px]">{t}</div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-forest text-snow p-4 font-mono font-light text-[12px] leading-relaxed">
              bucket: luutruhoso<br />path: patients/DERM-2026-000001/visits/2026-08-10/image-01.jpg<br />policy: authenticated only → signed URL
            </div>
          </motion.div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        <div className="text-[12px] uppercase tracking-wide text-pewter font-medium">Quy trình</div>
        <h2 className="font-light text-[36px] md:text-[40px] leading-[1.1] tracking-[-0.4px] mt-3">3 bước — từ tiếp nhận đến tái khám</h2>
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
                  <div className="px-2 py-[6px] rounded-pill bg-forest text-snow text-[12px] font-medium">{s.n}</div>
                  <Icon size={18} strokeWidth={1.5} />
                </div>
                <div className="font-medium text-[18px] tracking-[-0.18px] mt-4">{s.t}</div>
                <div className="text-[16px] text-pewter mt-1 leading-[1.5]">{s.d}</div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1200px] mx-auto px-6 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-[32px] bg-forest text-snow p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between"
        >
          <div>
            <div className="font-light text-[32px] md:text-[36px] leading-[1.1]">Sẵn sàng cho phòng khám của bạn?</div>
            <div className="text-[16px] mt-2 opacity-90">Đặt lịch trong 2 phút, hoặc kết nối Supabase trong 5 phút.</div>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link to="/dat-lich" onClick={() => playClick('success')} className="px-6 py-4 rounded-pill bg-snow text-forest text-[16px] hover:opacity-90">Đặt lịch khám</Link>
            <Link to="/register" onClick={() => playClick('tap')} className="px-6 py-4 rounded-pill bg-transparent border-[1.5px] border-snow text-snow text-[16px] hover:opacity-80">Tạo tài khoản</Link>
          </div>
        </motion.div>
      </section>
      {/* FOOTER đầy đủ — gọn */}
      <footer className="bg-forest text-snow">
        <div className="max-w-[1200px] mx-auto px-6 pt-10 pb-6">
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
                <div className="font-medium tracking-tight text-[18px]">DermaCare</div>
                <div className="text-[13px] opacity-70">Làn da khỏe, bắt đầu từ một lịch hẹn.</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[14px]">
              <span className="tracking-[0.2em] text-lime">★★★★★</span>
              <span className="opacity-80">Được phòng khám da liễu tin dùng · Hotline 1900 6368</span>
            </div>
          </motion.div>

          <div className="border-t border-snow/15 mt-6 pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { h: 'Khám bệnh', links: [['Đặt lịch khám', '/dat-lich'], ['Hỏi AI trước khi đặt', '/tro-ly-ai'], ['Cẩm nang da', '/cam-nang'], ['Lịch của tôi', '/benh-nhan']] },
              { h: 'Tài liệu', links: [['Tính năng', '#features'], ['Quy trình', '#workflow'], ['Bảo mật', '#security']] },
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
                <div className="text-[12px] uppercase tracking-[0.14em] font-medium opacity-90">{col.h}</div>
                <ul className="mt-3 space-y-2.5 text-[14px]">
                  {col.links.map(([label, to]) => (
                    <li key={label}>
                      {to.startsWith('#') ? (
                        <a href={to} className="opacity-70 hover:opacity-100">{label}</a>
                      ) : to.startsWith('tel:') ? (
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
            <div className="text-[12px] opacity-60">© 2026 DermaCare — Thông tin đặt lịch được bảo mật</div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex text-[12px] px-3 py-1.5 rounded-pill border border-snow/25 opacity-80">Tiếng Việt</span>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-10 h-10 rounded-full bg-snow text-forest flex items-center justify-center hover:opacity-90" aria-label="Về đầu trang">↑</button>
            </div>
          </div>
        </div>
      </footer>

      <AIChatWidget />
    </div>
  )
}
