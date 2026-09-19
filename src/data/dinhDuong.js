// List món ăn + liệu pháp thiên nhiên (ảnh thật trong public/img, nguồn Wikimedia Commons).
// Nguyên tắc: diễn đạt "hỗ trợ/có thể", ghi rõ nguồn, luôn kèm lưu ý an toàn.
const IMG = (n) => `/img/${n}.jpg`

export const FOODS = [
  { key: 'ca-hoi', ten: 'Cá hồi, cá béo', img: IMG('ca-hoi'), nen: true, viSao: 'Giàu omega-3 (EPA/DHA) hỗ trợ giảm phản ứng viêm — tốt cho da mụn, viêm da. Ăn 2-3 bữa/tuần.', nguon: 'NHS · WHO' },
  { key: 'yen-mach', ten: 'Yến mạch', img: IMG('yen-mach'), nen: true, viSao: 'Chất xơ hòa tan, đường huyết thấp, no lâu. Tắm yến mạch còn giúp dịu ngứa (Mayo Clinic).', nguon: 'Mayo Clinic · WHO' },
  { key: 'tra-xanh', ten: 'Trà xanh không đường', img: IMG('tra-xanh'), nen: true, viSao: 'EGCG chống oxy hóa. Uống thay nước ngọt rất tốt cho da mụn.', nguon: 'AAD · WHO' },
  { key: 'rau-xanh', ten: 'Rau lá xanh', img: IMG('rau-xanh'), nen: true, viSao: 'Vitamin A, C, sắt, folate — nuôi da và nang tóc khỏe mỗi ngày.', nguon: 'WHO' },
  { key: 'ca-chua', ten: 'Cà chua chín', img: IMG('ca-chua'), nen: true, viSao: 'Lycopene chống oxy hóa, hỗ trợ da dưới nắng. Không thay kem chống nắng.', nguon: 'Mayo Clinic' },
  { key: 'viet-quat', ten: 'Việt quất, quả mọng', img: IMG('viet-quat'), nen: true, viSao: 'Anthocyanin + vitamin C giúp da đều màu, chậm lão hóa.', nguon: 'AAD' },
  { key: 'hat-bi', ten: 'Hạt bí, hạt hướng dương', img: IMG('hat-bi'), nen: true, viSao: 'Kẽm và vitamin E hỗ trợ kiểm soát dầu và lành da. Ăn một nắm nhỏ mỗi ngày.', nguon: 'NHS · WHO' },
  { key: 'trung', ten: 'Trứng', img: IMG('trung'), nen: true, viSao: 'Đạm, biotin, vitamin D tốt cho da và tóc. Ăn điều độ mỗi ngày.', nguon: 'WHO · NHS' },
  { key: 'ga-ran', ten: 'Gà rán, đồ chiên nhiều dầu', img: IMG('ga-ran'), nen: false, viSao: 'Nhiều dầu mỡ, dễ bùng mụn và tăng phản ứng viêm. Ăn chơi thỉnh thoảng, đừng thành bữa chính.', nguon: 'AAD · Mayo Clinic' },
  { key: 'nuoc-ngot', ten: 'Nước ngọt có ga', img: IMG('nuoc-ngot'), nen: false, viSao: 'Đường rất cao — nghiên cứu quan sát thấy liên quan mụn nặng hơn. Đổi sang trà xanh/trà thảo mộc không đường.', nguon: 'AAD · WHO' },
  { key: 'bia-ruou', ten: 'Rượu, bia', img: IMG('bia-ruou'), nen: false, viSao: 'Giãn mạch gây đỏ mặt, mất nước, dễ bùng viêm và rosacea. Da đang viêm thì nên kiêng hẳn.', nguon: 'NHS · AAD' },
  { key: 'banh-keo', ten: 'Bánh kẹo ngọt', img: IMG('banh-keo'), nen: false, viSao: 'Đường huyết cao làm da lão hóa nhanh và mụn khó lành. Thèm ngọt thì ăn trái cây tươi.', nguon: 'WHO · AAD' },
]

