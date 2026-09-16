import { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { listNotifications, markNotifRead } from '../lib/bookingStore'
import { supabase, isDemoMode } from '../lib/supabase'

export default function NotificationsBell({ keys = [], title = 'Thông báo' }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)

  async function load() {
    try {
      setItems(await listNotifications(keys))
    } catch {}
  }

  useEffect(() => {
    load()
    if (isDemoMode || !supabase) {
      const h = () => load()
      window.addEventListener('dermacare:notifs', h)
      window.addEventListener('dermacare:bookings', h)
      return () => {
        window.removeEventListener('dermacare:notifs', h)
        window.removeEventListener('dermacare:bookings', h)
      }
    }
    const ch = supabase
      .channel('notif-bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(keys)])

  const unread = items.filter((n) => !n.is_read).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50"
        aria-label={title}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[320px] max-w-[85vw] bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 font-bold text-sm">{title} {unread > 0 && <span className="text-red-500">({unread} mới)</span>}</div>
            <div className="max-h-[340px] overflow-auto divide-y divide-slate-100">
              {items.length === 0 && <div className="p-4 text-sm text-slate-500">Chưa có thông báo.</div>}
              {items.slice(0, 20).map((n) => (
                <div key={n.id} className={`p-3 text-sm ${n.is_read ? '' : 'bg-emerald-50/50'}`}>
                  <div className="font-semibold text-[13px]">{n.title}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{n.body}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-slate-400">{new Date(n.created_at).toLocaleString('vi-VN')}</span>
                    {!n.is_read && (
                      <button
                        onClick={() => markNotifRead(n.id).then(load)}
                        className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1 hover:underline"
                      >
                        <Check size={12} /> Đã đọc
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
