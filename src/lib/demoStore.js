// In-memory demo store — mimics Supabase tables
// All data is fake: DEMO DATA — NOT REAL PATIENT INFORMATION

const LS_KEY = 'dermacare_demo_v3'
function migrateLegacyStore(raw){
  try{
    const parsed = JSON.parse(raw)
    if (parsed?.patients?.some(p=> p.record_code?.startsWith('DER-'))){
      parsed.patients.forEach(p=>{ if(p.record_code.startsWith('DER-')) p.record_code = p.record_code.replace('DER-','DERM-') })
      parsed.images?.forEach(img=>{ if(img.storage_path?.includes('DER-')) img.storage_path = img.storage_path.replace(/DER-/g,'DERM-') })
      return JSON.stringify(parsed)
    }
  }catch{}
  return raw
}

function uid() { return Math.random().toString(36).slice(2,10) + Date.now().toString(36) }

function genRecordCode(existing) {
  const yr = new Date().getFullYear()
  const count = existing.filter(p=>p.record_code.startsWith(`DERM-${yr}`)).length + 1
  return `DERM-${yr}-${String(count).padStart(6,'0')}`
}

const seedPatients = [
  {
    id: 'p-demo-000001', record_code: 'DERM-2026-000001', full_name: 'Nguyễn Minh Anh', date_of_birth:'2000-03-15', gender:'female', phone:'0901234567', email:'minhanh.demo@example.com', address:'123 Lê Lợi, Q.1, TP.HCM', emergency_contact:'Nguyễn Văn B - 0907654321 (Bố)', skin_type:'combination', affected_areas:['forehead','left_cheek','right_cheek','chin'], allergies:'Không ghi nhận', medical_history:'Tiền sử viêm da cơ địa nhẹ thời thơ ấu', dermatology_history:'Mụn trứng cá từ năm 2018, đã điều trị isotretinoin 2021', current_medications:'Không', skincare_products:'Cetaphil Gentle Cleanser, La Roche-Posay Anthelios', previous_treatments:'Isotretinoin 20mg (2021, 6 tháng)', status:'active', is_archived:false, created_by:'demo-doctor', created_at:'2026-08-10T02:00:00Z', updated_at:'2026-10-10T02:00:00Z'
  },
  {
    id: 'p-demo-000002', record_code: 'DERM-2026-000002', full_name: 'Trần Hoàng Phúc', date_of_birth:'1995-07-22', gender:'male', phone:'0912345678', email:'hoangphuc.demo@example.com', address:'45 Nguyễn Huệ, Q.1, TP.HCM', emergency_contact:'Trần Thị C - 0918765432 (Mẹ)', skin_type:'oily', affected_areas:['forehead','nose'], allergies:'Dị ứng hải sản', medical_history:'Không', dermatology_history:'Viêm da tiết bã 2020', current_medications:'Retinol 0.5% buổi tối', skincare_products:'CeraVe Foaming Cleanser', previous_treatments:'Ketoconazole 2% cream', status:'follow_up', is_archived:false, created_by:'demo-doctor', created_at:'2026-08-20T02:00:00Z', updated_at:'2026-09-20T02:00:00Z'
  },
  {
    id: 'p-demo-000003', record_code: 'DERM-2026-000003', full_name: 'Lê Thảo Vy', date_of_birth:'1998-11-08', gender:'female', phone:'0934567890', email:'thaovy.demo@example.com', address:'78 Võ Văn Tần, Q.3, TP.HCM', emergency_contact:'Lê Văn D - 0930001111 (Anh trai)', skin_type:'sensitive', affected_areas:['left_cheek','right_cheek'], allergies:'Dị ứng fragrance', medical_history:'Hen suyễn nhẹ', dermatology_history:'Rosacea type 2 từ 2023', current_medications:'Metronidazole gel', skincare_products:'Bioderma Sensibio H2O', previous_treatments:'Chưa điều trị đặc hiệu', status:'active', is_archived:false, created_by:'demo-doctor', created_at:'2026-09-05T02:00:00Z', updated_at:'2026-09-05T02:00:00Z'
  },
  {
    id: 'p-demo-000004', record_code: 'DERM-2026-000004', full_name: 'Phạm Quốc Huy', date_of_birth:'1988-02-14', gender:'male', phone:'0945678901', email:'quochuy.demo@example.com', address:'12 Pasteur, Q.3, TP.HCM', emergency_contact:'Phạm Thị E - 0940002222 (Vợ)', skin_type:'dry', affected_areas:['neck','other'], allergies:'Không', medical_history:'Tăng huyết áp', dermatology_history:'Vảy nến mảng 5 năm', current_medications:'Methotrexate 10mg/tuần (theo dõi BV Da Liễu)', skincare_products:'Eucerin Original', previous_treatments:'UVB quang trị liệu 2024', status:'active', is_archived:false, created_by:'demo-doctor', created_at:'2026-07-10T02:00:00Z', updated_at:'2026-07-10T02:00:00Z'
  },
  {
    id: 'p-demo-000005', record_code: 'DERM-2026-000005', full_name: 'Đặng Ngọc Linh', date_of_birth:'2002-06-30', gender:'female', phone:'0956789012', email:'ngoclinh.demo@example.com', address:'90 Điện Biên Phủ, Bình Thạnh, TP.HCM', emergency_contact:'Đặng Văn F - 0950003333 (Bố)', skin_type:'combination', affected_areas:['chin','forehead'], allergies:'Dị ứng nickel', medical_history:'Không', dermatology_history:'Viêm da tiếp xúc kích ứng do mỹ phẩm 2025', current_medications:'Không', skincare_products:'Simple Micellar, Avene Thermal Water', previous_treatments:'Ngưng sản phẩm nghi ngờ 2025', status:'follow_up', is_archived:false, created_by:'demo-doctor', created_at:'2026-08-01T02:00:00Z', updated_at:'2026-08-01T02:00:00Z'
  },
]

