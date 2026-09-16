import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Stethoscope, AlertCircle, Calendar } from 'lucide-react'
import { SPECIALTIES, TIME_SLOTS, specialtyBySlug, guessSpecialtyFromText } from '../data/content'
import { createAppointment, listDoctors, notifyDoctorsOfBooking } from '../lib/bookingStore'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { playClick } from '../utils/sound'

const STEPS = ['Nhóm bệnh', 'Bác sĩ & giờ', 'Thông tin', 'Tiền sử da', 'Xác nhận']

function HistoryToggle({ label, hint, value, detail, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="font-semibold text-sm">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{hint}</div>
      <div className="flex gap-2 mt-3">
        {['no', 'yes'].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => { playClick('tap'); onChange({ has: opt === 'yes', detail: opt === 'yes' ? detail : '' }) }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${
              (value === 'yes') === (opt === 'yes')
                ? opt === 'yes'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {opt === 'yes' ? 'Có' : 'Không'}
          </button>
        ))}
      </div>
      {value === 'yes' && (
        <textarea
          value={detail}
          onChange={(e) => onChange({ has: true, detail: e.target.value })}
          rows={3}
          placeholder="Nêu rõ giúp Thư iu nhé — VD: tên thuốc, liều dùng, từ khi nào… (bắt buộc)"
          className="mt-3 w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
      )}
      {value === 'yes' && !detail.trim() && (
        <div className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> Bạn chọn “Có” thì cần ghi rõ thông tin mới qua bước tiếp theo.</div>
      )}
    </div>
  )
}

