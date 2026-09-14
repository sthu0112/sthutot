import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { demoStore } from '../lib/demoStore'
import { isDemoMode, supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function VisitNew(){
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    visit_date: new Date().toISOString().slice(0,10),
    reason:'', symptoms:'', clinical_findings:'', diagnosis:'', treatment_plan:'', skincare_advice:'', follow_up_date:'', notes:'', status:'completed'
  })
  const [meds, setMeds] = useState([{ name:'', active_ingredient:'', dosage:'', frequency:'', duration:'', instructions:'', notes:'' }])

  useEffect(()=>{
    if (isDemoMode) setPatient(demoStore.getPatient(id))
    else supabase.from('patients').select('id, full_name, record_code').eq('id', id).maybeSingle().then(({data})=> setPatient(data))
  },[id])

  function upd(k,v){ setForm(s=>({...s,[k]:v})) }
  function updMed(idx, k, v){ setMeds(arr=> arr.map((m,i)=> i===idx ? {...m,[k]:v}: m)) }
  function addMed(){ setMeds(a=> [...a, { name:'', active_ingredient:'', dosage:'', frequency:'', duration:'', instructions:'', notes:'' }]) }
  function removeMed(idx){ setMeds(a=> a.filter((_,i)=> i!==idx)) }

  async function submit(e, isDraft=false){
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, status: isDraft ? 'draft' : 'completed', medications: meds.filter(m=> m.name.trim()) }
    try{
      if (isDemoMode) {
        const visit = demoStore.createVisit(patient.id, payload)
        toast.push('Đã tạo lần khám','success')
        nav(`/dashboard/patients/${patient.id}`)
      } else {
        const { data: visit, error } = await supabase.from('visits').insert({ patient_id: patient.id, doctor_id: (await supabase.auth.getUser()).data.user?.id, visit_date: payload.visit_date, reason: payload.reason, symptoms: payload.symptoms, clinical_findings: payload.clinical_findings, diagnosis: payload.diagnosis, treatment_plan: payload.treatment_plan, skincare_advice: payload.skincare_advice, follow_up_date: payload.follow_up_date || null, notes: payload.notes, status: payload.status }).select().single()
        if (error) throw error
        if (payload.medications.length) {
          await supabase.from('medications').insert(payload.medications.map(m=> ({ visit_id: visit.id, ...m })))
        }
        await supabase.from('audit_logs').insert({ user_id: (await supabase.auth.getUser()).data.user?.id, action:'create_visit', table_name:'visits', record_id: visit.id })
        toast.push('Đã tạo lần khám','success')
        nav(`/dashboard/patients/${patient.id}`)
      }
    } catch(err){ toast.push(err.message,'error') }
    finally{ setLoading(false) }
  }

  if (!patient) return <div className="text-center py-16 text-slate-500">Đang tải...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">+ Thêm lần khám</h1>
        <p className="text-sm text-slate-500">Bệnh nhân: <span className="font-semibold text-slate-900">{patient.full_name}</span> — <span className="font-mono text-xs">{patient.record_code}</span></p>
      </div>

      <form onSubmit={(e)=>submit(e,false)} className="space-y-6">
        <Section title="01 — Thông tin lần khám">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Ngày khám"><input type="date" value={form.visit_date} onChange={e=>upd('visit_date',e.target.value)} className="input" /></Field>
            <Field label="Ngày tái khám"><input type="date" value={form.follow_up_date} onChange={e=>upd('follow_up_date',e.target.value)} className="input" /></Field>
            <Field label="Lý do khám" full><textarea rows={2} value={form.reason} onChange={e=>upd('reason',e.target.value)} placeholder="Mụn viêm vùng mặt..." className="input" /></Field>
          </div>
        </Section>

        <Section title="02 — Triệu chứng"><Field label="Triệu chứng" full><textarea rows={3} value={form.symptoms} onChange={e=>upd('symptoms',e.target.value)} placeholder="Mô tả triệu chứng..." className="input" /></Field></Section>
        <Section title="03 — Khám lâm sàng"><Field label="Khám lâm sàng" full><textarea rows={3} value={form.clinical_findings} onChange={e=>upd('clinical_findings',e.target.value)} placeholder="Kết quả khám lâm sàng..." className="input" /></Field></Section>
        <Section title="04 — Chẩn đoán"><Field label="Chẩn đoán" full><textarea rows={2} value={form.diagnosis} onChange={e=>upd('diagnosis',e.target.value)} placeholder="Mụn trứng cá mức độ..." className="input" /></Field></Section>
        <Section title="05 — Điều trị"><Field label="Phương pháp điều trị / Phác đồ" full><textarea rows={3} value={form.treatment_plan} onChange={e=>upd('treatment_plan',e.target.value)} placeholder="Adapalene 0.1%..." className="input" /></Field></Section>

        <Section title="06 — Thuốc">
          <div className="space-y-3">
            {meds.map((m,i)=>(
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-slate-500">THUỐC #{i+1}</span>{meds.length>1 && <button type="button" onClick={()=>removeMed(i)} className="text-xs text-red-600">Xóa</button>}</div>
                <div className="grid md:grid-cols-3 gap-3">
                  <input placeholder="Tên thuốc *" value={m.name} onChange={e=>updMed(i,'name',e.target.value)} className="input" />
                  <input placeholder="Hoạt chất" value={m.active_ingredient} onChange={e=>updMed(i,'active_ingredient',e.target.value)} className="input" />
                  <input placeholder="Liều dùng (100mg)" value={m.dosage} onChange={e=>updMed(i,'dosage',e.target.value)} className="input" />
                  <input placeholder="Tần suất (1 lần/ngày)" value={m.frequency} onChange={e=>updMed(i,'frequency',e.target.value)} className="input" />
                  <input placeholder="Thời gian (14 ngày)" value={m.duration} onChange={e=>updMed(i,'duration',e.target.value)} className="input" />
                  <input placeholder="Cách dùng" value={m.instructions} onChange={e=>updMed(i,'instructions',e.target.value)} className="input" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addMed} className="text-sm px-3 py-1.5 rounded-full bg-white border border-slate-200">+ Thêm thuốc</button>
          </div>
        </Section>

        <Section title="07 — Skincare"><Field label="Hướng dẫn chăm sóc da" full><textarea rows={2} value={form.skincare_advice} onChange={e=>upd('skincare_advice',e.target.value)} placeholder="Rửa mặt 2 lần/ngày..." className="input" /></Field></Section>
        <Section title="08 — Ghi chú & Tái khám"><Field label="Ghi chú chuyên môn" full><textarea rows={2} value={form.notes} onChange={e=>upd('notes',e.target.value)} placeholder="Ghi chú..." className="input" /></Field></Section>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={()=>nav(-1)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium">Hủy</button>
          <button type="button" onClick={(e)=>submit(e,true)} disabled={loading} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium">Lưu nháp</button>
          <button disabled={loading} className="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50">{loading?'Đang lưu...':'Lưu hồ sơ'}</button>
        </div>
      </form>
    </div>
  )
}
function Section({ title, children }){ return <div className="bg-white rounded-2xl border border-slate-200 p-6"><h3 className="font-semibold text-slate-900 mb-4">{title}</h3><div>{children}</div><style>{`.input{width:100%;padding:0.6rem 0.75rem;border-radius:0.75rem;border:1px solid #e2e8f0;background:#f8fafc;font-size:0.875rem} .input:focus{outline:none;background:white;box-shadow:0 0 0 2px #14b8a6}`}</style></div> }
function Field({ label, children, full }){ return <label className={`block ${full?'md:col-span-2':''}`}><span className="text-xs font-semibold tracking-widest text-slate-500">{label.toUpperCase()}</span><div className="mt-1">{children}</div></label> }
