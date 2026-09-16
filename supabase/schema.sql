-- ============================================================
-- DERMACARE RECORDS — Supabase SQL Schema (Security First)
-- Project: gzznbchlgkqcmcoswsef
-- Bucket: luutruhoso (PRIVATE)
-- Run in Supabase Dashboard > SQL Editor (single migration)
-- ============================================================

-- 0) Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1) Helper for record_code — DERM-YYYY-XXXXXX (6 digits, UNIQUE, concurrency-safe)
-- Uses advisory lock + count fallback. For production high-concurrency, replace with sequence table.
create table if not exists record_code_seq (
  year int primary key,
  last_seq int not null default 0
);

create or replace function generate_record_code()
returns text language plpgsql as $$
declare
  yr text := to_char(now(), 'YYYY');
  yr_int int := to_char(now(), 'YYYY')::int;
  seq int;
  code text;
  attempt int := 0;
begin
  -- Lock per-year to avoid race
  perform pg_advisory_xact_lock(yr_int);

  insert into record_code_seq(year, last_seq) values (yr_int, 0)
  on conflict (year) do nothing;

  -- Try to use seq table if patients already migrated, else fallback to max
  select last_seq + 1 into seq from record_code_seq where year = yr_int;

  -- Ensure seq is beyond existing max (migration from DER- to DERM-)
  declare
    max_existing int;
  begin
    select coalesce(max((regexp_match(record_code, 'DERM-'||yr||'-(\d+)'))[1]::int), 0) into max_existing
    from patients where record_code like 'DERM-'||yr||'-%';
    if seq <= max_existing then seq := max_existing + 1; end if;
  end;

  update record_code_seq set last_seq = seq where year = yr_int;

  code := 'DERM-' || yr || '-' || lpad(seq::text, 6, '0');
  return code;
end $$;

-- 2) profiles — maps auth.users -> app user (thông tin bác sĩ)
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin','doctor','staff')),
  phone text, -- số điện thoại di động bác sĩ (mới)
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Safety: vá cột TRƯỚC khi tạo index (phòng bảng profiles tồn tại dở từ template khác)
alter table profiles add column if not exists user_id uuid;
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists role text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists avatar_url text;
do $$ begin
  alter table profiles add constraint profiles_user_id_unique unique (user_id);
exception when duplicate_object then null; when others then null;
end $$;

create index if not exists idx_profiles_user_id on profiles(user_id);
create index if not exists idx_profiles_role on profiles(role);

