# 🩺 DERMACARE RECORDS — Quản lý hồ sơ da liễu — an toàn, khoa học, dễ tra cứu

Website quản lý & lưu trữ hồ sơ da liễu cho bác sĩ/chuyên gia. **Security First → Data Privacy → Functionality → UX → UI**.

- Frontend: React 19 + Vite + Tailwind CSS + React Router
- Backend: Supabase (PostgreSQL + Auth + Storage + RLS)
- Demo mode: chạy ngay không cần Supabase (localStorage — Dữ liệu giả)
- Bucket: **luutruhoso** (PRIVATE) — https://supabase.com/dashboard/project/gzznbchlgkqcmcoswsef/storage/files/buckets/luutruhoso
- Mã hồ sơ: **DERM-YYYY-XXXXXX** (ví dụ DERM-2026-000001) — UNIQUE, tự động sinh, copy 1-click

> **DEMO DATA — KHÔNG PHẢI DỮ LIỆU BỆNH NHÂN THẬT**

---

## 🚀 Chạy local (Demo Mode — không cần Supabase)

```bash
cd dermacare
npm install
npm run dev
# mở http://localhost:5173
# đăng nhập: doctor@dermacare.demo / bất kỳ mật khẩu (demo1234)
# hoặc admin@dermacare.demo / staff@dermacare.demo
```
Mặc định `.env` đã đặt `VITE_DEMO_MODE=demo` + placeholder keys → chạy demo ngay.

Để tắt demo, đặt trong `.env`:
```
VITE_DEMO_MODE=
VITE_SUPABASE_URL=https://gzznbchlgkqcmcoswsef.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

---

## 🔌 Supabase Setup (khi muốn dùng backend thật) — Project gzznbchlgkqcmcoswsef

### 1. Tạo project / Mở project có sẵn
- Dashboard: https://supabase.com/dashboard/project/gzznbchlgkqcmcoswsef

### 2. Chạy SQL Migration
Vào **SQL Editor** → chạy lần lượt:

1. `supabase/schema.sql` — tạo tables, indexes, triggers, RLS, storage policies + bucket `luutruhoso` (private) + `record_code_seq`
2. `supabase/seed.sql` — 5 bệnh nhân demo DERM-2026-000001..000005 + visits/meds/images/attachments

> RLS đã bật cho tất cả bảng. Storage bucket `luutruhoso` là **PRIVATE** (public = false). Không expose Service Role Key.

### 3. Kiểm tra Storage bucket `luutruhoso`
Dashboard → **Storage** → Bucket `luutruhoso` → **Private** (Public = OFF).
Nếu SQL chưa tạo, tạo thủ công:
- New Bucket → Name: `luutruhoso` → Private → Create.
- Sau đó chạy lại phần Storage policies trong `schema.sql`.

Cấu trúc thư mục:
```
luutruhoso/
  patients/
    DERM-2026-000001/
      visits/
        2026-08-10/
          image-01.jpg
          image-02.jpg
          xet-nghiem.pdf
```

Khi bác sĩ xem file private → tạo **signed URL** có hạn (không expose permanent public URL).

### 4. Cấu hình Auth
- Authentication → Providers → Email/Password: **ON**
- (Tùy chọn) Tắt Confirm email khi test, hoặc bật nếu production.

### 5. Tạo tài khoản bác sĩ/admin
**Cách A — qua Dashboard (khuyến nghị):**
- Authentication → Users → Add user → nhập email/password
- Sau đó vào SQL Editor chạy:
```sql
insert into profiles (user_id, full_name, role)
values ('<user_id_from_auth.users>', 'BS. Nguyễn Văn A', 'doctor');
-- role: 'admin' | 'doctor' | 'staff'
```

**Cách B — tự đăng ký (Register page):**
- Mở `/register` → tạo tài khoản → sẽ tự insert `profiles` với role đã chọn (cần RLS cho phép insert own).
- Lưu ý: role `admin` chỉ nên tạo qua SQL bởi admin hiện tại.

### 6. Kết nối frontend
Tạo `.env` từ `.env.example`:
```
VITE_SUPABASE_URL=https://gzznbchlgkqcmcoswsef.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_DEMO_MODE=
```
Chạy lại `npm run dev`.

### 7. Tạo tài khoản demo hướng dẫn
```
Email: doctor@dermacare.demo
Mật khẩu: demo1234 (hoặc bất kỳ trong demo mode)
Role: doctor