export default function Booking() {
  const [params] = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [doctors, setDoctors] = useState([])
  const [err, setErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)

  const [form, setForm] = useState({
    specialty_slug: params.get('chuyen-khoa') || '',
    symptoms: '',
    doctor_user_id: '',
    doctor_name: params.get('bac-si') || '',
    date: '',
    time_slot: '',
    full_name: '',
    phone: '',
    dob: '',
    gender: 'female',
    email: '',
    skin: { has: false, detail: '' },
    allergy: { has: false, detail: '' },
    meds: { has: false, detail: '' },
  })

  useEffect(() => {
    listDoctors().then(setDoctors).catch(() => {})
  }, [])

  // prefill từ user đăng nhập
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        full_name: f.full_name || user.full_name || '',
        phone: f.phone || user.phone || '',
        email: f.email || user.email || '',
      }))
    }
  }, [user])

  // tự đoán nhóm bệnh khi gõ triệu chứng (gợi ý, không ép)
  const guessed = useMemo(() => guessSpecialtyFromText(form.symptoms), [form.symptoms])
  const specialty = specialtyBySlug(form.specialty_slug)
  const suggestedDoctors = useMemo(() => {
    if (!form.specialty_slug) return doctors
    const matched = doctors.filter((d) => d.specialty_slug === form.specialty_slug)
    return matched.length ? matched : doctors
  }, [doctors, form.specialty_slug])

  const minDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }, [])

  function validateStep(s) {
    if (s === 0) {
      if (!form.specialty_slug) return 'Vui lòng chọn 1 trong 8 nhóm bệnh'
      if (form.symptoms.trim().length < 10) return 'Mô tả triệu chứng rõ hơn giúp mình (ít nhất 10 ký tự)'
      return null
    }
    if (s === 1) {
      if (!form.date) return 'Vui lòng chọn ngày khám (từ ngày mai)'
      if (form.date < minDate) return 'Ngày khám phải từ ngày mai trở đi'
      if (!form.time_slot) return 'Vui lòng chọn khung giờ'
      return null
    }
    if (s === 2) {
      if (form.full_name.trim().length < 2) return 'Họ tên là bắt buộc'
      if (!/^(0|\+84)[0-9]{9,10}$/.test(form.phone.replace(/[\s.]/g, ''))) return 'Số điện thoại chưa đúng (VD: 0901234567)'
      if (!form.dob) return 'Ngày sinh là bắt buộc để bác sĩ đánh giá da theo tuổi'
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email chưa đúng định dạng'
      return null
    }
    if (s === 3) {
      if (form.skin.has && !form.skin.detail.trim()) return 'Phần “Tiền sử da” bạn chọn Có — cần ghi rõ'
      if (form.allergy.has && !form.allergy.detail.trim()) return 'Phần “Dị ứng thuốc” bạn chọn Có — cần ghi rõ tên thuốc & biểu hiện'
      if (form.meds.has && !form.meds.detail.trim()) return 'Phần “Thuốc đang dùng” bạn chọn Có — cần ghi rõ tên & liều'
      return null
    }
    return null
  }

  function next() {
    playClick('tap')
    const v = validateStep(step)
    if (v) {
      playClick('error')
      setErr(v)
      return
    }
    setErr('')
    setStep((s) => Math.min(s + 1, 4))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function back() {
    playClick('pop')
    setErr('')
    setStep((s) => Math.max(s - 1, 0))
  }

  async function submit() {
    playClick('tap')
    for (let s = 0; s <= 3; s++) {
      const v = validateStep(s)
      if (v) {
        playClick('error')
        setErr(`Thiếu thông tin ở bước ${s + 1}: ${v}`)
        setStep(s)
        return
      }
    }
    setSubmitting(true)
    setErr('')
    try {
      const spec = specialtyBySlug(form.specialty_slug)
      const payload = {
        patient_user_id: user?.id || null,
        doctor_user_id: form.doctor_user_id || null,
        doctor_name: form.doctor_name || null,
        specialty_slug: form.specialty_slug,
        specialty_name: spec?.name || form.specialty_slug,
        symptoms: form.symptoms.trim(),
        date: form.date,
        time_slot: form.time_slot,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        dob: form.dob,
        gender: form.gender,
        email: form.email.trim() || null,
        skin_history_has: form.skin.has,
        skin_history_detail: form.skin.has ? form.skin.detail.trim() : null,
        drug_allergy_has: form.allergy.has,
        drug_allergy_detail: form.allergy.has ? form.allergy.detail.trim() : null,
        current_meds_has: form.meds.has,
        current_meds_detail: form.meds.has ? form.meds.detail.trim() : null,
        status: 'pending',
      }
      const row = await createAppointment(payload)
      await notifyDoctorsOfBooking({ ...payload, id: row.id })
      playClick('success')
      setDone(row)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      playClick('error')
      setErr(e.message || 'Đặt lịch thất bại, thử lại giúp mình')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[560px] bg-white border border-slate-200 rounded-[24px] p-6 sm:p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto"><Check size={26} /></div>
          <h1 className="font-display font-extrabold text-2xl mt-4">Đặt lịch thành công</h1>
          <p className="text-sm text-slate-600 mt-2 leading-6">
            Cảm ơn Thư iu! DermaCare đã nhận lịch <b>{done.specialty_name}</b> ngày <b>{done.date}</b> lúc <b>{done.time_slot}</b>.
            <br />Bác sĩ chuyên khoa đã nhận được thông báo và sẽ xác nhận sớm qua SĐT {done.phone}.
          </p>
          <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-left text-sm space-y-1.5">
            <div><b>Bệnh nhân:</b> {done.full_name} • {done.phone}</div>
            <div><b>Nhóm bệnh:</b> {done.specialty_name}</div>
            <div><b>Bác sĩ:</b> {done.doctor_name || 'Hệ thống tự gợi ý theo chuyên khoa'}</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <Link to="/" className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold hover:bg-slate-50">Về trang chủ</Link>
            <Link to={isAuthenticated ? '/benh-nhan' : '/login'} className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800">
              {isAuthenticated ? 'Xem lịch của tôi' : 'Đăng nhập để theo dõi'}
            </Link>
          </div>
          {!isAuthenticated && (
            <p className="text-xs text-slate-500 mt-3">Mẹo: tạo tài khoản bệnh nhân để nhận thông báo realtime khi bác sĩ xác nhận.</p>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6 md:py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft size={16} /> Về trang chủ</Link>
        <h1 className="font-display font-extrabold tracking-tight text-2xl sm:text-3xl mt-3">Đặt lịch khám da liễu</h1>
        <p className="text-sm text-slate-500 mt-1">Điền đủ từng bước mới qua tiếp — để bác sĩ hiểu đúng da bạn.</p>

        {/* stepper */}
        <div className="flex items-center gap-1.5 mt-5 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-300 mx-1" />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 mt-4">
          {err && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex gap-2"><AlertCircle size={15} className="shrink-0 mt-0.5" />{err}</div>}

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold tracking-widest text-slate-500">1. CHỌN NHÓM BỆNH *</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {SPECIALTIES.map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => { playClick('tap'); setForm({ ...form, specialty_slug: s.slug }) }}
                      className={`text-left p-3.5 rounded-2xl border transition ${form.specialty_slug === s.slug ? 'border-emerald-500 bg-emerald-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <div className="text-sm font-bold">{s.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.diseases.slice(0, 3).join(' • ')}</div>
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-xs font-bold tracking-widest text-slate-500">2. MÔ TẢ TRIỆU CHỨNG * (≥10 KÝ TỰ)</span>
                <textarea value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} rows={4} placeholder="VD: Mặt nổi mụn viêm đỏ 2 tuần, hơi đau, để lại thâm…" className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </label>
              {guessed && guessed !== form.specialty_slug && (
                <button type="button" onClick={() => setForm({ ...form, specialty_slug: guessed })} className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  Gợi ý: mô tả của bạn giống nhóm “{specialtyBySlug(guessed)?.name}” — bấm để chọn nhanh
                </button>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold tracking-widest text-slate-500">BÁC SĨ GỢI Ý THEO {specialty ? `“${specialty.name.toUpperCase()}”` : 'CHUYÊN KHOA'}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <button type="button" onClick={() => setForm({ ...form, doctor_user_id: '', doctor_name: '' })} className={`text-left p-3.5 rounded-2xl border ${!form.doctor_user_id ? 'border-emerald-500 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
                    <div className="text-sm font-bold">Để hệ thống tự gán</div>
                    <div className="text-xs text-slate-500">Admin/bác sĩ phù hợp nhất sẽ nhận lịch</div>
                  </button>
                  {suggestedDoctors.map((d) => (
                    <button key={d.user_id} type="button" onClick={() => setForm({ ...form, doctor_user_id: d.user_id, doctor_name: d.full_name })} className={`text-left p-3.5 rounded-2xl border ${form.doctor_user_id === d.user_id ? 'border-emerald-500 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
                      <div className="text-sm font-bold">{d.full_name}</div>
                      <div className="text-xs text-emerald-700 font-semibold">{d.specialty}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold tracking-widest text-slate-500">NGÀY KHÁM * (TỪ NGÀY MAI)</span>
                  <input type="date" min={minDate} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                </label>
                <div>
                  <span className="text-xs font-bold tracking-widest text-slate-500">KHUNG GIỜ *</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TIME_SLOTS.map((t) => (
                      <button key={t} type="button" onClick={() => setForm({ ...form, time_slot: t })} className={`px-3 py-2 rounded-xl text-[13px] font-bold border ${form.time_slot === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-400'}`}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block sm:col-span-2">
                <span className="text-xs font-bold tracking-widest text-slate-500">HỌ VÀ TÊN *</span>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nguyễn Thị Thư" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </label>
              <label className="block">
                <span className="text-xs font-bold tracking-widest text-slate-500">SỐ ĐIỆN THOẠI *</span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0901234567" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </label>
              <label className="block">
                <span className="text-xs font-bold tracking-widest text-slate-500">NGÀY SINH *</span>
                <input type="date" value={form.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </label>
              <label className="block">
                <span className="text-xs font-bold tracking-widest text-slate-500">GIỚI TÍNH *</span>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
                  <option value="female">Nữ</option>
                  <option value="male">Nam</option>
                  <option value="other">Khác</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold tracking-widest text-slate-500">EMAIL (NẾU CÓ)</span>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ban@email.com" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
              </label>
              <p className="sm:col-span-2 text-xs text-slate-500">Không bỏ trống họ tên, SĐT và ngày sinh — cả ba đều bắt buộc mới qua bước tiếp theo.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Mỗi mục chọn <b>Không</b> hoặc <b>Có</b>. Nếu chọn <b>Có</b> thì phải ghi rõ mới được qua bước tiếp theo.</p>
              <HistoryToggle label="Tiền sử da" hint="VD: từng bị viêm da cơ địa, vảy nến, mụn nặng…" value={form.skin.has ? 'yes' : 'no'} detail={form.skin.detail} onChange={(v) => setForm({ ...form, skin: v })} />
              <HistoryToggle label="Dị ứng thuốc" hint="VD: penicillin gây mẩn ngứa…" value={form.allergy.has ? 'yes' : 'no'} detail={form.allergy.detail} onChange={(v) => setForm({ ...form, allergy: v })} />
              <HistoryToggle label="Thuốc đang dùng" hint="VD: isotretinoin 10mg/ngày từ 01/2026…" value={form.meds.has ? 'yes' : 'no'} detail={form.meds.detail} onChange={(v) => setForm({ ...form, meds: v })} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                <div><b>Nhóm bệnh:</b> {specialty?.name}</div>
                <div><b>Triệu chứng:</b> {form.symptoms}</div>
                <div><b>Bác sĩ:</b> {form.doctor_name || 'Hệ thống tự gán theo chuyên khoa'}</div>
                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-600" /><b>{form.date}</b> lúc <b>{form.time_slot}</b></div>
                <div><b>Bệnh nhân:</b> {form.full_name} • {form.phone} • {form.dob}</div>
                <div><b>Tiền sử da:</b> {form.skin.has ? form.skin.detail : 'Không'}</div>
                <div><b>Dị ứng thuốc:</b> {form.allergy.has ? form.allergy.detail : 'Không'}</div>
                <div><b>Thuốc đang dùng:</b> {form.meds.has ? form.meds.detail : 'Không'}</div>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1"><Stethoscope size={13} /> Gửi đi là bác sĩ đúng chuyên khoa + quản trị nhận thông báo ngay.</p>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            {step > 0 && <button onClick={back} className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold hover:bg-slate-50">Quay lại</button>}
            {step < 4 && <button onClick={next} className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 inline-flex items-center justify-center gap-2">Tiếp tục <ArrowRight size={16} /></button>}
            {step === 4 && <button onClick={submit} disabled={submitting} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">{submitting ? 'Đang gửi…' : 'Xác nhận đặt lịch'}</button>}
          </div>
        </div>

        <div className="text-center mt-4">
          <button onClick={() => nav('/')} className="text-xs text-slate-400 hover:text-slate-600">Hủy và về trang chủ</button>
        </div>
      </div>
    </div>
  )
}
