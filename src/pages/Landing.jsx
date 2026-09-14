import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { ShieldCheck, Lock, Database, Image as ImageIcon, ClipboardList, Search, BarChart3, Users, Stethoscope, ArrowRight, Check, Sparkles, Activity, FileText, Eye, Zap, HeartPulse, Layers, Clock, Award } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function CanvasBackground(){
  const canvasRef = useRef(null)
  useEffect(()=>{
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = canvas.width = canvas.offsetWidth * window.devicePixelRatio
    let h = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    const onResize = () => {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    }
    window.addEventListener('resize', onResize)
    const dots = Array.from({length: 70}, ()=>({
      x: Math.random()*w,
      y: Math.random()*h,
      vx: (Math.random()-0.5)*0.3,
      vy: (Math.random()-0.5)*0.3,
      r: Math.random()*1.6+0.6
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0,0,w,h)
      // subtle grid
      ctx.strokeStyle = 'rgba(148,163,184,0.06)'
      ctx.lineWidth = 1
      const step = 56 * window.devicePixelRatio
      for(let x=0;x<w;x+=step){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke() }
      for(let y=0;y<h;y+=step){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke() }
      // dots + lines
      dots.forEach(d=>{
        d.x+=d.vx; d.y+=d.vy
        if(d.x<0||d.x>w) d.vx*=-1
        if(d.y<0||d.y>h) d.vy*=-1
        ctx.beginPath()
        ctx.arc(d.x,d.y,d.r,0,Math.PI*2)
        ctx.fillStyle = 'rgba(13,148,136,0.35)'
        ctx.fill()
      })
      // connections
      for(let i=0;i<dots.length;i++){
        for(let j=i+1;j<dots.length;j++){
          const dx=dots[i].x-dots[j].x, dy=dots[i].y-dots[j].y
          const dist=Math.sqrt(dx*dx+dy*dy)
          if(dist < 140*window.devicePixelRatio){
            ctx.beginPath()
            ctx.moveTo(dots[i].x,dots[i].y)
            ctx.lineTo(dots[j].x,dots[j].y)
            ctx.strokeStyle = `rgba(13,148,136,${0.08*(1-dist/(140*window.devicePixelRatio))})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    return ()=>{ window.removeEventListener('resize', onResize); cancelAnimationFrame(raf) }
  },[])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{width:'100%',height:'100%'}} />
}

function FeatureCard({ icon:Icon, title, desc, delay=0 }){
  return (
    <motion.div
      initial={{opacity:0, y:18}}
      whileInView={{opacity:1, y:0}}
      viewport={{once:true, margin:"-80px"}}
      transition={{duration:0.5, delay, ease:[0.22,1,0.36,1]}}
      whileHover={{y:-4}}
      className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-shadow"
    >
      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 transition-colors">
        <Icon size={18} />
      </div>
      <h3 className="font-semibold text-slate-900 mt-4">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

export default function Landing(){
  const { isAuthenticated } = useAuth()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 80])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.85])

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 overflow-x-hidden">
      {/* NAV */}
      <motion.header
        initial={{y:-12, opacity:0}}
        animate={{y:0, opacity:1}}
        transition={{duration:0.6, ease:[0.22,1,0.36,1]}}
        className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-slate-200"
      >
        <div className="max-w-[1160px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center"><Stethoscope size={16} /></div>
            <div className="font-bold tracking-tight">DERMACARE</div>
            <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 font-medium">RECORDS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">Tính năng</a>
            <a href="#security" className="hover:text-slate-900">Bảo mật</a>
            <a href="#workflow" className="hover:text-slate-900">Quy trình</a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">Vào Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium hover:bg-slate-50">Đăng nhập</Link>
                <Link to="/register" className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">Đăng ký bác sĩ</Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-teal-50/40 to-white pointer-events-none" />
        <CanvasBackground />
        <motion.div style={{y: heroY, opacity: heroOpacity}} className="relative max-w-[1160px] mx-auto px-6 pt-14 pb-10 md:pt-20 md:pb-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{delay:0.05, duration:0.6}} className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-slate-900 text-white">
                <Sparkles size={14} className="text-teal-300" /> Dành cho phòng khám & bệnh viện da liễu — v2.0
              </motion.div>
              <motion.h1 initial={{opacity:0, y:16}} animate={{opacity:1, y:0}} transition={{delay:0.12, duration:0.7, ease:[0.22,1,0.36,1]}} className="text-[40px] md:text-[52px] font-[800] tracking-tight leading-[0.95] mt-4">
                Quản lý hồ sơ<br/>
                <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">da liễu an toàn</span><br/>
                khoa học, dễ tra cứu
              </motion.h1>
              <motion.p initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{delay:0.22, duration:0.6}} className="text-slate-600 mt-4 text-[15px] leading-7 max-w-[560px]">
                DERMACARE RECORDS là web app thực tế cho bác sĩ da liễu: tạo mã hồ sơ <span className="font-mono font-semibold">DERM-YYYY-XXXXXX</span> duy nhất, lưu thăm khám, hình ảnh tổn thương vào bucket <span className="font-mono">luutruhoso</span> PRIVATE với signed URL, RLS và audit đầy đủ.
              </motion.p>
              <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{delay:0.32, duration:0.6}} className="flex flex-wrap gap-3 mt-7">
                <Link to={isAuthenticated?"/dashboard":"/register"} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
                  Bắt đầu miễn phí <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold hover:bg-slate-50">Xem demo</Link>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 self-center"><Clock size={14} /> Thiết lập 5 phút với Supabase</span>
              </motion.div>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5, duration:0.6}} className="flex items-center gap-4 mt-6 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> RLS bảo vệ DB</span>
                <span className="inline-flex items-center gap-1.5"><Lock size={14} className="text-slate-600" /> Bucket PRIVATE</span>
                <span className="inline-flex items-center gap-1.5"><Award size={14} className="text-amber-600" /> Audit log</span>
              </motion.div>
            </div>

            {/* Preview card */}
            <motion.div
              initial={{opacity:0, y:18, rotate:-0.6}}
              animate={{opacity:1, y:0, rotate:0}}
              transition={{delay:0.25, duration:0.8, ease:[0.22,1,0.36,1]}}
              className="relative lg:pl-6"
            >
              <div className="absolute -inset-6 bg-gradient-to-br from-teal-200/30 via-cyan-200/20 to-transparent blur-2xl rounded-[32px] -z-10" />
              <div className="bg-white rounded-[24px] border border-slate-200 shadow-xl overflow-hidden">
                <div className="h-9 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 px-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-mono text-slate-500">dermacare-records.vercel.app/patients/DERM-2026-000001</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">N</div>
                    <div>
                      <div className="text-sm font-semibold">Nguyễn Minh Anh</div>
                      <div className="text-xs font-mono text-slate-500">DERM-2026-000001 • Nữ • 26 tuổi</div>
                    </div>
                    <span className="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">Hoạt động</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                      <div className="text-lg font-bold">3</div><div className="text-[11px] text-slate-500">Lần khám</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                      <div className="text-lg font-bold">2</div><div className="text-[11px] text-slate-500">Ảnh</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                      <div className="text-lg font-bold">DERM</div><div className="text-[11px] text-slate-500">Mã duy nhất</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2 bg-slate-50 border-b text-xs font-semibold">Timeline — 2026-08-10 → 2026-08-24 → 2026-09-12</div>
                    <div className="p-3 flex gap-2">
                      <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-amber-100 to-teal-100 border" />
                      <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 border" />
                      <div className="flex-1 text-xs text-slate-600"><span className="font-semibold">Mụn trứng cá trung bình</span><br/>Adapalene + Doxycycline</div>
                    </div>
                  </div>
                </div>
              </div>
              <motion.div initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} transition={{delay:0.8, duration:0.6}} className="absolute -right-2 -bottom-4 bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-xl text-xs">
                <div className="flex items-center gap-2"><Zap size={14} className="text-amber-400" /> Copy mã 1-click</div>
                <div className="font-mono mt-1">DERM-2026-000001 [Copy]</div>
              </motion.div>
            </motion.div>
          </div>

          {/* stats strip */}
          <motion.div initial={{opacity:0, y:12}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.6}} className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
            {[
              {k:"Mã hồ sơ", v:"DERM-YYYY-XXXXXX", d:"Unique, concurrency-safe"},
              {k:"Storage", v:"luutruhoso", d:"PRIVATE + signed URL"},
              {k:"Bảo mật", v:"RLS + Audit", d:"Row Level Security"},
              {k:"Tích hợp", v:"Supabase", d:"Auth • DB • Storage"},
            ].map(s=>(
              <div key={s.k} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="text-xs tracking-widest text-slate-500">{s.k}</div>
                <div className="font-semibold mt-1">{s.v}</div>
                <div className="text-xs text-slate-500">{s.d}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-[1160px] mx-auto px-6 py-14">
        <div className="max-w-2xl">
          <div className="text-xs tracking-widest text-teal-700 font-semibold">TÍNH NĂNG</div>
          <h2 className="text-3xl font-bold tracking-tight mt-2">Mọi thứ phòng khám cần — không rườm rà</h2>
          <p className="text-slate-600 mt-2">Thiết kế medical minimal, ưu tiên desktop, thao tác nhanh với bàn phím và tìm kiếm bằng mã hồ sơ.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <FeatureCard icon={ClipboardList} title="Hồ sơ & mã duy nhất" desc="Tự sinh DERM-YYYY-XXXXXX, không trùng, copy 1-click, tìm kiếm tức thì." delay={0.05} />
          <FeatureCard icon={Activity} title="Thăm khám có cấu trúc" desc="Lý do, triệu chứng, khám da, chẩn đoán, điều trị, tái khám — đầy đủ." delay={0.1} />
          <FeatureCard icon={ImageIcon} title="Hình ảnh PRIVATE" desc="JPG/PNG/WEBP/PDF ≤8MB, lưu luutruhoso/patients/.../visits/... với signed URL." delay={0.15} />
          <FeatureCard icon={Search} title="Tìm kiếm toàn cục" desc="Ctrl+K tìm bằng mã/tên/SĐT, ưu tiên mã hồ sơ chính xác." delay={0.05} />
          <FeatureCard icon={Users} title="Phân quyền" desc="admin/doctor/staff + RLS ở DB, không chỉ frontend." delay={0.1} />
          <FeatureCard icon={FileText} title="Export & in" desc="In PDF hồ sơ, kiểm tra quyền trước khi xuất." delay={0.15} />
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="bg-slate-900 text-white">
        <div className="max-w-[1160px] mx-auto px-6 py-14 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-white/10 border border-white/15"><ShieldCheck size={14} /> Bảo mật là tính năng số 1</div>
            <h2 className="text-3xl font-bold tracking-tight mt-3">An toàn dữ liệu nhạy cảm</h2>
            <p className="text-slate-300 mt-3 leading-relaxed">Bucket <span className="font-mono text-white">luutruhoso</span> luôn PRIVATE, RLS bật mọi bảng, service_role không bao giờ lộ ra frontend, audit log không cho user thường sửa.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Supabase Auth + RLS — chưa đăng nhập = không đọc/ghi",
                "Storage PRIVATE + signed URL 1h — không public vĩnh viễn",
                "Mã hồ sơ concurrency-safe với pg_advisory_lock",
                "Soft delete + ConfirmModal — chống xóa nhầm",
              ].map(t=>(
                <li key={t} className="flex gap-2"><Check size={16} className="text-emerald-400 shrink-0 mt-0.5" /> {t}</li>
              ))}
            </ul>
          </div>
          <motion.div initial={{opacity:0, y:12}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.6}} className="bg-white rounded-2xl text-slate-900 p-6">
            <div className="flex items-center gap-2 font-semibold"><Database size={18} className="text-teal-600" /> Supabase schema</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              {["profiles","patients","visits","patient_images","attachments","audit_logs"].map(t=>(
                <div key={t} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 font-mono">{t}</div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs leading-relaxed">
              bucket: luutruhoso<br/>path: patients/DERM-2026-000001/visits/2026-08-10/image-01.jpg<br/>policy: authenticated only → signed URL
            </div>
          </motion.div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="max-w-[1160px] mx-auto px-6 py-14">
        <div className="text-xs tracking-widest text-slate-500 font-semibold">QUY TRÌNH</div>
        <h2 className="text-3xl font-bold tracking-tight mt-2">3 bước — từ tiếp nhận đến tái khám</h2>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            {n:"01", t:"Tạo hồ sơ", d:"Nhập họ tên, SĐT, tiền sử da liễu → hệ thống sinh DERM-... tự động.", icon:Layers},
            {n:"02", t:"Thăm khám & lưu ảnh", d:"Ghi chẩn đoán, phác đồ, upload ảnh vào đúng visit — PRIVATE.", icon:HeartPulse},
            {n:"03", t:"Theo dõi & tái khám", d:"Timeline, lọc cần tái khám, in PDF khi cần.", icon:Clock},
          ].map(s=>{
            const Icon=s.icon
            return (
              <motion.div key={s.n} initial={{opacity:0, y:12}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.5}} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold">{s.n}</div>
                  <Icon size={18} className="text-teal-600" />
                </div>
                <div className="font-semibold mt-4">{s.t}</div>
                <div className="text-sm text-slate-600 mt-1">{s.d}</div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1160px] mx-auto px-6 pb-14">
        <motion.div initial={{opacity:0, y:12}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.6}} className="rounded-[24px] bg-gradient-to-br from-slate-900 via-slate-900 to-teal-800 p-[1px]">
          <div className="rounded-[23px] bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-10 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div>
              <div className="text-white font-bold text-xl md:text-2xl">Sẵn sàng cho phòng khám của bạn?</div>
              <div className="text-slate-300 text-sm mt-1">Chạy demo ngay không cần Supabase, hoặc kết nối project gzznbchlgkqcmcoswsef trong 5 phút.</div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to="/register" className="px-5 py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50">Đăng ký bác sĩ</Link>
              <Link to="/login" className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/15">Đăng nhập</Link>
            </div>
          </div>
        </motion.div>
        <div className="text-center text-xs text-slate-400 mt-6">© 2026 DermaCare — Secure Dermatology Records • DEMO DATA — NOT REAL PATIENT</div>
      </section>
    </div>
  )
}