-- Trigger: tự động tạo profile khi có user mới đăng ký (bảo mật: role mặc định doctor, lấy từ user_metadata)
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, full_name, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'doctor'),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3) patients — Mã hồ sơ duy nhất DERM-YYYY-XXXXXX
create table if not exists patients (
  id uuid primary key default uuid_generate_v4(),
  record_code text unique not null,
  full_name text not null,
  date_of_birth date,
  gender text check (gender in ('male','female','other','unknown')),
  phone text,
  email text,
  address text,
  emergency_contact text,
  skin_type text check (skin_type in ('dry','oily','combination','sensitive','normal','unknown')),
  affected_areas text[],
  allergies text,
  medical_history text,
  dermatology_history text,
  current_medications text,
  skincare_products text,
  previous_treatments text,
  status text default 'active' check (status in ('active','follow_up','archived')),
  is_archived boolean default false,
  deleted_at timestamptz,
  deleted_by uuid references profiles(user_id),
  created_by uuid references profiles(user_id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint record_code_format check (record_code ~ '^DERM-[0-9]{4}-[0-9]{6}$')
);
-- Safety: vá cột patients TRƯỚC index (phòng bảng tồn tại dở)
alter table patients add column if not exists record_code text;
alter table patients add column if not exists full_name text;
alter table patients add column if not exists date_of_birth date;
alter table patients add column if not exists gender text;
alter table patients add column if not exists phone text;
alter table patients add column if not exists email text;
alter table patients add column if not exists address text;
alter table patients add column if not exists emergency_contact text;
alter table patients add column if not exists skin_type text;
alter table patients add column if not exists affected_areas text[];
alter table patients add column if not exists allergies text;
alter table patients add column if not exists medical_history text;
alter table patients add column if not exists dermatology_history text;
alter table patients add column if not exists current_medications text;
alter table patients add column if not exists skincare_products text;
alter table patients add column if not exists previous_treatments text;
alter table patients add column if not exists status text;
alter table patients add column if not exists is_archived boolean default false;
alter table patients add column if not exists deleted_at timestamptz;
alter table patients add column if not exists deleted_by uuid;
alter table patients add column if not exists created_by uuid;
alter table patients add column if not exists created_at timestamptz default now();
alter table patients add column if not exists updated_at timestamptz default now();

create index if not exists idx_patients_record_code on patients(record_code);
create index if not exists idx_patients_full_name on patients(full_name);
create index if not exists idx_patients_phone on patients(phone);
create index if not exists idx_patients_status on patients(status);
create index if not exists idx_patients_created_at on patients(created_at desc);
create index if not exists idx_patients_deleted_at on patients(deleted_at);

-- trigger: auto generate record_code if not provided
create or replace function trg_set_record_code()
returns trigger language plpgsql as $$
begin
  if new.record_code is null or new.record_code = '' then
    new.record_code := generate_record_code();
  end if;
  -- Normalize: ensure DERM- prefix (reject DER- legacy if inserted manually)
  if new.record_code !~ '^DERM-[0-9]{4}-[0-9]{6}$' then
    raise exception 'record_code must match DERM-YYYY-XXXXXX';
  end if;
  return new;
end $$;
drop trigger if exists patients_record_code on patients;
create trigger patients_record_code before insert on patients
for each row execute function trg_set_record_code();

-- trigger: updated_at
create or replace function trg_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists patients_updated_at on patients;
create trigger patients_updated_at before update on patients for each row execute function trg_updated_at();
drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles for each row execute function trg_updated_at();

-- 4) medical_histories — Tiền sử da liễu tách bảng (liên kết patients)
create table if not exists medical_histories (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null unique references patients(id) on delete cascade,
  skin_history text,
  allergies text,
  drug_allergies text,
  cosmetic_allergies text,
  family_history text,
  current_medications text,
  trigger_factors text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Safety: vá cột medical_histories TRƯỚC index
alter table medical_histories add column if not exists patient_id uuid;
alter table medical_histories add column if not exists skin_history text;
alter table medical_histories add column if not exists allergies text;
alter table medical_histories add column if not exists drug_allergies text;
alter table medical_histories add column if not exists cosmetic_allergies text;
alter table medical_histories add column if not exists family_history text;
alter table medical_histories add column if not exists current_medications text;
alter table medical_histories add column if not exists trigger_factors text;
alter table medical_histories add column if not exists notes text;
alter table medical_histories add column if not exists created_at timestamptz default now();
alter table medical_histories add column if not exists updated_at timestamptz default now();

create index if not exists idx_medical_histories_patient_id on medical_histories(patient_id);
drop trigger if exists medical_histories_updated_at on medical_histories;
create trigger medical_histories_updated_at before update on medical_histories for each row execute function trg_updated_at();

-- 5) visits — Encounter / Visit
create table if not exists visits (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid references profiles(user_id),
  visit_date date not null default current_date,
  visit_time time,
  chief_complaint text,
  reason text,
  history text,
  symptoms text,
  skin_exam jsonb, -- {location, count, size, color, morphology, surface, distribution, severity}
  clinical_findings text,
  clinical_impression text,
  diagnosis text,
  differential_diagnosis text,
  treatment_plan text,
  treatment jsonb, -- structured treatment
  skincare_advice text,
  follow_up_date date,
  follow_up_notes text,
  response_to_treatment text,
  notes text,
  status text default 'completed' check (status in ('draft','completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Safety: vá cột visits TRƯỚC index
alter table visits add column if not exists patient_id uuid;
alter table visits add column if not exists doctor_id uuid;
alter table visits add column if not exists visit_date date;
alter table visits add column if not exists visit_time time;
alter table visits add column if not exists chief_complaint text;
alter table visits add column if not exists reason text;
alter table visits add column if not exists history text;
alter table visits add column if not exists symptoms text;
alter table visits add column if not exists skin_exam jsonb;
alter table visits add column if not exists clinical_findings text;
alter table visits add column if not exists clinical_impression text;
alter table visits add column if not exists diagnosis text;
alter table visits add column if not exists differential_diagnosis text;
alter table visits add column if not exists treatment_plan text;
alter table visits add column if not exists treatment jsonb;
alter table visits add column if not exists skincare_advice text;
alter table visits add column if not exists follow_up_date date;
alter table visits add column if not exists follow_up_notes text;
alter table visits add column if not exists response_to_treatment text;
alter table visits add column if not exists notes text;
alter table visits add column if not exists status text;
alter table visits add column if not exists created_at timestamptz default now();
alter table visits add column if not exists updated_at timestamptz default now();

create index if not exists idx_visits_patient_id on visits(patient_id);
create index if not exists idx_visits_visit_date on visits(visit_date desc);
create index if not exists idx_visits_doctor_id on visits(doctor_id);
create index if not exists idx_visits_follow_up on visits(follow_up_date) where follow_up_date is not null;
drop trigger if exists visits_updated_at on visits;
create trigger visits_updated_at before update on visits for each row execute function trg_updated_at();

-- 6) medications
create table if not exists medications (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references visits(id) on delete cascade,
  name text not null,
  active_ingredient text,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  notes text,
  created_at timestamptz default now()
);
-- Safety: vá cột medications TRƯỚC index
alter table medications add column if not exists visit_id uuid;
alter table medications add column if not exists name text;
alter table medications add column if not exists active_ingredient text;
alter table medications add column if not exists dosage text;
alter table medications add column if not exists frequency text;
alter table medications add column if not exists duration text;
alter table medications add column if not exists instructions text;
alter table medications add column if not exists notes text;
alter table medications add column if not exists created_at timestamptz default now();

create index if not exists idx_medications_visit_id on medications(visit_id);

-- 7) patient_images — Hình ảnh da liễu (lưu trong bucket luutruhoso)
create table if not exists patient_images (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  visit_id uuid references visits(id) on delete set null,
  storage_path text not null, -- luutruhoso/patients/DERM-2026-000001/visits/2026-08-10/image-01.jpg
  file_name text,
  file_type text,
  file_size int,
  body_area text check (body_area in ('forehead','left_cheek','right_cheek','chin','nose','neck','other')),
  captured_at date default current_date,
  notes text,
  uploaded_by uuid references profiles(user_id),
  created_at timestamptz default now()
);
-- Safety: vá cột patient_images TRƯỚC index
alter table patient_images add column if not exists patient_id uuid;
alter table patient_images add column if not exists visit_id uuid;
alter table patient_images add column if not exists storage_path text;
alter table patient_images add column if not exists file_name text;
alter table patient_images add column if not exists file_type text;
alter table patient_images add column if not exists file_size int;
alter table patient_images add column if not exists body_area text;
alter table patient_images add column if not exists captured_at date;
alter table patient_images add column if not exists notes text;
alter table patient_images add column if not exists uploaded_by uuid;
alter table patient_images add column if not exists created_at timestamptz default now();

create index if not exists idx_patient_images_patient_id on patient_images(patient_id);
create index if not exists idx_patient_images_visit_id on patient_images(visit_id);

-- 8) attachments — Tài liệu (PDF, DOCX, xét nghiệm, đơn thuốc)
create table if not exists attachments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  visit_id uuid references visits(id) on delete set null,
  file_name text not null,
  file_path text not null, -- luutruhoso/patients/DERM-.../visits/.../doc.pdf
  file_type text,
  file_size int,
  category text check (category in ('lab','prescription','report','other')) default 'other',
  uploaded_by uuid references profiles(user_id),
  created_at timestamptz default now()
);
-- Safety: vá cột attachments TRƯỚC index
alter table attachments add column if not exists patient_id uuid;
alter table attachments add column if not exists visit_id uuid;
alter table attachments add column if not exists file_name text;
alter table attachments add column if not exists file_path text;
alter table attachments add column if not exists file_type text;
alter table attachments add column if not exists file_size int;
alter table attachments add column if not exists category text;
alter table attachments add column if not exists uploaded_by uuid;
alter table attachments add column if not exists created_at timestamptz default now();

