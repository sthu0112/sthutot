import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { demoStore } from '../lib/demoStore'
import { isDemoMode, supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

const skinTypes = [['combination','Da hỗn hợp'],['oily','Da dầu'],['dry','Da khô'],['sensitive','Da nhạy cảm'],['normal','Da thường'],['unknown','Không rõ']]
const genders = [['female','Nữ'],['male','Nam'],['other','Khác'],['unknown','Không rõ']]
const areas = ['forehead','left_cheek','right_cheek','chin','nose','neck','other']

export default function PatientNew(){
  const nav = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name:'', date_of_birth:'', gender:'female', phone:'', email:'', address:'', emergency_contact:'',
    skin_type:'combination', affected_areas:[], allergies:'', medical_history:'', dermatology_history:'', current_medications:'', skincare_products:'', previous_treatments:''
  })
  function upd(k,v){ setForm(s=>({...s,[k]:v})) }
  function toggleArea(a){ setForm(s=> ({...s, affected_areas: s.affected_areas.includes(a) ? s.affected_areas.filter(x=>x!==a) : [...s.affected_areas, a]})) }

  async function submit(e){
    e.preventDefault()
    if (!form.full_name.trim()) return toast.push('Họ tên là bắt buộc','error')
    setLoading(true)
    try{
      let patient
      if (isDemoMode) patient = demoStore.createPatient({...form, phone: form.phone.trim(), email: form.email.trim()})
      else {
        // record_code will be auto via trigger if not provided; we generate preview client side but let DB handle uniqueness fallback
        const { data, error } = await supabase.from('patients').insert({...form}).select().single()
        if (error) throw error
        patient = data
        await supabase.from('audit_logs').insert({ user_id: (await supabase.auth.getUser()).data.user?.id, action:'create_patient', table_name:'patients', record_id: patient.id, metadata:{record_code: patient.record_code} })
      }
      toast.push(`Đã tạo hồ sơ ${patient.record_code}`,'success')
      nav(`/patients/${patient.id}`)
    } catch(err){ toast.push(err.message || 'Không thể lưu hồ sơ. Vui lòng thử lại.','error') }
    finally{ setLoading(false) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tạo hồ sơ bệnh nhân</h1>
        <p className="text-sm text-slate-500">Mã hồ sơ sẽ được tự động tạo dạng <span className="font-mono font-semibold">DERM-YYYY-XXXXXX</span> và không thể thay đổi sau khi tạo.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <span className="inline-flex w-6 h-6 rounded-full bg-amber-500 text-white items-center justify-center text-xs font-bold">ID</span> Mã hồ sơ: <span className="font-mono font-bold">tự động tạo (DERM-{new Date().getFullYear()}-XXXXXX)</span> — không dùng SĐT/CCCD làm mã.
        </div>

        <Section title="01 — Thông tin cơ bản" desc="Họ tên là bắt buộc, các trường khác tùy chọn.">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Họ và tên *"><input required value={form.full_name} onChange={e=>upd('full_name',e.target.value)} placeholder="Nguyễn Minh Anh" className="input" /></Field>
            <Field label="Ngày sinh"><input type="date" value={form.date_of_birth} onChange={e=>upd('date_of_birth',e.target.value)} className="input" /></Field>
            <Field label="Giới tính"><select value={form.gender} onChange={e=>upd('gender',e.target.value)} className="input bg-white">{genders.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Số điện thoại"><input value={form.phone} onChange={e=>upd('phone',e.target.value)} placeholder="090..." className="input" /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={e=>upd('email',e.target.value)} placeholder="email@example.com" className="input" /></Field>
            <Field label="Người liên hệ khẩn cấp"><input value={form.emergency_contact} onChange={e=>upd('emergency_contact',e.target.value)} placeholder="Tên - SĐT (quan hệ)" className="input" /></Field>
            <Field label="Địa chỉ" full><input value={form.address} onChange={e=>upd('address',e.target.value)} placeholder="Địa chỉ" className="input" /></Field>
          </div>
        </Section>

        <Section title="02 — Thông tin da liễu" desc="Không bắt buộc điền tất cả.">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Loại da"><select value={form.skin_type} onChange={e=>upd('skin_type',e.target.value)} className="input bg-white">{skinTypes.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Vùng da cần khám" full>
              <div className="flex flex-wrap gap-2">
                {areas.map(a=>(
                  <button key={a} type="button" onClick={()=>toggleArea(a)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${form.affected_areas.includes(a) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'}`}>{a}</button>
                ))}
              </div>
            </Field>
            <Field label="Dị ứng"><textarea rows={2} value={form.allergies} onChange={e=>upd('allergies',e.target.value)} placeholder="Dị ứng thuốc, mỹ phẩm..." className="input" /></Field>
            <Field label="Tiền sử bệnh da liễu"><textarea rows={2} value={form.dermatology_history} onChange={e=>upd('dermatology_history',e.target.value)} className="input" /></Field>
            <Field label="Tiền sử bệnh lý liên quan"><textarea rows={2} value={form.medical_history} onChange={e=>upd('medical_history',e.target.value)} className="input" /></Field>
            <Field label="Thuốc đang sử dụng"><textarea rows={2} value={form.current_medications} onChange={e=>upd('current_medications',e.target.value)} className="input" /></Field>
            <Field label="Mỹ phẩm / skincare đang sử dụng"><textarea rows={2} value={form.skincare_products} onChange={e=>upd('skincare_products',e.target.value)} className="input" /></Field>
            <Field label="Tiền sử điều trị trước đây"><textarea rows={2} value={form.previous_treatments} onChange={e=>upd('previous_treatments',e.target.value)} className="input" /></Field>
          </div>
        </Section>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={()=>nav(-1)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium">Hủy</button>
          <button disabled={loading} className="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">{loading?'Đang lưu...':'Lưu hồ sơ'}</button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, desc, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {desc && <p className="text-xs text-slate-500 mb-4">{desc}</p>}
      <div>{children}</div>
      <style>{`.input{width:100%;padding:0.6rem 0.75rem;border-radius:0.75rem;border:1px solid #e2e8f0;background:#f8fafc;font-size:0.875rem} .input:focus{outline:none;ring:2px solid #14b8a6;background:white;box-shadow:0 0 0 2px #14b8a6}`}</style>
    </div>
  )
}
function Field({ label, children, full }) {
  return <label className={`block ${full?'md:col-span-2':''}`}><span className="text-xs font-semibold tracking-widest text-slate-500">{label.toUpperCase()}</span><div className="mt-1">{children}</div></label>
}
