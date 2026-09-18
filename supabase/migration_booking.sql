-- DermaCare booking migration — chạy trong Supabase SQL Editor SAU schema.sql
-- Thêm 3 vai trò patient/doctor/admin + đặt lịch + thông báo realtime

-- 1) profiles: mở rộng role patient + cột chuyên khoa bác sĩ
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin','doctor','patient','staff'));
alter table profiles add column if not exists specialty text;
alter table profiles add column if not exists specialty_slug text;
alter table profiles add column if not exists license_code text;
alter table profiles add column if not exists experience text;
alter table profiles add column if not exists bio text;

-- 2) specialties: 8 nhóm điều trị
create table if not exists specialties (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);
insert into specialties (slug, name, description) values
 ('mun-trung-ca-seo','Mụn trứng cá & Sẹo mụn','Mụn viêm, mụn ẩn, thâm và sẹo rỗ'),
 ('viem-da-di-ung','Viêm da cơ địa & Dị ứng da','Viêm da cơ địa, mề đay, viêm da tiếp xúc'),
 ('sac-to-nam','Nám – Tàn nhang – Sắc tố','Nám, tàn nhang, tăng sắc tố sau viêm'),
 ('vay-nen-man-tinh','Vảy nến & Viêm da mạn tính','Vảy nến, viêm da tiết bã, rosacea'),
 ('nhiem-trung-da','Nhiễm trùng da','Nấm da, viêm nang lông, herpes, chốc lở'),
 ('toc-da-dau','Rụng tóc & Bệnh da đầu','Rụng tóc, gàu, viêm da đầu'),
 ('tre-hoa-tham-my','Trẻ hóa & Thẩm mỹ da liễu','Lão hóa da, lỗ chân lông, tone da'),
 ('not-ruoi-ung-thu','Nốt ruồi & Tầm soát ung thư da','Nốt ruồi bất thường, tầm soát sớm')
on conflict (slug) do nothing;

-- 3) appointments: lịch hẹn
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_user_id uuid references auth.users(id) on delete set null,
  doctor_user_id uuid references profiles(user_id) on delete set null,
  specialty_slug text not null,
  specialty_name text not null,
  symptoms text not null,
  date date not null,
  time_slot text not null,
  full_name text not null,
  phone text not null,
  dob date,
  gender text check (gender in ('female','male','other')) default 'female',
  email text,
  skin_history_has boolean default false,
  skin_history_detail text,
  drug_allergy_has boolean default false,
  drug_allergy_detail text,
  current_meds_has boolean default false,
  current_meds_detail text,
  status text default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  doctor_name text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Backfill idempotent PHẢI chạy trước index: vá mọi cột còn thiếu nếu bảng đã tồn tại dở từ lần chạy lỗi trước
alter table appointments add column if not exists patient_user_id uuid;
alter table appointments add column if not exists doctor_user_id uuid;
alter table appointments add column if not exists specialty_slug text;
alter table appointments add column if not exists specialty_name text;
alter table appointments add column if not exists symptoms text;
alter table appointments add column if not exists date date;
alter table appointments add column if not exists time_slot text;
alter table appointments add column if not exists full_name text;
alter table appointments add column if not exists phone text;
alter table appointments add column if not exists dob date;
alter table appointments add column if not exists gender text;
alter table appointments add column if not exists email text;
alter table appointments add column if not exists skin_history_has boolean default false;
alter table appointments add column if not exists skin_history_detail text;
alter table appointments add column if not exists drug_allergy_has boolean default false;
alter table appointments add column if not exists drug_allergy_detail text;
alter table appointments add column if not exists current_meds_has boolean default false;
alter table appointments add column if not exists current_meds_detail text;
alter table appointments add column if not exists status text default 'pending';
alter table appointments add column if not exists note text;
alter table appointments add column if not exists created_at timestamptz default now();
alter table appointments add column if not exists updated_at timestamptz default now();
alter table appointments add column if not exists doctor_name text;

