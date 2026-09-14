import { useState, useEffect } from 'react'
import { Camera, Image as ImageIcon, Trash2, Upload, ExternalLink } from 'lucide-react'
import { demoStore } from '../lib/demoStore'
import { isDemoMode, supabase, getSignedUrl } from '../lib/supabase'
import { formatDate, bodyAreaLabel } from '../utils/format'
import { useToast } from './Toast'

export default function ImageGallery({ patientId, images, visits, onRefresh }) {
  const [uploading, setUploading] = useState(false)
  const [bodyArea, setBodyArea] = useState('forehead')
  const [visitId, setVisitId] = useState(visits[0]?.id || '')
  const [notes, setNotes] = useState('')
  const [preview, setPreview] = useState(null)
  const [signedMap, setSignedMap] = useState({})
  const toast = useToast()

  // Tạo signed URL cho images private (bảo mật: không expose public URL)
  useEffect(()=>{
    if (isDemoMode || !images?.length) return
    let cancelled = false
    async function loadSigned(){
      const map = {}
      for (const img of images){
        if (img.url || img.signedUrl) continue
        const url = await getSignedUrl(img.storage_path, 3600)
        if (url) map[img.id] = url
      }
      if (!cancelled) setSignedMap(prev=> ({...prev, ...map}))
    }
    loadSigned()
    return ()=> { cancelled = true }
  }, [images])

  async function handleUpload(e){
    e.preventDefault()
    const file = e.target.file?.files?.[0]
    if (!file) return toast.push('Chọn file ảnh','error')
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf']
    if (file.size > 8*1024*1024) return toast.push('File tối đa 8MB','error')
    if (!allowed.includes(file.type) && !file.type.startsWith('image/')) return toast.push('Định dạng không hỗ trợ (JPG/PNG/WEBP/PDF)','error')
    setUploading(true)
    try{
      if (isDemoMode) {
        demoStore.uploadImage(patientId, visitId || null, file, bodyArea, notes)
        toast.push('Đã upload ảnh (demo) — luutruhoso/patients/DERM-.../visits/...','success')
        setNotes(''); setPreview(null); e.target.reset()
        onRefresh?.()
      } else {
        const { data: patient } = await supabase.from('patients').select('record_code').eq('id', patientId).single()
        const recordCode = patient?.record_code || patientId
        const visitDate = visits.find(v=>v.id===visitId)?.visit_date || new Date().toISOString().slice(0,10)
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'_')
        const path = `patients/${recordCode}/visits/${visitDate}/${Date.now()}-${safeName}`
        const { error: upErr } = await supabase.storage.from('luutruhoso').upload(path, file, { contentType: file.type, upsert: false })
        if (upErr) throw upErr
        const { error: dbErr } = await supabase.from('patient_images').insert({ patient_id: patientId, visit_id: visitId || null, storage_path: path, file_name: file.name, file_type: file.type, file_size: file.size, body_area: bodyArea, notes, captured_at: new Date().toISOString().slice(0,10) })
        if (dbErr) throw dbErr
        await supabase.from('audit_logs').insert({ user_id: (await supabase.auth.getUser()).data.user?.id, action:'upload_image', table_name:'patient_images', resource_type:'image', metadata:{patient_id: patientId, path} })
        toast.push('Đã upload ảnh — bucket luutruhoso (private)','success')
        e.target.reset(); setNotes(''); setPreview(null)
        onRefresh?.()
      }
    } catch(err){ toast.push(err.message,'error') }
    finally{ setUploading(false) }
  }

  async function handleDelete(imgId, storagePath){
    if (!confirm('Xóa ảnh này? Cần xác nhận: ảnh sẽ bị xóa khỏi Storage bucket luutruhoso.')) return
    try{
      if (isDemoMode) demoStore.deleteImage(imgId)
      else {
        await supabase.from('patient_images').delete().eq('id', imgId)
        if (storagePath) await supabase.storage.from('luutruhoso').remove([storagePath])
        await supabase.from('audit_logs').insert({ user_id: (await supabase.auth.getUser()).data.user?.id, action:'delete_image', table_name:'patient_images', resource_type:'image', record_id: imgId })
      }
      toast.push('Đã xóa ảnh','success')
      onRefresh?.()
    } catch(e){ toast.push(e.message,'error') }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Camera size={18} className="text-teal-600" /> Upload hình ảnh da (Private Storage)</h3>
        <p className="text-xs text-slate-500 mb-4">Mỗi ảnh liên kết với Patient + Visit. Bucket <span className="font-mono">luutruhoso</span> là PRIVATE — signed URL có hạn. Đường dẫn: <span className="font-mono">patients/DERM-2026-000001/visits/2026-08-10/image-01.jpg</span></p>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="block"><span className="text-xs font-semibold text-slate-500">LẦN KHÁM</span>
            <select value={visitId} onChange={e=>setVisitId(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
              <option value="">— Không liên kết visit —</option>
              {visits.map(v=> <option key={v.id} value={v.id}>{formatDate(v.visit_date)} — {v.reason?.slice(0,30) || v.diagnosis?.slice(0,30) || v.id.slice(0,8)}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-xs font-semibold text-slate-500">VÙNG DA</span>
            <select value={bodyArea} onChange={e=>setBodyArea(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm">
              {Object.entries(bodyAreaLabel).map(([k,l])=> <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-xs font-semibold text-slate-500">GHI CHÚ</span>
            <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Trước điều trị..." className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex gap-3 items-center flex-wrap">
          <input name="file" type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f) setPreview(URL.createObjectURL(f)) }} className="text-sm" />
          {preview && <img src={preview} alt="preview" className="w-16 h-16 rounded-xl object-cover border" />}
          <button disabled={uploading} className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-50"><Upload size={16} />{uploading?'Đang upload...':'Upload ảnh'}</button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><ImageIcon size={16} /> Thư viện — {images.length} ảnh</h3>
        {images.length===0 ? (
          <div className="text-center py-12 text-slate-500"><div className="flex justify-center mb-2 text-slate-400"><ImageIcon size={32} /></div><div className="text-sm">Chưa có hình ảnh</div><div className="text-xs">Upload ảnh theo từng lần khám để theo dõi tiến triển.</div></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map(img=>{
              const src = img.url || img.signedUrl || signedMap[img.id]
              return (
              <div key={img.id} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <div className="aspect-[4/3] bg-slate-200 overflow-hidden relative">
                  {src ? (
                    <a href={src} target="_blank" rel="noreferrer" className="block w-full h-full">
                      <img src={src} alt={img.body_area} className="w-full h-full object-cover hover:opacity-95 transition" />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"><ExternalLink size={10} /> Xem</span>
                    </a>
                  ) : <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 p-4 text-center">Private image<br/><span className="font-mono text-[10px] break-all">{img.storage_path}</span><br/>(signed URL 1h)</div>}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-full bg-white border border-slate-200">{bodyAreaLabel[img.body_area]||img.body_area}</span>
                    <span className="text-xs text-slate-500">{formatDate(img.captured_at || img.created_at)}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-2 line-clamp-2">{img.notes || '—'}</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 truncate" title={img.storage_path}>{img.storage_path}</div>
                  <button onClick={()=>handleDelete(img.id, img.storage_path)} className="mt-2 text-xs text-red-600 hover:underline inline-flex items-center gap-1"><Trash2 size={12} /> Xóa</button>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
