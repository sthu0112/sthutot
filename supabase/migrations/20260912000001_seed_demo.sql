-- ============================================================
-- DERMACARE RECORDS — Seed demo data (NOT REAL PATIENT INFORMATION)
-- Bucket: luutruhoso
-- Format: DERM-YYYY-XXXXXX
-- Run AFTER schema.sql and AFTER creating at least one profile row
-- ============================================================

-- Demo patients — mã DERM-2026-000001 .. 000005
insert into patients (record_code, full_name, date_of_birth, gender, phone, email, address, emergency_contact, skin_type, affected_areas, allergies, medical_history, dermatology_history, current_medications, skincare_products, previous_treatments, status)
values
('DERM-2026-000001','Nguyễn Minh Anh','2000-03-15','female','0901234567','minhanh.demo@example.com','123 Lê Lợi, Q.1, TP.HCM','Nguyễn Văn B - 0907654321 (Bố)','combination','{forehead,left_cheek,right_cheek,chin}','Không ghi nhận','Tiền sử viêm da cơ địa nhẹ thời thơ ấu','Mụn trứng cá từ năm 2018, đã điều trị isotretinoin 2021','Không','Cetaphil Gentle Cleanser, La Roche-Posay Anthelios','Isotretinoin 20mg (2021, 6 tháng)','active'),
('DERM-2026-000002','Trần Hoàng Phúc','1995-07-22','male','0912345678','hoangphuc.demo@example.com','45 Nguyễn Huệ, Q.1, TP.HCM','Trần Thị C - 0918765432 (Mẹ)','oily','{forehead,nose}','Dị ứng hải sản','Không','Viêm da tiết bã 2020','Retinol 0.5% buổi tối','CeraVe Foaming Cleanser','Ketoconazole 2% cream','follow_up'),
('DERM-2026-000003','Lê Thảo Vy','1998-11-08','female','0934567890','thaovy.demo@example.com','78 Võ Văn Tần, Q.3, TP.HCM','Lê Văn D - 0930001111 (Anh trai)','sensitive','{left_cheek,right_cheek}','Dị ứng fragrance','Hen suyễn nhẹ','Rosacea type 2 từ 2023','Metronidazole gel','Bioderma Sensibio H2O','Chưa điều trị đặc hiệu','active'),
('DERM-2026-000004','Phạm Quốc Huy','1988-02-14','male','0945678901','quochuy.demo@example.com','12 Pasteur, Q.3, TP.HCM','Phạm Thị E - 0940002222 (Vợ)','dry','{neck,other}','Không','Tăng huyết áp','Vảy nến mảng 5 năm','Methotrexate 10mg/tuần (theo dõi BV Da Liễu)','Eucerin Original','UVB quang trị liệu 2024','active'),
('DERM-2026-000005','Đặng Ngọc Linh','2002-06-30','female','0956789012','ngoclinh.demo@example.com','90 Điện Biên Phủ, Bình Thạnh, TP.HCM','Đặng Văn F - 0950003333 (Bố)','combination','{chin,forehead}','Dị ứng nickel','Không','Viêm da tiếp xúc kích ứng do mỹ phẩm 2025','Không','Simple Micellar, Avene Thermal Water','Ngưng sản phẩm nghi ngờ 2025','follow_up')
on conflict (record_code) do nothing;

-- Ensure seq table is in sync after seed
do $$
declare yr int := 2026; max_seq int;
begin
  select coalesce(max((regexp_match(record_code, 'DERM-2026-(\d+)'))[1]::int),0) into max_seq from patients where record_code like 'DERM-2026-%';
  insert into record_code_seq(year, last_seq) values (yr, max_seq) on conflict (year) do update set last_seq = excluded.last_seq;
end $$;

-- Demo medical_histories for DERM-2026-000001
insert into medical_histories (patient_id, skin_history, allergies, drug_allergies, cosmetic_allergies, family_history, current_medications, trigger_factors, notes)
select id, 'Mụn trứng cá từ năm 2018, đã điều trị isotretinoin 2021', 'Không ghi nhận', 'Không', 'Không rõ', 'Mẹ có tiền sử mụn trứng cá nhẹ', 'Không', 'Stress, chu kỳ kinh nguyệt, thức khuya', 'Tiền sử viêm da cơ địa nhẹ thời thơ ấu'
from patients where record_code='DERM-2026-000001'
on conflict (patient_id) do nothing;

-- Demo visits for DERM-2026-000001 (Nguyễn Minh Anh) — hồ sơ mẫu hoàn chỉnh
do $$
declare
  p1 uuid := (select id from patients where record_code='DERM-2026-000001');
  p2 uuid := (select id from patients where record_code='DERM-2026-000002');
  p3 uuid := (select id from patients where record_code='DERM-2026-000003');
  v1 uuid; v2 uuid; v3 uuid;
