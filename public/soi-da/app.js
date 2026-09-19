/* DermaCare localhost demo
 * Flow: 3 angles -> FaceMesh filter -> 6 ROI -> heuristic lesion seg (stand-in YOLOv8-Seg/ViT) -> aggregator + kb.json RAG -> dashboard
 * Thay model thật bằng cách thay hàm detectLesions() bằng fetch tới inference server.
 */
const ANGLES = ["left_cheek", "frontal", "right_cheek"];
const EXPECTED_YAW = { left_cheek: [-55, -20], frontal: [-18, 18], right_cheek: [20, 55] };
const state = { left_cheek: { img: null }, frontal: { img: null }, right_cheek: { img: null } };
let KB = null;

const CLASS_COLOR = { pustule: "#ef4444", papule: "#fb923c", comedone: "#eab308", whitehead: "#facc15", pih: "#a855f7", mole: "#ff00aa", nodule: "#dc2626" };
const CLASS_VI = { pustule: "Mụn mủ/viêm", papule: "Sẩn viêm", comedone: "Mụn đầu đen", whitehead: "Mụn đầu trắng", pih: "Thâm PIH", mole: "Nốt sắc tố", nodule: "Cục/nang" };

// ---------- init ----------
// Init đặt tên để trang React gọi lại sau khi mount (script nạp động, DOMContentLoaded đã qua)
function initDermaCare() {
  if (window.__soidaInit) return;
  window.__soidaInit = true;
  const BASE = window.__SOIDA_BASE__ || "";
  ANGLES.forEach(a => {
    const inp = document.getElementById("file-" + a);
    if (!inp) return;
    inp.addEventListener("change", async e => {
      const f = e.target.files[0]; if (!f) return;
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = async () => {
        state[a].img = img; drawCover(a, img); updateProgress();
        setStat(a, `Đã tải: ${f.name} — đang phân tích kỹ…`);
        await quickAnalyze(a);
        if (ANGLES.every(k => !!state[k].img)) setTimeout(() => analyzeAll(true), 600);
        else { const nx = ANGLES.find(k => !state[k].img); if (nx) setTarget(nx); }
      };
      img.src = url;
    });
  });
  fetch(BASE + "kb.json").then(r => r.json()).then(j => {
    KB = j;
    const kv = document.getElementById("kbView");
    if (kv) kv.textContent = JSON.stringify(j.triage_rules, null, 2).slice(0, 3000);
  }).catch(() => {
    const kv = document.getElementById("kbView");
    if (kv) kv.textContent = "Không load được kb.json";
  });
  setTarget("left_cheek");
  try { listCameras(); } catch {}
  const sel = document.getElementById("camDevice");
  if (sel) sel.addEventListener("change", () => { if (camStream) openCamera(); });
  initDevicePrompt();
  // glossary: bấm vào thuật ngữ -> popup giải thích (gỡ handler cũ để remount React không bind trùng)
  document.removeEventListener("click", __soidaDocClick);
  document.addEventListener("click", __soidaDocClick);
}
function __soidaDocClick(e) {
  const t = e.target.closest ? e.target.closest(".g") : null;
  const pop = document.getElementById("gpop");
  if (!pop) return;
  if (t && GLOSS[t.dataset.t]) {
    e.preventDefault();
    document.getElementById("gpopBody").innerHTML = `<b>${GLOSS[t.dataset.t][0]}</b><br/>${GLOSS[t.dataset.t][1]}`;
    pop.style.display = "block";
    const r = t.getBoundingClientRect();
    pop.style.left = Math.min(window.innerWidth - 320, Math.max(8, r.left)) + "px";
    pop.style.top = (r.bottom + window.scrollY + 8) + "px";
  } else if (!e.target.closest || !e.target.closest("#gpop")) {
    pop.style.display = "none";
  }
}
if (typeof window !== "undefined") {
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", initDermaCare);
  else initDermaCare();
}
// Thiết bị: máy tính -> gợi ý dùng điện thoại + QR sang link test
function initDevicePrompt() {
  try {
    const ua = navigator.userAgent || "";
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 760);
    if (isMobile) return;
    const box = el("devicePrompt");
    if (!box) return;
    box.style.display = "flex";
    const target = (/localhost|127\.0\.0\.1/.test(location.hostname) ? PUBLIC_URL : location.href);
    const qr = el("qrImg");
    if (qr) {
      qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(target);
      qr.onerror = () => { qr.style.display = "none"; };
    }
  } catch {}
}
function setStat(a, t) { document.getElementById("stat-" + a).textContent = t; }
function cv(a) { return document.getElementById("cv-" + a); }
function ctxOf(a) { return cv(a).getContext("2d", { willReadFrequently: true }); }

function drawCover(angle, img) {
  const c = cv(angle), x = c.getContext("2d");
  x.clearRect(0, 0, c.width, c.height);
  const s = Math.max(c.width / img.width, c.height / img.height);
  const w = img.width * s, h = img.height * s;
  x.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
}

