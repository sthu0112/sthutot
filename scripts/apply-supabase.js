#!/usr/bin/env node
// Auto-apply supabase SQL files to real Supabase project (service_role required)
// Usage: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/apply-supabase.js
// Or: DATABASE_URL=postgres://... node scripts/apply-supabase.js
// Will apply: supabase/schema.sql -> supabase/seed.sql (if --seed)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const args = process.argv.slice(2)
const withSeed = args.includes('--seed')

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

async function applyViaPg(sql) {
  // Try pg connection if DATABASE_URL provided
  if (!dbUrl) return false
  try {
    const { Client } = await import('pg')
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
    await client.connect()
    console.log('→ Connected via pg, executing SQL...')
    await client.query(sql)
    await client.end()
    console.log('✓ SQL applied via pg')
    return true
  } catch (e) {
    console.warn('pg apply failed:', e.message)
    return false
  }
}

async function applyViaRest(sql) {
  if (!url || !serviceKey) {
    console.log('ℹ No SERVICE_ROLE or DB URL — skipping auto-apply (manual SQL Editor needed)')
    console.log('  Copy supabase/schema.sql vào Supabase Dashboard → SQL Editor → Run')
    return false
  }
  // Supabase doesn't have direct SQL REST, but we can try supabase-js rpc if we created one
  // Fallback: instruct manual
  console.log('ℹ SERVICE_ROLE detected but direct SQL via REST not available — please use Dashboard SQL Editor or supabase CLI:')
  console.log('  npx supabase link --project-ref', (url.match(/https:\/\/([^.]+)\.supabase\.co/)||[])[1] || 'YOUR_REF')
  console.log('  npx supabase db push')
  return false
}

async function main(){
  const schemaPath = path.join(root, 'supabase/schema.sql')
  const seedPath = path.join(root, 'supabase/seed.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  console.log('── DERMACARE Supabase Auto-Apply ──')
  console.log('Project:', url || '(demo)')
  console.log('Files:', schemaPath, withSeed ? seedPath : '(no seed)')

  let sql = schema
  if (withSeed && fs.existsSync(seedPath)) sql += '\n' + fs.readFileSync(seedPath, 'utf8')

  // Try pg first
  if (await applyViaPg(sql)) return
  await applyViaRest(sql)

  console.log('\n✓ Done. Nếu auto-apply không chạy, hãy copy file SQL vào Dashboard:')
  console.log('  https://supabase.com/dashboard/project/gzznbchlgkqcmcoswsef/sql/new')
}
main()
