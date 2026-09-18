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
        {err && <div className="mt-10 rounded-2xl bg-stone p-6 text-[15px]">Chưa tải được cẩm nang ({err}). Bạn hỏi <Link to="/tro-ly-ai" className="underline font-medium">trợ lý AI</Link> trước nhé.</div>}

        {!loading && !err && (
          <>
            <div className="flex gap-2 mt-8 overflow-x-auto pb-1">
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

export function CamNangDetail() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getArticle(slug).then(setArticle).catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }, [slug])

  return (
    <div className="min-h-screen bg-snow">
      <div className="max-w-[760px] mx-auto px-6 py-10">
        <Link to="/cam-nang" className="inline-flex items-center gap-1.5 text-[14px] text-pewter hover:text-forest"><ArrowLeft size={15} /> Tất cả bài viết</Link>
        {loading && <div className="mt-6 space-y-3"><div className="h-10 rounded-2xl bg-stone animate-pulse" /><div className="h-64 rounded-2xl bg-stone animate-pulse" /></div>}
        {err && <div className="mt-6 rounded-2xl bg-stone p-6 text-[15px]">Không tải được bài viết ({err}).</div>}
        {article && (
          <article>
            <span className="inline-block mt-4 px-2 py-[6px] rounded-pill bg-lime text-forest text-[12px] font-medium">{article.category}</span>
            <h1 className="font-light text-[32px] md:text-[36px] leading-[1.15] mt-3">{article.title}</h1>
            <div className="mt-6 space-y-4 text-[16px] leading-[1.7]">
              {paragraphs(article.content).map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <div className="mt-8 rounded-2xl bg-stone p-5 text-[14px]">
              <div className="flex items-center gap-2 font-medium"><BookOpen size={15} /> Nguồn tham khảo đáng tin cậy</div>
              <ul className="mt-2 space-y-1 text-pewter">
                {TRUSTED.map((s) => (
                  <li key={s.name}>· {s.name} — <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">Truy cập nguồn</a></li>
                ))}
              </ul>
              <p className="mt-3 text-pewter">Hình ảnh minh họa không đính kèm vì chỉ dùng ảnh rõ nguồn. Biểu hiện thực tế mỗi người khác nhau, không dùng bài viết để tự chẩn đoán.</p>
            </div>
            <div className="mt-6 rounded-[32px] bg-forest text-snow p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="font-light text-[20px]">Thấy giống tình trạng của bạn?</div>
              <div className="flex gap-3">
                <Link to="/tro-ly-ai" className="px-5 py-3 rounded-pill bg-snow text-forest text-[14px]">Hỏi AI</Link>
                <Link to="/dat-lich" className="px-5 py-3 rounded-pill border-[1.5px] border-snow text-[14px]">Đặt lịch</Link>
              </div>
            </div>
            <p className="mt-6 text-[13px] text-pewter">Lưu ý: thông tin chỉ tham khảo, không thay thế khám trực tiếp. Triệu chứng bất thường/kéo dài/nặng dần nên đi khám.</p>
          </article>
        )}
      </div>
    </div>
  )
}
