-- ============================================================
-- DERMACARE RECORDS — Storage Policies for bucket `luutruhoso`
-- Project: gzznbchlgkqcmcoswsef
-- Dashboard: https://supabase.com/dashboard/project/gzznbchlgkqcmcoswsef/storage/files/buckets/luutruhoso
-- Run in SQL Editor AFTER creating bucket (or let schema.sql create it)
-- Bucket MUST be PRIVATE (public = false) — không public hồ sơ bệnh nhân
-- ============================================================

-- Ensure bucket exists as PRIVATE
insert into storage.buckets (id, name, public) values ('luutruhoso','luutruhoso', false)
on conflict (id) do update set public = false;

-- Enable RLS on storage.objects (already enabled by Supabase)
-- Policies: chỉ authenticated mới được select/insert/update/delete trong bucket luutruhoso
-- Path convention: patients/DERM-YYYY-XXXXXX/visits/YYYY-MM-DD/image-01.jpg

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

-- Kiểm tra:
-- select * from storage.buckets where id='luutruhoso'; -- public should be false
-- select * from storage.objects where bucket_id='luutruhoso' limit 5;

-- Lưu ý: Khi bác sĩ xem file private, frontend gọi:
-- supabase.storage.from('luutruhoso').createSignedUrl('patients/DERM-2026-000001/visits/2026-08-10/image-01.jpg', 3600)
-- → trả về signed URL có hạn 1h, không expose permanent URL.
-- Không bao giờ để bucket ở trạng thái public.

-- Nếu bạn đang migrate từ bucket cũ `patient-images`, giữ policies cho backward compat:
insert into storage.buckets (id, name, public) values ('patient-images','patient-images', false)
on conflict (id) do nothing;