// ---------- SINGLE CAMERA STUDIO (1 camera duy nhất, chắc chắn xài được) ----------
// Luồng: Mở camera 1 lần -> chọn góc (B1/B2/B3) -> bấm Chụp -> đếm 3-2-1 -> auto chụp
// -> phân tích kỹ ngay vùng đó -> đủ 3/3 tự chạy tổng hợp.
let camStream = null, currentTarget = "left_cheek", isCounting = false, isAnalyzingSingle = false;
const GUIDE = {
  left_cheek: "Bước 1/3 — Má Trái: quay mặt sang TRÁI khung hình",
  frontal: "Bước 2/3 — Chính Diện: nhìn thẳng vào camera",
  right_cheek: "Bước 3/3 — Má Phải: quay mặt sang PHẢI khung hình"
};
// Link công khai cho bạn bè test (đổi mỗi khi tạo tunnel mới) — dùng cho QR sang điện thoại
const PUBLIC_URL = "https://dermacare-one.vercel.app/soi-da";
const GMAIN = {
  left_cheek: ["BƯỚC 1/3", "↰ Quay mặt sang TRÁI khung hình", "Để lộ má trái • Camera tự bám theo mặt • Đợi ✅ OK rồi bấm chụp (đếm 3-2-1)"],
  frontal: ["BƯỚC 2/3", "⬆ Nhìn thẳng vào camera", "Cân 2 tai • Mắt nhìn thẳng • Đợi ✅ OK rồi bấm chụp"],
  right_cheek: ["BƯỚC 3/3", "↱ Quay mặt sang PHẢI khung hình", "Để lộ má phải • Camera tự bám theo mặt • Đợi ✅ OK rồi bấm chụp (đếm 3-2-1)"]
};
// Từ điển bình dân cho học sinh / người mới
const GLOSS = {
  "sac-to": ["Sắc tố", "Những vệt/đốm sẫm màu trên da do ánh nắng hoặc vết thâm cũ để lại."],
  "mun-viem": ["Mụn viêm", "Nốt mụn đỏ, sưng, đau — bên trong đang viêm, đừng nặn."],
  "mun-an": ["Mụn ẩn", "Nhân mụn nằm dưới da, sờ thấy cộm nhưng ít đỏ, khó thấy."],
  "nhan-mun": ["Nhân mụn", "Đầu đen / đầu trắng do lỗ chân lông bị bít bởi dầu + da chết."],
  "tham": ["Thâm (PIH)", "Vết nâu/đen còn lại sau khi mụn lành, mờ dần theo tuần nếu chống nắng."],
  "porphyrin": ["Porphyrin", "Chất do vi khuẩn mụn tiết ra, soi đèn đặc biệt mới thấy — dấu hiệu vi khuẩn nhiều."],
  "gags": ["GAGS", "Thang điểm mức độ mụn chuẩn (nhẹ 1-18, vừa 19-30, nặng 31+)."],
  "seo-ro": ["Sẹo rỗ", "Vết lõm còn lại sau mụn nặng, skincare không làm đầy được."],
  "abcde": ["ABCDE", "5 dấu hiệu nốt ruồi đáng ngờ: Bất đối xứng - Bờ méo - Màu loang - Đường kính >6mm - Đổi khác."],
  "do-da": ["Đỏ da", "Vùng da đỏ lan rộng — có thể kích ứng/viêm, cần theo dõi."]
};
function setTarget(angle) {
  currentTarget = angle;
  const g = document.getElementById("angleGuide");
  if (g) g.textContent = GUIDE[angle] || angle;
  const gm = GMAIN[angle];
  if (gm) {
    const a = el("gStep"), b = el("gMain"), c = el("gSub");
    if (a) a.textContent = gm[0]; if (b) b.textContent = gm[1]; if (c) c.textContent = gm[2];
  }
  ["left_cheek", "frontal", "right_cheek"].forEach(a => {
    const b = document.getElementById("step-" + a);
    if (b) b.classList.toggle("active", a === angle);
  });
  updateProgress();
}
function updateProgress() {
  const n = ANGLES.filter(a => !!state[a].img).length;
  const p = document.getElementById("progress");
  if (p) p.textContent = `Tiến độ: ${n}/3`;
  ANGLES.forEach(a => {
    const b = document.getElementById("step-" + a);
    if (b) b.classList.toggle("done", !!state[a].img);
  });
  const btn = document.getElementById("btnShoot");
  if (btn) btn.disabled = !(camStream && !isCounting);
}
async function listCameras() {
  try {
    const devs = await navigator.mediaDevices.enumerateDevices();
    const sel = document.getElementById("camDevice");
    if (!sel) return;
    sel.innerHTML = `<option value="">Camera mặc định (selfie)</option>`;
    devs.filter(d => d.kind === "videoinput").forEach((d, i) => {
      const o = document.createElement("option");
      o.value = d.deviceId; o.textContent = d.label || `Camera ${i + 1}`;
      sel.appendChild(o);
    });
  } catch {}
}
const el = id => document.getElementById(id);
function setStepBar(n) {
  ["s1", "s2", "s3"].forEach((id, i) => {
    const b = el(id); if (!b) return;
    b.classList.toggle("on", i + 1 === n);
    b.classList.toggle("done", i + 1 < n);
  });
}
// stepper 9 bước pipeline (Camera->...->Biểu đồ), hiện thứ tự xử lý thật
function pipeReset() { document.querySelectorAll("#pipeSteps .pstep").forEach(s => { s.className = "pstep"; }); }
function pipeTo(i) {
  document.querySelectorAll("#pipeSteps .pstep").forEach(s => {
    const k = +s.dataset.i;
    s.className = "pstep" + (k < i ? " done" : (k === i ? " on" : ""));
  });
}
function pipeDone() { document.querySelectorAll("#pipeSteps .pstep").forEach(s => { s.className = "pstep done"; }); }
async function openCamera() {
  const st = el("camStatus"), v = el("camVideo");
  const say = t => { if (st) st.textContent = t; };
  try {
    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1")
      throw new Error("Trang cần HTTPS mới mở được camera.");
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Trình duyệt này không hỗ trợ camera (hãy dùng Chrome/Safari mới).");
    stopCamera(true);
    const devId = el("camDevice")?.value || "";
    // Thử dần: đúng camera đã chọn -> camera trước -> bất kỳ camera nào (không bao giờ chết vì constraint)
    const tries = [];
    if (devId) tries.push({ video: { deviceId: { exact: devId } }, audio: false });
    tries.push({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    tries.push({ video: true, audio: false });
    let err = null;
    for (const cons of tries) {
      try { camStream = await navigator.mediaDevices.getUserMedia(cons); err = null; break; }
      catch (e) { err = e; camStream = null; }
    }
    if (!camStream) {
      if (err && (err.name === "NotAllowedError" || err.name === "SecurityError"))
        throw new Error("Bạn đã chặn quyền camera. Bấm biểu tượng 🔒/🎥 trên thanh địa chỉ → cho phép camera → tải lại trang.");
      throw new Error("Không tìm thấy camera khả dụng (" + (err ? err.name : "unknown") + ").");
    }
    v.srcObject = camStream;
    v.muted = true;
    try { v.setAttribute("playsinline", ""); } catch {}
    try { await v.play(); } catch (e) { /* một số máy cần chạm mới play, vẫn tiếp tục */ }
    // Đợi video RA HÌNH thật (có kích thước khung) mới chạy tiếp — không thì báo rõ
    try {
      await new Promise((res, rej) => {
        if (v.videoWidth) return res();
        const to = setTimeout(() => rej(new Error("timeout")), 8000);
        v.onloadedmetadata = () => { clearTimeout(to); res(); };
      });
    } catch {
      throw new Error("Camera đã mở nhưng không ra hình. Hãy thử chọn camera khác, tải lại trang, hoặc dùng Chrome mới nhất.");
    }
    lastTrackLm = null; smoothBox = null;
    startLiveLoop();
    say("✅ Camera đã mở — khung hình tự bám theo mặt bạn.");
    try { await listCameras(); } catch {}
    setStepBar(1);
  } catch (e) {
    say("❌ " + e.message);
  }
  updateProgress();
}
// Chẩn đoán camera 1 chạm — hiện đúng chỗ hỏng để fix, không đoán mò
async function diagCamera() {
  const st = el("camStatus");
  const say = t => { if (st) st.textContent = t; };
  const out = [];
  try {
    out.push("mạng: " + (navigator.onLine === false ? "MẤT MẠNG" : "ok"));
    out.push("bảo mật: " + (window.isSecureContext ? "ok" : "THIẾU HTTPS"));
    out.push("mediaDevices: " + (navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? "ok" : "THIẾU (đổi Chrome mới)"));
    out.push("engine: " + (typeof analyzeAngle === "function" ? "ok" : "THIẾU (tải lại trang)"));
    out.push("AI mặt: " + (typeof FaceMesh !== "undefined" ? "ok" : "chưa tải (cần mạng)"));
    const need = ["liveCanvas", "camVideo", "camSnap", "faceStatus", "followToggle", "camDevice", "btnShoot", "countdown"];
    const miss = need.filter(id => !document.getElementById(id));
    out.push("khung hình: " + (miss.length ? "THIẾU " + miss.join(",") : "ok"));
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput");
        out.push("tìm thấy " + devs.length + " camera" + (devs.length ? "" : " (máy không thấy camera nào)"));
      } catch { out.push("liệt kê camera lỗi"); }
    }
    out.push("stream: " + (typeof camStream !== "undefined" && camStream ? "đang mở" : "chưa mở"));
  } catch (e) { out.push("lỗi chẩn đoán: " + e.message); }
  say("🔧 " + out.join(" • "));
}
function stopCamera(silent) {
  try {
    cancelAnimationFrame(trackRAF); trackRAF = 0;
    if (camStream) camStream.getTracks().forEach(t => t.stop());
    const v = el("camVideo");
    if (v) v.srcObject = null;
    const fs = el("faceStatus");
    if (fs) { fs.textContent = "Camera đã dừng"; fs.className = "facestat"; }
  } catch {}
  camStream = null; lastTrackLm = null;
  if (!silent) { const st = el("camStatus"); if (st) st.textContent = "Đã dừng camera."; }
  updateProgress();
}
// ---------- CAMERA TỰ BÁM MẶT: crop khung hình quanh mặt (smooth) + vẽ oval bám theo ----------
let trackFM = null, lastTrackLm = null, trackRAF = 0, lastTrackSend = 0, smoothBox = null, faceOkNow = false;
let lastTrackSeen = 0, trackCanvas = null, trackBusy = false;
async function ensureTrackFM() {
  if (trackFM) return trackFM;
  trackFM = new FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
  trackFM.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
  trackFM.onResults(r => {
    trackBusy = false;
    const lm = (r.multiFaceLandmarks && r.multiFaceLandmarks[0]) || null;
    if (lm) { lastTrackLm = lm; lastTrackSeen = performance.now(); }
  });
  return trackFM;
}
function startLiveLoop() {
  cancelAnimationFrame(trackRAF);
  const tick = () => { liveFrame(); trackRAF = requestAnimationFrame(tick); };
  tick();
}
function faceBoxOfVideo(v, lm) {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  OVAL_IDX.forEach(i => { const p = lm[i]; if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y; if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y; });
  const vw = v.videoWidth, vh = v.videoHeight;
  const fw = Math.max(1, (x1 - x0) * vw), fh = Math.max(1, (y1 - y0) * vh);
  // FULL đầu: ±30% bề rộng (hết má + tai 2 bên), +55% lên trên (trán cao + đỉnh đầu), +30% xuống dưới (cằm/cổ)
  let bx = x0 * vw - 0.30 * fw;
  let by = y0 * vh - 0.55 * fh;
  let bw = fw * 1.6, bh = fh * 1.85;
  // ép tỉ lệ 4:3 của liveCanvas
  const want = 4 / 3, cur = bw / bh;
  if (cur > want) { const nb = bw / want; by -= (nb - bh) / 2; bh = nb; }
  else { const nb = bh * want; bx -= (nb - bw) / 2; bw = nb; }
  bx = clamp(bx, -bw * 0.3, vw - bw * 0.7); by = clamp(by, -bh * 0.3, vh - bh * 0.7);
  return { x: bx, y: by, w: bw, h: bh, fw: (x1 - x0) * vw };
}
function drawVideoCover(x, v, W, H) {
  const vw = v.videoWidth, vh = v.videoHeight;
  const s = Math.max(W / vw, H / vh), w = vw * s, h = vh * s;
  x.save(); x.translate(W, 0); x.scale(-1, 1); // mirror selfie
  x.drawImage(v, (W - w) / 2, (H - h) / 2, w, h);
  x.restore();
}
function liveFrame() {
  const v = el("camVideo"), c = el("liveCanvas");
  if (!c || !camStream || !v || !v.videoWidth) return;
  const x = c.getContext("2d"), W = c.width, H = c.height;
  const follow = el("followToggle")?.checked !== false;
  // giữ khung cũ 1.2s khi mất mặt thoáng qua -> không giật; quá lâu mới về toàn cảnh
  const trackFresh = lastTrackLm && (performance.now() - lastTrackSeen < 1200);
  let box = null;
  if (trackFresh && follow) {
    const raw = faceBoxOfVideo(v, lastTrackLm);
    if (smoothBox) { // smooth thích ứng: lệch nhiều -> bám nhanh, lệch ít -> đứng yên
      const d = Math.hypot(raw.x - smoothBox.x, raw.y - smoothBox.y) + Math.abs(raw.w - smoothBox.w);
      const a = clamp(d / 120, 0.18, 0.65);
      smoothBox = {
        x: smoothBox.x + (raw.x - smoothBox.x) * a, y: smoothBox.y + (raw.y - smoothBox.y) * a,
        w: smoothBox.w + (raw.w - smoothBox.w) * a, h: smoothBox.h + (raw.h - smoothBox.h) * a, fw: raw.fw
      };
    } else smoothBox = raw;
    box = smoothBox;
    // vẽ crop bám mặt (mirror để khớp selfie)
    x.save(); x.translate(W, 0); x.scale(-1, 1);
    x.drawImage(v, box.x, box.y, box.w, box.h, 0, 0, W, H);
    x.restore();
  } else {
    smoothBox = null;
    drawVideoCover(x, v, W, H);
  }
  // oval bám theo mặt (chỉ vẽ khi tracking còn tươi -> không lệch)
  const ovalFresh = lastTrackLm && (performance.now() - lastTrackSeen < 1500);
  if (!ovalFresh && camStream) drawAngleGuide(x, W, H, currentTarget);
  if (ovalFresh) {
    x.save(); x.strokeStyle = "rgba(56,189,248,.9)"; x.lineWidth = 3; x.setLineDash([10, 7]);
    x.beginPath();
    OVAL_IDX.forEach((idx, k) => {
      const p = lastTrackLm[idx];
      let px, py;
      if (box) { // map từ video -> crop bám mặt (đã mirror)
        px = W - ((p.x * v.videoWidth - box.x) / box.w * W);
        py = (p.y * v.videoHeight - box.y) / box.h * H;
      } else { // map từ video full -> cover mirror
        const s = Math.max(W / v.videoWidth, H / v.videoHeight), w = v.videoWidth * s, h = v.videoHeight * s;
        px = W - (p.x * w + (W - w) / 2); py = p.y * h + (H - h) / 2;
      }
      k ? x.lineTo(px, py) : x.moveTo(px, py);
    });
    x.closePath(); x.stroke(); x.restore();
  }
  updateFaceStatus(v, box);
  // tracking NHANH: frame nhỏ 256px + chu kỳ 180ms + không gửi chồng
  const now = performance.now();
  if (now - lastTrackSend > 180 && !trackBusy && typeof FaceMesh !== "undefined") {
    lastTrackSend = now; trackBusy = true;
    if (!trackCanvas) trackCanvas = document.createElement("canvas");
    const tw = 256, th = Math.max(2, Math.round(256 * v.videoHeight / v.videoWidth));
    trackCanvas.width = tw; trackCanvas.height = th;
    trackCanvas.getContext("2d").drawImage(v, 0, 0, tw, th);
    ensureTrackFM().then(fm => { fm.send({ image: trackCanvas }).catch(() => { trackBusy = false; }); });
    setTimeout(() => { trackBusy = false; }, 1500); // chống kẹt nếu onResults không về
  }
}
// Khung định hình khuôn mặt theo góc chụp (khi chưa bám được mặt thật)
function drawAngleGuide(x, W, H, angle) {
  const cx = W / 2, cy = H / 2 - 10, rw = W * 0.20, rh = H * 0.30;
  x.save();
  x.strokeStyle = "rgba(125,211,252,.95)"; x.lineWidth = 4; x.setLineDash([14, 10]);
  x.beginPath();
  if (angle === "frontal") x.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
  else if (angle === "left_cheek") x.ellipse(cx + rw * 0.35, cy, rw * 0.9, rh, 0.25, 0, Math.PI * 2);
  else x.ellipse(cx - rw * 0.35, cy, rw * 0.9, rh, -0.25, 0, Math.PI * 2);
  x.stroke();
  x.setLineDash([]);
  // mũi tên hướng quay
  const dir = angle === "left_cheek" ? -1 : (angle === "right_cheek" ? 1 : 0);
  x.fillStyle = "rgba(125,211,252,.95)"; x.font = `900 ${Math.round(W * 0.09)}px sans-serif`; x.textAlign = "center";
  x.fillText(dir < 0 ? "↰" : (dir > 0 ? "↱" : "⬆"), cx, cy + rh + W * 0.10);
  x.font = `700 ${Math.round(W * 0.035)}px sans-serif`;
  x.fillText(dir < 0 ? "Quay sang TRÁI" : (dir > 0 ? "Quay sang PHẢI" : "Nhìn thẳng"), cx, cy + rh + W * 0.155);
  x.restore();
}
function updateFaceStatus(v, box) {
  const fs = el("faceStatus"); if (!fs) return;
  faceOkNow = false;
  const fresh = lastTrackLm && (performance.now() - lastTrackSeen < 1500);
  if (!fresh) { fs.textContent = "🔍 Chưa thấy mặt — đưa mặt vào giữa khung"; fs.className = "facestat bad"; updateProgress(); return; }
  const fw = (box ? box.fw : v.videoWidth * 0.3) / v.videoWidth;
  let msg = "", cls = "facestat";
  if (fw < 0.22) { msg = "↔️ Mặt hơi xa — lại gần thêm"; cls += " bad"; }
  else if (fw > 0.75) { msg = "↔️ Mặt quá gần — lùi ra một chút"; cls += " bad"; }
  else {
    const pose = estimatePose(lastTrackLm);
    const yaw = pose ? pose.yaw : 0;
    const [y0, y1] = EXPECTED_YAW[currentTarget];
    if (yaw >= y0 - 12 && yaw <= y1 + 12) { msg = `✅ OK — ${GUIDE[currentTarget]}`; cls += " ok"; faceOkNow = true; }
    else { msg = "🔄 " + angleGuidance(currentTarget, yaw); cls += " bad"; }
  }
  fs.textContent = msg; fs.className = cls;
  updateProgress();
}
function retakeCurrent() {
  state[currentTarget].img = null;
  state[currentTarget].quick = null;
  const c = cv(currentTarget);
  c.getContext("2d").clearRect(0, 0, c.width, c.height);
  const rv = el("rv-" + currentTarget);
  if (rv) rv.getContext("2d").clearRect(0, 0, rv.width, rv.height);
  setStat(currentTarget, "chưa chụp");
  setTarget(currentTarget);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
// Giữ tương thích nút cũ (nếu còn)
async function capture() { await captureWithCountdown(); }

async function captureWithCountdown() {
  const st = el("camStatus"), cd = el("countdown"), live = el("liveCanvas");
  if (isCounting) return;
  if (!camStream || !live) { if (st) st.textContent = "⚠️ Chưa có camera. Bấm “Mở camera” trước."; await openCamera(); if (!camStream) return; }
  if (!lastTrackLm || (performance.now() - lastTrackSeen > 1500)) { if (st) st.textContent = "⚠️ Mất mặt trong khung — đưa mặt vào giữa, đợi ✅ OK rồi chụp."; return; }
  if (state[currentTarget].img && !confirm(`Góc ${currentTarget} đã có ảnh. Chụp đè?`)) return;
  isCounting = true; updateProgress();
  setStepBar(1);
  for (const s of ["3", "2", "1"]) {
    if (cd) cd.textContent = s;
    if (st) st.textContent = `Chuẩn bị… ${s} — giữ yên: ${GUIDE[currentTarget]}`;
    try { await new Promise(r => setTimeout(r, 800)); } catch {}
  }
  if (cd) cd.textContent = "📸";
  // liveCanvas đang mirror (selfie) -> lật lại thành ảnh thật để phân tích đúng trái/phải, yaw đúng dấu
  const snap = el("camSnap");
  const sx = snap.getContext("2d");
  sx.save(); sx.translate(snap.width, 0); sx.scale(-1, 1);
  sx.drawImage(live, 0, 0, live.width, live.height, 0, 0, snap.width, snap.height);
  sx.restore();
  if (cd) cd.textContent = "";
  const img = new Image(); img.src = snap.toDataURL("image/png");
  await new Promise(r => img.onload = r);
  state[currentTarget].img = img;
  drawCover(currentTarget, img);
  isCounting = false;
  if (st) st.textContent = `✅ Đã chụp ${currentTarget}. Đang phân tích kỹ vùng này…`;
  setStepBar(2);
  updateProgress();
  await quickAnalyze(currentTarget); // phân tích kỹ ngay vùng đó
  const next = ANGLES.find(a => !state[a].img);
  if (next) { setTarget(next); if (st) st.textContent += ` Tiếp theo: ${GUIDE[next]}`; }
  else {
    if (st) st.textContent = "✅ Đủ 3/3. Tự chạy tổng hợp 3 góc…";
    setTimeout(() => analyzeAll(true), 600);
  }
  updateProgress();
}
// Phân tích kỹ ngay 1 vùng vừa chụp (QC + ROI + bbox + số lượng), không đợi đủ 3
async function quickAnalyze(angle) {
  if (isAnalyzingSingle) return;
  isAnalyzingSingle = true;
  try {
    setStat(angle, "Đang chạy pipeline 9 bước…");
    pipeReset();
    const r = await analyzeAngle(angle, pipeTo);
    pipeDone();
    state[angle].quick = r;
    drawOverlay(angle, r.lesions, r.oval);
    const nP = r.lesions.filter(l => ["pustule", "nodule", "papule"].includes(l.class)).length;
    const nC = r.lesions.filter(l => l.class === "comedone").length;
    const nH = r.lesions.filter(l => l.class === "pih").length;
    const nM = r.lesions.filter(l => l.class === "mole").length;
    const yawT = r.yawEst == null ? "?°" : r.yawEst + "°";
    const aT = r.angle_valid == null ? "? góc" : (r.angle_valid ? "✓ góc" : "✗ SAI GÓC");
    const bT = r.blur_pass ? "✓ nét" : (r.blur_marginal ? "~ hơi mờ" : "✗ MỜ");
    const qc = `${aT} (góc quay ${yawT}) • ${bT} (độ nét) • ${r.lighting_valid ? "✓ đủ sáng" : "✗ THIẾU SÁNG"} • nhận diện da ${r.skinRatio}%`;
    setStat(angle, `Viêm ${nP} • Comedone ${nC} • PIH ${nH} • Sắc tố ${nM} | ${qc}`);
    const needRetake = (!r.blur_pass && !r.blur_marginal) || !r.lighting_valid || r.angle_valid === false;
    copyToResult(angle);
    const singleRel = lesionProfileVector(r.lesions, Math.max.apply(null, Object.values(r.perROI).map(v => v.erythemaPct).concat([0])));
    const singleMatch = matchConditionKB(singleRel);
    attachTooltip(el("rv-" + angle), r.lesions, singleMatch.best ? singleMatch.best.label : null);
    const cap = el("cap-" + angle);
    if (cap) cap.innerHTML = capBadges(nP, nC, nH, nM) +
      (singleMatch.best ? `<br/><span class="note">Giống “<b>${singleMatch.best.label}</b>” ${Math.round(singleMatch.best.sim * 100)}%</span>` : "") +
      `<br/><span class="note">${r.guidance}${needRetake ? " ⚠️ <b>Nên chụp lại.</b>" : " ✅"}</span>`;
    const stb = el("st-" + angle);
    if (stb) stb.innerHTML = angleBadge(r);
    const q = el("quickDetail");
    if (q) q.innerHTML = `<b>${angle}</b>: viêm <b>${nP}</b>, comedone <b>${nC}</b>, PIH <b>${nH}</b>, sắc tố <b>${nM}</b> — ${qc}.<br/>➡️ ${r.guidance} ${needRetake ? "⚠️ <b>Nên chụp lại góc này.</b>" : "✅ Đạt."}`;
  } catch (e) { setStat(angle, "Lỗi phân tích nhanh: " + e.message); }
  isAnalyzingSingle = false;
}

// ---------- demo ----------
function loadDemo() {
  // Vẽ 3 mặt mẫu với tổn thương giả lập để test ngay không cần upload
  const cfgs = { left_cheek: { yaw: -38, seed: 11 }, frontal: { yaw: 2, seed: 7 }, right_cheek: { yaw: 36, seed: 23 } };
  ANGLES.forEach(a => {
    const c = cv(a), x = c.getContext("2d");
    drawSyntheticFace(x, c.width, c.height, cfgs[a].yaw, cfgs[a].seed);
    const img = new Image(); img.src = c.toDataURL("image/png");
    state[a].img = img;
    setStat(a, "Ảnh demo mẫu (tổng hợp để test)");
  });
  updateProgress();
  setTimeout(() => analyzeAll(true), 400);
}
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function drawSyntheticFace(x, W, H, yaw, seed) {
  const R = rnd(seed);
  // nền
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#e8d9c4"); g.addColorStop(1, "#c9a98c");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const cx = W / 2 + yaw * 1.6, cy = H / 2, fw = W * 0.30, fh = H * 0.38;
  // mặt
  x.fillStyle = "#f2c9a4";
  x.beginPath(); x.ellipse(cx, cy, fw, fh, 0, 0, Math.PI * 2); x.fill();
  // mắt mũi miệng lệch theo yaw
  const off = yaw * 1.2;
  x.fillStyle = "#3b2a20";
  x.beginPath(); x.ellipse(cx - 45 + off * 0.4, cy - 30, 12, 8, 0, 0, 7); x.fill();
  x.beginPath(); x.ellipse(cx + 45 + off * 0.4, cy - 30, 12, 8, 0, 0, 7); x.fill();
  x.fillStyle = "#d69a6d"; x.beginPath(); x.ellipse(cx + off, cy + 10, 12, 22, 0, 0, 7); x.fill();
  x.strokeStyle = "#8a5a3b"; x.lineWidth = 4; x.beginPath(); x.ellipse(cx + off * 0.6, cy + 70, 30, 12, 0, 0.2, Math.PI - 0.2); x.stroke();
  // tổn thương giả lập
  const spots = 26;
  for (let i = 0; i < spots; i++) {
    const px = cx + (R() - 0.5) * fw * 1.6, py = cy + (R() - 0.5) * fh * 1.6;
    const t = R();
    if (t < 0.35) { x.fillStyle = "rgba(220,40,40,0.95)"; x.beginPath(); x.arc(px, py, 4 + R() * 5, 0, 7); x.fill(); x.fillStyle = "rgba(255,230,150,0.95)"; x.beginPath(); x.arc(px, py, 2, 0, 7); x.fill(); }
    else if (t < 0.6) { x.fillStyle = "rgba(60,30,20,0.9)"; x.beginPath(); x.arc(px, py, 2 + R() * 2, 0, 7); x.fill(); }
    else if (t < 0.85) { x.fillStyle = "rgba(130,70,35,0.85)"; x.beginPath(); x.arc(px, py, 3 + R() * 4, 0, 7); x.fill(); }
    else { x.fillStyle = "rgba(255,255,255,0.9)"; x.beginPath(); x.arc(px, py, 2, 0, 7); x.fill(); }
  }
  if (seed === 23) { x.fillStyle = "rgba(40,20,20,0.95)"; x.beginPath(); x.ellipse(cx + 60, cy + 20, 10, 13, 0.4, 0, 7); x.fill(); } // nốt ruồi to để test RED
}

// ---------- FaceMesh ----------
let fm = null, fmReady = false;
function getFaceMesh() {
  return new Promise(resolve => {
    if (typeof FaceMesh === "undefined") return resolve(null);
    if (fm && fmReady) return resolve(fm);
    try {
      fm = new FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
      fm.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      fm.onResults(() => {});
      fmReady = true; resolve(fm);
    } catch { resolve(null); }
  });
}
function runFaceMesh(canvas) {
  return new Promise(async resolve => {
    const inst = await getFaceMesh();
    if (!inst) return resolve(null);
    let done = false;
    const to = setTimeout(() => { if (!done) { done = true; resolve(null); } }, 6000);
    inst.onResults(res => { if (!done) { done = true; clearTimeout(to); resolve(res.multiFaceLandmarks?.[0] || null); } });
    try { await inst.send({ image: canvas }); } catch { if (!done) { done = true; clearTimeout(to); resolve(null); } }
  });
}

// ---------- QC metrics ----------
function blurScore(canvas) {
  const w = 160, h = Math.round(canvas.height * w / canvas.width);
  const t = document.createElement("canvas"); t.width = w; t.height = h;
  const tx = t.getContext("2d", { willReadFrequently: true });
  tx.drawImage(canvas, 0, 0, w, h);
  const d = tx.getImageData(0, 0, w, h).data;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  let sum = 0, sum2 = 0, n = 0;
  const lap = [];
  for (let y = 1; y < h - 1; y++) for (let x0 = 1; x0 < w - 1; x0++) {
    const v = gray[(y - 1) * w + x0] + gray[y * w + x0 - 1] - 4 * gray[y * w + x0] + gray[y * w + x0 + 1] + gray[(y + 1) * w + x0];
    lap.push(v); sum += v; sum2 += v * v; n++;
  }
  const mean = sum / n, vari = sum2 / n - mean * mean;
  return vari; // >60 pass, <25 rất mờ / nghi filter
}
function lightStats(canvas) {
  const x = canvas.getContext("2d", { willReadFrequently: true });
  const d = x.getImageData(0, 0, canvas.width, canvas.height).data;
  let s = 0, over = 0, under = 0; const N = d.length / 4, step = 7;
  let n = 0;
  for (let i = 0; i < d.length; i += 4 * step) {
    const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    s += y; n++; if (y > 240) over++; if (y < 25) under++;
  }
  return { mean: s / n, overPct: over / n * 100, underPct: under / n * 100 };
}
// ---------- topology landmark CHÍNH THỨC (google-ai-edge/mediapipe face_mesh_connections.py) ----------
// MediaPipe LEFT_* = phía PHẢI ảnh (theo chủ thể), RIGHT_* = phía TRÁI ảnh.
const OVAL_IDX = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const EYE_IMG_L = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]; // mắt TRÁI ảnh
const EYE_IMG_R = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]; // mắt PHẢI ảnh
const BROW_L = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107]; // mày trái ảnh
const BROW_R = [276, 283, 282, 295, 285, 300, 293, 334, 296, 336]; // mày phải ảnh
const LIPS_IDX = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 191, 80, 81, 82, 13, 312, 311, 310, 415];
const LI = { NOSE_TIP: 1, NOSE_TOP: 168, NOSE_BOT: 2, MOUTH_L: 61, MOUTH_R: 291, CHIN: 152, TOP: 10 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const RAD2DEG = 180 / Math.PI;
const avgLm = (lm, ids) => { let x = 0, y = 0, z = 0; ids.forEach(i => { x += lm[i].x; y += lm[i].y; z += (lm[i].z || 0); }); return { x: x / ids.length, y: y / ids.length, z: z / ids.length }; };
function iouFn(a, b) {
  const x0 = Math.max(a[0], b[0]), y0 = Math.max(a[1], b[1]), x1 = Math.min(a[2], b[2]), y1 = Math.min(a[3], b[3]);
  if (x1 < x0 || y1 < y0) return 0;
  const inter = (x1 - x0 + 1) * (y1 - y0 + 1);
  const ua = (a[2] - a[0] + 1) * (a[3] - a[1] + 1) + (b[2] - b[0] + 1) * (b[3] - b[1] + 1) - inter;
  return ua > 0 ? inter / ua : 0;
}
function nms(list, thr) {
  const t = thr == null ? 0.35 : thr;
  const s = list.slice().sort((a, b) => (b.confidence * b.area) - (a.confidence * a.area));
  const keep = [];
  for (const l of s) { if (!keep.some(k => iouFn(k.bbox, l.bbox) > t)) keep.push(l); }
  return keep;
}

// ---------- POSE bằng 2 vector độc lập (theo cues "nose deviation + bilateral symmetry") ----------
// Quy ước: yaw ÂM = mặt hướng sang TRÁI khung hình, yaw DƯƠNG = sang PHẢI khung hình.
function estimatePose(lm) {
  if (!lm) return null;
  try {
    const eL = avgLm(lm, [33, 133]), eR = avgLm(lm, [362, 263]);
    const eyeDist = Math.hypot(eR.x - eL.x, eR.y - eL.y) || 1e-6;
    if (eyeDist < 0.015) return null; // mắt quá gần nhau -> mesh không tin cậy
    const mid = { x: (eL.x + eR.x) / 2, y: (eL.y + eR.y) / 2 };
    const nose = lm[LI.NOSE_TIP];
    // Vector 1: độ lệch mũi so với trục 2 mắt (chuẩn hóa bằng khoảng cách mắt, hàm atan để khỏi vọt như trước)
    const yawA = Math.atan2(nose.x - mid.x, 1.05 * eyeDist) * RAD2DEG;
    // Vector 2: độ lệch mũi so với tâm oval mặt (chuẩn hóa bằng nửa rộng mặt)
    let cx = 0, x0 = 1, x1 = 0;
    OVAL_IDX.forEach(i => { cx += lm[i].x; if (lm[i].x < x0) x0 = lm[i].x; if (lm[i].x > x1) x1 = lm[i].x; });
    cx /= OVAL_IDX.length;
    const halfW = Math.max(1e-6, (x1 - x0) / 2);
    const yawB = ((nose.x - cx) / halfW) * 70;
    const yaw = clamp(0.45 * yawA + 0.55 * yawB, -65, 65);
    // Pitch: hình học trục dọc + chiều sâu z (z MediaPipe: càng âm càng gần camera)
    const mouth = avgLm(lm, [LI.MOUTH_L, LI.MOUTH_R]);
    const eyeMouthH = Math.max(1e-6, Math.abs(mouth.y - mid.y));
    const vDev = ((mid.y + mouth.y) / 2 - nose.y) / eyeMouthH;
    const pitchA = clamp(vDev * 45, -40, 40);
    const zF = lm[LI.TOP].z || 0, zC = lm[LI.CHIN].z || 0;
    const pitchB = clamp((zF - zC) * 900, -40, 40);
    const pitch = clamp(0.5 * pitchA + 0.5 * pitchB, -40, 40);
    const roll = Math.atan2(eR.y - eL.y, eR.x - eL.x) * RAD2DEG;
    return { yaw, pitch, roll };
  } catch { return null; }
}
// Hướng dẫn chụp lại theo đúng dấu yaw (trái/phải theo KHUNG HÌNH, khỏi nhầm giải phẫu)
function angleGuidance(cardAngle, yaw) {
  if (yaw == null) return "Không xác định được góc quay (mất mesh) — hãy chụp đủ sáng, rõ mặt.";
  if (cardAngle === "left_cheek") {
    if (yaw < -8 && yaw > -67) return "✓ Góc má trái đạt.";
    if (yaw >= -8 && yaw <= 12) return "Chưa đủ nghiêng — hãy quay mặt sang TRÁI thêm (mũi lệch sang trái khung hình).";
    if (yaw > 12) return "Đang quay nhầm sang PHẢI (thấy má phải) — hãy đổi hướng, quay sang TRÁI.";
    return "Nghiêng quá đà — hãy quay mặt lại một chút.";
  }
  if (cardAngle === "right_cheek") {
    if (yaw > 8 && yaw < 67) return "✓ Góc má phải đạt.";
    if (yaw > -12 && yaw <= 8) return "Chưa đủ nghiêng — hãy quay mặt sang PHẢI thêm.";
    if (yaw < -12) return "Đang quay nhầm sang TRÁI (thấy má trái) — hãy đổi hướng, quay sang PHẢI.";
    return "Nghiêng quá đà — hãy quay mặt lại một chút.";
  }
  if (Math.abs(yaw) <= 18) return "✓ Chính diện đạt.";
  return yaw < 0 ? "Đang lệch sang TRÁI — hãy nhìn thẳng, cân 2 tai." : "Đang lệch sang PHẢI — hãy nhìn thẳng, cân 2 tai.";
}

// ---------- ROI ----------
// ---------- baseline màu da mặt + ngưỡng THÍCH ỨNG (không còn "da thường = đỏ 60-100%") ----------
// Da mỗi người/mỗi ánh sáng khác nhau -> đo baseline trên da mặt rồi mới so lệch.
function computeSkinBaseline(img, face, skin, W, H) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < W * H; i += 4) {
    if (!face[i] || !skin[i]) continue;
    r += img[i * 4]; g += img[i * 4 + 1]; b += img[i * 4 + 2]; n++;
  }
  if (!n) return null;
  r /= n; g /= n; b /= n;
  return { r, g, b, y: 0.299 * r + 0.587 * g + 0.114 * b, rg: r - g, rb: r - b };
}
// Đỏ viêm = đỏ HƠN baseline (kênh R-G, R-B vượt trội), không phải đỏ tuyệt đối
function isRedAdaptive(r, g, b, base) {
  if (!base || r < 90) return false;
  return ((r - g) - base.rg > 11) && ((r - b) - base.rb > 10) && (r > base.r * 0.7);
}
// Thâm = TỐI hơn baseline + sắc nâu (loại bóng đổ xám)
function isBrownAdaptive(r, g, b, base) {
  if (!base) return false;
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  if (y > base.y * 0.90) return false;
  return (r - g) >= 5 && (r - g) <= 50 && (r - b) > 14 && r >= g && g >= b - 6;
}
// Nhân mủ vàng-trắng SÁNG hơn baseline (tránh nhầm quầng da trong bbox)
function isPusAdaptive(r, g, b, base) {
  if (!base || r < 165) return false;
  return g > base.g + 12 && (r - b) < 115 && (g - b) < 95 && (Math.max(r, g, b) - Math.min(r, g, b)) < 75;
}
// Gỗ/nâu nội thất cũng lọt skin-test -> BẮT BUỘC giao với face-oval (xem buildFaceMasks).
// ---------- SKIN MASK (YCrCb Chai-Ngan/Dahmani + luật RGB Kolkur) ----------
function skinPixel(r, g, b) {
  const Y = 0.299 * r + 0.587 * g + 0.114 * b;
  if (Y < 40 || Y > 245) return false;
  const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  if (Cb < 77 || Cb > 127 || Cr < 133 || Cr > 170) return false;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn < 12) return false; // loại tường trắng/xám
  if (r < g - 12 || r < b - 12) return false; // da thường kênh R trội
  return true;
}
function bboxOf(pts, W, H) {
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  pts.forEach(p => { if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y; if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y; });
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(W - 1, Math.ceil(x1)); y1 = Math.min(H - 1, Math.ceil(y1));
  return { x: x0, y: y0, w: Math.max(1, x1 - x0 + 1), h: Math.max(1, y1 - y0 + 1) };
}
function ellipseMask(box, W, H) {
  const m = new Uint8Array(W * H);
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2, rx = box.w / 2, ry = box.h / 2;
  for (let y = Math.max(0, Math.floor(box.y)); y < Math.min(H, box.y + box.h); y++)
    for (let x = Math.max(0, Math.floor(box.x)); x < Math.min(W, box.x + box.w); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) m[y * W + x] = 1;
    }
  return m;
}
function dilateInto(src, dst, W, H, r) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!src[y * W + x]) continue;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H) dst[ny * W + nx] = 1;
    }
  }
}
function circleInto(dst, W, H, cx, cy, rad) {
  for (let y = Math.max(0, Math.floor(cy - rad)); y < Math.min(H, cy + rad); y++)
    for (let x = Math.max(0, Math.floor(cx - rad)); x < Math.min(W, cx + rad); x++)
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= rad * rad) dst[y * W + x] = 1;
}
// Dải sống mũi -> đầu mũi (FACEMESH_NOSE): loại khỏi phân tích theo yêu cầu (chỉ soi da, không soi mũi)
function noseStripPoly(lm, W, H, hw) {
  const ids = [168, 6, 197, 195, 5, 4, 1, 2];
  const pts = ids.filter(i => lm[i]).map(i => ({ x: lm[i].x * W, y: lm[i].y * H }));
  if (pts.length < 2) return null;
  const w = Math.max(6, hw * 0.17);
  const L = [], R = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
    let dx = b.x - a.x, dy = b.y - a.y;
    const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    L.push({ x: pts[k].x - dy * w, y: pts[k].y + dx * w });
    R.push({ x: pts[k].x + dy * w, y: pts[k].y - dx * w });
  }
  return L.concat(R.reverse());
}
// Vùng phân tích = skin ∩ oval mặt ∩ ¬(mắt/mày/môi/mũi). Mắt + mũi LOẠI HẲN khỏi phân tích.
function buildFaceMasks(canvas, lm) {
  const W = canvas.width, H = canvas.height;
  const img = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const skin = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) { if (skinPixel(img[i * 4], img[i * 4 + 1], img[i * 4 + 2])) skin[i] = 1; }
  let oval = null, ovalBox;
  if (lm) {
    oval = OVAL_IDX.map(i => ({ x: lm[i].x * W, y: lm[i].y * H }));
    ovalBox = bboxOf(oval, W, H);
  } else {
    ovalBox = { x: W * 0.2, y: H * 0.08, w: W * 0.6, h: H * 0.84 };
  }
  const ovalMask = oval ? polyMask(oval, W, H) : ellipseMask(ovalBox, W, H);
  const excl = new Uint8Array(W * H);
  const eyeMask = new Uint8Array(W * H); // riêng vùng mắt để veto blob
  if (lm) {
    const P = set => polyMask(set.map(i => ({ x: lm[i].x * W, y: lm[i].y * H })), W, H);
    [BROW_L, BROW_R].forEach(set => dilateInto(P(set), excl, W, H, 4));
    dilateInto(P(LIPS_IDX), excl, W, H, 3);
    [EYE_IMG_L, EYE_IMG_R].forEach(set => { const m = P(set); dilateInto(m, excl, W, H, 6); dilateInto(m, eyeMask, W, H, 6); });
    circleInto(excl, W, H, lm[LI.NOSE_BOT].x * W, lm[LI.NOSE_BOT].y * H, Math.max(4, W * 0.022));
    const hw = (Math.max(...OVAL_IDX.map(i => lm[i].x)) - Math.min(...OVAL_IDX.map(i => lm[i].x))) * W / 2;
    const strip = noseStripPoly(lm, W, H, hw);
    if (strip) { const sm = polyMask(strip, W, H); for (let i = 0; i < W * H; i++) if (sm[i]) excl[i] = 1; }
  }
  const face = new Uint8Array(W * H);
  let facePx = 0, skinFace = 0;
  for (let i = 0; i < W * H; i++) {
    if (ovalMask[i] && !excl[i]) { face[i] = 1; facePx++; if (skin[i]) skinFace++; }
  }
  return { img, W, H, skin, ovalMask, excl, eyeMask, face, facePx, skinFace, ovalBox, oval };
}
// Neo vector: brow-line, eye-line, mouth-line, sống mũi 168->1->2, tâm + nửa rộng oval.
function faceAnchors(lm, W, H) {
  if (!lm) return null;
  try {
    const eL = avgLm(lm, [33, 133]), eR = avgLm(lm, [362, 263]);
    const eyeDist = Math.max(1e-6, Math.hypot(eR.x - eL.x, eR.y - eL.y)) * W;
    const mid = { x: (eL.x + eR.x) / 2 * W, y: (eL.y + eR.y) / 2 * H };
    const browY = (avgLm(lm, BROW_L).y + avgLm(lm, BROW_R).y) / 2 * H;
    const mouth = avgLm(lm, [LI.MOUTH_L, LI.MOUTH_R]);
    const mouthY = mouth.y * H;
    const noseTop = { x: lm[LI.NOSE_TOP].x * W, y: lm[LI.NOSE_TOP].y * H };
    const noseTip = { x: lm[LI.NOSE_TIP].x * W, y: lm[LI.NOSE_TIP].y * H };
    const noseBot = { x: lm[LI.NOSE_BOT].x * W, y: lm[LI.NOSE_BOT].y * H };
    const ox = OVAL_IDX.map(i => lm[i].x * W), oy = OVAL_IDX.map(i => lm[i].y * H);
    const x0 = Math.min(...ox), x1 = Math.max(...ox);
    const cx = (x0 + x1) / 2, hw = Math.max(1, (x1 - x0) / 2);
    const top = Math.min(...oy), bottom = Math.max(...oy), faceH = Math.max(1, bottom - top);
    return { mid, eyeDist, browY, mouthY, noseTop, noseTip, noseBot, cx, hw, top, bottom, faceH, faceW: hw * 2 };
  } catch { return null; }
}
// 6 ROI = oval ∩ dải hình học neo theo vector (không còn box tỉ lệ cứng).
// left_cheek/right_cheek đặt tên THEO ẢNH (trái/phải khung hình).
function buildRoiMasks(m, a, lm, W, H) {
  const mk = () => new Uint8Array(W * H);
  const out = { forehead: mk(), temple_l: mk(), temple_r: mk(), left_cheek: mk(), right_cheek: mk(), perioral: mk(), chin: mk() };
  if (!a) { // fallback mất mesh: box tỉ lệ cũ ∩ oval (không có vùng mũi)
    const b = m.ovalBox;
    const R = (xf0, yf0, xf1, yf1) => [{ x: b.x + b.w * xf0, y: b.y + b.h * yf0 }, { x: b.x + b.w * xf1, y: b.y + b.h * yf0 }, { x: b.x + b.w * xf1, y: b.y + b.h * yf1 }, { x: b.x + b.w * xf0, y: b.y + b.h * yf1 }];
    const polys = { forehead: R(0.22, 0.0, 0.78, 0.26), temple_l: R(0.02, 0.10, 0.30, 0.30), temple_r: R(0.70, 0.10, 0.98, 0.30), left_cheek: R(0.02, 0.32, 0.38, 0.72), right_cheek: R(0.62, 0.32, 0.98, 0.72), perioral: R(0.33, 0.60, 0.67, 0.80), chin: R(0.28, 0.78, 0.72, 1.0) };
    for (const k of Object.keys(out)) {
      const pm = polyMask(polys[k], W, H);
      for (let i = 0; i < W * H; i++) if (pm[i] && m.ovalMask[i] && !m.excl[i]) out[k][i] = 1;
    }
    return out;
  }
  const noseXat = y => {
    if (y <= a.noseTip.y) { const t = (y - a.noseTop.y) / Math.max(1, a.noseTip.y - a.noseTop.y); return a.noseTop.x + (a.noseTip.x - a.noseTop.x) * clamp(t, 0, 1); }
    const t = (y - a.noseTip.y) / Math.max(1, a.noseBot.y - a.noseTip.y); return a.noseTip.x + (a.noseBot.x - a.noseTip.x) * clamp(t, 0, 1);
  };
  const y0 = Math.max(0, Math.floor(a.top)), y1 = Math.min(H - 1, Math.ceil(a.bottom));
  for (let y = y0; y <= y1; y++) {
    const nx = noseXat(y);
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!m.ovalMask[i] || m.excl[i]) continue; // mắt/mũi/môi đã loại khỏi mọi vùng
      const dx = (x - a.cx) / a.hw, adx = Math.abs(dx);
      let k = null;
      // ưu tiên: quanh miệng > cằm > má > thái dương > trán (mũi đã loại, không suy vùng này cho vùng khác)
      if (y >= a.mouthY - 0.10 * a.faceH && y <= a.mouthY + 0.10 * a.faceH && adx < 0.34) k = "perioral";
      else if (y > a.mouthY + 0.04 * a.faceH && adx < 0.72) k = "chin";
      else if (y >= a.mid.y + 0.03 * a.faceH && y <= a.mouthY + 0.16 * a.faceH && dx < -0.08) k = "left_cheek";
      else if (y >= a.mid.y + 0.03 * a.faceH && y <= a.mouthY + 0.16 * a.faceH && dx > 0.08) k = "right_cheek";
      else if (y >= a.browY - 0.10 * a.faceH && y < a.mid.y + 0.08 * a.faceH && adx >= 0.60) k = dx < 0 ? "temple_l" : "temple_r";
      else if (y < a.browY && adx < 0.80) k = "forehead";
      if (k) out[k][i] = 1;
    }
  }
  return out;
}
function polyMask(poly, W, H) {
  const m = new Uint8Array(W * H);
  let ys = poly.map(p => p.y), xs = poly.map(p => p.x);
  let y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(H - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const inter = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b2 = poly[(i + 1) % poly.length];
      if ((a.y <= y && b2.y > y) || (b2.y <= y && a.y > y)) inter.push(a.x + (y - a.y) / (b2.y - a.y) * (b2.x - a.x));
    }
    inter.sort((p, q) => p - q);
    for (let k = 0; k + 1 < inter.length; k += 2) {
      let x0 = Math.max(0, Math.ceil(inter[k])), x1 = Math.min(W - 1, Math.floor(inter[k + 1]));
      for (let x = x0; x <= x1; x++) m[y * W + x] = 1;
    }
  }
  return m;
}

