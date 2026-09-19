// DermaCare — dữ liệu dùng chung (đồng bộ Landing + Booking + Portals)
// 12 nhóm điều trị da liễu — logic thật, không bịa bác sĩ tượng trưng

export const SPECIALTIES = [
  {
    slug: 'mun-trung-ca-seo',
    name: 'Mụn trứng cá & Sẹo mụn',
    desc: 'Mụn viêm, mụn ẩn, thâm sau mụn và sẹo rỗ. Phác đồ chuẩn da liễu + theo dõi tái khám.',
    diseases: ['Mụn viêm', 'Mụn ẩn', 'Mụn đầu đen', 'Sẹo rỗ', 'Thâm sau mụn'],
    icon: 'sparkles',
  },
  {
    slug: 'viem-da-di-ung',
    name: 'Viêm da cơ địa & Dị ứng da',
    desc: 'Viêm da cơ địa, mề đay, viêm da tiếp xúc. Tìm nguyên nhân, kiểm soát ngứa và tái phát.',
    diseases: ['Viêm da cơ địa', 'Mề đay', 'Viêm da tiếp xúc', 'Chàm'],
    icon: 'shield',
  },
  {
    slug: 'sac-to-nam',
    name: 'Nám – Tàn nhang – Sắc tố',
    desc: 'Nám mảng, tàn nhang, tăng sắc tố sau viêm. Soi da, phân loại sắc tố và điều trị an toàn.',
    diseases: ['Nám', 'Tàn nhang', 'Đồi mồi', 'Tăng sắc tố sau viêm'],
    icon: 'sun',
  },
  {
    slug: 'vay-nen-man-tinh',
    name: 'Vảy nến & Viêm da mạn tính',
    desc: 'Vảy nến mảng, viêm da tiết bã, rosacea. Quản lý dài hạn, giảm đợt bùng phát.',
    diseases: ['Vảy nến', 'Viêm da tiết bã', 'Rosacea', 'Viêm da mạn'],
    icon: 'layers',
  },
  {
    slug: 'nhiem-trung-da',
    name: 'Nhiễm trùng da',
    desc: 'Nấm da, viêm nang lông, thủy đậu, herpes, chốc lở. Chẩn đoán đúng tác nhân, trị đúng thuốc.',
    diseases: ['Nấm da', 'Viêm nang lông', 'Herpes', 'Chốc lở', 'Mụn cóc'],
    icon: 'bug',
  },
  {
    slug: 'toc-da-dau',
    name: 'Rụng tóc & Bệnh da đầu',
    desc: 'Rụng tóc androgen, rụng tóc từng mảng, gàu và viêm da đầu. Soi nang tóc và phục hồi.',
    diseases: ['Rụng tóc', 'Gàu', 'Viêm da đầu', 'Hói androgen'],
    icon: 'scan',
  },
  {
    slug: 'tre-hoa-tham-my',
    name: 'Trẻ hóa & Thẩm mỹ da liễu',
    desc: 'Lão hóa da, lỗ chân lông to, sẹo và tone da không đều. Tư vấn an toàn, không lạm dụng thủ thuật.',
    diseases: ['Lão hóa da', 'Lỗ chân lông to', 'Da không đều màu', 'Sẹo thẩm mỹ'],
    icon: 'heart',
  },
  {
    slug: 'not-ruoi-ung-thu',
    name: 'Nốt ruồi & Tầm soát ung thư da',
    desc: 'Nốt ruồi bất thường, dày sừng, tổn thương nghi ngờ. Soi da và tầm soát sớm.',
    diseases: ['Nốt ruồi bất thường', 'Dày sừng', 'Tổn thương nghi ngờ', 'Tầm soát định kỳ'],
    icon: 'eye',
  },
  {
    slug: 'nam-mong',
    name: 'Nấm móng & Bệnh móng',
    desc: 'Nấm móng, móng quặm, viêm quanh móng. Điều trị kiên trì, tránh lây lan.',
    diseases: ['Nấm móng', 'Móng quặm', 'Viêm quanh móng', 'Móng dày vàng'],
    icon: 'layers',
  },
  {
    slug: 'cham-sua-tre-em',
    name: 'Chàm sữa & Da trẻ em',
    desc: 'Chàm sữa, rôm sảy, hăm tã, thủy đậu. Nội dung dễ hiểu cho ba mẹ.',
    diseases: ['Chàm sữa', 'Rôm sảy', 'Hăm tã', 'Thủy đậu', 'Tay chân miệng'],
    icon: 'shield',
  },
  {
    slug: 'seo-loi-vet-thuong',
    name: 'Sẹo lồi & Vết thương khó lành',
    desc: 'Sẹo lồi, sẹo phì đại, loét da, vết bỏng. Can thiệp sớm hạn chế sẹo xấu.',
    diseases: ['Sẹo lồi', 'Sẹo phì đại', 'Loét tì đè', 'Vết bỏng', 'Vết thương lâu lành'],
    icon: 'layers',
  },
  {
    slug: 'viem-da-tiet-ba',
    name: 'Viêm da tiết bã & Đỏ da mặt',
    desc: 'Viêm da tiết bã, đỏ da, giãn mạch vùng mặt. Kiểm soát đợt bùng phát.',
    diseases: ['Viêm da tiết bã', 'Đỏ da mặt', 'Giãn mạch', 'Bong vảy vùng chữ T'],
    icon: 'sun',
  },
]