export const NATURALS = [
  {
    key: 'nha-dam', ten: 'Nha đam tươi', img: IMG('nha-dam'),
    congDung: 'Làm dịu vùng đỏ rát sau nắng, cấp ẩm nhẹ cho da khô.',
    hieuQua: 'Dịu nhanh trong ngày; kiên trì 2-4 tuần da mềm hơn. Không trị được mụn nặng hay nám sâu.',
    cachLam: ['Chọn bẹ to, gọt bỏ vỏ xanh và rửa sạch mủ vàng (gây ngứa).', 'Lấy gel trong, bôi mỏng vùng cần dịu 10-15 phút rồi rửa sạch.', 'Dùng 2-3 lần/tuần, thử trước ở sau tai 1 ngày.'],
    luuY: 'Mủ vàng của nha đam gây ngứa — phải rửa thật sạch. Da đang có vết hở, mụn mủ thì bỏ qua.',
  },
  {
    key: 'mat-ong', ten: 'Mật ong nguyên chất', img: IMG('mat-ong'),
    congDung: 'Kháng khuẩn nhẹ, giữ ẩm, chấm điểm mụn viêm nhỏ.',
    hieuQua: 'Nốt viêm nhỏ xẹp nhanh hơn sau 1-2 đêm. Không xử lý được mụn bọc, nang.',
    cachLam: ['Rửa tay sạch, chấm một giọt mật ong lên nốt mụn.', 'Để 15-20 phút rồi rửa sạch bằng nước ấm.', 'Thử trước ở cằm 1 ngày vì có người dị ứng phấn hoa trong mật.'],
    luuY: 'Chỉ dùng mật ong thật, rõ nguồn. Không bôi lên vết thương hở sâu.',
  },
  {
    key: 'yen-mach-tam', ten: 'Tắm yến mạch', img: IMG('yen-mach'),
    congDung: 'Dịu ngứa da khô, rôm sảy, viêm nhẹ (Mayo Clinic ghi nhận).',
    hieuQua: 'Đỡ ngứa ngay sau khi tắm; duy trì 2-3 lần/tuần trong đợt khô ngứa.',
    cachLam: ['Xay mịn 1 chén yến mạch cán dẹt thành bột.', 'Hòa vào chậu nước ấm (không nóng), khuấy đều.', 'Ngâm hoặc dội 15 phút rồi thấm khô nhẹ, bôi dưỡng ẩm ngay.'],
    luuY: 'Nước quá nóng làm khô da hơn. Da nhiễm trùng, chảy dịch thì đi khám thay vì tắm lá.',
  },
  {
    key: 'tra-xanh-dap', ten: 'Trà xanh đắp mát', img: IMG('tra-xanh'),
    congDung: 'Chống oxy hóa, dịu da dầu và vùng hơi đỏ.',
    hieuQua: 'Da mát, bớt bóng dầu sau mỗi lần đắp. Hiệu quả duy trì, không trắng cấp tốc.',
    cachLam: ['Hãm 2 túi trà xanh với 200ml nước sôi, để nguội hẳn.', 'Thấm bông hoặc mặt nạ giấy, đắp 10 phút.', 'Rửa lại nước mát, dưỡng ẩm nhẹ. 2-3 lần/tuần.'],
    luuY: 'Không đắp khi đang viêm nặng, trầy xước. Nước trà phải nguội hẳn.',
  },
  {
    key: 'dau-dua', ten: 'Dầu dừa', img: IMG('dau-dua'),
    congDung: 'Dưỡng ẩm vùng da khô nứt (gót chân, khuỷu tay, môi).',
    hieuQua: 'Mềm da ngay sau bôi; hợp da khô, da thường.',
    cachLam: ['Lấy lượng nhỏ bằng hạt đậu, xoa ấm trong lòng bàn tay.', 'Bôi mỏng vùng khô vào buổi tối.', 'Da mặt đang mụn: TRÁNH vì dễ bít tắc thêm.'],
    luuY: 'Dầu dừa gây bít tắc ở nhiều người da mụn — chỉ dùng cho vùng khô ngoài mặt.',
  },
  {
    key: 'tram-tra', ten: 'Tinh dầu tràm trà pha loãng', img: IMG('tram-tra'),
    congDung: 'Hỗ trợ nốt viêm nhỏ, da đầu gàu nhẹ (bằng chứng ban đầu).',
    hieuQua: 'Nốt nhỏ khô đầu nhanh hơn sau vài ngày chấm đúng cách.',
    cachLam: ['Pha 1-2 giọt tinh dầu với 1 thìa dầu nền (jojoba/dừa).', 'Chấm đúng nốt mụn, tránh lan ra da lành.', 'Thử trước ở sau tai 24 giờ. Tuyệt đối tránh mắt và vết hở.'],
    luuY: 'KHÔNG bôi trực tiếp tinh dầu nguyên chất — bỏng rát da. Ngưng ngay nếu đỏ rát lan.',
  },
  {
    key: 'nghe', ten: 'Bột nghệ + mật ong', img: IMG('nghe'),
    congDung: 'Mặt nạ sáng da, hỗ trợ mờ thâm mới.',
    hieuQua: 'Da sáng, thâm mới mờ dần sau 4-8 tuần đều đặn. Vàng da tạm 1-2 ngày sau đắp.',
    cachLam: ['Trộn 1 thìa cà phê bột nghệ + 1 thìa mật ong (+ ít sữa chua không đường).', 'Bôi mỏng toàn mặt 10-15 phút, 1-2 lần/tuần.', 'Rửa kỹ bằng sữa rửa mặt dịu nhẹ, chống nắng kỹ ban ngày.'],
    luuY: 'Vàng da tạm thời là bình thường. Dị ứng nghệ thì bỏ ngay. Không trị được nám chân sâu.',
  },
  {
    key: 'dua-chuot', ten: 'Dưa chuột ướp lạnh', img: IMG('dua-chuot'),
    congDung: 'Giảm sưng bọng mắt buổi sáng, dịu da sau nắng nhẹ.',
    hieuQua: 'Mắt đỡ sưng sau 10 phút đắp lạnh. Hiệu quả tức thì, ngắn hạn.',
    cachLam: ['Rửa sạch, thái lát mỏng, ướp lạnh 15 phút.', 'Đắp lên mắt/ vùng cần dịu 10 phút.', 'Rửa lại nước mát. Dao thớt phải sạch.'],
    luuY: 'Chỉ là biện pháp làm mát tạm thời, không thay kem mắt hay điều trị.',
  },
]
