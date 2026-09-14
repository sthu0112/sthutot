import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Droplets, Activity, User, Pill, Sparkles, Plus, Printer, Edit3, Archive } from 'lucide-react'
import { demoStore } from '../lib/demoStore'
import { isDemoMode, supabase } from '../lib/supabase'
import { formatDate, ageFromDob, bodyAreaLabel, skinTypeLabel, genderLabel } from '../utils/format'
import RecordCode from '../components/RecordCode'
import VisitTimeline from '../components/VisitTimeline'
import ImageGallery from '../components/ImageGallery'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const tabs = ['Tổng quan','Lịch sử khám','Chẩn đoán','Điều trị','Hình ảnh','Thuốc','Ghi chú']

export default function PatientDetail(){
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [visits, setVisits] = useState([])
  const [meds, setMeds] = useState([])
  const [images, setImages] = useState([])
  const [active, setActive] = useState('Tổng quan')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [confirmArchive, setConfirmArchive] = useState(false)
  const toast = useToast()

  async function load(){
    if (isDemoMode) {
      const p = demoStore.getPatient(id)
      setPatient(p)
      if (p) { setVisits(demoStore.listVisits(p.id)); setMeds(demoStore.listMedsByPatient(p.id)); setImages(demoStore.listImages(p.id)) }
    } else {
      // try by id first, then record_code
      let { data: p } = await supabase.from('patients').select('*').eq('id', id).maybeSingle()
      if (!p) { const { data: byCode } = await supabase.from('patients').select('*').eq('record_code', id).maybeSingle(); p = byCode }
      setPatient(p)
      if (p) {
        const { data: vs } = await supabase.from('visits').select('*').eq('patient_id', p.id).order('visit_date',{ascending:false})
        setVisits(vs||[])
        const vIds = (vs||[]).map(v=>v.id)
        if (vIds.length) {
          const { data: ms } = await supabase.from('medications').select('*').in('visit_id', vIds)
          setMeds(ms||[])
        }
        const { data: imgs } = await supabase.from('patient_images').select('*').eq('patient_id', p.id).order('created_at',{ascending:false})
        // in supabase mode images need signed url; for now show path
        setImages(imgs||[])
      }
    }
  }
  useEffect(()=>{ load() },[id])

  if (patient === null) return <div className="text-center py-16 text-slate-500">Đang tải hồ sơ...</div>
  if (!patient) return <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center"><div className="text-lg font-semibold">Không tìm thấy hồ sơ</div><p className="text-sm text-slate-500 mt-1">Mã <span className="font-mono">{id}</span> không tồn tại.</p><Link to="/patients" className="inline-flex mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Quay lại danh sách</Link></div>

  function startEdit(){ setEditForm({...patient}); setEditing(true) }
  async function saveEdit(e){
    e.preventDefault()
    try {
      if (isDemoMode) { const updated = demoStore.updatePatient(patient.id, editForm); setPatient(updated); toast.push('Đã cập nhật hồ sơ','success') }
      else {
        const { data, error } = await supabase.from('patients').update(editForm).eq('id', patient.id).select().single()
        if (error) throw error
        setPatient(data); toast.push('Đã cập nhật','success')
      }
      setEditing(false)
    } catch(err){ toast.push(err.message,'error') }
  }
  async function handleArchive(){
    try{
      if (isDemoMode) demoStore.archivePatient(patient.id)
      else await supabase.from('patients').update({ is_archived:true, status:'archived' }).eq('id', patient.id)
      toast.push('Đã lưu trữ hồ sơ (Archive)','success')
      setConfirmArchive(false)
      load()
    } catch(e){ toast.push(e.message,'error') }
  }

  const progressRows = visits.slice().reverse().map(v=> ({ date: v.visit_date, status: v.diagnosis?.slice(0,60) || v.reason || '—', eval: v.follow_up_date ? 'Tái khám '+formatDate(v.follow_up_date) : '—' }))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{patient.full_name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full font-medium border ${patient.status==='follow_up'?'bg-amber-50 text-amber-700 border-amber-200': patient.status==='archived'?'bg-slate-100 text-slate-600 border-slate-200':'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{patient.status}</span>
            </div>
            <div className="mt-3"><RecordCode code={patient.record_code} size="large" /></div>
            <div className="text-xs text-slate-500 mt-2">{genderLabel[patient.gender] || patient.gender} · {ageFromDob(patient.date_of_birth)} · {patient.phone || '—'} {patient.email ? `· ${patient.email}`:''}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/patients/${patient.id}/visit/new`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"><Plus size={16} /> Thêm lần khám</Link>
            <button onClick={startEdit} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium"><Edit3 size={16} /> Chỉnh sửa</button>
            <button onClick={()=>setConfirmArchive(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-amber-700"><Archive size={16} /> Archive</button>
            <button onClick={()=>window.print()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium no-print"><Printer size={16} /> In / Export PDF</button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-auto pb-1">
        {tabs.map(t=>(
          <button key={t} onClick={()=>setActive(t)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${active===t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{t}</button>
        ))}
      </div>

      {editing && (
        <form onSubmit={saveEdit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold">Chỉnh sửa hồ sơ</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block"><span className="text-xs font-semibold text-slate-500">HỌ TÊN</span><input value={editForm.full_name||''} onChange={e=>setEditForm({...editForm, full_name:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-500">SĐT</span><input value={editForm.phone||''} onChange={e=>setEditForm({...editForm, phone:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm" /></label>
            <label className="block md:col-span-2"><span className="text-xs font-semibold text-slate-500">ĐỊA CHỈ</span><input value={editForm.address||''} onChange={e=>setEditForm({...editForm, address:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-500">TRẠNG THÁI</span><select value={editForm.status||'active'} onChange={e=>setEditForm({...editForm, status:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"><option value="active">Hoạt động</option><option value="follow_up">Theo dõi</option><option value="archived">Lưu trữ</option></select></label>
            <label className="block"><span className="text-xs font-semibold text-slate-500">LOẠI DA</span><select value={editForm.skin_type||''} onChange={e=>setEditForm({...editForm, skin_type:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"><option value="combination">Hỗn hợp</option><option value="oily">Dầu</option><option value="dry">Khô</option><option value="sensitive">Nhạy cảm</option><option value="normal">Thường</option></select></label>
            <label className="block md:col-span-2"><span className="text-xs font-semibold text-slate-500">GHI CHÚ / TIỀN SỬ</span><textarea rows={3} value={editForm.medical_history||''} onChange={e=>setEditForm({...editForm, medical_history:e.target.value})} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm" /></label>
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={()=>setEditing(false)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm">Hủy</button><button className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold">Lưu</button></div>
        </form>
      )}

      {active==='Tổng quan' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Droplets size={18} className="text-teal-600" /> Tình trạng da</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Loại da:</span> <span className="font-medium ml-2">{skinTypeLabel[patient.skin_type] || patient.skin_type}</span></div>
                <div><span className="text-slate-500">Vùng tổn thương:</span> <span className="font-medium ml-2">{(patient.affected_areas||[]).map(a=> bodyAreaLabel[a]||a).join(', ') || '—'}</span></div>
                <div className="md:col-span-2"><span className="text-slate-500">Dị ứng:</span> <span className="ml-2">{patient.allergies || '—'}</span></div>
                <div className="md:col-span-2"><span className="text-slate-500">Tiền sử da liễu:</span> <span className="ml-2">{patient.dermatology_history || '—'}</span></div>
                <div className="md:col-span-2"><span className="text-slate-500">Skincare hiện tại:</span> <span className="ml-2">{patient.skincare_products || '—'}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity size={18} className="text-teal-600" /> Theo dõi tiến triển</h3>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs tracking-widest text-slate-500 border-b"><tr><th className="text-left py-2">NGÀY</th><th className="text-left py-2">TÌNH TRẠNG</th><th className="text-left py-2">ĐÁNH GIÁ</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {progressRows.length ? progressRows.map((r,i)=>(
                      <tr key={i}><td className="py-2 font-mono text-xs">{formatDate(r.date)}</td><td className="py-2">{r.status}</td><td className="py-2"><span className={`px-2 py-1 rounded-full text-xs border ${i===progressRows.length-1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : i===0 ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{i===0?'Ban đầu': i===progressRows.length-1 ? 'Tốt' : 'Cải thiện'}</span></td></tr>
                    )) : <tr><td colSpan={3} className="text-center py-6 text-slate-500">Chưa có dữ liệu tiến triển</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><User size={18} className="text-slate-700" /> Thông tin cơ bản</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Ngày sinh</span><span className="font-medium">{formatDate(patient.date_of_birth)} ({ageFromDob(patient.date_of_birth)})</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Giới tính</span><span className="font-medium">{genderLabel[patient.gender]||patient.gender}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">SĐT</span><span className="font-mono text-xs">{patient.phone||'—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-xs truncate ml-2">{patient.email||'—'}</span></div>
                <div><span className="text-slate-500">Địa chỉ</span><div className="font-medium">{patient.address||'—'}</div></div>
                <div><span className="text-slate-500">Liên hệ khẩn cấp</span><div className="font-medium">{patient.emergency_contact||'—'}</div></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Pill size={18} className="text-teal-600" /> Thuốc hiện tại</h3>
              <div className="text-sm text-slate-600">{patient.current_medications || '—'}</div>
              <h3 className="font-semibold mt-4 mb-2 flex items-center gap-2"><Sparkles size={18} className="text-amber-600" /> Skincare</h3>
              <div className="text-sm text-slate-600">{patient.skincare_products || '—'}</div>
            </div>
          </div>
        </div>
      )}

      {active==='Lịch sử khám' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Lịch sử thăm khám ({visits.length})</h3><Link to={`/patients/${patient.id}/visit/new`} className="text-sm px-3 py-1.5 rounded-full bg-teal-600 text-white">+ Thêm lần khám</Link></div>
          <VisitTimeline visits={visits} />
        </div>
      )}

      {active==='Chẩn đoán' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold mb-4">Chẩn đoán qua các lần khám</h3>
          <div className="space-y-3">
            {visits.map(v=>(
              <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-mono text-slate-500">{formatDate(v.visit_date)} — {v.id.slice(0,8)}</div>
                <div className="font-medium mt-1">{v.diagnosis || '—'}</div>
                <div className="text-sm text-slate-600 mt-1">{v.clinical_findings || ''}</div>
              </div>
            ))}
            {visits.length===0 && <div className="text-center py-8 text-slate-500">Chưa có chẩn đoán</div>}
          </div>
        </div>
      )}

      {active==='Điều trị' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold mb-4">Phác đồ điều trị</h3>
          <div className="space-y-3">
            {visits.map(v=>(
              <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-mono text-slate-500">{formatDate(v.visit_date)}</div>
                <div className="text-sm mt-1 whitespace-pre-wrap">{v.treatment_plan || '—'}</div>
                {v.skincare_advice && <div className="text-sm mt-2"><span className="font-semibold">Hướng dẫn skincare:</span> {v.skincare_advice}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {active==='Hình ảnh' && (
        <ImageGallery patientId={patient.id} images={images} visits={visits} onRefresh={load} />
      )}

      {active==='Thuốc' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold mb-4">Thuốc / Sản phẩm ({meds.length})</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs tracking-widest text-slate-500 border-b"><tr><th className="text-left py-2">TÊN THUỐC</th><th className="text-left py-2">HOẠT CHẤT</th><th className="text-left py-2">LIỀU</th><th className="text-left py-2">TẦN SUẤT</th><th className="text-left py-2">THỜI GIAN</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {meds.map(m=>(
                  <tr key={m.id}><td className="py-2 font-medium">{m.name}</td><td className="py-2">{m.active_ingredient||'—'}</td><td className="py-2">{m.dosage||'—'}</td><td className="py-2">{m.frequency||'—'}</td><td className="py-2">{m.duration||'—'}</td></tr>
                ))}
                {meds.length===0 && <tr><td colSpan={5} className="text-center py-6 text-slate-500">Chưa có thuốc</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {active==='Ghi chú' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold">Ghi chú chuyên môn</h3>
          {visits.map(v=> v.notes && (
            <div key={v.id} className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xs font-mono text-amber-700">{formatDate(v.visit_date)}</div>
              <div className="text-sm mt-1">{v.notes}</div>
            </div>
          ))}
          {visits.filter(v=>v.notes).length===0 && <div className="text-center py-8 text-slate-500">Chưa có ghi chú</div>}
          <div className="text-xs text-slate-500 border-t pt-4">Tiền sử điều trị trước đây: {patient.previous_treatments || '—'}</div>
        </div>
      )}

      <ConfirmDialog open={confirmArchive} title="Lưu trữ hồ sơ?" message={`Hồ sơ ${patient.record_code} sẽ được chuyển sang trạng thái Archive thay vì xóa vĩnh viễn. Bạn có thể khôi phục sau.`} confirmText="Archive" onConfirm={handleArchive} onCancel={()=>setConfirmArchive(false)} />
    </div>
  )
}
