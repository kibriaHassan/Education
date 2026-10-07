import { useMemo, useState } from 'react'
import { PdfViewer } from '../components/PdfViewer'
import { useCatalog } from '../catalog'
import { bn, pad, shuffle } from '../lib/format'
import { cqPaper, mcqPaper, type SheetPage } from '../lib/sheets'
import { useTitle } from '../useTitle'

const presets = [5, 10, 15, 20]

export function GeneratorPage() {
  useTitle('প্রশ্ন জেনারেটর')
  const { chapters, cqs, mcqs } = useCatalog()
  const [kind, setKind] = useState<'mcq' | 'cq'>('mcq')
  const [selected, setSelected] = useState<number[]>(() => chapters.map((chapter) => chapter.id))
  const [count, setCount] = useState(10)
  const [school, setSchool] = useState('')
  const [exam, setExam] = useState('অনুশীলনী প্রশ্নপত্র')
  const [minutes, setMinutes] = useState(15)
  const [includeKey, setIncludeKey] = useState(true)
  const [paper, setPaper] = useState<SheetPage[] | null>(null)
  const [note, setNote] = useState('')

  const poolSize = useMemo(() => {
    const source = kind === 'mcq' ? mcqs : cqs
    return source.filter((item) => selected.includes(item.chapterId)).length
  }, [chapters, cqs, kind, mcqs, selected])

  function switchKind(next: 'mcq' | 'cq') {
    setKind(next)
    setPaper(null)
    setNote('')
    if (next === 'mcq') {
      setCount(10)
      setMinutes(15)
    } else {
      setCount(2)
      setMinutes(30)
    }
  }

  function toggle(id: number) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
    setPaper(null)
  }

  function generate() {
    if (selected.length === 0 || poolSize === 0) {
      setPaper(null)
      setNote('অন্তত একটি অধ্যায় বাছাই করো।')
      return
    }
    const info = {
      school,
      exam,
      minutes: Math.max(5, minutes),
      includeKey,
    }
    if (kind === 'mcq') {
      const picked = shuffle(mcqs.filter((item) => selected.includes(item.chapterId))).slice(0, count)
      setPaper(mcqPaper(picked, info, chapters))
      setNote(
        picked.length < count
          ? `ভাণ্ডারে ${bn(poolSize)}টি MCQ আছে, তাই ${bn(picked.length)}টি নেওয়া হয়েছে।`
          : `${bn(picked.length)}টি MCQ তৈরি হয়েছে।`,
      )
      return
    }
    const picked = shuffle(cqs.filter((item) => selected.includes(item.chapterId))).slice(0, count)
    setPaper(cqPaper(picked, info, chapters))
    setNote(
      picked.length < count
        ? `ভাণ্ডারে ${bn(poolSize)}টি সৃজনশীল প্রশ্ন আছে, তাই ${bn(picked.length)}টি নেওয়া হয়েছে।`
        : `${bn(picked.length)}টি সৃজনশীল প্রশ্ন তৈরি হয়েছে।`,
    )
  }

  return (
    <div className="wrap page">
      <div className="page-head">
        <p className="eyebrow">প্রশ্ন জেনারেটর</p>
        <h1>নিজের প্রশ্নপত্র বানাও</h1>
        <p className="lede">
          অধ্যায়, প্রশ্নের ধরন ও সংখ্যা বেছে নাও। তৈরি সেট পৃষ্ঠায় দেখা যাবে, PDFও নামাবে। প্রশ্ন এই সাইটের ভাণ্ডার থেকে
          এলোমেলো আসে।
        </p>
      </div>
      <div className="gen">
        <form
          className="gen-form"
          onSubmit={(event) => {
            event.preventDefault()
            generate()
          }}
        >
          <div className="mode-switch ink" role="group" aria-label="প্রশ্নের ধরন">
            <button type="button" className={kind === 'mcq' ? 'on' : ''} onClick={() => switchKind('mcq')}>
              MCQ
            </button>
            <button type="button" className={kind === 'cq' ? 'on' : ''} onClick={() => switchKind('cq')}>
              সৃজনশীল
            </button>
          </div>

          <label className="field">
            প্রতিষ্ঠানের নাম
            <input value={school} onChange={(event) => setSchool(event.target.value)} placeholder="ঐচ্ছিক" />
          </label>
          <label className="field">
            পরীক্ষার নাম
            <input value={exam} onChange={(event) => setExam(event.target.value)} />
          </label>
          <div className="split-fields">
            <label className="field">
              প্রশ্ন সংখ্যা
              <input
                type="number"
                min={1}
                max={poolSize || 1}
                value={count}
                onChange={(event) => setCount(Number(event.target.value) || 1)}
              />
            </label>
            <label className="field">
              সময় (মিনিট)
              <input
                type="number"
                min={5}
                max={180}
                value={minutes}
                onChange={(event) => setMinutes(Number(event.target.value) || 5)}
              />
            </label>
          </div>
          {kind === 'mcq' ? (
            <div className="chips">
              {presets.map((preset) => (
                <button key={preset} type="button" className={count === preset ? 'chip on' : 'chip'} onClick={() => setCount(preset)}>
                  {bn(preset)}
                </button>
              ))}
            </div>
          ) : null}
          <label className="check">
            <input type="checkbox" checked={includeKey} onChange={(event) => setIncludeKey(event.target.checked)} />
            {kind === 'mcq' ? 'উত্তরপত্র যোগ করো' : 'সমাধান যোগ করো'}
          </label>
          <p className="hint">এই নির্বাচনে {bn(poolSize)}টি প্রশ্ন আছে।</p>

          <div className="field">
            <div className="field-label">
              <span>অধ্যায়</span>
              <button type="button" className="text-btn" onClick={() => setSelected(chapters.map((chapter) => chapter.id))}>
                সব
              </button>
              <button type="button" className="text-btn" onClick={() => setSelected([])}>
                মুছে ফেলো
              </button>
            </div>
            <div className="chapter-picks">
              {chapters.map((chapter) => {
                const on = selected.includes(chapter.id)
                return (
                  <button key={chapter.id} type="button" className={on ? 'pick on' : 'pick'} onClick={() => toggle(chapter.id)}>
                    <span>{pad(chapter.id)}</span>
                    {chapter.title}
                  </button>
                )
              })}
            </div>
          </div>

          <button type="submit" className="btn btn-saffron">
            প্রশ্ন তৈরি করো
          </button>
          {note ? <p className="hint">{note}</p> : null}
        </form>

        <div>
          {paper ? (
            <PdfViewer pages={paper} filename={kind === 'mcq' ? 'অঙ্কশালা-MCQ-প্রশ্নপত্র.pdf' : 'অঙ্কশালা-সৃজনশীল-প্রশ্নপত্র.pdf'} />
          ) : (
            <div className="empty-panel">
              <p className="eyebrow">প্রিভিউ</p>
              <h2>এখনো প্রশ্নপত্র হয়নি</h2>
              <p>বাম পাশ থেকে অধ্যায় বেছে তৈরি করো। পৃষ্ঠা ঘুরিয়ে দেখতে পারবে, তারপর PDF নামাবে।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
