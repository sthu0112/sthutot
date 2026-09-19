import { useState } from 'react'

// Logo DermaCare (/public/logo.png). Chưa có file thì tự ẩn, giữ chữ brand.
export default function Logo({ size = 36, rounded = 'rounded-full', className = '' }) {
  const [err, setErr] = useState(false)
  if (err) return null
  return (
    <img
      src="/logo.png"
      alt="DermaCare"
      width={size}
      height={size}
      onError={() => setErr(true)}
      className={`${rounded} object-cover bg-white shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