create index if not exists idx_attachments_patient_id on attachments(patient_id);
create index if not exists idx_attachments_visit_id on attachments(visit_id);

-- 9) audit_logs
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(user_id),
  action text not null,
  patient_id uuid references patients(id) on delete set null,
  table_name text,
  resource_type text,
  record_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);
-- Safety: vá cột audit_logs TRƯỚC index
alter table audit_logs add column if not exists user_id uuid;
alter table audit_logs add column if not exists action text;
alter table audit_logs add column if not exists patient_id uuid;
alter table audit_logs add column if not exists table_name text;
alter table audit_logs add column if not exists resource_type text;
alter table audit_logs add column if not exists record_id uuid;
alter table audit_logs add column if not exists metadata jsonb;
alter table audit_logs add column if not exists created_at timestamptz default now();

create index if not exists idx_audit_logs_user_id on audit_logs(user_id);
create index if not exists idx_audit_logs_patient_id on audit_logs(patient_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
create index if not exists idx_audit_logs_action on audit_logs(action);

-- helper to get current role
create or replace function current_user_role()
returns text language sql stable as $$
  select role from profiles where user_id = auth.uid() limit 1;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table patients enable row level security;
alter table medical_histories enable row level security;
alter table visits enable row level security;
alter table medications enable row level security;
alter table patient_images enable row level security;
alter table attachments enable row level security;
alter table audit_logs enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles for select to authenticated
using ( user_id = auth.uid() or current_user_role() = 'admin' );

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert to authenticated with check ( user_id = auth.uid() );

drop policy if exists "profiles_update_own_or_admin" on profiles;
create policy "profiles_update_own_or_admin" on profiles for update to authenticated
using ( user_id = auth.uid() or current_user_role() = 'admin' );

-- patients
drop policy if exists "patients_authenticated_all" on patients;
create policy "patients_authenticated_all" on patients for all to authenticated
using ( auth.role() = 'authenticated' ) with check ( auth.role() = 'authenticated' );

-- medical_histories
drop policy if exists "medical_histories_authenticated_all" on medical_histories;
create policy "medical_histories_authenticated_all" on medical_histories for all to authenticated
using ( auth.role()='authenticated' ) with check ( auth.role()='authenticated' );

-- visits
drop policy if exists "visits_authenticated_all" on visits;
create policy "visits_authenticated_all" on visits for all to authenticated
using ( auth.role()='authenticated' ) with check ( auth.role()='authenticated' );

-- medications
drop policy if exists "medications_authenticated_all" on medications;
create policy "medications_authenticated_all" on medications for all to authenticated
using ( auth.role()='authenticated') with check ( auth.role()='authenticated');

-- patient_images
drop policy if exists "patient_images_authenticated_all" on patient_images;
create policy "patient_images_authenticated_all" on patient_images for all to authenticated
using ( auth.role()='authenticated') with check ( auth.role()='authenticated');

-- attachments
drop policy if exists "attachments_authenticated_all" on attachments;
create policy "attachments_authenticated_all" on attachments for all to authenticated
using ( auth.role()='authenticated') with check ( auth.role()='authenticated');

-- audit_logs: users can insert, admin can read all, user can read own
drop policy if exists "audit_insert_authenticated" on audit_logs;
create policy "audit_insert_authenticated" on audit_logs for insert to authenticated with check ( auth.uid() is not null );

drop policy if exists "audit_select_own_or_admin" on audit_logs;
create policy "audit_select_own_or_admin" on audit_logs for select to authenticated
using ( user_id = auth.uid() or current_user_role()='admin' );

-- Prevent update/delete on audit_logs for non-service_role
drop policy if exists "audit_no_update" on audit_logs;
create policy "audit_no_update" on audit_logs for update to authenticated using (false);
drop policy if exists "audit_no_delete" on audit_logs;
create policy "audit_no_delete" on audit_logs for delete to authenticated using (false);

-- ============================================================
-- STORAGE — private bucket: luutruhoso
-- ============================================================
-- Bucket MUST be private. Do NOT set public=true
insert into storage.buckets (id, name, public) values ('luutruhoso','luutruhoso', false)
on conflict (id) do update set public = false;

-- Storage RLS — authenticated only, path: patients/DERM-YYYY-XXXXXX/visits/YYYY-MM-DD/*
-- Store files under luutruhoso
drop policy if exists "luutruhoso_select_authenticated" on storage.objects;
create policy "luutruhoso_select_authenticated" on storage.objects for select to authenticated
using ( bucket_id='luutruhoso' );

drop policy if exists "luutruhoso_insert_authenticated" on storage.objects;
create policy "luutruhoso_insert_authenticated" on storage.objects for insert to authenticated
with check ( bucket_id='luutruhoso' );

drop policy if exists "luutruhoso_update_authenticated" on storage.objects;
create policy "luutruhoso_update_authenticated" on storage.objects for update to authenticated
using ( bucket_id='luutruhoso' );

drop policy if exists "luutruhoso_delete_authenticated" on storage.objects;
create policy "luutruhoso_delete_authenticated" on storage.objects for delete to authenticated
using ( bucket_id='luutruhoso' );

-- Legacy bucket migration: if old bucket patient-images exists, keep policies but advise to migrate
-- Keep private as well
insert into storage.buckets (id, name, public) values ('patient-images','patient-images', false)
on conflict (id) do nothing;

drop policy if exists "patient_images_storage_select" on storage.objects;
create policy "patient_images_storage_select" on storage.objects for select to authenticated
using ( bucket_id='patient-images' );

drop policy if exists "patient_images_storage_insert" on storage.objects;
create policy "patient_images_storage_insert" on storage.objects for insert to authenticated
with check ( bucket_id='patient-images' );

drop policy if exists "patient_images_storage_update" on storage.objects;
create policy "patient_images_storage_update" on storage.objects for update to authenticated
using ( bucket_id='patient-images' );

drop policy if exists "patient_images_storage_delete" on storage.objects;
create policy "patient_images_storage_delete" on storage.objects for delete to authenticated
using ( bucket_id='patient-images' );

-- ============================================================
-- AUDIT TRIGGER: auto log patient changes
-- ============================================================
create or replace function trg_audit_patient() returns trigger language plpgsql as $$
begin
  insert into audit_logs(user_id, action, table_name, resource_type, record_id, patient_id, metadata)
  values (auth.uid(), TG_OP || '_patient', TG_TABLE_NAME, 'patient', coalesce(new.id, old.id), coalesce(new.id, old.id), to_jsonb(coalesce(new, old)));
  return coalesce(new, old);
end $$;
drop trigger if exists audit_patients on patients;
create trigger audit_patients after insert or update or delete on patients
for each row execute function trg_audit_patient();

create or replace function trg_audit_visit() returns trigger language plpgsql as $$
begin
  insert into audit_logs(user_id, action, table_name, resource_type, record_id, patient_id, metadata)
  values (auth.uid(), TG_OP || '_visit', TG_TABLE_NAME, 'visit', coalesce(new.id, old.id), coalesce(new.patient_id, old.patient_id), jsonb_build_object('visit_id', coalesce(new.id, old.id), 'patient_id', coalesce(new.patient_id, old.patient_id)));
  return coalesce(new, old);
end $$;
drop trigger if exists audit_visits on visits;
create trigger audit_visits after insert or update or delete on visits
for each row execute function trg_audit_visit();

-- ============================================================
-- SOFT DELETE helper
-- ============================================================
create or replace function soft_delete_patient(target_id uuid)
returns void language plpgsql security definer as $$
begin
  update patients set deleted_at = now(), deleted_by = auth.uid(), is_archived = true, status='archived'
  where id = target_id;
  insert into audit_logs(user_id, action, table_name, resource_type, record_id, patient_id)
  values (auth.uid(), 'soft_delete_patient', 'patients', 'patient', target_id, target_id);
end $$;

-- ============================================================
-- REALTIME — cho lưu trữ realtime user & hồ sơ
-- ============================================================
-- Bật realtime cho các bảng chính (cần chạy sau khi tạo bảng)
do $$ begin
  begin
    alter publication supabase_realtime add table profiles;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table patients;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table visits;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table patient_images;
  exception when duplicate_object then null; end;
end $$;

-- ============================================================
-- MIGRATION: normalize legacy DER- codes to DERM- if needed
-- ============================================================
-- Uncomment to migrate existing DER- codes:
-- update patients set record_code = replace(record_code, 'DER-', 'DERM-') where record_code like 'DER-%';
