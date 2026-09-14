export default function ConfirmDialog({ open, title, message, confirmText='Xác nhận', cancelText='Hủy', onConfirm, onCancel, danger=false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-2">{message}</p>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700">{cancelText}</button>
          <button onClick={onConfirm} className={`px-5 py-2 rounded-xl text-sm font-semibold text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