// Bác sĩ dự phòng khi chưa có Supabase (thông tin logic theo chuyên môn, không tượng trưng vô lý)
// Khi có Supabase thật, web tự lấy từ bảng profiles (role=doctor) realtime.
export const FALLBACK_DOCTORS = [
  {
    user_id: 'doc-mun',
    full_name: 'BS. CKI Trần Mai Anh',
    specialty_slug: 'mun-trung-ca-seo',
    specialty: 'Mụn trứng cá & Sẹo mụn',
    experience: '8 năm da liễu',
    bio: 'Chuyên mụn viêm, thâm và sẹo rỗ. Theo dõi sát sau mỗi đợt điều trị.',
  },
  {
    user_id: 'doc-viemda',
    full_name: 'BS. CKI Nguyễn Hoàng Nam',
    specialty_slug: 'viem-da-di-ung',
    specialty: 'Viêm da cơ địa & Dị ứng da',
    experience: '10 năm da liễu',
    bio: 'Chuyên viêm da cơ địa, mề đay mạn và viêm da tiếp xúc ở người lớn & trẻ em.',
  },
  {
    user_id: 'doc-sacto',
    full_name: 'BS. CKII Lê Phương Thảo',
    specialty_slug: 'sac-to-nam',
    specialty: 'Nám – Sắc tố da',
    experience: '12 năm da liễu',
    bio: 'Chuyên nám, tàn nhang và tăng sắc tố. Ưu tiên điều trị an toàn, ít tái phát.',
  },
  {
    user_id: 'doc-tongquat',
    full_name: 'BS. CKI Phạm Đức Huy',
    specialty_slug: 'nhiem-trung-da',
    specialty: 'Nhiễm trùng & Da tổng quát',
    experience: '7 năm da liễu',
    bio: 'Khám tổng quát: nấm da, viêm nang lông, rụng tóc, tầm soát nốt ruồi.',
  },
]

export const TIME_SLOTS = ['08:00', '08:45', '09:30', '10:15', '13:30', '14:15', '15:00', '15:45', '16:30']

export const ABOUT_TIMELINE = [
  {
    no: '01',
    title: 'Khởi nguồn từ phòng khám',
    date: '01/2025',
    desc: 'DermaCare bắt đầu khi các bác sĩ da liễu cần một nơi đặt lịch gọn nhẹ: bệnh nhân kể đúng bệnh, bác sĩ nhận đúng chuyên môn.',
    highlight: false,
  },
  {
    no: '02',
    title: 'Số hóa hồ sơ & hình ảnh',
    date: '06/2025',
    desc: 'Mỗi hồ sơ có mã DERM-YYYY-XXXXXX duy nhất, ảnh tổn thương lưu bucket riêng tư với đường dẫn có thời hạn.',
    highlight: false,
  },
  {
    no: '03',
    title: 'Phân luồng đặt lịch thông minh',
    date: '11/2025',
    desc: 'Web tự phân loại nhóm bệnh từ mô tả của bệnh nhân để gợi ý bác sĩ đúng chuyên khoa ngay ở bước đặt lịch.',
    highlight: false,
  },
  {
    no: '04',
    title: 'Vận hành 3 vai trò realtime',
    date: '09/2026',
    desc: 'Bệnh nhân đặt lịch → bác sĩ và quản trị nhận thông báo tức thì, xác nhận và theo dõi trên đúng trang của từng vai trò.',
    highlight: true,
  },
]

export function specialtyBySlug(slug) {
  return SPECIALTIES.find((s) => s.slug === slug) || null
}

// Đoán nhóm bệnh từ mô tả tự do của bệnh nhân (logic phân loại đơn giản, minh bạch)
export function guessSpecialtyFromText(text = '') {
  const t = text.toLowerCase()
  const rules = [
    { slug: 'mun-trung-ca-seo', keys: ['mụn', 'thâm', 'sẹo rỗ', 'đầu đen', 'mụn ẩn', 'mụn viêm'] },
    { slug: 'cham-sua-tre-em', keys: ['chàm sữa', 'rôm sảy', 'hăm tã', 'thủy đậu', 'tay chân miệng', 'cứt trâu'] },
    { slug: 'viem-da-di-ung', keys: ['ngứa', 'mề đay', 'dị ứng', 'chàm', 'viêm da cơ địa', 'mẩn'] },
    { slug: 'sac-to-nam', keys: ['nám', 'tàn nhang', 'sắc tố', 'đồi mồi', 'thâm nám'] },
    { slug: 'viem-da-tiet-ba', keys: ['viêm da tiết bã', 'đỏ da mặt', 'giãn mạch'] },
    { slug: 'vay-nen-man-tinh', keys: ['vảy nến', 'tiết bã', 'rosacea', 'đỏ mặt', 'bong vảy'] },
    { slug: 'nam-mong', keys: ['nấm móng', 'móng quặm', 'móng dày', 'móng vàng', 'viêm quanh móng'] },
    { slug: 'nhiem-trung-da', keys: ['nấm', 'lang ben', 'herpes', 'zona', 'chốc', 'mụn cóc', 'viêm nang'] },
    { slug: 'toc-da-dau', keys: ['rụng tóc', 'hói', 'gàu', 'da đầu', 'nang tóc'] },
    { slug: 'tre-hoa-tham-my', keys: ['lão hóa', 'nếp nhăn', 'lỗ chân lông', 'trẻ hóa', 'không đều màu'] },
    { slug: 'seo-loi-vet-thuong', keys: ['sẹo lồi', 'sẹo phì đại', 'loét', 'vết bỏng', 'vết thương lâu lành', 'tì đè'] },
    { slug: 'not-ruoi-ung-thu', keys: ['nốt ruồi', 'ung thư', 'tầm soát', 'dày sừng', 'đốm nâu lạ'] },
  ]
  for (const r of rules) {
    if (r.keys.some((k) => t.includes(k))) return r.slug
  }
  return null
}