begin
  -- Patient 1 visits
  insert into visits (patient_id, visit_date, chief_complaint, reason, history, symptoms, clinical_findings, clinical_impression, diagnosis, differential_diagnosis, treatment_plan, skincare_advice, follow_up_date, notes)
  values
  (p1,'2026-08-10','Mụn viêm vùng mặt, thâm sau mụn','Mụn viêm vùng mặt','Mụn kéo dài 2 năm, nặng hơn 2 tuần trước khám','Mụn viêm đỏ, đau nhẹ khi chạm, xuất hiện 2 tuần, nặng hơn trước kỳ kinh','Mụn viêm rải rác trán, má, cằm; mụn đầu đen vùng mũi; thâm sau mụn','Mụn trứng cá viêm','Mụn trứng cá mức độ trung bình (Acne vulgaris, moderate)','Viêm nang lông, Rosacea','Adapalene 0.1% buổi tối, Benzoyl peroxide 2.5% chấm mụn, kháng sinh Doxycycline 100mg 1v/ngày 14 ngày','Rửa mặt 2 lần/ngày, chống nắng SPF50, tránh nặn mụn','2026-08-24','Tư vấn chế độ ăn, ngủ đủ giấc — DEMO DATA'),
  (p1,'2026-08-24','Tái khám mụn viêm','Tái khám mụn viêm','Sau 2 tuần điều trị','Giảm sưng viêm, còn thâm đỏ','Giảm 40% tổn thương viêm, còn mụn ẩn trán','Cải thiện','Mụn trứng cá cải thiện','—','Tiếp tục Adapalene, giảm Doxycycline, thêm Niacinamide 5%','Duy trì skincare, thêm dưỡng ẩm','2026-09-12','Đánh giá tốt, tiếp tục theo dõi — DEMO'),
  (p1,'2026-09-12','Tái khám lần 2','Tái khám lần 2','Sau 1 tháng điều trị','Da cải thiện rõ, ít mụn mới','Hết mụn viêm, còn thâm sau mụn nhẹ','Thuyên giảm','Mụn trứng cá thuyên giảm, tăng sắc tố sau viêm','Tăng sắc tố sau viêm','Ngưng kháng sinh, duy trì Adapalene 3 lần/tuần, Azelaic acid 10%','Chống nắng nghiêm ngặt, tránh nắng gắt','2026-10-10','Tiên lượng tốt — DEMO')
  on conflict do nothing;

  insert into medications (visit_id, name, active_ingredient, dosage, frequency, duration, instructions)
  values
  ((select id from visits where patient_id=p1 and visit_date='2026-08-10' limit 1),'Doxycycline 100mg','Doxycycline','100mg','1 lần/ngày','14 ngày','Uống sau ăn, tránh nắng'),
  ((select id from visits where patient_id=p1 and visit_date='2026-08-10' limit 1),'Adapalene 0.1%','Adapalene','0.1%','1 lần buổi tối','30 ngày','Bôi mỏng vùng mụn, tránh mắt'),
  ((select id from visits where patient_id=p1 and visit_date='2026-08-24' limit 1),'Niacinamide 5%','Niacinamide','5%','2 lần/ngày','30 ngày','Bôi sau toner')
  on conflict do nothing;

  -- Patient 2 visits
  insert into visits (patient_id, visit_date, chief_complaint, reason, symptoms, clinical_findings, diagnosis, treatment_plan, skincare_advice, follow_up_date)
  values
  (p2,'2026-08-20','Da dầu, bong vảy vùng chữ T','Da dầu, bong vảy vùng chữ T','Ngứa nhẹ, đỏ da, vảy trắng','Hồng ban, vảy mỡ vùng trán, cánh mũi','Viêm da tiết bã (Seborrheic dermatitis)','Ketoconazole 2% cream 2 lần/ngày, rửa mặt dịu nhẹ','Tránh sản phẩm chứa cồn','2026-09-20'),
  (p2,'2026-09-20','Tái khám viêm da tiết bã','Tái khám viêm da tiết bã','Giảm ngứa, còn đỏ nhẹ','Cải thiện 60%','Viêm da tiết bã cải thiện','Duy trì Ketoconazole 2 lần/tuần dự phòng','Duy trì','2026-10-20')
  on conflict do nothing;

  -- Patient 3 visits
  insert into visits (patient_id, visit_date, chief_complaint, reason, symptoms, clinical_findings, diagnosis, treatment_plan, skincare_advice, follow_up_date)
  values
  (p3,'2026-09-05','Đỏ da, mụn mủ vùng má','Đỏ da, mụn mủ vùng má','Nóng rát, đỏ bừng sau nắng','Hồng ban, sẩn mủ vùng má','Rosacea type 2 (Papulopustular)','Metronidazole 0.75% gel buổi tối, chống nắng vật lý','Tránh nắng, tránh rượu bia, đồ cay','2026-09-19')
  on conflict do nothing;

  -- Images — stored in bucket luutruhoso with structure: patients/DERM-2026-000001/visits/2026-08-10/image-01.jpg
  insert into patient_images (patient_id, visit_id, storage_path, file_name, file_type, body_area, notes)
  values
  (p1, (select id from visits where patient_id=p1 and visit_date='2026-08-10' limit 1),'patients/DERM-2026-000001/visits/2026-08-10/image-01.jpg','image-01.jpg','image/jpeg','forehead','Ảnh trán trước điều trị — placeholder DEMO'),
  (p1, (select id from visits where patient_id=p1 and visit_date='2026-08-24' limit 1),'patients/DERM-2026-000001/visits/2026-08-24/image-02.jpg','image-02.jpg','image/jpeg','forehead','Ảnh trán sau 2 tuần — cải thiện DEMO'),
  (p2, (select id from visits where patient_id=p2 limit 1),'patients/DERM-2026-000002/visits/2026-08-20/image-01.jpg','image-01.jpg','image/jpeg','nose','Vùng mũi — vảy tiết bã DEMO')
  on conflict do nothing;

  -- Attachments — tài liệu demo (PDF)
  insert into attachments (patient_id, visit_id, file_name, file_path, file_type, category)
  values
  (p1, (select id from visits where patient_id=p1 and visit_date='2026-08-10' limit 1), 'xet-nghiem-mau-2026-08-10.pdf','patients/DERM-2026-000001/visits/2026-08-10/xet-nghiem-mau-2026-08-10.pdf','application/pdf','lab'),
  (p1, (select id from visits where patient_id=p1 limit 1), 'don-thuoc-2026-08-10.pdf','patients/DERM-2026-000001/visits/2026-08-10/don-thuoc-2026-08-10.pdf','application/pdf','prescription')
  on conflict do nothing;

end $$;
