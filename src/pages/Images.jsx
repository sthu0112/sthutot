import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Images as ImagesIcon, ExternalLink } from 'lucide-react'
import { demoStore } from '../lib/demoStore'
import { isDemoMode, supabase, getSignedUrl } from '../lib/supabase'
import { formatDate, bodyAreaLabel } from '../utils/format'

export default function ImagesView(){
  const [images, setImages] = useState([])
  const [signedMap, setSignedMap] = useState({})
  const [patientsMap, setPatientsMap] = useState({})
  useEffect(()=>{
    async function load(){
      if (isDemoMode) { setImages(demoStore.listAllImages()); const map={}; demoStore.listPatients({perPage:100}).data.forEach(p=> map[p.id]=p); setPatientsMap(map) }
      else {
        const { data } = await supabase.from('patient_images').select('*, patients(full_name, record_code)').order('created_at',{ascending:false}).limit(50)
        const rows = data||[]
        setImages(rows)
        // tạo signed URL private
        const map = {}
        for (const img of rows){
          const url = await getSignedUrl(img.storage_path, 3600)
          if (url) map[img.id] = url
        }
        setSignedMap(map)
      }
    }
    load()
  },[])
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2"><ImagesIcon size={22} className="text-slate-700" /> Hình ảnh</h1>
      <p className="text-sm text-slate-500">Tất cả hình ảnh da — liên kết Patient + Visit. Bucket private.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map(img=>{
          const p = isDemoMode ? patientsMap[img.patient_id] : img.patients
          return (
            <div key={img.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                {(() => {
                  const src = img.url || signedMap[img.id]
                  return src ? (
                    <a href={src} target="_blank" rel="noreferrer" className="block w-full h-full">
                      <img src={src} alt={img.body_area} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"><ExternalLink size={10} /> 1h</span>
                    </a>
                  ) : <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 p-4 text-center">Private<br/><span className="font-mono text-[10px] break-all">{img.storage_path}</span><br/>(signed URL đang tạo...)</div>
                })()}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700">{bodyAreaLabel[img.body_area]||img.body_area}</span>
                  <span className="text-slate-500">{formatDate(img.captured_at || img.created_at)}</span>
                </div>
                <div className="text-sm font-medium mt-2 truncate">{p?.full_name || img.patient_id} <span className="font-mono text-xs text-slate-500">{p?.record_code}</span></div>
                <div className="text-xs text-slate-600 line-clamp-2">{img.notes || '—'}</div>
                {p && <Link to={`/patients/${p.id}`} className="text-xs text-teal-700 hover:underline">Mở hồ sơ</Link>}
              </div>
            </div>
          )
        })}
        {images.length===0 && <div className="col-span-3 text-center py-12 text-slate-500">Chưa có hình ảnh</div>}
      </div>
    </div>
  )
}