Email: admin@dermacare.demo / staff@dermacare.demo
```
Khi dùng Supabase thật, tạo tài khoản thật với email của phòng khám và chạy SQL insert profile tương ứng.

---

## 🗄️ Database Schema

Xem chi tiết trong `supabase/schema.sql` và `supabase/migrations/`. Tóm tắt:

- `profiles` (id, user_id FK auth.users, full_name, role: admin/doctor/staff)
- `patients` (id, record_code UNIQUE `DERM-YYYY-XXXXXX` CHECK format, full_name, dob, gender, phone, email, address, emergency_contact, skin_type, affected_areas[], allergies, medical_history, dermatology_history, current_medications, skincare_products, previous_treatments, status, is_archived, deleted_at, deleted_by, created_by)
- `medical_histories` (id, patient_id UNIQUE FK, skin_history, allergies, drug_allergies, cosmetic_allergies, family_history, current_medications, trigger_factors, notes)
- `visits` (id, patient_id FK, doctor_id, visit_date, visit_time, chief_complaint, reason, history, symptoms, skin_exam JSONB, clinical_findings, clinical_impression, diagnosis, differential_diagnosis, treatment_plan, skincare_advice, follow_up_date, notes, status)
- `medications` (id, visit_id FK, name, active_ingredient, dosage, frequency, duration...)
- `patient_images` (id, patient_id FK, visit_id FK, storage_path, file_name, file_type, file_size, body_area, captured_at, notes, uploaded_by) → bucket `luutruhoso`
- `attachments` (id, patient_id FK, visit_id FK, file_name, file_path, file_type, file_size, category: lab/prescription/report/other)
- `audit_logs` (id, user_id, action, patient_id, table_name, resource_type, record_id, metadata)
- `record_code_seq` (year, last_seq) — đảm bảo UNIQUE, concurrency-safe via pg_advisory_xact_lock

Indexes trên `record_code`, `full_name`, `phone`, `visit_date`... Triggers tự sinh `record_code` nếu rỗng (DERM-...), auto `updated_at`, audit triggers.

Storage: `luutruhoso` PRIVATE + 4 policies (select/insert/update/delete) cho `authenticated`.

---

## 🔒 Bảo mật (Security → Privacy → Functionality)

- **Auth**: `supabase.auth` — session persist + autoRefresh, redirect `/login` nếu chưa đăng nhập
- **RLS**: `ENABLE RLS` + policies `TO authenticated` (chưa đăng nhập = không đọc/ghi gì). Kiểm tra ở DB, không chỉ frontend.
- **Storage**: bucket `luutruhoso` PRIVATE + policies chỉ `authenticated`. Khi xem file → tạo signed URL có hạn (client không lưu permanent URL).
- **Không** expose Service Role Key — chỉ dùng anon key ở client, service key chỉ server/Edge Functions
- **Validation**: họ tên bắt buộc, ngày sinh hợp lệ, email format, SĐT, file type (JPG/PNG/WEBP/PDF) + size ≤8MB
- **Không** log dữ liệu nhạy cảm ra console/localStorage (trừ demo) và không đưa PHI vào URL nếu không cần
- **Soft delete / Archive** thay vì xóa cứng — cần ConfirmModal, chỉ ADMIN mới khôi phục
- **Audit log**: trigger DB + app-level insert cho create/update/upload/delete/view; user thường không thể sửa audit_logs (policy no-update/no-delete)
- **Least Privilege**: staff không xem toàn bộ nếu chưa cấp quyền (UI ẩn trường nhạy cảm; có thể tách View riêng)
- **HTTPS** bắt buộc production + Site URL trong Supabase Auth

> Staff: hiện RLS cho phép đọc tất cả nhưng UI ẩn các trường nhạy cảm; có thể tách View riêng nếu cần siết hơn.

---

## 📁 Cấu trúc project (theo yêu cầu)

```
dermacare/
├── src/
│   ├── components/   Sidebar, Header, RecordCode, VisitTimeline, ImageGallery, Toast, ConfirmDialog...
│   ├── pages/        Dashboard, Patients, PatientNew, PatientDetail, VisitNew, Search, Visits, Images, Stats, Login, Register, Settings
│   ├── layouts/      AppLayout
│   ├── contexts/     AuthContext
│   ├── lib/          supabase.js, demoStore.js
│   ├── utils/        format.js
│   └── index.css (tailwind)
├── supabase/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/   (copy của schema + hướng dẫn)
├── public/
├── .env.example
└── README.md
```

> Spec yêu cầu Next.js structure `app/patients/[id]` nhưng hiện tại dùng Vite + React Router (`src/pages/PatientDetail` với route `/patients/:id`) — tương đương về chức năng. Có thể migrate sang Next.js App Router khi cần SSR.

---

## 🧪 Dữ liệu demo — Hồ sơ mẫu Nguyễn Minh Anh

5 bệnh nhân với 2–3 lần khám mỗi người, có mã `DERM-2026-000001` → `DERM-2026-000005`. Kèm timeline, chẩn đoán, thuốc, ảnh placeholder (picsum). Luôn gắn nhãn **DEMO DATA**.

**Hồ sơ mẫu hoàn chỉnh:**
```
DERM-2026-000001 — Nguyễn Minh Anh
Thông tin: Nữ 2000-03-15, hỗn hợp da, mụn trứng cá từ 2018
Visits:
  2026-08-10 — Mụn trứng cá trung bình — Adapalene + Doxycycline — tái khám 2026-08-24
  2026-08-24 — Cải thiện 40% — Niacinamide — tái khám 2026-09-12
  2026-09-12 — Thuyên giảm — Azelaic acid — tái khám 2026-10-10