const seedVisits = [
  { id:'v-001', patient_id:'p-demo-000001', doctor_id:'demo-doctor', visit_date:'2026-08-10', reason:'Mụn viêm vùng mặt', symptoms:'Mụn viêm đỏ, đau nhẹ khi chạm, xuất hiện 2 tuần, nặng hơn trước kỳ kinh', clinical_findings:'Mụn viêm rải rác trán, má, cằm; mụn đầu đen vùng mũi; thâm sau mụn', diagnosis:'Mụn trứng cá mức độ trung bình (Acne vulgaris, moderate)', treatment_plan:'Adapalene 0.1% buổi tối, Benzoyl peroxide 2.5% chấm mụn, kháng sinh Doxycycline 100mg 1v/ngày 14 ngày', skincare_advice:'Rửa mặt 2 lần/ngày, chống nắng SPF50, tránh nặn mụn', follow_up_date:'2026-08-24', notes:'Tư vấn chế độ ăn, ngủ đủ giấc — DEMO DATA', status:'completed', created_at:'2026-08-10T03:00:00Z' },
  { id:'v-002', patient_id:'p-demo-000001', doctor_id:'demo-doctor', visit_date:'2026-08-24', reason:'Tái khám mụn viêm', symptoms:'Giảm sưng viêm, còn thâm đỏ', clinical_findings:'Giảm 40% tổn thương viêm, còn mụn ẩn trán', diagnosis:'Mụn trứng cá cải thiện', treatment_plan:'Tiếp tục Adapalene, giảm Doxycycline, thêm Niacinamide 5%', skincare_advice:'Duy trì skincare, thêm dưỡng ẩm', follow_up_date:'2026-09-12', notes:'Đánh giá tốt, tiếp tục theo dõi — DEMO', status:'completed', created_at:'2026-08-24T03:00:00Z' },
  { id:'v-003', patient_id:'p-demo-000001', doctor_id:'demo-doctor', visit_date:'2026-09-12', reason:'Tái khám lần 2', symptoms:'Da cải thiện rõ, ít mụn mới', clinical_findings:'Hết mụn viêm, còn thâm sau mụn nhẹ', diagnosis:'Mụn trứng cá thuyên giảm, tăng sắc tố sau viêm', treatment_plan:'Ngưng kháng sinh, duy trì Adapalene 3 lần/tuần, Azelaic acid 10%', skincare_advice:'Chống nắng nghiêm ngặt, tránh nắng gắt', follow_up_date:'2026-10-10', notes:'Tiên lượng tốt — DEMO', status:'completed', created_at:'2026-09-12T03:00:00Z' },
  { id:'v-004', patient_id:'p-demo-000002', doctor_id:'demo-doctor', visit_date:'2026-08-20', reason:'Da dầu, bong vảy vùng chữ T', symptoms:'Ngứa nhẹ, đỏ da, vảy trắng', clinical_findings:'Hồng ban, vảy mỡ vùng trán, cánh mũi', diagnosis:'Viêm da tiết bã (Seborrheic dermatitis)', treatment_plan:'Ketoconazole 2% cream 2 lần/ngày, rửa mặt dịu nhẹ', skincare_advice:'Tránh sản phẩm chứa cồn', follow_up_date:'2026-09-20', notes:'', status:'completed', created_at:'2026-08-20T03:00:00Z' },
  { id:'v-005', patient_id:'p-demo-000002', doctor_id:'demo-doctor', visit_date:'2026-09-20', reason:'Tái khám viêm da tiết bã', symptoms:'Giảm ngứa, còn đỏ nhẹ', clinical_findings:'Cải thiện 60%', diagnosis:'Viêm da tiết bã cải thiện', treatment_plan:'Duy trì Ketoconazole 2 lần/tuần dự phòng', skincare_advice:'Duy trì', follow_up_date:'2026-10-20', notes:'', status:'completed', created_at:'2026-09-20T03:00:00Z' },
  { id:'v-006', patient_id:'p-demo-000003', doctor_id:'demo-doctor', visit_date:'2026-09-05', reason:'Đỏ da, mụn mủ vùng má', symptoms:'Nóng rát, đỏ bừng sau nắng', clinical_findings:'Hồng ban, sẩn mủ vùng má', diagnosis:'Rosacea type 2 (Papulopustular)', treatment_plan:'Metronidazole 0.75% gel buổi tối, chống nắng vật lý', skincare_advice:'Tránh nắng, tránh rượu bia, đồ cay', follow_up_date:'2026-09-19', notes:'', status:'completed', created_at:'2026-09-05T03:00:00Z' },
]

