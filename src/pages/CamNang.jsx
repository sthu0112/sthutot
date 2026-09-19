import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, CalendarCheck, MessageCircle } from 'lucide-react'
import { listArticles, getArticle } from '../lib/camNang'
import { playClick } from '../utils/sound'

const TRUSTED = [
  { name: 'American Academy of Dermatology', url: 'https://www.aad.org' },
  { name: 'Mayo Clinic', url: 'https://www.mayoclinic.org' },
  { name: 'Cleveland Clinic', url: 'https://my.clevelandclinic.org' },
  { name: 'NHS', url: 'https://www.nhs.uk' },
  { name: 'WHO', url: 'https://www.who.int' },
]

function paragraphs(content) {
  return content.split(/\n{2,}|\r\n\r\n/).map((p) => p.trim()).filter(Boolean)
}

export function CamNangList() {
  const [articles, setArticles] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('all')

  useEffect(() => {
    listArticles().then(setArticles).catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }, [])

  const cats = useMemo(() => ['all', ...new Set(articles.map((a) => a.category))], [articles])
  const shown = cat === 'all' ? articles : articles.filter((a) => a.category === cat)

  return (
    <div className="min-h-screen bg-snow">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[14px] text-pewter hover:text-forest"><ArrowLeft size={15} /> Về trang chủ</Link>
        <div className="text-[12px] uppercase tracking-wide text-pewter font-medium mt-4">DermaCare / Cẩm nang</div>
        <h1 className="font-light text-[36px] md:text-[40px] leading-[1.1] tracking-[-0.4px] mt-2">Hiểu làn da của bạn</h1>
        <p className="text-[16px] text-pewter mt-3 max-w-2xl leading-[1.5]">Bài viết ngắn gọn, dễ hiểu từ kho tài liệu da liễu của DermaCare. Thông tin chỉ tham khảo, không thay thế khám trực tiếp.</p>

        {loading && <div className="grid md:grid-cols-3 gap-4 mt-10">{[0, 1, 2].map((i) => <div key={i} className="h-44 rounded-2xl bg-stone animate-pulse" />)}</div>}
        {err && <div className="mt-10 rounded-2xl bg-stone p-6 text-[15px]">Chưa tải được cẩm nang ({err}). <button onClick={() => window.location.reload()} className="underline font-medium">Thử lại</button> Bạn hỏi <Link to="/tro-ly-ai" className="underline font-medium">trợ lý AI</Link> trước nhé.</div>}

        {!loading && !err && (
          <>
            <p className="text-[13px] text-pewter mt-2">{articles.length} bài viết · Chữ gạch đứt trong bài là thuật ngữ — di chuột/chạm giữ để xem nghĩa</p>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {cats.map((c) => (
                <button key={c} onClick={() => { playClick('tap'); setCat(c) }} className={`px-4 py-2 rounded-pill text-[13px] font-medium border whitespace-nowrap ${cat === c ? 'bg-forest text-snow border-forest' : 'bg-snow border-forest/20'}`}>
                  {c === 'all' ? 'Tất cả' : c}
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              {shown.map((a, i) => (
                <motion.div key={a.slug} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: (i % 3) * 0.06 }} className="bg-stone rounded-2xl p-6 flex flex-col">
                  <span className="self-start px-2 py-[6px] rounded-pill bg-lime text-forest text-[12px] font-medium">{a.category}</span>
                  <div className="font-medium text-[18px] tracking-[-0.18px] mt-3 leading-snug">{a.title}</div>
                  <p className="text-[14px] text-pewter mt-2 leading-[1.5] flex-1">{a.excerpt}</p>
                  <Link to={`/cam-nang/${a.slug}`} onClick={() => playClick('tap')} className="inline-flex items-center gap-1 text-[14px] font-medium mt-4 underline underline-offset-4 decoration-[1.5px]">
                    Đọc bài <ArrowRight size={14} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <div className="mt-12 rounded-[32px] bg-forest text-snow p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <div className="font-light text-[24px]">Đọc xong vẫn còn thắc mắc?</div>
            <div className="text-[15px] opacity-80 mt-1">Hỏi trợ lý AI hoặc đặt lịch để bác sĩ xem trực tiếp.</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/tro-ly-ai" className="inline-flex items-center gap-2 px-6 py-3 rounded-pill bg-snow text-forest text-[15px]"><MessageCircle size={16} /> Hỏi AI</Link>
            <Link to="/dat-lich" className="inline-flex items-center gap-2 px-6 py-3 rounded-pill border-[1.5px] border-snow text-[15px]"><CalendarCheck size={16} /> Đặt lịch</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const GLOSSARY = [
  ['mụn bọc', 'Mụn viêm to, sâu, đau, dễ để lại sẹo.'],
  ['mụn viêm', 'Nốt mụn đỏ, sưng, đau do đang viêm.'],
  ['mụn mủ', 'Mụn viêm có đầu mủ trắng/vàng.'],
  ['mụn ẩn', 'Nhân mụn nằm dưới da, sờ cộm nhưng ít đỏ.'],
  ['nhân mụn', 'Đầu đen/đầu trắng do lỗ chân lông bít tắc.'],
  ['thâm sau mụn', 'Vết nâu/đỏ còn lại sau khi mụn lành, mờ dần theo tuần.'],
  ['sẹo rỗ', 'Vết lõm sau mụn nặng, skincare không làm đầy được.'],
  ['sắc tố', 'Màu nâu/đen của da do melanin.'],
  ['nám', 'Mảng nâu đối xứng do nắng/nội tiết.'],
  ['tàn nhang', 'Chấm nâu nhỏ, rõ khi nắng, hay do di truyền.'],
  ['viêm da', 'Da đỏ, ngứa/rát do viêm.'],
  ['dị ứng', 'Phản ứng quá mức của da với chất lạ.'],
  ['corticoid', 'Thuốc chống viêm mạnh, chỉ dùng theo chỉ định bác sĩ.'],
  ['kháng sinh', 'Thuốc diệt vi khuẩn, cần bác sĩ kê đơn.'],
  ['retinoid', 'Nhóm vitamin A trị mụn/chống lão hóa, cần dùng đúng cách.'],
  ['niacinamide', 'Vitamin B3 giúp sáng da, kiềm dầu nhẹ.'],
  ['kem chống nắng', 'Lớp bảo vệ da khỏi tia UV, SPF 30+ cho hằng ngày.'],
  ['hàng rào da', 'Lớp bảo vệ tự nhiên giữ ẩm và chặn vi khuẩn.'],
  ['lỗ chân lông', 'Lỗ nhỏ nơi lông và dầu thoát ra, bít tắc gây mụn.'],
]

function splitSections(content) {
  const lines = (content || '').split('\n')
  const secs = []
  let cur = { heading: null, body: [] }
  for (const ln of lines) {
    const m = ln.match(/^##\s+(.+)/)
    if (m) { if (cur.body.length || cur.heading) secs.push(cur); cur = { heading: m[1].trim(), body: [] } }
    else if (ln.trim()) cur.body.push(ln.trim())
  }
  if (cur.body.length || cur.heading) secs.push(cur)
  return secs
}

function richText(text, keyPrefix) {
  const terms = GLOSSARY.map(([t]) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const re = new RegExp(`(${terms})`, 'gi')
  const parts = String(text).split(re)
  return parts.map((p, i) => {
    const found = GLOSSARY.find(([t]) => t.toLowerCase() === p.toLowerCase())
    return found
      ? <span key={`${keyPrefix}-${i}`} title={found[1]} className="font-medium text-forest border-b-2 border-dotted border-teal-600 cursor-help">{p}</span>
      : <span key={`${keyPrefix}-${i}`}>{p}</span>
  })
}

export function CamNangDetail() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [related, setRelated] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true); setErr(''); setArticle(null)
    getArticle(slug).then(setArticle).catch((e) => setErr(e.message)).finally(() => setLoading(false))
    listArticles().then((all) => setRelated(all.filter((a) => a.slug !== slug))).catch(() => {})
  }, [slug])

  const secs = article ? splitSections(article.content) : []
  const sameCat = related.filter((a) => a.category === article?.category).slice(0, 3)
  const relList = (sameCat.length ? sameCat : related.slice(0, 3)).slice(0, 3)
  const readMin = article ? Math.max(1, Math.round(article.content.split(/\s+/).length / 200)) : 0

  return (
    <div className="min-h-screen bg-snow">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 md:py-12">
        <Link to="/cam-nang" className="inline-flex items-center gap-1.5 text-[14px] text-pewter hover:text-forest"><ArrowLeft size={15} /> Tất cả bài viết</Link>
        {loading && <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6"><div className="space-y-3"><div className="h-10 rounded-2xl bg-stone animate-pulse" /><div className="h-64 rounded-2xl bg-stone animate-pulse" /></div><div className="h-64 rounded-2xl bg-stone animate-pulse" /></div>}
        {err && <div className="mt-6 rounded-2xl bg-stone p-6 text-[15px]">Không tải được bài viết ({err}). <button onClick={() => window.location.reload()} className="underline font-medium">Thử lại</button></div>}
        {article && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8 mt-4 items-start">
            <article className="min-w-0">
              <span className="inline-block px-2 py-[6px] rounded-pill bg-lime text-forest text-[12px] font-medium">{article.category}</span>
              <h1 className="font-light text-[32px] md:text-[40px] leading-[1.15] mt-3">{article.title}</h1>
              <div className="text-[13px] text-pewter mt-2">Khoảng {readMin} phút đọc · Chữ <span className="border-b-2 border-dotted border-teal-600 font-medium text-forest">gạch đứt</span> là thuật ngữ — di chuột/chạm giữ để xem nghĩa</div>
              {secs.map((s, i) => (
                <section key={i} id={`muc-${i}`} className="scroll-mt-24 mt-8">
                  {s.heading && <h2 className="font-semibold text-[22px] tracking-tight flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-forest text-snow text-[13px] flex items-center justify-center shrink-0">{i}</span>{s.heading}</h2>}
                  <div className="mt-3 space-y-3 text-[16px] leading-[1.75]">
                    {s.body.map((p, j) => <p key={j}>{richText(p, `${i}-${j}`)}</p>)}
                  </div>
                </section>
              ))}
              <div className="mt-8 rounded-2xl bg-stone p-5 text-[14px]">
                <div className="flex items-center gap-2 font-medium"><BookOpen size={15} /> Nguồn tham khảo đáng tin cậy</div>
                <ul className="mt-2 space-y-1 text-pewter">
                  {TRUSTED.map((s) => (
                    <li key={s.name}>· {s.name} — <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">Truy cập nguồn</a></li>
                  ))}
                </ul>
                <p className="mt-3 text-pewter">Biểu hiện thực tế mỗi người khác nhau, không dùng bài viết để tự chẩn đoán.</p>
              </div>
              <p className="mt-6 text-[13px] text-pewter">Lưu ý: thông tin chỉ tham khảo, không thay thế khám trực tiếp. Triệu chứng bất thường/kéo dài/nặng dần nên đi khám.</p>
            </article>
            <aside className="lg:sticky lg:top-24 space-y-4">
              {secs.some((s) => s.heading) && (
                <div className="rounded-2xl border border-forest/15 bg-white p-5">
                  <div className="font-semibold text-[15px]">Mục lục bài viết</div>
                  <ul className="mt-2 space-y-1.5 text-[14px]">
                    {secs.map((s, i) => s.heading && <li key={i}><a href={`#muc-${i}`} className="text-pewter hover:text-forest hover:underline underline-offset-4">{i}. {s.heading}</a></li>)}
                  </ul>
                </div>
              )}
              <div className="rounded-[24px] bg-forest text-snow p-6">
                <div className="font-light text-[20px]">Thấy giống tình trạng của bạn?</div>
                <div className="flex flex-col gap-2.5 mt-4">
                  <Link to="/tro-ly-ai" className="text-center px-5 py-3 rounded-pill bg-snow text-forest text-[14px] font-medium">Hỏi AI</Link>
                  <Link to="/dat-lich" className="text-center px-5 py-3 rounded-pill border-[1.5px] border-snow text-[14px]">Đặt lịch khám</Link>
                  <a href="/soi-da" className="text-center px-5 py-3 rounded-pill bg-lime text-forest text-[14px] font-medium">Soi da AI</a>
                </div>
              </div>
              {relList.length > 0 && (
                <div className="rounded-2xl border border-forest/15 bg-white p-5">
                  <div className="font-semibold text-[15px]">Bài liên quan</div>
                  <ul className="mt-2 space-y-2.5 text-[14px]">
                    {relList.map((a) => (
                      <li key={a.slug}><Link to={`/cam-nang/${a.slug}`} className="text-forest hover:underline underline-offset-4 font-medium">{a.title}</Link><div className="text-[12px] text-pewter">{a.category}</div></li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
