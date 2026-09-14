import { ClipboardList } from 'lucide-react'
import { formatDate } from '../utils/format'

export default function VisitTimeline({ visits }) {
  if (!visits.length) return <div className="text-center py-12 text-slate-500">
    <div className="flex justify-center mb-2 text-slate-400"><ClipboardList size={32} /></div>
    <div className="text-sm">Chưa có lần khám nào</div>
    <div className="text-xs">Nhấn “+ Thêm lần khám” để tạo visit đầu tiên.</div>
  </div>
  return (
    <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
      {visits.map((v, idx)=>(
        <div key={v.id} className="relative">
          <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-teal-600 border-4 border-white shadow" />
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-slate-900">Lần khám {String(visits.length - idx).padStart(2,'0')} — {formatDate(v.visit_date)}</div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium border ${v.status==='draft' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{v.status==='draft'?'Nháp':'Hoàn thành'}</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
              <div><span className="text-slate-500">Lý do khám:</span> <span className="ml-1">{v.reason || '—'}</span></div>
              <div><span className="text-slate-500">Tái khám:</span> <span className="ml-1">{v.follow_up_date ? formatDate(v.follow_up_date) : '—'}</span></div>
              <div className="md:col-span-2"><span className="text-slate-500">Triệu chứng:</span> <div className="mt-1 bg-white rounded-xl p-3 border border-slate-200 whitespace-pre-wrap">{v.symptoms || '—'}</div></div>
              <div className="md:col-span-2"><span className="text-slate-500">Khám lâm sàng:</span> <div className="mt-1 bg-white rounded-xl p-3 border border-slate-200 whitespace-pre-wrap">{v.clinical_findings || '—'}</div></div>
              <div className="md:col-span-2"><span className="text-slate-500 font-semibold">Chẩn đoán:</span> <div className="mt-1 bg-teal-50 rounded-xl p-3 border border-teal-200 whitespace-pre-wrap font-medium text-teal-900">{v.diagnosis || '—'}</div></div>
              <div className="md:col-span-2"><span className="text-slate-500">Phác đồ:</span> <div className="mt-1 bg-white rounded-xl p-3 border border-slate-200 whitespace-pre-wrap">{v.treatment_plan || '—'}</div></div>
              {v.skincare_advice && <div className="md:col-span-2"><span className="text-slate-500">Skincare:</span> <div className="mt-1 bg-white rounded-xl p-3 border border-slate-200 whitespace-pre-wrap">{v.skincare_advice}</div></div>}
              {v.notes && <div className="md:col-span-2"><span className="text-slate-500">Ghi chú:</span> <div className="mt-1 bg-amber-50 rounded-xl p-3 border border-amber-200 whitespace-pre-wrap">{v.notes}</div></div>}
            </div>
            <div className="text-xs text-slate-400 mt-3">ID: {v.id} · Bác sĩ: {v.doctor_id || '—'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