-- Index tạo SAU khi đã vá đủ cột
create index if not exists idx_appt_patient on appointments(patient_user_id);
create index if not exists idx_appt_doctor on appointments(doctor_user_id);
create index if not exists idx_appt_status on appointments(status);
create index if not exists idx_appt_specialty on appointments(specialty_slug);
create index if not exists idx_appt_date on appointments(date);

-- 4) notifications: thông báo web realtime
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  role_target text check (role_target in ('patient','doctor','admin')),
  specialty_slug text,
  type text not null,
  title text not null,
  body text,
  related_id uuid,
  is_read boolean default false,
  created_at timestamptz default now()
);
-- Backfill idempotent PHẢI chạy trước index (phòng bảng tồn tại dở từ lần chạy lỗi trước)
alter table notifications add column if not exists user_id uuid;
alter table notifications add column if not exists role_target text;
alter table notifications add column if not exists specialty_slug text;
alter table notifications add column if not exists type text;
alter table notifications add column if not exists title text;
alter table notifications add column if not exists body text;
alter table notifications add column if not exists related_id uuid;
alter table notifications add column if not exists is_read boolean default false;
alter table notifications add column if not exists created_at timestamptz default now();

-- Index tạo SAU khi đã vá đủ cột
create index if not exists idx_notif_user on notifications(user_id);
create index if not exists idx_notif_role on notifications(role_target);
create index if not exists idx_notif_created on notifications(created_at desc);

-- 5) contact_messages: liên hệ (không lưu địa chỉ)
create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,
  message text not null,
  created_at timestamptz default now()
);

-- 6) RLS
alter table specialties enable row level security;
alter table appointments enable row level security;
alter table notifications enable row level security;
alter table contact_messages enable row level security;

drop policy if exists "specialties_read_all" on specialties;
create policy "specialties_read_all" on specialties for select using (true);

drop policy if exists "contact_insert_all" on contact_messages;
create policy "contact_insert_all" on contact_messages for insert with check (true);
drop policy if exists "contact_select_admin" on contact_messages;
create policy "contact_select_admin" on contact_messages for select to authenticated using (true);

-- Khách chưa đăng nhập vẫn đặt được (lưu SĐT + tên), bác sĩ/admin xác nhận sau
drop policy if exists "appt_insert_auth" on appointments;
create policy "appt_insert_auth" on appointments for insert to authenticated with check (true);
drop policy if exists "appt_insert_anon" on appointments;
create policy "appt_insert_anon" on appointments for insert to anon with check (true);
drop policy if exists "appt_select_own_or_staff" on appointments;
create policy "appt_select_own_or_staff" on appointments for select to authenticated using (
  patient_user_id = auth.uid() or doctor_user_id = auth.uid() or current_user_role() in ('admin','doctor','staff')
);
drop policy if exists "appt_update_staff" on appointments;
create policy "appt_update_staff" on appointments for update to authenticated using (
  patient_user_id = auth.uid() or doctor_user_id = auth.uid() or current_user_role() in ('admin','doctor','staff')
);

drop policy if exists "notif_insert_auth" on notifications;
create policy "notif_insert_auth" on notifications for insert to authenticated with check (true);
drop policy if exists "notif_insert_anon" on notifications;
create policy "notif_insert_anon" on notifications for insert to anon with check (true);
drop policy if exists "notif_select_related" on notifications;
create policy "notif_select_related" on notifications for select to authenticated using (
  user_id = auth.uid() or role_target in ('patient','doctor','admin')
);
drop policy if exists "notif_update_own" on notifications;
create policy "notif_update_own" on notifications for update to authenticated using (
  user_id = auth.uid() or role_target in ('patient','doctor','admin')
);

-- 7) realtime
do $$ begin
  begin alter publication supabase_realtime add table appointments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table notifications; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table contact_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table specialties; exception when duplicate_object then null; end;
end $$;