const ROI_VI = { forehead: "Trán", temple_l: "Thái dương trái (ảnh)", temple_r: "Thái dương phải (ảnh)", left_cheek: "Má trái (ảnh)", right_cheek: "Má phải (ảnh)", perioral: "Quanh miệng", chin: "Cằm" };
// Phân loại viêm: vùng lan (>900px = đỏ lan tỏa, tính vào erythema, KHÔNG đếm nốt) / nang / có nhân mủ / sẩn
function classifyRedBlob(area, coreRatio) {
  if (area > 900) return { cls: "diffuse", confidence: 0.5 };
  if (area > 300) return { cls: "nodule", confidence: 0.8 };
  if (coreRatio > 0.05) return { cls: "pustule", confidence: +(0.74 + Math.min(0.14, area / 2500)).toFixed(2) };
  if (area > 80) return { cls: "pustule", confidence: +(0.68 + Math.min(0.14, area / 2500)).toFixed(2) };
  return { cls: "papule", confidence: +(0.6 + Math.min(0.15, area / 900)).toFixed(2) };
}
// ================= PIPELINE ĐA TẦNG CHỐNG NHIỄU (precision > recall) =================
// Thứ tự bắt buộc: kiểm tra ảnh -> nhận diện mặt -> kiểm tra ánh sáng -> loại bóng ->
// phân vùng -> tìm nốt -> lọc nhiễu (false-positive) -> chấm tin cậy -> biểu đồ.
// B1: cổng chất lượng ảnh (pure, test được)
function qualityVerdict(m) {
  const issues = [];
  if (m.blur < 40) issues.push("mờ");
  if (m.lightMean < 50 || m.lightMean > 215) issues.push("sáng kém");
  if (m.overPct > 12 || m.underPct > 30) issues.push("cháy/tối");
  if (m.skinRatio < 25) issues.push("che khuất");
  if (m.faceFrac < 0.12 || m.faceFrac > 0.95) issues.push("khoảng cách");
  if (issues.length) return { level: "FAIL", issues };
  const warn = [];
  if (m.blurMarginal) warn.push("hơi mờ");
  if (m.overPct > 8 || m.underPct > 20) warn.push("sáng chưa đều");
  if (m.wbOff > 30) warn.push("lệch màu đèn");
  if (m.angleValid === false) warn.push("sai góc");
  if (m.angleValid == null) warn.push("chưa rõ góc");
  if (m.faceFrac < 0.18 || m.faceFrac > 0.85) warn.push("khoảng cách");
  if (m.skinRatio < 40) warn.push("da nhận được ít");
  if (warn.length) return { level: "MARGINAL", issues: warn };
  return { level: "PASS", issues: [] };
}
// B3: phân tích ánh sáng trên da mặt — median bền hơn mean, tách bóng/chói/lệch sáng
function analyzeIllumination(masks, ovalBox) {
  const { img, W, H, face, skin } = masks;
  const hist = new Uint32Array(256);
  let n = 0, sR = 0, sG = 0, sB = 0, sY = 0, sY2 = 0;
  for (let i = 0; i < W * H; i += 2) {
    if (!face[i] || !skin[i]) continue;
    const r = img[i * 4], g = img[i * 4 + 1], b = img[i * 4 + 2];
    const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    hist[y]++; n++; sR += r; sG += g; sB += b; sY += y; sY2 += y * y;
  }
  if (!n) return null;
  let acc = 0, median = 0;
  for (let y = 0; y < 256; y++) { acc += hist[y]; if (acc >= n / 2) { median = y; break; } }
  const mean = sY / n, std = Math.sqrt(Math.max(1, sY2 / n - mean * mean));
  const shadowMask = new Uint8Array(W * H), hiMask = new Uint8Array(W * H);
  let shN = 0, hiN = 0, over = 0, under = 0, lS = 0, lN = 0, rS = 0, rN = 0;
  const cx = ovalBox.x + ovalBox.w / 2, skinN = n * 2;
  for (let i = 0; i < W * H; i++) {
    if (!face[i] || !skin[i]) continue;
    const y = 0.299 * img[i * 4] + 0.587 * img[i * 4 + 1] + 0.114 * img[i * 4 + 2];
    if (y < median - 1.2 * std && y < median * 0.78) { shadowMask[i] = 1; shN++; }
    if (y > median + 1.6 * std || y > 238) { hiMask[i] = 1; hiN++; }
    if (y > 245) over++; if (y < 25) under++;
    if ((i % W) < cx) { lS += y; lN++; } else { rS += y; rN++; }
  }
  const asym = Math.abs(lS / Math.max(1, lN) - rS / Math.max(1, rN)) / Math.max(1, mean);
  return {
    meanY: mean, medianY: median, stdY: std, shadowMask, hiMask,
    shadowPct: shN / Math.max(1, skinN) * 100, hiPct: hiN / Math.max(1, skinN) * 100,
    asym, overPct: over / Math.max(1, skinN) * 100, underPct: under / Math.max(1, skinN) * 100,
    meanR: sR / n, meanG: sG / n, meanB: sB / n, wbOff: Math.abs(sG - sB) / n
  };
}
// gradient Sobel 1 lần/ảnh cho điểm ranh giới tổn thương
function graySobel(img, W, H) {
  const gray = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) gray[i] = 0.299 * img[i * 4] + 0.587 * img[i * 4 + 1] + 0.114 * img[i * 4 + 2];
  const mag = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    const gx = -gray[i - W - 1] - 2 * gray[i - 1] - gray[i + W - 1] + gray[i - W + 1] + 2 * gray[i + 1] + gray[i + W + 1];
    const gy = -gray[i - W - 1] - 2 * gray[i - W] - gray[i - W + 1] + gray[i + W - 1] + 2 * gray[i + W] + gray[i + W + 1];
    mag[i] = Math.sqrt(gx * gx + gy * gy);
  }
  return { gray, mag };
}
// đặc trưng 1 blob: hình thái + màu nốt + vòng da đối chứng + phủ bóng/chói/mắt
function blobFeatures(cutMask, pusMask, bb, ctx) {
  const { img, W, H, face, skin, mag, shadowMask, hiMask, eyeMask } = ctx;
  const [x0, y0, x1, y1] = bb;
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  let n = 0, sR = 0, sG = 0, sB = 0, per = 0, edge = 0, sh = 0, hi = 0, core = 0, eye = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * W + x;
    if (!cutMask[i]) continue;
    n++; sR += img[i * 4]; sG += img[i * 4 + 1]; sB += img[i * 4 + 2];
    if (shadowMask[i]) sh++; if (hiMask[i]) hi++;
    if (eyeMask && eyeMask[i]) eye++;
    if (pusMask && pusMask[i]) core++;
    if ((x > x0 && !cutMask[i - 1]) || (x < x1 && !cutMask[i + 1]) || (y > y0 && !cutMask[i - W]) || (y < y1 && !cutMask[i + W])) {
      per++; if (mag[i] > 18) edge++;
    }
  }
  if (!n) return null;
  const mr = sR / n, mg = sG / n, mb = sB / n, s = mr + mg + mb || 1;
  const dx0 = Math.max(0, x0 - 6), dy0 = Math.max(0, y0 - 6), dx1 = Math.min(W - 1, x1 + 6), dy1 = Math.min(H - 1, y1 + 6);
  let rn = 0, rr = 0, rg = 0, rb = 0;
  for (let y = dy0; y <= dy1; y++) for (let x = dx0; x <= dx1; x++) {
    const i = y * W + x;
    if (cutMask[i] || !face[i] || !skin[i]) continue;
    rn++; rr += img[i * 4]; rg += img[i * 4 + 1]; rb += img[i * 4 + 2];
  }
  let ring = null;
  if (rn > 10) {
    const qr = rr / rn, qg = rg / rn, qb = rb / rn, qs = qr + qg + qb || 1;
    ring = { n: rn, y: 0.299 * qr + 0.587 * qg + 0.114 * qb, rn: qr / qs, gn: qg / qs, rg: qr - qg, rb: qr - qb };
  }
  return {
    area: n, w, h, aspect: Math.max(w, h) / Math.max(1, Math.min(w, h)), fill: n / (w * h),
    bound: per ? edge / per : 0,
    mean: { r: mr, g: mg, b: mb, y: 0.299 * mr + 0.587 * mg + 0.114 * mb, rn: mr / s, gn: mg / s, rg: mr - mg, rb: mr - mb, sat: Math.max(mr, mg, mb) - Math.min(mr, mg, mb) },
    ring, shadowOverlap: sh / n, hiOverlap: hi / n, eyeOverlap: eye / n, coreRatio: core / n
  };
}
// đối chứng nâng sáng: so trong không gian sắc độ (bất biến với độ sáng) —
// nốt thật giữ chữ ký sắc độ khi đưa về cùng độ sáng, bóng đổ thì không
function liftPersistCheck(blobMean, baseMean, medianY, cls) {
  if (!baseMean || !blobMean) return false;
  const bs = blobMean.r + blobMean.g + blobMean.b || 1, qs = baseMean.r + baseMean.g + baseMean.b || 1;
  const brn = blobMean.r / bs, bgn = blobMean.g / bs, qrn = baseMean.r / qs, qgn = baseMean.g / qs;
  const yRatio = blobMean.y / Math.max(1, baseMean.y);
  if (cls === "red") return (brn - bgn) - (qrn - qgn) > 0.025;
  if (cls === "brown") return brn > 0.33 && brn < 0.47 && bgn > 0.26 && bgn < 0.37 && yRatio < 0.92;
  return true;
}
// B7+B8: quyết định pure từng lớp. KHÔNG đủ bằng chứng -> loại kèm lý do.
function verifyRedCandidate(F, base, medianY) {
  if (!F) return { keep: false, reason: "empty" };
  if (F.eyeOverlap > 0.2) return { keep: false, reason: "eye" };
  if (F.shadowOverlap > 0.4) return { keep: false, reason: "shadow" };
  if (F.hiOverlap > 0.3) return { keep: false, reason: "glare" };
  if (F.aspect > 4.5 || F.fill < 0.22) return { keep: false, reason: "shape" };
  if (F.bound < 0.22) return { keep: false, reason: "boundary" };
  if (!F.ring) return { keep: false, reason: "noring" };
  if ((F.mean.rg - F.ring.rg) < 5 || (F.mean.rb - F.ring.rb) < 4) return { keep: false, reason: "contrast" };
  if (((F.mean.rn - F.mean.gn) - (F.ring.rn - F.ring.gn)) <= 0.007) return { keep: false, reason: "persist" };
  if (!liftPersistCheck(F.mean, base, medianY, "red")) return { keep: false, reason: "lift" };
  const k = classifyRedBlob(F.area, F.coreRatio);
  if (k.cls === "diffuse") return { keep: false, reason: "diffuse" };
  const conf = clamp(k.confidence + 0.08 * F.bound + 0.04, 0.5, 0.95);
  if (k.cls === "nodule" && (conf < 0.6 || F.bound < 0.3)) return { keep: false, reason: "lowconf" };
  if (conf < 0.55) return { keep: false, reason: "lowconf" };
  return { keep: true, cls: k.cls, confidence: +conf.toFixed(2) };
}
function verifyBrownCandidate(F, base, medianY) {
  if (!F) return { keep: false, reason: "empty" };
  if (F.eyeOverlap > 0.2) return { keep: false, reason: "eye" };
  if (F.shadowOverlap > 0.6) return { keep: false, reason: "shadow" };
  if (F.hiOverlap > 0.3) return { keep: false, reason: "glare" };
  if (F.aspect > 5 || F.fill < 0.2) return { keep: false, reason: "shape" };
  if (!F.ring) return { keep: false, reason: "noring" };
  if ((F.ring.y - F.mean.y) < 6) return { keep: false, reason: "contrast" };
  const s = F.mean.r + F.mean.g + F.mean.b || 1, rn = F.mean.r / s, gn = F.mean.g / s;
  if (!(rn > 0.30 && rn < 0.50 && gn > 0.25 && gn < 0.38)) return { keep: false, reason: "chroma" };
  if (!liftPersistCheck(F.mean, base, medianY, "brown")) return { keep: false, reason: "lift" };
  const conf = clamp(0.6 + Math.min(0.2, F.area / 1200) + 0.05 * F.bound, 0.5, 0.9);
  if (conf < 0.55) return { keep: false, reason: "lowconf" };
  return { keep: true, cls: "pih", confidence: +conf.toFixed(2) };
}
function verifyDarkCandidate(F, white) {
  if (!F) return { keep: false, reason: "empty" };
  if (F.eyeOverlap > 0.2) return { keep: false, reason: "eye" };
  if (F.shadowOverlap > 0.5) return { keep: false, reason: "shadow" };
  if (F.hiOverlap > 0.3) return { keep: false, reason: "glare" };
  if (F.aspect > 4 || F.fill < 0.25) return { keep: false, reason: "shape" };
  if (F.bound < 0.2) return { keep: false, reason: "boundary" };
  if (!F.ring) return { keep: false, reason: "noring" };
  if ((white ? (F.mean.y - F.ring.y) : (F.ring.y - F.mean.y)) < (white ? 18 : 15)) return { keep: false, reason: "contrast" };
  if (F.mean.sat > 35) return { keep: false, reason: "chroma" };
  const conf = clamp(0.58 + Math.min(0.2, F.area / 500) + 0.06 * F.bound, 0.5, 0.88);
  if (conf < 0.55) return { keep: false, reason: "lowconf" };
  return { keep: true, cls: "comedone", confidence: +conf.toFixed(2) };
}
function verifyMoleCandidate(F, flags) {
  if (!F) return { keep: false, reason: "empty" };
  if (F.eyeOverlap > 0.2) return { keep: false, reason: "eye" };
  if (F.shadowOverlap > 0.5) return { keep: false, reason: "shadow" };
  if (F.hiOverlap > 0.3) return { keep: false, reason: "glare" };
  if (F.bound < 0.35) return { keep: false, reason: "boundary" };
  if (!F.ring || (F.ring.y - F.mean.y) < 25) return { keep: false, reason: "contrast" };
  const conf = (flags && flags.suspicious) ? 0.78 : 0.65;
  if (conf < 0.6) return { keep: false, reason: "lowconf" };
  return { keep: true, cls: "mole", confidence: conf };
}
// mức nội bộ theo % (giữ để test + dùng nội bộ, UI hiển thị trạng thái bằng chứng)
function sevOf(aff, ery, nodule) {
  if (aff >= 4 || ery > 25 || nodule > 0) return ["red", "🔴", "Nặng"];
  if (aff >= 1 || ery > 12) return ["yellow", "🟡", "Vừa"];
  return ["green", "🟢", "Nhẹ"];
}
// trạng thái bằng chứng từng vùng (pure): signs / clear / uncertain
function regionEvidence(o) { if (o.n > 0) return "signs";
  if (!o.visible || o.skinPx < 600) return "uncertain";
  if (o.marginal || (o.shadowPct || 0) > 35) return "uncertain";
  return "clear";
}
// đối chứng đa góc core (pure): cùng vị trí giải phẫu có nốt ở góc khác?
function crossViewSupport(t, others) {
  return others.some(o => o.angle !== t.angle && o.roi === t.roi &&
    Math.abs(o.u - t.u) < 0.15 && Math.abs(o.v - t.v) < 0.15 &&
    (o.grp === t.grp || (o.grp === "INF" && t.grp === "INF")));
}
// ổn định ánh sáng giữa 3 ảnh (pure)
function lightSpread(meds) {
  if (!meds.length) return { spread: 0, stable: true };
  const s = Math.max.apply(null, meds) - Math.min.apply(null, meds);
  return { spread: +s.toFixed(1), stable: s <= 40 };
}
// ---------- lesion segmentation (heuristic thay YOLOv8-Seg/ViT, CHỈ chạy trên da mặt) ----------
// 1 pass duy nhất trên pixel da∩mặt -> 5 score-mask -> blob theo ROI -> NMS -> cap số lượng.
function findBlobs(mask, W, H, minArea, maxArea) {
  const seen = new Uint8Array(W * H); const out = [];
  const stack = [];
  for (let i = 0; i < W * H; i++) {
    if (!mask[i] || seen[i]) continue;
    let x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0;
    stack.push(i); seen[i] = 1;
    while (stack.length) {
      const p = stack.pop(); const px = p % W, py = (p / W) | 0;
      area++; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      if (px > 0 && mask[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack.push(p - 1); }
      if (px < W - 1 && mask[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack.push(p + 1); }
      if (py > 0 && mask[p - W] && !seen[p - W]) { seen[p - W] = 1; stack.push(p - W); }
      if (py < H - 1 && mask[p + W] && !seen[p + W]) { seen[p + W] = 1; stack.push(p + W); }
      if (area > (maxArea || 1e9)) { while (stack.length) stack.pop(); area = -1; break; }
    }
    if (area >= minArea && area > 0) out.push({ bbox: [x0, y0, x1, y1], area });
  }
  return out;
}
function detectLesions(canvas, masks, roiMasks, anchors, aux) {
  const { W, H, img, face, skin } = masks;
  aux = aux || {};
  const base = aux.base || computeSkinBaseline(img, face, skin, W, H); // baseline da của chính mặt này
  const illum = aux.illum || { shadowMask: new Uint8Array(W * H), hiMask: new Uint8Array(W * H), medianY: 128 };
  const mag = aux.mag || new Float32Array(W * H);
  const qvLevel = aux.qvLevel || "PASS";
  const mRed = new Uint8Array(W * H), mDark = new Uint8Array(W * H),
    mWhite = new Uint8Array(W * H), mBrown = new Uint8Array(W * H), mMole = new Uint8Array(W * H),
    mPus = new Uint8Array(W * H);
  const darkMax = base ? Math.min(90, base.y * 0.55) : 85;
  const whiteMin = base ? base.y + 22 : 180;
  const moleMax = base ? base.y * 0.45 : 70;
  for (let i = 0; i < W * H; i++) {
    if (!face[i] || !skin[i]) continue;
    const r = img[i * 4], g = img[i * 4 + 1], b = img[i * 4 + 2];
    if (isRedAdaptive(r, g, b, base)) mRed[i] = 1;
    if (isPusAdaptive(r, g, b, base)) mPus[i] = 1;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx < darkMax && (mx - mn) > 6) mDark[i] = 1;
    if (mn > whiteMin && (mx - mn) < 35) mWhite[i] = 1;
    if (isBrownAdaptive(r, g, b, base)) mBrown[i] = 1;
    if (mx < moleMax) mMole[i] = 1;
  }
  const lesions = [], perROI = {};
  const stats = { candidates: 0, confirmed: 0, drop: {} };
  const drop = reason => { stats.drop[reason] = (stats.drop[reason] || 0) + 1; };
  const faceWpx = anchors ? anchors.faceW : W * 0.5;
  const mmPerPx = 140 / Math.max(1, faceWpx); // bề rộng mặt ~140mm để ước đường kính nốt
  for (const roi of Object.keys(roiMasks)) {
    const rm = roiMasks[roi];
    const cut = src => { const o = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) if (src[i] && rm[i]) o[i] = 1; return o; };
    const pusCut = cut(mPus);
    const vctx = { img, W, H, face, skin, mag, shadowMask: illum.shadowMask, hiMask: illum.hiMask, eyeMask: masks.eyeMask };
    const medianY = illum.medianY, baseM = base;
    // B6 ứng viên (nhạy) -> B7+B8 xác minh từng ứng viên (đặc hiệu): bóng/chói/hình thái/ranh giới/
    // tương phản cục bộ/vòng sắc độ/nâng sáng -> confidence. Nghi ngờ = loại.
    const verify = (blobs, cutM, kind) => {
      const ok = [];
      blobs.forEach(o => {
        stats.candidates++;
        const F = blobFeatures(cutM, kind === "red" ? pusCut : null, o.bbox, vctx);
        let v;
        if (kind === "red") v = verifyRedCandidate(F, baseM, medianY);
        else if (kind === "brown") v = verifyBrownCandidate(F, baseM, medianY);
        else if (kind === "dark") v = verifyDarkCandidate(F, false);
        else if (kind === "white") v = verifyDarkCandidate(F, true);
        else v = verifyMoleCandidate(F, o.flags);
        if (!v.keep) { drop(v.reason); return; }
        ok.push({ ...o, cls: v.cls, confidence: v.confidence });
      });
      return ok;
    };
    let cand = [
      ...verify(findBlobs(cut(mRed), W, H, 15, 1400), cut(mRed), "red"),
      ...verify(findBlobs(cut(mDark), W, H, 7, 220), cut(mDark), "dark"),
      ...verify(findBlobs(cut(mWhite), W, H, 8, 200), cut(mWhite), "white"),
      ...verify(findBlobs(cut(mBrown), W, H, 22, 2500), cut(mBrown), "brown"),
    ];
    // nốt sắc tố: blob đậm đủ to + chấm ABCDE trước, rồi xác minh hình thái/ranh giới
    const moleCut = cut(mMole);
    cand = cand.concat(verify(
      findBlobs(moleCut, W, H, 100, 15000).map(o => {
        const w = o.bbox[2] - o.bbox[0] + 1, h = o.bbox[3] - o.bbox[1] + 1;
        const asym = Math.abs(w - h) / Math.max(1, Math.max(w, h));
        const irr = (w * h) / Math.max(1, o.area);
        const diamMm = Math.max(w, h) * mmPerPx;
        o.flags = { asym: +asym.toFixed(2), irr: +irr.toFixed(2), diamMm: +diamMm.toFixed(1), suspicious: (diamMm > 6 && (asym > 0.35 || irr > 1.75)) || diamMm > 9 };
        return o;
      }), moleCut, "mole"));
    const byCls = {};
    cand.forEach(o => { (byCls[o.cls] = byCls[o.cls] || []).push(o); });
    const caps = { nodule: 25, pustule: 80, papule: 80, comedone: 120, pih: 80, mole: 15 };
    let kept = [];
    for (const k of Object.keys(byCls)) kept = kept.concat(nms(byCls[k]).slice(0, caps[k] || 40));
    kept.forEach(o => {
      const w = o.bbox[2] - o.bbox[0] + 1, h = o.bbox[3] - o.bbox[1] + 1;
      lesions.push({ roi, class: o.cls, bbox: o.bbox, confidence: o.confidence, area: o.area, flags: o.flags || null, sizeMm: +(Math.max(w, h) * mmPerPx).toFixed(1) });
    });
    // thống kê ROI trên DA (mẫu số = pixel da, không phải cả nền)
    let skinPx = 0, redPx = 0, shPx = 0;
    for (let i = 0; i < W * H; i++) {
      if (rm[i] && face[i] && skin[i]) { skinPx++; if (mRed[i]) redPx++; if (illum.shadowMask[i]) shPx++; }
    }
    stats.confirmed += kept.length;
    const cnt = c => kept.filter(l => l.class === c).length;
    const lesionArea = kept.reduce((s, l) => s + l.area, 0);
    const affPct = +(lesionArea / Math.max(1, skinPx) * 100).toFixed(1);
    const avgConf = kept.length ? +(kept.reduce((s, l) => s + l.confidence, 0) / kept.length).toFixed(2) : 0;
    const shadowPct = +(shPx / Math.max(1, skinPx) * 100).toFixed(1);
    const visible = skinPx >= 600;
    perROI[roi] = {
      visible, skinPx, lesionArea, affPct, avgConf, shadowPct,
      status: regionEvidence({ n: kept.length, visible, skinPx, marginal: qvLevel !== "PASS", shadowPct }),
      erythemaPct: +(redPx / Math.max(1, skinPx) * 100).toFixed(1),
      pustule: cnt("pustule"), papule: cnt("papule"), nodule: cnt("nodule"),
      comedone: cnt("comedone"), pih: cnt("pih"), mole: cnt("mole")
    };
  }
  return { lesions, perROI, skinFace: masks.skinFace, facePx: masks.facePx, stats };
}

