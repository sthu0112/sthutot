import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../soida-scope.css'

const W = (fn) => (...a) => { try { return window[fn]?.(...a) } catch {} }

/* Trang Soi da AI (React + Tailwind, vibe web chính).
   Engine phân tích (public/soi-da/app.js) được nạp động và bám vào
   các mount-point id bên dưới — không dùng file HTML tĩnh nữa. */
export default function SoiDa() {
  useEffect(() => {
    let dead = false
    // Hiện mọi lỗi JS lên khung trạng thái camera — không còn lỗi thầm lặng
    const showErr = (msg) => {
      try {
        const st = document.getElementById('camStatus')
        if (st && msg) st.textContent = '⚠️ ' + msg
      } catch {}
    }
    const onErr = (e) => {
      const f = e?.filename || ''
      if (/^(chrome|moz)-extension:/.test(f)) return // bỏ qua lỗi extension rác
      showErr(e?.message || 'Lỗi không rõ, tải lại trang giúp mình')
    }
    const onRej = (e) => showErr(e?.reason?.message || 'Lỗi mạng, kiểm tra kết nối giúp mình')
    window.addEventListener('error', onErr)
    window.addEventListener('unhandledrejection', onRej)
    const load = (src) => new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = src; s.async = true
      s.onload = res; s.onerror = rej
      document.body.appendChild(s)
    })
    ;(async () => {
      try {
        if (!window.FaceMesh) await load('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js').catch(() => {})
        if (!window.__soidaEngine) {
          window.__SOIDA_BASE__ = '/soi-da/'
          await load('/soi-da/app.js')
          window.__soidaEngine = true
        }
        if (typeof window.openCamera !== 'function' || typeof window.initDermaCare !== 'function') {
          showErr('Chưa tải được engine (mất mạng?). Tải lại trang giúp mình.')
          return
        }
        if (!dead) window.initDermaCare?.()
      } catch {
        showErr('Chưa tải được engine (mất mạng?). Tải lại trang giúp mình.')
      }
    })()
    return () => {
      dead = true
      window.removeEventListener('error', onErr)
      window.removeEventListener('unhandledrejection', onRej)
      try { window.stopCamera && window.stopCamera(true) } catch {}
      try { window.__soidaInit = false } catch {} // mount sau bind lại từ đầu
    }
  }, [])

  const shoot = W('captureWithCountdown')
  const openCam = W('openCamera')
  const stopCam = () => W('stopCamera')()
  const retake = W('retakeCurrent')
  const demo = W('loadDemo')
  const analyze = W('analyzeAll')
  const dl = W('downloadJSON')
  const openBk = W('openBooking')
  const closeBk = W('closeBooking')
  const buildBk = W('buildBooking')
  const copyBk = W('copyBooking')
  const target = (a) => W('setTarget')(a)

  const stepBtn = (id, b, s, em) => (
    <button key={id} id={`step-${id}`} onClick={() => target(id)} className="step border-2 border-forest/15 bg-[#f8faf3] rounded-2xl p-2 cursor-pointer flex flex-col gap-0.5 text-forest text-left">
      <b className="text-[12px] text-pewter font-semibold">{b}</b>
      <span className="font-bold text-[14px]">{s}</span>
      <em className="not-italic text-[11px] font-semibold text-pewter">{em}</em>
    </button>
  )

  const thumb = (id, label) => (
    <div className="border-2 border-forest/15 rounded-2xl overflow-hidden cursor-pointer bg-[#f8faf3]" onClick={() => target(id)}>
      <canvas id={`cv-${id}`} width="480" height="360" className="w-full h-[150px] object-cover block bg-slate-200" />
      <span className="block font-bold text-[14px] px-2 pt-1.5 text-forest">{label}</span>
      <em id={`stat-${id}`} className="block not-italic text-[12px] font-semibold text-pewter px-2 pb-2">chưa chụp</em>
    </div>
  )

  const rescard = (id, label) => (
    <div className="border border-forest/15 rounded-2xl overflow-hidden bg-[#fbfbf4]">
      <h3 className="m-0 px-3 py-2.5 text-[15px] font-bold text-forest">{label} <span id={`st-${id}`} /></h3>
      <div className="imgwrap relative">
        <canvas id={`rv-${id}`} width="480" height="360" className="w-full block cursor-crosshair bg-slate-200" />
      </div>
      <p id={`cap-${id}`} className="text-[13px] font-semibold text-pewter px-3 py-2 m-0">—</p>
    </div>
  )

  return (
    <div className="soida-scope min-h-screen bg-snow text-forest">
      <header className="sticky top-0 z-30 bg-snow/95 backdrop-blur border-b border-forest/10">
        <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-[18px] tracking-tight">DermaCare <span className="w-2 h-2 rounded-full bg-forest" /></Link>
          <nav className="hidden md:flex items-center gap-6 text-[15px]">
            <Link to="/" className="hover:opacity-70">Trang chủ</Link>
            <Link to="/dat-lich" className="hover:opacity-70">Đặt lịch</Link>
            <Link to="/tro-ly-ai" className="hover:opacity-70">Hỏi AI</Link>
            <span className="font-bold border-b-2 border-forest pb-0.5">Soi da</span>
          </nav>
          <Link to="/dat-lich" className="px-5 py-2.5 rounded-pill bg-forest text-snow text-[14px] font-medium">Đặt lịch khám</Link>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-4 sm:px-6 py-5">
        <div className="flex items-center gap-2 text-[14px]">
          <div className="sstep" id="s1"><i>1</i> Chụp</div>
          <div className="sstep" id="s2"><i>2</i> Phân tích</div>
          <div className="sstep" id="s3"><i>3</i> Kết quả</div>
        </div>

        <div id="devicePrompt" className="mt-3 rounded-2xl p-3 items-center gap-3 bg-amber-50 border-2 border-amber-500" style={{ display: 'none' }}>
          <img id="qrImg" alt="QR mở trên điện thoại" className="w-[84px] h-[84px] border rounded-lg bg-white" />
          <div className="text-[13px] font-bold text-amber-900">Bạn đang dùng máy tính — quét QR bằng điện thoại để chụp trực tiếp, hoặc chụp camera thường rồi tải ảnh lên bên dưới.</div>
        </div>

        <section className="bg-white border border-forest/10 rounded-[24px] p-4 sm:p-5 mt-4" style={{ boxShadow: '0 8px 32px rgba(28,58,19,.08)' }}>
          <h2 className="text-[20px] font-extrabold">📷 Chụp 3 góc <small id="progress" className="text-teal-600">0/3</small></h2>
          <div className="rounded-2xl border-2 border-forest p-3.5 mb-3 text-center" style={{ background: 'linear-gradient(180deg,#f2f9d8,#fcfcf7)' }}>
            <div className="text-[15px] font-extrabold" id="gStep">BƯỚC 1/3</div>
            <div className="text-[21px] font-extrabold my-1.5" id="gMain">↰ Quay mặt sang TRÁI khung hình</div>
            <div className="text-[14px] font-semibold text-pewter" id="gSub">Để lộ má trái • Camera tự bám theo mặt • Đợi ✅ OK rồi bấm chụp (đếm 3-2-1)</div>
          </div>
          <div className="rounded-2xl p-3 mb-3 bg-orange-50 border-2 border-orange-400">
            <b className="text-[15px] text-orange-900">⚠️ Bắt buộc trước khi chụp (kẻo kết quả sai):</b>
            <ol className="m-2 mb-0 pl-5 text-[14px] font-semibold text-orange-950">
              <li><b>Tắt filter làm đẹp</b> (Beauty / Làm mịn da) — filter xóa mất nốt thật.</li>
              <li><b>Chụp bằng camera thường</b>, không dùng app có filter sẵn.</li>
              <li><b>Ánh sáng ổn định:</b> gần cửa sổ, mặt hướng ra sáng, không ngược sáng.</li>
            </ol>
          </div>

          <div className="grid gap-3.5" style={{ gridTemplateColumns: '1.25fr 1fr' }}>
            <div className="relative bg-[#0b1526] rounded-xl overflow-hidden min-h-[280px]">
              <canvas id="liveCanvas" width="640" height="480" className="w-full h-[360px] object-cover block bg-[#0b1526]" />
              <div id="countdown" className="absolute inset-0 flex items-center justify-center font-black pointer-events-none" style={{ fontSize: 110, color: '#fff', textShadow: '0 4px 30px rgba(0,0,0,.7)' }} />
              <div id="faceStatus" className="facestat absolute left-2.5 bottom-2.5 text-white text-[14px] font-bold px-3.5 py-2 rounded-full" style={{ background: 'rgba(2,10,25,.72)' }}>Camera chưa mở</div>
            </div>
            <div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {stepBtn('left_cheek', 'B1', 'Má Trái', 'quay sang trái')}
                {stepBtn('frontal', 'B2', 'Chính diện', 'nhìn thẳng')}
                {stepBtn('right_cheek', 'B3', 'Má Phải', 'quay sang phải')}
              </div>
              <div id="angleGuide" className="rounded-xl px-2.5 py-2 text-[14px] font-bold mb-2 text-forest border border-dashed border-forest" style={{ background: '#f2f9d8' }}>Bước 1/3 — Má Trái: quay mặt sang TRÁI khung hình</div>
              <div className="flex gap-2 flex-wrap my-2 items-center">
                <select id="camDevice" className="bg-white border border-forest/15 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-forest"><option value="">Camera mặc định</option></select>
              </div>
              <div className="flex gap-2 flex-wrap my-2 items-center">
                <button id="btnOpenCam" onClick={openCam} className="rounded-pill bg-forest text-lime px-4 py-2.5 text-[14px] font-bold">▶ Mở camera</button>
                <button id="btnShoot" onClick={shoot} disabled className="rounded-pill bg-forest text-lime px-5 py-3 text-[15px] font-bold disabled:opacity-45">📸 Chụp (3-2-1)</button>
                <button onClick={stopCam} className="rounded-pill bg-white border border-forest/15 px-4 py-2.5 text-[14px] font-bold">Dừng</button>
              </div>
              <label className="text-[13px] font-semibold text-pewter flex gap-1.5 items-center"><input type="checkbox" id="followToggle" defaultChecked className="w-auto" /> Camera tự bám theo mặt</label>
              <div className="flex gap-2 flex-wrap my-2 items-center">
                <button onClick={retake} className="rounded-pill bg-white border border-forest/15 px-4 py-2.5 text-[14px] font-bold">↺ Chụp lại góc này</button>
                <button onClick={demo} className="rounded-pill bg-white border border-forest/15 px-4 py-2.5 text-[14px] font-bold">Ảnh demo</button>
              </div>
              <div id="camStatus" className="text-[12px] font-semibold text-pewter">Bấm “Mở camera” và cho phép trình duyệt dùng webcam.</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-2.5 mt-3">
            {thumb('left_cheek', 'Má Trái')}
            {thumb('frontal', 'Chính diện')}
            {thumb('right_cheek', 'Má Phải')}
          </div>
          <div className="flex gap-2 flex-wrap my-2 items-center">
            <span className="text-[12px] font-semibold text-pewter"><b>Chụp bằng camera thường điện thoại rồi tải lên:</b></span>
            <input type="file" id="file-left_cheek" accept="image/*" className="text-[12px]" />
            <input type="file" id="file-frontal" accept="image/*" className="text-[12px]" />
            <input type="file" id="file-right_cheek" accept="image/*" className="text-[12px]" />
          </div>
        </section>

        <section className="bg-white border border-forest/10 rounded-[24px] p-4 sm:p-5 mt-4" style={{ boxShadow: '0 8px 32px rgba(28,58,19,.08)' }}>
          <h2 className="text-[20px] font-extrabold text-forest">📋 Kết quả <small id="busy" className="text-teal-600" /></h2>
          <div className="flex flex-wrap gap-1.5 my-2">
            {['1. Kiểm tra ảnh', '2. Nhận diện mặt', '3. Kiểm tra ánh sáng', '4. Loại bóng', '5. Phân vùng', '6. Tìm nốt', '7. Lọc nhiễu', '8. Chấm tin cậy', '9. Biểu đồ'].map((t, i) => (
              <span key={i} className="pstep" data-i={i}>{t}</span>
            ))}
          </div>
          <div id="triageBanner" className="my-2" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 my-2.5">
            <div className="bg-[#f4f5ec] border border-forest/10 rounded-2xl p-2.5 text-center"><small className="text-pewter text-[12px] font-bold">Tình trạng (bệnh da chính AI nhận thấy)</small><b id="kPrimary" className="block text-[16px] font-extrabold my-1">—</b><em id="kSim" className="not-italic text-[12px] font-bold text-teal-600" /></div>
            <div className="bg-[#f4f5ec] border border-forest/10 rounded-2xl p-2.5 text-center"><small className="text-pewter text-[12px] font-bold">Mức độ (thang điểm GAGS)</small><b id="kGags" className="block text-[16px] font-extrabold my-1">—</b></div>
            <div className="bg-[#f4f5ec] border border-forest/10 rounded-2xl p-2.5 text-center"><small className="text-pewter text-[12px] font-bold">Diện tích da bị ảnh hưởng (% da mặt có nốt)</small><b id="kArea" className="block text-[16px] font-extrabold my-1">—</b></div>
            <div className="bg-[#f4f5ec] border border-forest/10 rounded-2xl p-2.5 text-center"><small className="text-pewter text-[12px] font-bold">Khuyến nghị (mức cần đi khám)</small><b id="kTriage" className="block text-[16px] font-extrabold my-1">—</b></div>
          </div>

          <h3 className="mt-3 mb-1 text-[16px] font-extrabold">📍 Từng góc mặt</h3>
          <p className="text-pewter text-[14px] font-semibold my-1">👆 <b>Di chuột / chạm vào từng ô màu trên ảnh</b> để xem nốt đó là gì.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {rescard('left_cheek', 'Má Trái')}
            {rescard('frontal', 'Chính diện')}
            {rescard('right_cheek', 'Má Phải')}
          </div>

          <h3 className="mt-3.5 mb-1 text-[16px] font-extrabold">🧾 Bằng chứng từng vùng</h3>
          <p className="text-pewter text-[14px] font-semibold my-1"><b>Không phát hiện ≠ 0% do AI đoán.</b> Không phát hiện = chưa tìm thấy bằng chứng đủ mạnh.</p>
          <div id="sevMatrix" />

          <div className="text-[14px] font-semibold text-pewter my-2.5">Ô màu (di chuột vào để xem chi tiết):
            <b style={{ color: '#ef4444' }}> P</b> mụn viêm (nốt đỏ sưng đau) •
            <b style={{ color: '#dc2626' }}> N</b> cục/nang (mụn bọc sâu, dễ sẹo) •
            <b style={{ color: '#b8860b' }}> C</b> nhân mụn (đầu đen/trắng) •
            <b style={{ color: '#a855f7' }}> H</b> thâm (vết nâu sau mụn) •
            <b style={{ color: '#ec4899' }}> M</b> sắc tố (đốm nâu/đen)
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: '300px 1fr' }}>
            <div className="border border-forest/10 rounded-2xl bg-[#fbfbf4] p-3">
              <h3 className="m-0 mb-2 text-[15px] font-extrabold">🥧 Tỉ lệ loại tổn thương <span className="text-[12px] font-semibold text-pewter">(chỉ nốt đã xác nhận)</span></h3>
              <canvas id="pieChart" width="280" height="280" className="w-full max-w-[280px] block mx-auto" />
              <div id="pieLegend" className="pielegend" />
            </div>
            <div className="border border-forest/10 rounded-2xl bg-[#fbfbf4] p-3">
              <h3 className="m-0 mb-1 text-[15px] font-extrabold">📊 Điểm da của bạn (tính riêng từng người)</h3>
              <p className="text-pewter text-[13px] font-semibold my-1">Thang 0–10 theo số nốt <b>bạn</b> đang có. Vạch xám là mức tham khảo chung.</p>
              <div id="scoreBars" />
              <h3 className="mt-3 mb-1 text-[15px] font-extrabold">🔍 Top 12 điểm da cần theo dõi kỹ nhất</h3>
              <p className="text-pewter text-[13px] font-semibold my-1">Chỉ nốt đã xác nhận (qua đối chứng đa góc) mới lên đây.</p>
              <div id="zoomGrid" className="zoomgrid" />
            </div>
          </div>

          <div id="lesionList" style={{ display: 'none' }} />
          <div id="mdOut" className="rounded-2xl p-3.5 text-[15px] font-semibold leading-relaxed my-2.5" style={{ background: '#f4f5ec', border: '1px solid #dde0cd' }}>Chụp đủ 3 góc để xem kết quả.</div>
          <div className="flex gap-2 flex-wrap my-2 items-center">
            <button id="btnAnalyze" onClick={analyze} className="rounded-pill bg-forest text-lime px-4 py-2.5 text-[14px] font-bold">▶ Phân tích lại 3 góc</button>
            <button onClick={dl} className="rounded-pill bg-white border border-forest/15 px-4 py-2.5 text-[14px] font-bold">⬇ Tải kết quả</button>
            <button onClick={openBk} className="rounded-pill bg-forest text-lime px-4 py-2.5 text-[14px] font-bold">📅 Đặt lịch & gửi báo cáo cho bác sĩ</button>
          </div>
        </section>

        <footer className="text-center text-pewter text-[13px] font-semibold mt-4">DermaCare — AI hỗ trợ, không thay thế bác sĩ da liễu.</footer>
      </main>

      <div id="gpop" className="gpop" style={{ display: 'none' }}><span className="x" onClick={() => { document.getElementById('gpop').style.display = 'none' }}>✕</span><div id="gpopBody" /></div>

      <div id="bookModal" className="fixed inset-0 items-stretch justify-center p-[2vh] hidden" style={{ zIndex: 60, background: 'rgba(28,58,19,.45)', display: 'none' }}>
        <div className="bg-[#fcfcf7] rounded-3xl w-full flex flex-col overflow-hidden" style={{ maxWidth: 1320 }}>
          <button onClick={closeBk} aria-label="Đóng" className="self-end mt-3 mr-3 border-0 text-forest font-extrabold cursor-pointer" style={{ background: '#e7ead9', width: 36, height: 36, borderRadius: '50%' }}>✕</button>
          <div className="flex items-start justify-between gap-3 px-6 pb-3.5 border-b border-forest/10">
            <div>
              <div className="text-[22px] font-extrabold">📅 Đặt lịch khám da liễu</div>
              <div className="text-[13px] font-semibold text-pewter mt-1">Hồ sơ gồm 3 ảnh chụp + kết quả AI — gửi phòng khám qua Zalo/email hoặc mang theo khi đi khám</div>
            </div>
            <span className="badge bGREEN">Miễn phí tạo hồ sơ</span>
          </div>
          <div className="grid md:grid-cols-2 overflow-auto">
            <div className="p-5 px-6">
              <h4 className="my-1.5 text-[15px]">1. Thông tin của bạn</h4>
              <label className="block text-[14px] font-bold my-2">Họ tên <input id="bkName" placeholder="VD: Nguyễn Văn A" className="w-full mt-1 bg-white border border-forest/15 rounded-xl px-2.5 py-2 text-[14px] font-semibold" /></label>
              <label className="block text-[14px] font-bold my-2">Số điện thoại <input id="bkPhone" placeholder="VD: 09xx xxx xxx" className="w-full mt-1 bg-white border border-forest/15 rounded-xl px-2.5 py-2 text-[14px] font-semibold" /></label>
              <label className="block text-[14px] font-bold my-2">Ngày mong muốn khám <input id="bkDate" type="date" className="w-full mt-1 bg-white border border-forest/15 rounded-xl px-2.5 py-2 text-[14px] font-semibold" /></label>
              <label className="block text-[14px] font-bold my-2">Ghi chú thêm <input id="bkNote" placeholder="VD: mụn nặng lên 2 tuần nay" className="w-full mt-1 bg-white border border-forest/15 rounded-xl px-2.5 py-2 text-[14px] font-semibold" /></label>
              <h4 className="my-1.5 text-[15px]">2. Lấy hồ sơ</h4>
              <div className="flex gap-2 flex-wrap my-2 items-center">
                <button onClick={() => W('bookOnline')()} className="rounded-pill bg-forest text-lime px-5 py-3 text-[15px] font-bold">➡ Đặt lịch online (điền sẵn)</button>
              </div>
              <div className="flex gap-2 flex-wrap my-2 items-center">
                <button onClick={buildBk} className="rounded-pill bg-forest text-lime px-5 py-3 text-[15px] font-bold">⬇ Tạo hồ sơ & tải về</button>
                <button onClick={copyBk} className="rounded-pill bg-white border border-forest/15 px-4 py-2.5 text-[14px] font-bold">📋 Sao chép tóm tắt</button>
              </div>
              <p className="text-[13px] font-semibold text-pewter">File <b>ho-so-soi-da.html</b> mở được trên mọi máy, có sẵn ảnh + kết quả để bác sĩ xem.</p>
            </div>
            <div className="p-5 px-6" style={{ background: '#eeeee9', borderLeft: '1px solid #dde0cd' }}>
              <h4 className="my-1.5 text-[15px]">Tóm tắt gửi bác sĩ</h4>
              <textarea id="bookSummary" rows="14" readOnly placeholder="Bấm “Tạo hồ sơ” — tóm tắt hiện ở đây để copy" className="w-full mt-1 bg-white border border-forest/15 rounded-xl px-2.5 py-2 text-[13px]" />
              <div id="bookResult" className="text-[13px] font-bold text-emerald-700 mt-2" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'none' }} aria-hidden="true">
        <input id="age" type="number" defaultValue="24" />
        <select id="gender"><option>Nữ</option><option>Nam</option><option>Khác</option></select>
        <select id="duration"><option>&lt; 1 tháng</option><option>1-3 tháng</option><option>3-6 tháng</option><option>&gt; 6 tháng</option></select>
        <input id="products" defaultValue="SRM dịu nhẹ, BHA 2%, KCN" />
        <pre id="jsonOut">{}</pre><pre id="kbView" />
      </div>
      <video id="camVideo" autoPlay playsInline muted style={{ display: 'none' }} />
      <canvas id="camSnap" width="480" height="360" style={{ display: 'none' }} />
    </div>
  )
}