const seedMeds = [
  { id:'m-001', visit_id:'v-001', name:'Doxycycline 100mg', active_ingredient:'Doxycycline', dosage:'100mg', frequency:'1 lần/ngày', duration:'14 ngày', instructions:'Uống sau ăn, tránh nắng', notes:'', created_at:'2026-09-12T03:10:00Z' },
  { id:'m-002', visit_id:'v-001', name:'Adapalene 0.1%', active_ingredient:'Adapalene', dosage:'0.1%', frequency:'1 lần buổi tối', duration:'30 ngày', instructions:'Bôi mỏng vùng mụn, tránh mắt', notes:'', created_at:'2026-09-12T03:10:00Z' },
  { id:'m-003', visit_id:'v-002', name:'Niacinamide 5%', active_ingredient:'Niacinamide', dosage:'5%', frequency:'2 lần/ngày', duration:'30 ngày', instructions:'Bôi sau toner', notes:'', created_at:'2026-09-26T03:10:00Z' },
]

const seedImages = [
  { id:'img-001', patient_id:'p-demo-000001', visit_id:'v-001', storage_path:'patients/DERM-2026-000001/visits/2026-08-10/image-01.jpg', body_area:'forehead', captured_at:'2026-08-10', notes:'Ảnh trán trước điều trị — placeholder DEMO', uploaded_by:'demo-doctor', created_at:'2026-08-10T04:00:00Z', url:'https://picsum.photos/seed/derma-forehead1/600/400' },
  { id:'img-002', patient_id:'p-demo-000001', visit_id:'v-002', storage_path:'patients/DERM-2026-000001/visits/2026-08-24/image-02.jpg', body_area:'forehead', captured_at:'2026-08-24', notes:'Ảnh trán sau 2 tuần — cải thiện DEMO', uploaded_by:'demo-doctor', created_at:'2026-08-24T04:00:00Z', url:'https://picsum.photos/seed/derma-forehead2/600/400' },
  { id:'img-003', patient_id:'p-demo-000002', visit_id:'v-004', storage_path:'patients/DERM-2026-000002/visits/2026-08-20/image-01.jpg', body_area:'nose', captured_at:'2026-08-20', notes:'Vùng mũi — vảy tiết bã DEMO', uploaded_by:'demo-doctor', created_at:'2026-08-20T04:00:00Z', url:'https://picsum.photos/seed/derma-nose/600/400' },
]