// ---------- QC: mờ đo TRONG bbox mặt, sáng đo TRÊN da mặt (không còn đo cả cái kệ) ----------
function blurOnFace(canvas, ovalBox) {
  const b = ovalBox;
  const bw = Math.max(40, Math.min(canvas.width, b.w)), bh = Math.max(40, Math.min(canvas.height, b.h));
  const t = document.createElement("canvas");
  const w = 160, h = Math.max(40, Math.round(bh * w / bw));
  t.width = w; t.height = h;
  const tx = t.getContext("2d", { willReadFrequently: true });
  tx.drawImage(canvas, b.x, b.y, b.w, b.h, 0, 0, w, h);
  const d = tx.getImageData(0, 0, w, h).data;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  let sum = 0, sum2 = 0, n = 0;
  for (let y = 1; y < h - 1; y++) for (let x0 = 1; x0 < w - 1; x0++) {
    const v = gray[(y - 1) * w + x0] + gray[y * w + x0 - 1] - 4 * gray[y * w + x0] + gray[y * w + x0 + 1] + gray[(y + 1) * w + x0];
    sum += v; sum2 += v * v; n++;
  }
  const mean = sum / Math.max(1, n);
  return sum2 / Math.max(1, n) - mean * mean;
}
function lightOnSkin(masks) {
  const { img, W, H, skin, face } = masks;
  let s = 0, over = 0, under = 0, n = 0;
  for (let i = 0; i < W * H; i += 5) {
    if (!face[i] || !skin[i]) continue;
    const y = 0.299 * img[i * 4] + 0.587 * img[i * 4 + 1] + 0.114 * img[i * 4 + 2];
    s += y; n++; if (y > 245) over++; if (y < 30) under++;
  }
  if (!n) return { mean: 0, overPct: 0, underPct: 100 };
  return { mean: s / n, overPct: over / n * 100, underPct: under / n * 100 };
}
// ---------- tooltip khi di chuột + lời khuyên từng nốt ----------
const ADVICE = {
  pustule: "Mụn viêm/mủ — đừng nặn, giữ da sạch, xem khuyến nghị bên dưới.",
  papule: "Sẩn viêm đỏ — đừng nặn, tránh sờ tay lên mặt.",
  nodule: "Mụn bọc/nang sâu — dễ sẹo rỗ, nên khám da liễu.",
  comedone: "Nhân mụn/đầu đen-trắng — làm sạch dịu nhẹ, BHA nồng độ thấp.",
  pih: "Thâm sau mụn — chống nắng kỹ mỗi ngày, mờ dần theo tuần.",
  mole: "Nốt sắc tố — tự soi theo ABCDE, đi khám nếu to/đổi màu/ngứa."
};
function attachTooltip(canvas, lesions, matchName) {
  if (!canvas) return;
  const wrap = canvas.parentElement;
  let tip = wrap.querySelector(".tip");
  if (!tip) { tip = document.createElement("div"); tip.className = "tip"; wrap.appendChild(tip); }
  const show = e => {
    const r = canvas.getBoundingClientRect();
    const t = (e.touches && e.touches[0]) || e;
    const px = (t.clientX - r.left) * canvas.width / r.width, py = (t.clientY - r.top) * canvas.height / r.height;
    const hit = lesions.slice().reverse().find(l => px >= l.bbox[0] && px <= l.bbox[2] && py >= l.bbox[1] && py <= l.bbox[3]);
    if (!hit) { tip.style.display = "none"; return; }
    tip.style.display = "block";
    tip.style.left = Math.min(Math.max(0, t.clientX - r.left + 14), Math.max(0, r.width - 205)) + "px";
    tip.style.top = Math.max(0, t.clientY - r.top - 10) + "px";
    tip.innerHTML = `<b>${CLASS_VI[hit.class] || hit.class}</b> • AI chắc chắn ${Math.round(hit.confidence * 100)}% (mức tin cậy)<br><small>Ø ~${hit.sizeMm || "?"}mm • ${ROI_VI[hit.roi] || hit.roi || ""}</small><br><small>${ADVICE[hit.class] || ""}</small>` +
      (hit.xview === true ? `<br/><small>✓ Đã đối chứng đa góc</small>` : (hit.xview === false ? `<br/><small>○ Chưa đối chứng đa góc (đơn góc)</small>` : "")) +
      (matchName ? `<br/><small>Phù hợp: <b>${matchName}</b></small>` : "");
  };
  canvas.onmousemove = show; canvas.onclick = show; canvas.ontouchstart = show;
  canvas.onmouseleave = () => { tip.style.display = "none"; };
}
function copyToResult(angle) {
  const rv = el("rv-" + angle);
  if (rv) rv.getContext("2d").drawImage(cv(angle), 0, 0, rv.width, rv.height);
}
// ---------- vector lệch + so khớp với mạng tri thức kb (cosine similarity) ----------
// Mỗi mặt -> vector đặc trưng shape [viêm, nhân mụn, thâm, đỏ, sắc tố] (chuẩn hóa, không phụ thuộc số lượng tuyệt đối)
function cosine(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return (na && nb) ? d / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}
function lesionProfileVector(lesions, maxEry) {
  const n = lesions.length || 1;
  const c = k => lesions.filter(l => l.class === k).length / n;
  const inf = c("pustule") + c("papule") + c("nodule");
  const hasSusp = lesions.some(l => l.class === "mole" && l.flags && l.flags.suspicious);
  const hasMole = lesions.some(l => l.class === "mole");
  const v = [inf, c("comedone"), c("pih"), clamp((maxEry || 0) / 30, 0, 1), hasSusp ? 0.9 : (hasMole ? 0.3 : 0)];
  const m = Math.hypot.apply(null, v) || 1;
  return v.map(x => x / m);
}
function matchConditionKB(rel) {
  const pros = (KB && KB.profile_prototypes) || [];
  const scored = pros.map(p => ({ id: p.id, label: p.label_vi, sim: cosine(rel, p.vec) }));
  scored.sort((a, b) => b.sim - a.sim);
  return { best: scored[0] || null, top: scored.slice(0, 2) };
}
// ---------- vẽ overlay gọn: viền oval + box + tag 1 chữ (P/N/C/H/M) + legend ở HTML ----------
const TAG = { pustule: "P", papule: "P", nodule: "N", comedone: "C", pih: "H", mole: "M" };
function drawOverlay(angle, lesions, oval) {
  const c = cv(angle), x = c.getContext("2d");
  drawCover(angle, state[angle].img);
  if (oval && oval.length) {
    x.save(); x.strokeStyle = "rgba(56,189,248,.65)"; x.lineWidth = 2; x.setLineDash([7, 5]);
    x.beginPath(); oval.forEach((p, i) => i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y)); x.closePath(); x.stroke(); x.restore();
  }
  lesions.slice(0, 150).forEach((l, idx) => {
    const [a, b2, c2, d2] = l.bbox;
    x.strokeStyle = CLASS_COLOR[l.class] || "#fff"; x.lineWidth = 2.4;
    x.strokeRect(a, b2, c2 - a + 1, d2 - b2 + 1);
    const t = `${l.rank || (idx + 1)}.${TAG[l.class] || "?"}`; // số thứ tự khớp Top 12 bên dưới
    x.font = "bold 12px sans-serif";
    const tw = x.measureText(t).width;
    x.fillStyle = CLASS_COLOR[l.class] || "#fff";
    x.fillRect(a, Math.max(0, b2 - 14), tw + 6, 14);
    x.fillStyle = "#04121f"; x.fillText(t, a + 3, Math.max(10, b2 - 4));
  });
}

