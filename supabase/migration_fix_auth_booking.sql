-- DermaCare FIX — chạy 1 lần trong Supabase SQL Editor SAU schema.sql + migration_booking.sql
-- Mục đích: lưu được tài khoản người dùng (patient) + lưu lịch khám (kể cả khách chưa đăng nhập)
-- Project: gzznbchlgkqcmcoswsef

-- 1) Cho phép role patient (đăng ký công khai)
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin','doctor','patient','staff'));
alter table profiles add column if not exists specialty text;
alter table profiles add column if not exists specialty_slug text;
alter table profiles add column if not exists license_code text;
alter table profiles add column if not exists experience text;
alter table profiles add column if not exists bio text;

-- 2) Trigger tạo profile mặc định patient
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  r text := coalesce(new.raw_user_meta_data->>'role', 'patient');
begin
  if r not in ('admin','doctor','staff','patient') then r := 'patient'; end if;
  insert into public.profiles (id, user_id, full_name, role, phone)
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    r,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3) profiles: bệnh nhân đọc được danh sách bác sĩ để đặt lịch
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles for select to authenticated
using ( user_id = auth.uid() or role = 'doctor' or current_user_role() = 'admin' );
drop policy if exists "profiles_select_doctors_public" on profiles;
create policy "profiles_select_doctors_public" on profiles for select to anon
using ( role = 'doctor' );

-- 4) appointments: khách vãng lai (anon) vẫn insert được
drop policy if exists "appt_insert_anon" on appointments;
create policy "appt_insert_anon" on appointments for insert to anon with check (true);
drop policy if exists "notif_insert_anon" on notifications;
create policy "notif_insert_anon" on notifications for insert to anon with check (true);

-- 5) specialties đọc công khai
drop policy if exists "specialties_read_all" on specialties;
create policy "specialties_read_all" on specialties for select using (true);

-- 6) realtime cho lịch khám + thông báo
do $$ begin
  begin alter publication supabase_realtime add table appointments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table notifications; exception when duplicate_object then null; end;
end $$;
