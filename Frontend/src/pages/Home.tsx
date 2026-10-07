import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChapterGrid } from '../components/ChapterGrid'
import { MathText } from '../components/RichText'
import { useCatalog } from '../catalog'
import { bn, optionKey } from '../lib/format'
import { useTitle } from '../useTitle'

const features = [
  { href: '/book/1', kicker: '০১', title: 'গণিত বই', text: 'অধ্যায়ের সূত্র ও নোট পৃষ্ঠায় পড়ো, PDF নাও।' },
  { href: '/solutions', kicker: '০২', title: 'সমাধান', text: 'প্রতিটি অধ্যায়ের অঙ্ক ধাপে ধাপে।' },
  { href: '/mcq', kicker: '০৩', title: 'MCQ', text: 'উত্তর বাছো, সাথে সাথে ব্যাখ্যা দেখো।' },
  { href: '/cq', kicker: '০৪', title: 'সৃজনশীল', text: 'উদ্দীপক, খ ও গ—সমাধান আলাদা করে।' },
  { href: '/generator', kicker: '০৫', title: 'জেনারেটর', text: 'অধ্যায় বেছে প্রশ্নপত্র বানিয়ে PDF নাও।' },
]

export function Home() {
  useTitle('নবম-দশম গণিত')
  const { mcqs, getChapter } = useCatalog()
  const question = useMemo(() => {
    const now = new Date()
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
    return mcqs[seed % mcqs.length] ?? mcqs[0]
  }, [mcqs])
  const chapter = question ? getChapter(question.chapterId) : undefined
  const [picked, setPicked] = useState<number | null>(null)

  return (
    <div>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">এসএসসি · নবম–দশম শ্রেণি</p>
            <h1>সূত্র বোঝো, সমাধান দেখো, নিজে প্রশ্ন বানাও।</h1>
            <p className="lede">
              সতেরোটি অধ্যায়ের পাঠ, ধাপে ধাপে সমাধান, MCQ ও সৃজনশীল অনুশীলন। লগইন ছাড়াই পড়ো, ডাউনলোড করো, আর নিজের
              প্রশ্নপত্র তৈরি করো।
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/book/1">
                বই খুলো
              </Link>
              <Link className="btn btn-ghost" to="/mcq/1">
                MCQ শুরু করো
              </Link>
            </div>
          </div>
          {question && chapter ? (
            <aside className="hero-panel">
              <p className="eyebrow">আজকের প্রশ্ন · অধ্যায় {bn(chapter.id)}</p>
              <h2>{chapter.title}</h2>
              <p className="daily-q">
                <MathText text={question.question} />
              </p>
              <div className="daily-options">
                {question.options.map((option, index) => {
                  const locked = picked !== null
                  const state = !locked ? '' : index === question.answer ? 'right' : index === picked ? 'bad' : ''
                  return (
                    <button key={option} type="button" className={`option ${state}`} onClick={() => setPicked(index)} disabled={locked}>
                      <span>{optionKey(index)}</span>
                      <MathText text={option} />
                    </button>
                  )
                })}
              </div>
              {picked !== null ? (
                <p className="explain">
                  <MathText text={question.explanation} />
                </p>
              ) : null}
              <Link to={`/mcq/${chapter.id}`}>এই অধ্যায়ের সব MCQ</Link>
            </aside>
          ) : null}
        </div>
      </section>

      <section className="wrap page">
        <div className="section-head">
          <h2>এক নজরে</h2>
          <p>যে কাজের জন্য এসেছ, সেখান থেকেই শুরু করো।</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <Link key={feature.href} to={feature.href} className="feature">
              <span>{feature.kicker}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap page">
        <div className="section-head">
          <h2>অধ্যায়সমূহ</h2>
          <p>১৭টি অধ্যায়। নাম, ইংরেজি শিরোনাম বা নম্বর দিয়ে খুঁজতে পারো।</p>
        </div>
        <ChapterGrid
          hrefFor={(chapter) => `/book/${chapter.id}`}
          extra={(chapter) => (
            <>
              <Link to={`/book/${chapter.id}`}>পড়ো</Link>
              <Link to={`/solutions/${chapter.id}`}>সমাধান</Link>
              <Link to={`/mcq/${chapter.id}`}>MCQ</Link>
              <Link to={`/cq/${chapter.id}`}>CQ</Link>
            </>
          )}
        />
      </section>
    </div>
  )
}
