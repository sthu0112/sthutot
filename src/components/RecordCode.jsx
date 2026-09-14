import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { copyToClipboard } from '../utils/format'

export default function RecordCode({ code, size='default' }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    const ok = await copyToClipboard(code)
    if (ok) { setCopied(true); setTimeout(()=>setCopied(false), 1800) }
  }
  const sizeCls = size==='large' ? 'text-xl md:text-2xl py-2 px-4' : 'text-sm py-1.5 px-3'
  return (
    <div className="inline-flex items-center gap-2">
      <code className={`bg-slate-900 text-white rounded-lg font-mono tracking-widest border border-slate-700 ${sizeCls}`}>{code}</code>
      <button onClick={handleCopy} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition">
        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Đã sao chép!' : 'Copy'}
      </button>
      {copied && <span className="text-xs text-teal-600 font-medium">Đã sao chép mã hồ sơ.</span>}
    </div>
  )
}