Hình ảnh: patients/DERM-2026-000001/visits/2026-08-10/image-01.jpg (placeholder)
Tài liệu: don-thuoc-2026-08-10.pdf (placeholder)
```

Reset demo: Settings → Reset demo data (xóa localStorage key `dermacare_demo_v3`).

---

## 📤 Export / In

Trong trang hồ sơ → nút `In / Export PDF` → dùng `window.print()` (CSS `@media print` ẩn header/sidebar). Trước khi export đã kiểm tra `isAuthenticated`. Có thể mở rộng xuất PDF server-side với kiểm tra quyền.

---

## 🔍 Tìm kiếm & Bộ lọc

- **Search global** (Header, Ctrl+K): tìm bằng `DERM-2026-000001`, tên, SĐT — ưu tiên mã hồ sơ chính xác.
- **Trang /patients**: tìm + lọc theo trạng thái (active/follow_up/archived), sắp xếp (mới nhất/cũ nhất/A-Z), phân trang.
- **Trang /search**: nhập mã → mở đúng hồ sơ.
- **Workspace filter**: ngày tạo, ngày khám, bác sĩ, tình trạng, có hình ảnh, cần tái khám (qua visits.follow_up_date).

---

## 📋 Copy mã hồ sơ

Mỗi nơi hiển thị `DERM-2026-XXXXXX` có nút **[Copy]** → clipboard + toast `Đã sao chép mã hồ sơ` (component `RecordCode`).

---

## 🚨 Error / Loading / Empty State

- **Loading**: skeleton pulse (Dashboard) / "Đang tải hồ sơ..."
- **Empty**: "Chưa có hồ sơ nào." / "Chưa có hình ảnh" / "Chưa có lần khám"
- **Error**: toast `Không thể tải dữ liệu. Vui lòng thử lại.` / `Không thể lưu hồ sơ.`
- **Search no result**: "Không tìm thấy hồ sơ phù hợp."

---

## 🚢 Deploy production

```bash
npm run build
# deploy dist/ lên Vercel / Netlify / Cloudflare Pages
# Env trên host:
VITE_SUPABASE_URL=https://gzznbchlgkqcmcoswsef.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_DEMO_MODE=
```
Đảm bảo **HTTPS** + đặt Site URL trong Supabase Auth → URL Configuration → `https://your-domain.com`.

---

## ✅ Checklist hoàn thành (45 yêu cầu)

- [x] Công nghệ: React + Vite + Tailwind + Supabase (Auth/DB/Storage/RLS) — responsive, env separation
- [x] Đăng nhập `/login`: email/password, đăng xuất, quên mật khẩu, protected route
- [x] Phân quyền: admin/doctor/staff + RLS (không chỉ frontend)
- [x] Dashboard: thống kê + bảng hồ sơ gần đây + recent visits/new patients
- [x] Kho hồ sơ `/patients`: tìm kiếm mã/tên/SĐT, đặc biệt `DERM-2026-XXXXXX`
- [x] Mã hồ sơ duy nhất `DERM-YYYY-XXXXXX`, UNIQUE, auto-generate, copy 1-click
- [x] Hồ sơ bệnh nhân `/patients/:id`: medical record dashboard, mã nổi bật, timeline
- [x] Thông tin bệnh nhân + Tiền sử da liễu (medical_histories)
- [x] Hồ sơ mẫu Nguyễn Minh Anh `DERM-2026-000001` — ghi rõ DEMO
- [x] Mẫu phiếu thăm khám (Encounter) đầy đủ trường
- [x] Lịch sử thăm khám timeline (2026-08-10 → 2026-08-24 → 2026-09-12)
- [x] Hình ảnh: JPG/PNG/WEBP, lưu `luutruhoso/patients/DERM-.../visits/...`, thumbnail/full, ngày upload, người upload
- [x] Tài liệu: PDF/JPG/PNG, gắn patient_id/visit_id, người upload
- [x] Storage private `luutruhoso`, signed URL, Storage Policies
- [x] Database RLS đầy đủ + indexes + constraints + triggers + audit
- [x] Audit log: ai tạo/xem/sửa/upload/xóa
- [x] Không xóa nhầm: ConfirmModal + soft delete (deleted_at/is_archived)
- [x] Giao diện hồ sơ mẫu có timeline + hình ảnh
- [x] Tạo hồ sơ mới: form + auto DERM-... + copy
- [x] Tìm kiếm nhanh global (Ctrl+K)
- [x] Bộ lọc: ngày, bác sĩ, tình trạng, có ảnh/tài liệu, cần tái khám
- [x] Export PDF (print) có kiểm tra quyền
- [x] UX feedback (toast), Loading/Empty/Error states, Responsive, Sidebar/Header
- [x] Database migration + auto-generate mã + Security + Privacy + Validation
- [x] Component tách rõ + supabase client tách lib/ + demo data + settings + env + README

---

## 📄 License

MIT — demo only, not for real PHI without proper compliance review (HIPAA/GDPR).
Không sử dụng dữ liệu bệnh nhân thật làm demo. Không public bucket `luutruhoso`.