// ---------- main ----------
// Thứ tự pipeline bắt buộc: 0 kiểm tra ảnh -> 1 nhận diện mặt -> 2 ánh sáng ->
// 3 loại bóng -> 4 phân vùng -> 5/6 tìm nốt + lọc nhiễu -> 7 chấm tin cậy. 8 biểu đồ ở render.
async function analyzeAngle(angle, onStage) {
  const stage = i => { try { onStage && onStage(i); } catch {} };
  const c = cv(angle);
  if (!state[angle].img) throw new Error("Thiếu ảnh " + angle);
  drawCover(angle, state[angle].img);
  stage(0); // B0: kiểm tra ảnh thô
  const [y0, y1] = EXPECTED_YAW[angle];
  stage(1); // B1: nhận diện mặt
  const lm = await runFaceMesh(c);
  const pose = estimatePose(lm);
  const yawEst = pose ? +pose.yaw.toFixed(1) : null; // mất mesh -> null, KHÔNG bịa số
  const masks = buildFaceMasks(c, lm);
  const anchors = faceAnchors(lm, c.width, c.height);
  const faceFrac = masks.ovalBox.w * masks.ovalBox.h / (c.width * c.height);
  const skinRatio = +(masks.skinFace / Math.max(1, masks.facePx) * 100).toFixed(1);
  stage(2); // B2: kiểm tra ánh sáng + chất lượng
  const illum = analyzeIllumination(masks, masks.ovalBox);
  const blur = blurOnFace(c, masks.ovalBox), light = lightOnSkin(masks);
  const angle_valid = yawEst == null ? null : (yawEst >= y0 - 12 && yawEst <= y1 + 12);
  const lighting_valid = light.mean > 60 && light.mean < 205 && light.overPct < 10 && light.underPct < 25;
  const blur_pass = blur >= 70, blur_marginal = blur >= 40 && blur < 70;
  const qv = qualityVerdict({
    blur, blurMarginal: blur_marginal, lightMean: light.mean, overPct: light.overPct, underPct: light.underPct,
    wbOff: illum ? illum.wbOff : 0, angleValid: angle_valid, faceFrac, skinRatio
  });
  // KHÔNG chặn phân tích: ảnh kém chỉ ghi chú nhẹ, vẫn soi kỹ vùng mặt
  const qualityNote = qv.level === "FAIL"
    ? `ảnh hơi kém (${(qv.issues || []).join(", ")}) — kết quả mang tính tham khảo, chụp lại rõ hơn để chắc chắn`
    : (qv.level === "MARGINAL" ? "ảnh tạm được — giữ máy vững + đủ sáng sẽ chuẩn hơn" : "");
  const guidance = angleGuidance(angle, yawEst);
  const norm = anchors
    ? { cx: anchors.cx, hw: anchors.hw, top: anchors.top, faceH: anchors.faceH }
    : { cx: masks.ovalBox.x + masks.ovalBox.w / 2, hw: masks.ovalBox.w / 2, top: masks.ovalBox.y, faceH: masks.ovalBox.h };
  const base = {
    angle, lm: !!lm, pose: pose || { yaw: 0, pitch: 0, roll: 0, estimated: false },
    yawEst, blur: +blur.toFixed(1), light, angle_valid, lighting_valid,
    blur_pass, blur_marginal, guidance, skinRatio, oval: masks.oval, qv, excluded: false, qualityNote, norm,
    faceFrac: +faceFrac.toFixed(3),
    illum: illum ? {
      meanY: +illum.meanY.toFixed(1), medianY: illum.medianY, asym: +illum.asym.toFixed(3),
      shadowPct: +illum.shadowPct.toFixed(1), hiPct: +illum.hiPct.toFixed(1),
      overPct: +illum.overPct.toFixed(1), underPct: +illum.underPct.toFixed(1), wbOff: +illum.wbOff.toFixed(1)
    } : null,
    lesions: [], perROI: {}, fpStats: { candidates: 0, confirmed: 0, drop: {} }
  };
  // luôn chạy tiếp: soi vùng mặt + tìm nốt dù ảnh chưa hoàn hảo
  stage(3); // B3: loại bóng (shadow/hi mask đã có trong illum)
  stage(4); // B4: phân vùng khuôn mặt
  const roiMasks = buildRoiMasks(masks, anchors, lm, c.width, c.height);
  const { mag } = graySobel(masks.img, c.width, c.height);
  stage(5); stage(6); // B5+B6: tìm nốt + lọc nhiễu false-positive
  const det = detectLesions(c, masks, roiMasks, anchors, {
    mag, illum, base: computeSkinBaseline(masks.img, masks.face, masks.skin, c.width, c.height), qvLevel: qv.level
  });
  stage(7); // B7: chấm tin cậy (confidence đã tính trong verify)
  return { ...base, lesions: det.lesions, perROI: det.perROI, fpStats: det.stats, skinFace: det.skinFace, facePx: det.facePx };
}

