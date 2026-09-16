// Sinh public/env.js lúc build để web đọc cấu hình lúc chạy,
// không phụ thuộc cơ chế nhúng import.meta.env của bundler.
// Chỉ bao gồm 3 biến VITE_ công khai (không bao giờ chứa secret).
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
  VITE_DEMO_MODE: process.env.VITE_DEMO_MODE || '',
}

mkdirSync(join(root, 'public'), { recursive: true })
writeFileSync(
  join(root, 'public', 'env.js'),
  `window.__DERMA_ENV__=${JSON.stringify(env)};\n`,
)
console.log('[gen-env] wrote public/env.js (url set:', Boolean(env.VITE_SUPABASE_URL), ')')
