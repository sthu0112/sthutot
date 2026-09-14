# 🔐 DERMACARE RECORDS — Bảo mật hồ sơ bác sĩ & bệnh nhân

Tài liệu này mô tả cách web chính thức đảm bảo an toàn theo yêu cầu: `SECURITY → DATA PRIVACY → FUNCTIONALITY`.

## 1. Xác thực & tài khoản bác sĩ

- **Supabase Auth** (`supabase/auth`): email/password, session `persistSession:true, autoRefreshToken:true`, lưu JWT httpOnly không lưu plaintext.
- **Đăng ký** (`/register`): `AuthContext.signUp` lưu `full_name, phone, role` vào `user_metadata` + trigger `handle_new_user()` tự tạo `profiles`. Nếu bật `Confirm email` thì yêu cầu xác thực email trước khi login (thông báo `needsEmailConfirmation`).
- **Đăng nhập** (`/login`): `signInWithPassword`, rate-limit 5 lần sai → khóa 60s, hiển thị mắt `Eye/EyeOff` để kiểm tra mật khẩu nhưng không lưu.
- **Quên mật khẩu**: `resetPasswordForEmail` gửi link `redirectTo: /login`.
- **Chỉnh sửa thông tin** (`/settings`): phải `reauthenticate(email,password)` — demo check email khớp + pass ≥6, prod `signInWithPassword` lại và so `user.id`. Sau đó mới cho `updateProfile` (validate phone `^(0|+84)[0-9]{9,10}$`).
- **Không expose service_role**: chỉ `VITE_SUPABASE_ANON_KEY` ở client. `lib/supabase/server.js` dùng `SUPABASE_SERVICE_ROLE_KEY` chỉ ở server/Edge Functions.
- **Audit**: `audit_logs` ghi `create_patient, update_profile, upload_image, soft_delete` với `user_id` không cho update/delete bởi `authenticated` (policy `audit_no_update/delete`).

## 2. Phân quyền & RLS

- `supabase/schema.sql:253` `ENABLE RLS` cho 8 bảng. Mọi bảng `FOR ALL TO authenticated USING (auth.role()='authenticated')`. Chưa đăng nhập → không đọc/ghi.
- `profiles`: `select own_or_admin`, `insert own`, `update own_or_admin` qua `current_user_role()`.
- `audit_logs`: `insert authenticated`, `select own_or_admin`, cấm update/delete.
- Least Privilege: `staff` UI ẩn trường nhạy cảm (tiền sử, chẩn đoán) nếu cần siết hơn có thể tạo View.

## 3. Hồ sơ bệnh nhân — mã DERM-…

- `record_code` `CHECK ^DERM-[0-9]{4}-[0-9]{6}$`, UNIQUE, sinh bởi `generate_record_code()` với `pg_advisory_xact_lock` + `record_code_seq` chống trùng concurrent.
- Frontend không tự sinh mã để tránh trùng — để DB trigger `trg_set_record_code`.
- Copy 1-click qua `copyToClipboard` không log ra console.

## 4. Storage — bucket `luutruhoso` PRIVATE

- `schema.sql:322` `insert bucket luutruhoso public=false`. **KHÔNG public**.
- 4 policies `authenticated` select/insert/update/delete trên `storage.objects where bucket_id='luutruhoso'`.
- Đường dẫn: `luutruhoso/patients/DERM-2026-000001/visits/2026-08-10/image-01.jpg` (giữ tách bạch mỗi bệnh nhân).
- **Signed URL**: `lib/supabase.js:getSignedUrl(path, 3600)` → `createSignedUrl` 1h. `ImageGallery.jsx` và `Images.jsx` fetch signed URL cho mỗi ảnh, hiển thị ảnh với link kèm `ExternalLink`. Không expose permanent public URL.
- Validate: `allowed [jpg/png/webp/pdf]`, `≤8MB`, `sanitize file.name`.

## 5. Validation & Privacy

- Form: họ tên bắt buộc, ngày sinh hợp lệ, email regex, phone VN, file type/size cạnh input. Hiển thị lỗi đỏ cạnh field.
- Không `console.log` PHI ở production. Không đưa PHI vào URL nếu không cần (chỉ `record_code` khi cần).
- Soft delete: `deleted_at/is_archived/status=archived` + `ConfirmDialog` + `soft_delete_patient()` chỉ admin khôi phục.
- HTTPS bắt buộc prod, `Site URL` trong Auth.

## 6. Vận hành web chính thức

```bash
# 1. Clone & cài
cd dermacare && npm install

# 2. Tạo .env từ .env.example — điền anon key thật
# https://supabase.com/dashboard/project/gzznbchlgkqcmcoswsef/settings/api
VITE_SUPABASE_URL=https://gzznbchlgkqcmcoswsef.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_DEMO_MODE=

# 3. Chạy SQL
# SQL Editor → schema.sql → seed.sql → storage-policies.sql
# Kiểm tra bucket luutruhoso PRIVATE

# 4. Tạo admin đầu tiên
# Auth → Users → Add user → SQL: insert into profiles (user_id, full_name, role, phone) values ('<id>', 'BS. Admin', 'admin', '090...');

# 5. Chạy web
npm run dev   # http://localhost:5173
npm run build # → dist/ deploy Vercel/Netlify, set env VITE_* trên host
npm run preview
```

Tài khoản demo (khi `VITE_DEMO_MODE=demo`):
- `doctor@dermacare.demo / demo1234` — Doctor
- `admin@dermacare.demo / demo1234` — Admin
- `staff@dermacare.demo / demo1234` — Staff
- Hoặc đăng ký mới tại `/register` (lưu `phone` vào profile, cần xác thực lại khi sửa ở `/settings`)