let store = null
function load() {
  if (store) return store
  try {
    // migrate from v2 if exists
    const legacyRaw = localStorage.getItem('dermacare_demo_v2')
    if (legacyRaw && !localStorage.getItem(LS_KEY)) {
      const migrated = migrateLegacyStore(legacyRaw)
      localStorage.setItem(LS_KEY, migrated)
      localStorage.removeItem('dermacare_demo_v2')
    }
    const raw = localStorage.getItem(LS_KEY)
    if (raw) store = JSON.parse(raw)
  } catch {}
  if (!store || !store.patients) {
    store = { patients: seedPatients, visits: seedVisits, medications: seedMeds, images: seedImages, audit_logs: [{id:uid(), user_id:'demo-doctor', action:'seed_demo', table_name:'patients', record_id:null, metadata:{count:5}, created_at:new Date().toISOString()}], seq: 6 }
  }
  // ensure record_code format DERM-
  let needsSave = false
  store.patients.forEach(p=>{ if(p.record_code?.startsWith('DER-') && !p.record_code.startsWith('DERM-')){ p.record_code = p.record_code.replace('DER-','DERM-'); needsSave=true }})
  if (needsSave) save()
  return store
}
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(store)) } catch {} }

export const demoStore = {
  // patients
  listPatients({ search='', status='all', sort='newest', page=1, perPage=10 } = {}) {
    const s = load()
    let arr = [...s.patients].filter(p=> !p.is_archived)
    if (search) {
      const q = search.toLowerCase()
      arr = arr.filter(p=> p.record_code.toLowerCase().includes(q) || p.full_name.toLowerCase().includes(q) || (p.phone||'').includes(q))
    }
    if (status !== 'all') arr = arr.filter(p=> p.status===status)
    if (sort==='newest') arr.sort((a,b)=> new Date(b.created_at)- new Date(a.created_at))
    else if (sort==='oldest') arr.sort((a,b)=> new Date(a.created_at)- new Date(b.created_at))
    else if (sort==='name') arr.sort((a,b)=> a.full_name.localeCompare(b.full_name))
    const total = arr.length
    const start = (page-1)*perPage
    return { data: arr.slice(start, start+perPage), total }
  },
  getPatient(idOrCode) {
    const s = load()
    return s.patients.find(p=> p.id===idOrCode || p.record_code===idOrCode) || null
  },
  createPatient(payload) {
    const s = load()
    const record_code = genRecordCode(s.patients)
    const now = new Date().toISOString()
    const patient = { id: 'p-'+uid(), record_code, status:'active', is_archived:false, created_at: now, updated_at: now, created_by:'demo-doctor', ...payload }
    s.patients.unshift(patient)
    s.audit_logs.unshift({ id:uid(), user_id:'demo-doctor', action:'create_patient', table_name:'patients', record_id: patient.id, metadata:{record_code}, created_at: now })
    save()
    return patient
  },
  updatePatient(id, patch) {
    const s = load()
    const idx = s.patients.findIndex(p=>p.id===id)
    if (idx<0) throw new Error('Patient not found')
    s.patients[idx] = { ...s.patients[idx], ...patch, updated_at: new Date().toISOString() }
    s.audit_logs.unshift({ id:uid(), user_id:'demo-doctor', action:'update_patient', table_name:'patients', record_id:id, metadata: patch, created_at: new Date().toISOString() })
    save()
    return s.patients[idx]
  },
  archivePatient(id) {
    return this.updatePatient(id, { is_archived: true, status:'archived' })
  },
  // visits
  listVisits(patientId) {
    const s = load()
    return s.visits.filter(v=> v.patient_id===patientId).sort((a,b)=> new Date(b.visit_date)- new Date(a.visit_date))
  },
  listAllVisits() {
    const s = load()
    return [...s.visits].sort((a,b)=> new Date(b.visit_date)- new Date(a.visit_date))
  },
  createVisit(patientId, payload) {
    const s = load()
    const now = new Date().toISOString()
    const visit = { id:'v-'+uid(), patient_id: patientId, doctor_id:'demo-doctor', status:'completed', created_at: now, updated_at: now, visit_date: new Date().toISOString().slice(0,10), ...payload }
    s.visits.push(visit)
    if (payload.medications?.length) {
      payload.medications.forEach(m=>{
        if (!m.name) return
        s.medications.push({ id:'m-'+uid(), visit_id: visit.id, created_at: now, ...m })
      })
    }
    s.audit_logs.unshift({ id:uid(), user_id:'demo-doctor', action:'create_visit', table_name:'visits', record_id: visit.id, metadata:{patientId}, created_at: now })
    save()
    return visit
  },
  updateVisit(visitId, patch) {
    const s = load()
    const idx = s.visits.findIndex(v=>v.id===visitId)
    if (idx<0) throw new Error('Visit not found')
    s.visits[idx] = { ...s.visits[idx], ...patch, updated_at: new Date().toISOString() }
    save()
    return s.visits[idx]
  },
  // meds
  listMeds(visitId) {
    const s = load()
    return s.medications.filter(m=> m.visit_id===visitId)
  },
  listMedsByPatient(patientId) {
    const s = load()
    const vIds = new Set(s.visits.filter(v=>v.patient_id===patientId).map(v=>v.id))
    return s.medications.filter(m=> vIds.has(m.visit_id))
  },
  // images
  listImages(patientId, visitId=null) {
    const s = load()
    let arr = s.images.filter(i=> i.patient_id===patientId)
    if (visitId) arr = arr.filter(i=> i.visit_id===visitId)
    return arr.sort((a,b)=> new Date(b.created_at)- new Date(a.created_at))
  },
  listAllImages() {
    const s = load()
    return [...s.images].sort((a,b)=> new Date(b.created_at)- new Date(a.created_at))
  },
  uploadImage(patientId, visitId, file, body_area, notes) {
    const s = load()
    const url = URL.createObjectURL(file)
    const now = new Date().toISOString()
    const patient = s.patients.find(p=>p.id===patientId)
    const recordCode = patient?.record_code || patientId
    const dateStr = new Date().toISOString().slice(0,10)
    // Spec path: luutruhoso/patients/DERM-YYYY-XXXXXX/visits/YYYY-MM-DD/image-01.jpg
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'_')
    const storage_path = `patients/${recordCode}/visits/${dateStr}/${Date.now()}-${safeName}`
    const img = { id:'img-'+uid(), patient_id: patientId, visit_id: visitId || null, storage_path, file_name: file.name, file_type: file.type, file_size: file.size, body_area: body_area||'other', captured_at: dateStr, notes: notes||'', uploaded_by:'demo-doctor', created_at: now, url }
    s.images.unshift(img)
    s.audit_logs.unshift({ id:uid(), user_id:'demo-doctor', action:'upload_image', table_name:'patient_images', record_id: img.id, metadata:{patientId}, created_at: now })
    save()
    return img
  },
  deleteImage(id) {
    const s = load()
    s.images = s.images.filter(i=>i.id!==id)
    save()
  },
  // stats
  stats() {
    const s = load()
    return {
      totalPatients: s.patients.filter(p=>!p.is_archived).length,
      totalVisits: s.visits.length,
      totalImages: s.images.length,
      followUp: s.patients.filter(p=>p.status==='follow_up' && !p.is_archived).length,
      recentVisits: [...s.visits].sort((a,b)=> new Date(b.visit_date)- new Date(a.visit_date)).slice(0,5),
      newPatients: [...s.patients].filter(p=>!p.is_archived).sort((a,b)=> new Date(b.created_at)- new Date(a.created_at)).slice(0,5)
    }
  },
  // audit
  listAudit() {
    const s = load()
    return [...s.audit_logs].sort((a,b)=> new Date(b.created_at)- new Date(a.created_at)).slice(0,50)
  },
  // search
  searchPatients(q) {
    const s = load()
    const query = (q||'').trim().toLowerCase()
    if (!query) return []
    return s.patients.filter(p=> !p.is_archived && (p.record_code.toLowerCase().includes(query) || p.full_name.toLowerCase().includes(query) || (p.phone||'').includes(query))).slice(0,8)
  },
  reset() {
    localStorage.removeItem(LS_KEY)
    store = null
    load()
    save()
  }
}