async function analyzeAll(auto) {
  const busy = document.getElementById("busy");
  busy.textContent = "Đang chạy FaceMesh + segmentation…";
  setStepBar(2);
  document.getElementById("btnAnalyze").disabled = true;
  try {
    for (const a of ANGLES) if (!state[a].img) {
      // tự lấy từ canvas hiện tại (demo hoặc đã vẽ)
      const c = cv(a), x = c.getContext("2d");
      const d = x.getImageData(0, 0, c.width, c.height).data;
      const empty = d.every((v, i) => i % 4 === 3 || v === 0);
      if (empty) {
        busy.textContent = "";
        document.getElementById("btnAnalyze").disabled = false;
        const miss = ANGLES.filter(k => !state[k].img).join(", ");
        alert("Thiếu ảnh: " + miss + ". Lên Camera Studio, chụp từng góc (đếm 3-2-1).");
        setTarget(ANGLES.find(k => !state[k].img));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const img = new Image(); img.src = c.toDataURL(); await new Promise(r => img.onload = r);
      state[a].img = img;
    }
    const results = [];
    pipeReset();
    for (const a of ANGLES) { setStat(a, "Đang chạy pipeline 9 bước…"); results.push(await analyzeAngle(a, pipeTo)); }
    pipeTo(8);
    const agg = aggregate(results);
    renderAll(results, agg);
    busy.textContent = auto ? "Xong (tự chạy khi đủ 3/3) ✅" : "Xong.";
  } catch (e) { busy.textContent = "Lỗi: " + e.message; console.error(e); }
  document.getElementById("btnAnalyze").disabled = false;
  updateProgress();
}

function aggregate(results) {
  const usable = results; // luôn phân tích mọi góc đã chụp, không loại ảnh nào
  // Tọa độ giải phẫu chuẩn hóa (u,v theo khung mặt) để đối chiếu cùng vị trí giữa các ảnh
  let all = [];
  usable.forEach(r => r.lesions.forEach(l => {
    const cx = (l.bbox[0] + l.bbox[2] + 1) / 2, cy = (l.bbox[1] + l.bbox[3] + 1) / 2;
    all.push({
      ...l, angle: r.angle,
      u: (cx - r.norm.cx) / r.norm.hw, v: (cy - r.norm.top) / r.norm.faceH,
      grp: ["pustule", "papule", "nodule"].includes(l.class) ? "INF" : l.class
    });
  }));
  // vùng khả kiến theo từng góc -> nốt ở vùng hiện ở ≥2 góc mà không có đối chứng = bóng/nhiễu -> loại
  const visMap = {};
  usable.forEach(r => { visMap[r.angle] = {}; for (const k of Object.keys(r.perROI)) visMap[r.angle][k] = !!r.perROI[k].visible; });
  const roiVisN = {};
  Object.keys(ROI_VI).forEach(k => { roiVisN[k] = usable.filter(r => visMap[r.angle][k]).length; });
  const kept = [], droppedCross = [];
  // đối chứng 2 lớp: (1) cùng vị trí giải phẫu ở góc khác (chặt), (2) cùng vùng + cùng nhóm ở góc khác (rộng).
  // Bóng đèn không tái hiện ở góc khác nên vẫn bị loại; nốt thật lệch vị trí do xoay mặt thì qua được lớp 2.
  const regionSupport = (l, all) => all.some(o => o !== l && o.angle !== l.angle && o.roi === l.roi &&
    (o.grp === l.grp || (o.grp === "INF" && l.grp === "INF")));
  all.forEach(l => {
    if (roiVisN[l.roi] >= 2) {
      if (crossViewSupport(l, all) || regionSupport(l, all)) kept.push({ ...l, xview: true });
      else droppedCross.push(l);
    } else kept.push({ ...l, xview: false }); // chỉ hiện ở 1 góc -> giữ nhưng ghi "chưa đối chứng"
  });
  // số thứ tự toàn cục theo diện tích -> khớp ô Top 12 và số trên ảnh
  kept.slice().sort((a, b) => b.area - a.area).forEach((l, i) => { l.rank = i + 1; });
  const cnt = cls => kept.filter(l => l.class === cls).length;
  const pust = kept.filter(l => ["pustule", "nodule", "papule"].includes(l.class)).length;
  const comed = cnt("comedone"), pih = cnt("pih");
  const moles = kept.filter(l => l.class === "mole");
  const molesSusp = moles.filter(l => l.flags && l.flags.suspicious);
  const nodules = kept.filter(l => l.class === "nodule").length;
  const skinTotal = usable.reduce((s, r) => s + (r.skinFace || r.masksSkinFace || 0), 0) || results.reduce((s, r) => s + (r.facePx || 0), 0) || 1;
  const lesPx = kept.reduce((s, l) => s + l.area, 0);
  const coverage = +(lesPx / skinTotal * 100).toFixed(1); // % trên DA mặt (không tính nền)
  // GAGS face-only (Doshi 1997, không gồm ngực/lưng -> max 28): grade = tổn thương nặng nhất mỗi vùng
  const gradeOf = (Les) => {
    const c = Les.map(l => l.class);
    if (c.includes("nodule")) return 4;
    if (c.includes("pustule")) return 3;
    if (c.includes("papule")) return 2;
    if (c.includes("comedone")) return 1;
    return 0;
  };
  const factors = KB?.gags_reference?.factors || { forehead: 2, right_cheek: 2, left_cheek: 2, chin: 1 };
  const roiNames = ["forehead", "left_cheek", "right_cheek", "chin"]; // mũi + thái dương + quanh miệng không vào GAGS chuẩn
  let gags = 0; const gagsDetail = {};
  roiNames.forEach(rn => {
    const Les = kept.filter(l => l.roi === rn);
    const g = gradeOf(Les); gagsDetail[rn] = g; gags += (factors[rn] || 1) * g;
  });
  const visEry = usable.flatMap(r => Object.values(r.perROI).filter(v => v.visible).map(v => v.erythemaPct));
  const maxEry = visEry.length ? Math.max(...visEry) : 0;
  // RED chỉ khi bằng chứng mạnh (nốt nghi ngờ / nhiều nang / viêm dày / đỏ lan + viêm) — KHÔNG gọi Nặng vì tối/tương phản
  let triage = "GREEN", reasons = [];
  if (molesSusp.length > 0) { triage = "RED"; reasons.push(`Phát hiện ${molesSusp.length} nốt sắc tố NGHI NGỜ theo ABCDE (không khẳng định, cần soi da trực tiếp)`); }
  else if (nodules >= 2 || pust >= 8 || (maxEry > 30 && pust >= 3)) {
    triage = "RED";
    reasons.push(`Tổn thương viêm dày (${pust} viêm, ${nodules} cục/nang, đỏ da ${maxEry}%)`);
  }
  if (triage !== "RED") {
    if (gags >= 19 || pust >= 6 || coverage >= 12 || nodules >= 1) { triage = "YELLOW"; reasons.push(`GAGS face-only ${gags}/32 • ${pust} tổn thương viêm (${nodules} cục/nang) • phủ ${coverage}% da mặt`); }
    else if (comed >= 20 || pih >= 15) { triage = "YELLOW"; reasons.push("Nhiều comedone/PIH diện rộng"); }
    else reasons.push("Chưa thấy tổn thương viêm đáng kể");
  }
  if (moles.length > molesSusp.length) reasons.push(`${moles.length - molesSusp.length} nốt sắc tố trông lành tính — tự theo dõi ABCDE`);
  if (droppedCross.length) reasons.push(`${droppedCross.length} dấu hiệu chỉ thấy ở 1 góc (không đối chứng được với góc khác) đã loại khỏi kết quả`);
  const spread = lightSpread(usable.map(r => r.illum ? r.illum.medianY : null).filter(v => v != null));
  if (!spread.stable) reasons.push(`Ánh sáng 3 ảnh chênh lệch ( spread ${spread.spread}) — nên chụp lại 3 góc cùng một chỗ sáng đều để đối chứng tốt hơn`);
  const exclAngles = [];
  const softQ = results.filter(r => r.qv && r.qv.level !== "PASS");
  if (softQ.length) reasons.push(`Lưu ý chất lượng ảnh (${softQ.map(r => r.angle).join(", ")}) — kết quả mang tính tham khảo, chụp lại rõ hơn để chắc chắn`);
  const cond = triage === "RED" && molesSusp.length ? "Tổn thương sắc tố cần theo dõi (ABCDE) & Đỏ da/Viêm da"
    : triage === "RED" ? "Đỏ da/Viêm da tiếp xúc (cần loại trừ)"
    : gags >= 19 ? "Acne Vulgaris (Trung bình) & PIH" : "Acne Vulgaris (Nhẹ) & PIH";
  const slug = triage === "RED" && molesSusp.length ? "not-ruoi-sac-to-bat-thuong"
    : triage === "RED" ? "viem-da-do-da-mao-mach" : gags >= 19 ? "mun-trung-ca-seo" : "mun-an-duoi-da-mun-dau-den";
  // regional_breakdown theo 3 card góc
  const perAngle = {};
  results.forEach(r => {
    const L = kept.filter(l => l.angle === r.angle);
    const c = k => L.filter(l => l.class === k).length;
    const vis = Object.values(r.perROI).filter(v => v.visible).map(v => v.erythemaPct);
    perAngle[r.angle] = {
      excluded: false,
      quality: r.qv ? r.qv.level : "?",
      pustules_count: L.filter(l => ["pustule", "nodule", "papule"].includes(l.class)).length,
      comedones_count: c("comedones"), pih_count: c("pih"),
      moles_count: L.filter(l => l.class === "mole").length,
      unverified_single_view: L.filter(l => l.xview === false).length,
      erythema_pct: vis.length ? Math.max(...vis) : 0,
      dominant_issue: dominant(L)
    };
  });
  // so vector lệch của mặt với mạng tri thức kb -> độ tương đồng từng bệnh
  const vecMatch = matchConditionKB(lesionProfileVector(kept, maxEry));
  const pipe = { candidates: 0, confirmed: kept.length, dropped: {}, dropped_cross_view: droppedCross.length };
  usable.forEach(r => {
    pipe.candidates += (r.fpStats.candidates || 0);
    for (const [k, v] of Object.entries(r.fpStats.drop || {})) pipe.dropped[k] = (pipe.dropped[k] || 0) + v;
  });
  return { kept, pust, comed, pih, moles: moles.length, molesSusp: molesSusp.length, coverage, gags, gagsDetail, triage, reasons, cond, slug, perAngle, maxEry: +maxEry.toFixed(1), vecMatch, pipe, spread, excludedAngles: exclAngles };
}
function dominant(L) {
  if (!L.length) return "Da tương đối ổn định";
  const m = {}; L.forEach(l => m[l.class] = (m[l.class] || 0) + 1);
  const top = Object.entries(m).sort((a, b) => b[1] - a[1])[0][0];
  return { pustule: "Mụn viêm sẩn mủ", nodule: "Mụn bọc/nang", papule: "Sẩn viêm", comedone: "Mụn đầu đen/đầu trắng & bít tắc", pih: "Thâm sau mụn (PIH)", mole: "Nốt sắc tố cần theo dõi" }[top] || top;
}

// ---------- badge, ma trận cấp độ vùng, zoom nốt, cổng blur ----------
// Ảnh đạt chuẩn? -> chỉ khi đạt mới được gợi ý "gặp bác sĩ" ở mức Đỏ
function qualityStdOf(r) { return r && (r.blur_pass || r.blur_marginal) && r.lighting_valid; }
function capBadges(nP, nC, nH, nM) {
  return `<span class="statbadge sb-red">Viêm: ${nP}</span><span class="statbadge sb-yellow">Nhân mụn: ${nC}</span>` +
    `<span class="statbadge sb-blue">Thâm: ${nH}</span><span class="statbadge sb-gray">Sắc tố: ${nM}</span>`;
}
function angleBadge(r) {
  const name = r.angle === "frontal" ? "Chính diện" : (r.angle === "left_cheek" ? "Góc má trái" : "Góc má phải");
  if (r.angle_valid === true) return `<span class="badge bGREEN">✓ ${name} đạt</span>`;
  if (r.angle_valid === false) return `<span class="badge bRED">✗ ${name} sai góc</span>`;
  return `<span class="badge sb-gray">? ${name} chưa rõ góc</span>`;
}
// Bảng bằng chứng từng vùng: signs / clear / uncertain — KHÔNG ép % mức độ
function renderSevMatrix(results, agg) {
  const box = el("sevMatrix"); if (!box) return;
  const keys = Object.keys(ROI_VI);
  // Số liệu lấy từ nốt ĐÃ XÁC NHẬN (agg.kept) -> khớp 100% biểu đồ + báo cáo, không bao giờ lệch
  const byRoi = {};
  (agg.kept || []).forEach(l => { (byRoi[l.roi] = byRoi[l.roi] || []).push(l); });
  const rows = keys.map(k => {
    const L = byRoi[k] || [];
    let vis = false, skin = 0, sh = 0, passVis = false;
    results.forEach(r => {
      const v = r.perROI[k]; if (!v) return;
      vis = vis || v.visible; skin += v.skinPx || 0; sh = Math.max(sh, v.shadowPct || 0);
      if (v.visible && r.qv && r.qv.level === "PASS") passVis = true;
    });
    const st = regionEvidence({ n: L.length, visible: vis, skinPx: skin, marginal: vis && !passVis, shadowPct: sh });
    let chip, detail;
    if (st === "signs") {
      const tn = {}; L.forEach(l => { tn[l.class] = (tn[l.class] || 0) + 1; });
      const tnTxt = Object.entries(tn).map(([c, n]) => `${CLASS_VI[c] || c} ×${n}`).join(", ");
      const ac = Math.round(L.reduce((a, b) => a + b.confidence, 0) / L.length * 100);
      const angs = [...new Set(L.map(l => l.angle))].map(a => a === "frontal" ? "chính diện" : (a === "left_cheek" ? "má trái" : "má phải")).join(", ");
      chip = `<span class="evchip ev-signs">CÓ — ${L.length} nốt</span>`;
      detail = `${tnTxt} (nốt đỏ sưng thì đừng nặn) • AI chắc chắn TB ${ac}% • <b>Xem ô màu trên ảnh: ${angs}</b> — di chuột vào từng ô để biết từng nốt là gì`;
    } else if (st === "uncertain") {
      chip = `<span class="evchip ev-uncertain">KHÔNG RÕ — cần chụp lại</span>`;
      detail = !vis ? "Vùng này bị khuất hoặc AI nhận được quá ít da — hãy chụp đúng góc hơn, mặt đủ lớn trong khung" : (sh > 35 ? "Vùng này đang bị bóng đổ — chụp lại chỗ sáng đều, mặt hướng ra sáng" : "Ảnh vùng này chưa đủ rõ (mờ/thiếu sáng) — chụp lại gần và rõ hơn");
    } else {
      chip = `<span class="evchip ev-clear">KHÔNG — da ổn</span>`;
      detail = "Đã quét đủ rõ, chưa thấy nốt nào — vùng này bình thường, không cần lo";
    }
    return `<tr><td><b>${ROI_VI[k]}</b></td><td>${chip}</td><td>${detail}</td></tr>`;
  }).join("");
  box.innerHTML = `<table class="evtable"><thead><tr><th>Vùng</th><th>Có nốt không?</th><th>Giải thích đơn giản</th></tr></thead><tbody>${rows}</tbody></table>`;
}
// Top 12 điểm cần theo dõi: ô vuông crop cận cảnh đúng vị trí nốt
const _srcCache = {};
function lesionSourceCanvas(angle) {
  if (_srcCache[angle]) return _srcCache[angle];
  const t = document.createElement("canvas"); t.width = 480; t.height = 360;
  const img = state[angle] && state[angle].img;
  if (img && img.width) {
    const x = t.getContext("2d"), s = Math.max(480 / img.width, 360 / img.height);
    const w = img.width * s, h = img.height * s;
    x.drawImage(img, (480 - w) / 2, (360 - h) / 2, w, h);
  } else {
    t.getContext("2d").drawImage(cv(angle), 0, 0);
  }
  _srcCache[angle] = t; return t;
}
function renderZooms(kept) {
  const box = el("zoomGrid"); if (!box) return;
  for (const k in _srcCache) delete _srcCache[k]; // ảnh mới -> crop mới
  const top = kept.slice().sort((a, b) => b.area - a.area).slice(0, 12);
  if (!top.length) { box.innerHTML = '<p class="note">Da ổn định — chưa thấy điểm cần theo dõi.</p>'; return; }
  const ang = { frontal: "Chính diện", left_cheek: "Má trái", right_cheek: "Má phải" };
  box.innerHTML = "";
  top.forEach((l, i) => {
    const cell = document.createElement("div"); cell.className = "zcell";
    const c = document.createElement("canvas"); c.width = 144; c.height = 144;
    const src = lesionSourceCanvas(l.angle);
    const w = l.bbox[2] - l.bbox[0] + 1, h = l.bbox[3] - l.bbox[1] + 1;
    const side = Math.max(24, Math.max(w, h) * 2.2);
    let sx = (l.bbox[0] + l.bbox[2] + 1) / 2 - side / 2, sy = (l.bbox[1] + l.bbox[3] + 1) / 2 - side / 2;
    sx = clamp(sx, 0, 480 - side); sy = clamp(sy, 0, 360 - side);
    const zx = c.getContext("2d");
    zx.drawImage(src, sx, sy, side, side, 0, 0, 144, 144);
    zx.strokeStyle = CLASS_COLOR[l.class] || "#fff"; zx.lineWidth = 5;
    const bx = (l.bbox[0] - sx) / side * 144, by = (l.bbox[1] - sy) / side * 144;
    zx.strokeRect(bx, by, w / side * 144, h / side * 144);
    const lb = document.createElement("b"); lb.innerHTML = `${i + 1}. ${gname(l.class)}`;
    const sm = document.createElement("small");
    sm.textContent = `${ROI_VI[l.roi] || l.roi} • ${ang[l.angle] || l.angle} • Ø ~${l.sizeMm || "?"}mm`;
    cell.appendChild(c); cell.appendChild(lb); cell.appendChild(sm);
    box.appendChild(cell);
  });
}
// Điểm da THEO TỪNG NGƯỜI (0-10): đường cong bão hòa sat(n,k)=10*n/(n+k) —
// càng nhiều nốt điểm càng cao nhưng chững lại, không vọt vô lý. avg = mức tham khảo chung.
function lesionScores(kept, maxEry) {
  const sat = (n, k) => Math.min(10, Math.round(10 * n / (n + k)));
  const c = cls => kept.filter(l => l.class === cls).length;
  const inf = c("pustule") + c("papule") + c("nodule") * 2;
  const moles = kept.filter(l => l.class === "mole");
  const susp = moles.filter(l => l.flags && l.flags.suspicious).length;
  const defs = [
    { key: "vien", label: "Mụn viêm (đỏ/mủ)", value: sat(inf, 8), avg: 4 },
    { key: "tham", label: "Thâm sau mụn", value: sat(c("pih"), 10), avg: 5 },
    { key: "nhan", label: "Nhân mụn (đầu đen/trắng)", value: sat(c("comedone"), 12), avg: 4 },
    { key: "do", label: "Đỏ da", value: Math.min(10, Math.round((maxEry || 0) / 3)), avg: 3 },
    { key: "sac", label: "Nốt sắc tố", value: Math.min(10, moles.length * 2 + susp * 2), avg: 2 },
  ];
  return defs.map(d => ({
    ...d,
    verdict: d.value <= 3 ? ["Tốt", "lvl-ok"] : (d.value <= 6 ? ["Bình thường", "lvl-mid"] : ["Cần chú ý", "lvl-bad"])
  }));
}
function renderScores(agg) {
  const box = el("scoreBars"); if (!box) return;
  const scores = lesionScores(agg.kept, agg.maxEry);
  box.innerHTML = scores.map(s => `
    <div class="score">
      <div class="shead"><span>${s.label}: <span class="${s.verdict[1]}">${s.verdict[0]} (Mức ${s.value}/10)</span></span></div>
      <div class="strack">
        <div class="smark" style="left:${s.value * 10}%">Điểm của bạn<br/>${s.value}/10</div>
        <div class="savg" style="left:${s.avg * 10}%" title="Mức tham khảo chung"></div>
      </div>
      <div class="sscale"><span>0</span><span>Điểm tham khảo: ${s.avg}</span><span>10</span></div>
    </div>`).join("");
}
// ---------- biểu đồ: tròn tỉ lệ + list từng nốt ----------
function drawDoughnut(parts) {
  const c = el("pieChart"); if (!c) return;
  const x = c.getContext("2d"), W = c.width, H = c.height, cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) / 2 - 12, r = R * 0.58;
  const tot = parts.reduce((s, p) => s + p.value, 0);
  x.clearRect(0, 0, W, H);
  if (!tot) {
    x.fillStyle = "#94a3b8"; x.font = "14px sans-serif"; x.textAlign = "center";
    x.fillText("Da ổn định — không thấy nốt", cx, cy); return;
  }
  let a = -Math.PI / 2;
  parts.forEach(p => {
    if (!p.value) return;
    const a2 = a + p.value / tot * Math.PI * 2;
    x.beginPath(); x.arc(cx, cy, R, a, a2); x.arc(cx, cy, r, a2, a, true); x.closePath();
    x.fillStyle = p.color; x.fill(); a = a2;
  });
  x.fillStyle = "#0f2540"; x.font = "bold 26px sans-serif"; x.textAlign = "center";
  x.fillText(String(tot), cx, cy + 9);
  x.font = "12px sans-serif"; x.fillStyle = "#64748b"; x.fillText("tổn thương", cx, cy + 26);
  const lg = el("pieLegend");
  if (lg) lg.innerHTML = parts.filter(p => p.value).map(p =>
    `<span><i style="background:${p.color}"></i>${p.label}: <b>${p.value}</b> (${Math.round(p.value / tot * 100)}%)</span>`).join("");
}
function renderLesionList(kept) {
  const box = el("lesionList"); if (!box) return;
  const top = kept.slice().sort((a, b) => b.area - a.area).slice(0, 12);
  if (!top.length) { box.innerHTML = '<p class="note">Không thấy nốt đáng kể — da ổn định.</p>'; return; }
  const ang = { frontal: "chính diện", left_cheek: "má trái", right_cheek: "má phải" };
  box.innerHTML = top.map((l, i) =>
    `<div class="lrow"><b>${i + 1}. ${gname(l.class)}</b>` +
    `<span>${ROI_VI[l.roi] || l.roi} • ${ang[l.angle] || l.angle}</span>` +
    `<span>Ø ~${l.sizeMm || "?"}mm • tin cậy ${Math.round(l.confidence * 100)}%</span></div>`).join("");
}
function renderCharts(results, agg) {
  const infl = agg.kept.filter(l => ["pustule", "papule", "nodule"].includes(l.class)).length;
  drawDoughnut([
    { label: "Viêm (nốt đỏ/mủ)", value: infl, color: "#ef4444" },
    { label: "Nhân mụn (C)", value: agg.comed, color: "#eab308" },
    { label: "Thâm (H)", value: agg.pih, color: "#a855f7" },
    { label: "Sắc tố (M)", value: agg.moles, color: "#ec4899" },
  ]);
  const lg = el("pieLegend");
  const unv = agg.kept.filter(l => l.xview === false).length;
  if (lg) lg.innerHTML += `<span class="note">Chỉ nốt đã xác nhận mới lên biểu đồ` +
    (unv ? ` (gồm ${unv} nốt đơn góc chưa đối chứng)` : "") +
    (agg.pipe.dropped_cross_view ? ` • đã loại ${agg.pipe.dropped_cross_view} dấu hiệu đơn góc không đối chứng được` : "") + `</span>`;
  renderLesionList(agg.kept);
}
// ---------- render ----------
function renderAll(results, agg) {
  // overlay: luôn vẽ nốt đã xác nhận trên đúng vị trí từng góc
  results.forEach(r => {
    const L = agg.kept.filter(l => l.angle === r.angle);
    drawOverlay(r.angle, L, r.oval);
    copyToResult(r.angle);
    attachTooltip(el("rv-" + r.angle), L, agg.vecMatch.best ? agg.vecMatch.best.label : null);
    const cap = el("cap-" + r.angle);
    if (cap) {
      const nP = L.filter(l => ["pustule", "nodule", "papule"].includes(l.class)).length;
      cap.innerHTML = capBadges(nP, L.filter(l => l.class === "comedone").length, L.filter(l => l.class === "pih").length, L.filter(l => l.class === "mole").length) +
        `<br/><span class="note">${r.guidance}${r.qualityNote ? " • " + r.qualityNote : ""}</span>`;
    }
    const stb = el("st-" + r.angle);
    if (stb) stb.innerHTML = angleBadge(r);
    const yawT = r.yawEst == null ? "?°" : r.yawEst + "°";
    const bT = r.blur_pass ? "đạt" : (r.blur_marginal ? "hơi mờ" : "mờ");
    setStat(r.angle, `góc quay mặt ${yawT} • độ nét ${r.blur} (${bT}) • sáng da ${r.light.mean.toFixed(0)} • nhận diện da ${r.skinRatio}%`);
  });
  const frontalOk = results.find(r => r.angle === "frontal");
  const rejected = false;
  const status = "SUCCESS";
  // KPI
  document.getElementById("kPrimary").textContent = agg.cond;
  const ks = document.getElementById("kSim");
  if (ks) ks.textContent = agg.vecMatch.best ? `So khớp đặc điểm (vector) với kho bệnh mẫu: giống “${agg.vecMatch.best.label}” ${Math.round(agg.vecMatch.best.sim * 100)}%` : "";
  document.getElementById("kGags").textContent = agg.gags + (agg.gags >= 19 ? " (TB)" : (agg.gags >= 8 ? " (nhẹ+)" : " (nhẹ)"));
  document.getElementById("kArea").textContent = agg.coverage + "%";
  document.getElementById("kTriage").innerHTML = `<span class="badge b${agg.triage}">${agg.triage}</span>`;
  renderCharts(results, agg);
  renderScores(agg);
  renderSevMatrix(results, agg);
  renderZooms(agg.kept);
  setStepBar(3);
  pipeDone(); // B8: biểu đồ xong
  // Cổng "gặp bác sĩ": chỉ khi ảnh đạt chuẩn + tổn thương mức Đỏ thật
  const doctorOK = qualityStdOf(frontalOk) && agg.triage === "RED";
  const actionTxt = (agg.triage === "RED" && !doctorOK)
    ? "Ảnh chưa thật nét nên kết quả mang tính tham khảo — chụp lại rõ hơn để chắc chắn. Tạm thời chăm sóc dịu nhẹ + theo dõi."
    : (KB ? KB.triage_rules[agg.triage].action : "");
  window.__doctorOK = doctorOK;
  document.getElementById("triageBanner").innerHTML =
    `<span class="badge b${agg.triage}">${agg.triage} — ${KB ? KB.triage_rules[agg.triage].label : ""}</span>
     <p style="color:var(--muted);font-size:14px;font-weight:600">${agg.reasons.join(" • ")}</p>
     <p style="font-size:14px;font-weight:700">${actionTxt}</p>`;
  const tbl = document.querySelector("#tbl tbody");
  if (tbl) tbl.innerHTML = ["left_cheek", "frontal", "right_cheek"].map(k => {
    const v = agg.perAngle[k];
    return `<tr><td><b>${k}</b></td><td>${v.pustules_count}</td><td>${v.comedones_count}</td><td>${v.pih_count}</td><td>${v.erythema_pct}%</td><td>${v.dominant_issue}</td></tr>`;
  }).join("");
  const out = {
    processing_status: status,
    pipeline_order: ["image_check", "face_detect", "illumination", "shadow_removal", "roi_parsing", "lesion_detect", "fp_filter", "confidence", "charts"],
    quality_control: {
      lighting_valid: results.every(r => r.lighting_valid),
      angle_valid: results.every(r => r.angle_valid !== false),
      blur_score: results.every(r => r.blur_pass || r.blur_marginal) ? "pass" : "fail",
      per_angle: Object.fromEntries(results.map(r => [r.angle, {
        yaw: r.yawEst, angle_valid: r.angle_valid, guidance: r.guidance,
        quality_level: r.qv.level, quality_issues: r.qv.issues, excluded: r.excluded,
        blur_face_region: r.blur, blur_pass: r.blur_pass,
        lighting_mean_on_skin: +r.light.mean.toFixed(1), lighting_valid: r.lighting_valid,
        illumination: r.illum, face_fraction: r.faceFrac,
        skin_ratio_pct: r.skinRatio, mesh: r.lm ? "468pts" : "fallback"
      }]))
    },
    fp_pipeline: {
      candidates_total: agg.pipe.candidates, confirmed_total: agg.pipe.confirmed,
      dropped_by_reason: agg.pipe.dropped, dropped_cross_view: agg.pipe.dropped_cross_view,
      light_spread: agg.spread
    },
    overall_skin_analysis: {
      primary_condition: agg.cond, gags_score: agg.gags, gags_scale: "face-only (Doshi 1997, max 28, không gồm ngực/lưng)", gags_detail: agg.gagsDetail,
      affected_coverage_percentage: agg.coverage, coverage_denominator: "facial skin pixels (skin ∩ face oval)",
      triage_level: agg.triage, specialty_slug: agg.slug,
      counts: { inflammatory: agg.pust, comedones: agg.comed, pih: agg.pih, moles_total: agg.moles, moles_suspicious_abcde: agg.molesSusp, max_erythema_pct: agg.maxEry }
    },
    regional_breakdown: {
      left_cheek: { ...agg.perAngle.left_cheek, dominant_issue: agg.perAngle.left_cheek.dominant_issue },
      frontal: { ...agg.perAngle.frontal }, right_cheek: { ...agg.perAngle.right_cheek }
    },
    detected_lesion_coordinates: agg.kept.slice(0, 300).map(l => ({ roi: l.roi, angle: l.angle, class: l.class, bbox: l.bbox, confidence: l.confidence, size_mm: l.sizeMm, cross_view_supported: !!l.xview, flags: l.flags || undefined })),
    kb_match: (KB?.conditions || []).filter(c => c.specialty_slug === agg.slug || c.triage === agg.triage).slice(0, 3),
    guardrails: "Mô tả hình ảnh có dấu hiệu tương đồng với... (không khẳng định ung thư). Không kê kháng sinh toàn thân/Corticoid mạnh qua AI. Map ICD-10/ICD-11.",
    metadata: { age: +document.getElementById("age").value || null, gender: document.getElementById("gender").value, duration: document.getElementById("duration").value, products: document.getElementById("products").value }
  };
  window.__lastJSON = out;
  window.__lastAgg = agg;
  document.getElementById("jsonOut").textContent = JSON.stringify(out, null, 2);
  document.getElementById("mdOut").innerHTML = mdReport(out, agg, results);
}
// mã lý do loại -> tiếng Việt đơn giản
const REASON_VI = { shadow: "bóng đổ", glare: "chói sáng", eye: "vùng mắt", shape: "hình dạng không giống nốt", boundary: "ranh giới mờ", contrast: "không khác vùng da xung quanh", persist: "mất dấu khi chuẩn hóa ánh sáng", lift: "màu đổi khi nâng sáng (giống bóng)", chroma: "màu không giống tổn thương", noring: "không có da lành xung quanh để so", diffuse: "vùng lan rộng", lowconf: "AI chưa chắc chắn", empty: "rỗng" };
function mdReport(out, agg, results) {
  const kb = (out.kb_match[0] || {});
  const drops = Object.entries(agg.pipe.dropped).map(([k, v]) => `${REASON_VI[k] || k} ×${v}`).join(", ");
  const gagsTxt = Object.entries(agg.gagsDetail).map(([k, v]) => `${ROI_VI[k] || k}: ${v ? v + " điểm" : "0 (sạch)"}`).join(" • ");
  const qTxt = results.map(r => {
    const nm = r.angle === "frontal" ? "chính diện" : (r.angle === "left_cheek" ? "má trái" : "má phải");
    return `${nm}: ${r.qv.level === "PASS" ? "đạt" : "tạm được"} (góc quay ${r.yawEst == null ? "?" : r.yawEst + "°"}, độ nét ${r.blur}, bóng đổ ${r.illum ? r.illum.shadowPct + "%" : "?"})`;
  }).join(" | ");
  return `<h3>Báo cáo Da liễu (AI hỗ trợ — không thay thế bác sĩ)</h3>
  <p><b>Tình trạng chính (bệnh da AI nhận thấy):</b> ${out.overall_skin_analysis.primary_condition}<br/>
  <b>Điểm mụn (thang chuẩn, tối đa 32 — càng cao càng nặng):</b> ${agg.gags}/32 &nbsp; <b>Da có nốt:</b> ${agg.coverage}% diện tích da mặt &nbsp; <b>Mức cần khám:</b> <span class="badge b${agg.triage}">${agg.triage}</span><br/>
  <b>Mụn viêm (nốt đỏ sưng, đừng nặn):</b> ${agg.pust} • <b>Nhân mụn (đầu đen/trắng):</b> ${agg.comed} • <b>Thâm (vết nâu sau mụn):</b> ${agg.pih} • <b>Nốt sắc tố (đốm nâu/đen):</b> ${agg.moles} (đáng ngờ: ${agg.molesSusp}) • <b>Đỏ da cao nhất một vùng:</b> ${agg.maxEry}%</p>
  <p><b>Điểm từng vùng (vùng nào có nốt mới có điểm):</b> ${gagsTxt}</p>
  <p><b>Bác sĩ AI đối chiếu:</b> ${kb.label_vi || "—"} — ${kb.guidance_vi || ""}</p>
  <p><b>Nên làm gì:</b> ${window.__doctorOK === false && agg.triage === "RED"
    ? "Ảnh chưa đạt chuẩn — chụp lại rõ nét rồi mới kết luận. Tạm thời chăm sóc dịu nhẹ + theo dõi."
    : (KB ? KB.triage_rules[agg.triage].action : "")}</p>
  <p><b>AI đã làm gì với ảnh của bạn:</b> soi ${agg.pipe.candidates} điểm nghi ngờ → bỏ ${drops || "không điểm nào"} (toàn là bóng/nhiễu) → bỏ ${agg.pipe.dropped_cross_view} điểm chỉ thấy ở 1 góc (không đối chứng được) → <b>giữ lại ${agg.pipe.confirmed} nốt thật</b> để kết luận.</p>
  <p style="font-size:13px;color:#555"><b>Chất lượng 3 ảnh:</b> ${qTxt}</p>`;
}
// Tên nốt kèm giải thích tra cứu (bấm vào hiện popup nghĩa tiếng Việt)
function gname(cls) {
  const map = { pustule: "mun-viem", papule: "mun-viem", nodule: "mun-viem", comedone: "nhan-mun", pih: "tham", mole: "sac-to" };
  const label = CLASS_VI[cls] || cls;
  return map[cls] ? `<span class="g" data-t="${map[cls]}">${label}</span>` : label;
}
// ---------- Đặt lịch & gửi hồ sơ cho bác sĩ (file mang theo + tóm tắt copy) ----------
function openBooking() {
  if (!window.__lastJSON || !window.__lastAgg) { alert("Chụp đủ 3 góc và phân tích xong mới đặt lịch được."); return; }
  el("bookModal").style.display = "flex";
}
function closeBooking() { el("bookModal").style.display = "none"; }
// Sang trang đặt lịch chính của web, điền sẵn chuyên khoa + tóm tắt soi da
function bookOnline() {
  const agg = window.__lastAgg;
  if (!agg) { alert("Chưa có kết quả phân tích."); return; }
  const base = (/localhost|127\.0\.0\.1/.test(location.hostname)) ? PUBLIC_URL : location.origin;
  const vanDe = `Soi da AI: ${agg.cond} (GAGS ${agg.gags}/28, viêm ${agg.pust}, nhân ${agg.comed}, thâm ${agg.pih}, mức ${agg.triage})`.slice(0, 400);
  window.open(`${base}/dat-lich?chuyen-khoa=${encodeURIComponent(agg.slug || "")}&van-de=${encodeURIComponent(vanDe)}`, "_blank");
}
function bookingSummaryText(info, agg) {
  const L = [];
  L.push(`HỒ SƠ SOI DA DERMACARE (AI hỗ trợ, không thay thế bác sĩ)`);
  L.push(`Bệnh nhân: ${info.name} • SĐT: ${info.phone} • Ngày khám mong muốn: ${info.date || "—"}`);
  L.push(`Ghi chú: ${info.note || "—"}`);
  L.push(`Tình trạng (bệnh da chính AI nhận thấy): ${agg.cond}`);
  L.push(`Điểm mụn GAGS (thang chuẩn tính riêng mặt, tối đa 32): ${agg.gags} • Diện tích da có nốt: ${agg.coverage}% • Mức cần khám: ${agg.triage}`);
  L.push(`Mụn viêm/mủ (đỏ/sưng): ${agg.pust} • Nhân mụn (đầu đen/trắng): ${agg.comed} • Thâm sau mụn: ${agg.pih} • Nốt sắc tố: ${agg.moles} (nghi ngờ: ${agg.molesSusp}) • Đỏ da cao nhất: ${agg.maxEry}%`);
  if (agg.vecMatch.best) L.push(`So khớp đặc điểm với kho bệnh mẫu: giống "${agg.vecMatch.best.label}" ${Math.round(agg.vecMatch.best.sim * 100)}%`);
  L.push(`Chi tiết GAGS từng vùng: ` + Object.entries(agg.gagsDetail).map(([k, v]) => `${ROI_VI[k] || k}:${v}`).join(", "));
  L.push(`Từng góc: ` + ["left_cheek", "frontal", "right_cheek"].map(k => { const v = agg.perAngle[k]; return `${k}: viêm ${v.pustules_count}, nhân ${v.comedones_count}, thâm ${v.pih_count} (${v.dominant_issue})`; }).join(" | "));
  L.push(`Lý do: ${agg.reasons.join("; ")}`);
  L.push(`Kèm theo: 3 ảnh chụp mặt (file hồ sơ đầy đủ). Mong bác sĩ xem giúp.`);
  return L.join("\n");
}
function buildBooking() {
  const info = {
    name: el("bkName").value.trim(), phone: el("bkPhone").value.trim(),
    date: el("bkDate").value, note: el("bkNote").value.trim()
  };
  if (!info.name || !info.phone) { alert("Nhập họ tên + SĐT để đặt lịch."); return; }
  const agg = window.__lastAgg, out = window.__lastJSON;
  const imgs = ["left_cheek", "frontal", "right_cheek"].map(a => {
    try { return { angle: a, src: el("rv-" + a).toDataURL("image/jpeg", 0.85) }; } catch { return { angle: a, src: "" }; }
  });
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const top = agg.kept.slice().sort((a, b) => b.area - a.area).slice(0, 12);
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"/><title>Hồ sơ soi da - ${esc(info.name)}</title></head>` +
    `<body style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:16px;color:#1E293B">` +
    `<h2>Hồ sơ soi da DermaCare (AI hỗ trợ — bác sĩ chẩn đoán chính thức)</h2>` +
    `<p><b>Bệnh nhân:</b> ${esc(info.name)} • <b>SĐT:</b> ${esc(info.phone)} • <b>Ngày mong muốn:</b> ${esc(info.date || "—")}<br/><b>Ghi chú:</b> ${esc(info.note || "—")}</p>` +
    `<p><b>Tình trạng:</b> ${esc(agg.cond)}<br/><b>GAGS:</b> ${agg.gags}/32 • <b>Da có nốt:</b> ${agg.coverage}% • <b>Mức cần khám:</b> ${agg.triage}` +
    (agg.vecMatch.best ? `<br/><b>So khớp kho bệnh mẫu:</b> giống "${esc(agg.vecMatch.best.label)}" ${Math.round(agg.vecMatch.best.sim * 100)}%` : "") + `</p>` +
    imgs.map(o => `<h3>${o.angle === "frontal" ? "Chính diện" : (o.angle === "left_cheek" ? "Má trái" : "Má phải")}</h3>${o.src ? `<img src="${o.src}" style="width:100%;border-radius:8px"/>` : "<i>(thiếu ảnh)</i>"}`).join("") +
    `<h3>12 điểm cần theo dõi</h3><ol>` + top.map(l => `<li>${esc(CLASS_VI[l.class] || l.class)} — ${esc(ROI_VI[l.roi] || l.roi)} — Ø ~${l.sizeMm}mm — AI chắc chắn ${Math.round(l.confidence * 100)}%</li>`).join("") + `</ol>` +
    `<p><b>Lý do AI đưa ra:</b> ${esc(agg.reasons.join("; "))}</p>` +
    `<p><i>File gồm ảnh chụp thật để bác sĩ có góc nhìn rộng hơn khi thăm khám.</i></p></body></html>`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  a.download = "ho-so-soi-da.html"; a.click();
  el("bookSummary").value = bookingSummaryText(info, agg);
}
function copyBooking() {
  const t = el("bookSummary");
  t.select(); try { document.execCommand("copy"); } catch {}
  if (navigator.clipboard) navigator.clipboard.writeText(t.value).catch(() => {});
  alert(t.value ? "Đã sao chép tóm tắt — dán gửi cho phòng khám (Zalo/email)." : "Chưa có tóm tắt.");
}
function downloadJSON() {
  if (!window.__lastJSON) return alert("Chưa có kết quả để tải.");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(window.__lastJSON, null, 2)], { type: "application/json" }));
  a.download = "dermacare-result.json"; a.click();
}
// Export pure logic cho self-test node (không ảnh hưởng browser)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { estimatePose, angleGuidance, skinPixel, nms, iouFn, cosine, lesionProfileVector, classifyRedBlob, isRedAdaptive, isBrownAdaptive, isPusAdaptive, sevOf, qualityStdOf, bookingSummaryText, qualityVerdict, regionEvidence, crossViewSupport, lightSpread, liftPersistCheck, verifyRedCandidate, verifyBrownCandidate, verifyDarkCandidate, verifyMoleCandidate, REASON_VI, lesionScores, EXPECTED_YAW };
}
