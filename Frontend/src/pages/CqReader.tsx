import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChapterJump, ChapterPager, SideChapters } from '../components/ChapterNav'
import { Modal } from '../components/Modal'
import { PdfViewer } from '../components/PdfViewer'
import { RichText } from '../components/RichText'
import { useCatalog } from '../catalog'
import { bn, byChapter, pad } from '../lib/format'
import { chapterCqPaper, type SheetPage } from '../lib/sheets'
import { useTitle } from '../useTitle'
import { Missing } from './Missing'

export function CqReader() {
  const params = useParams()
  const { chapters, cqs, getChapter } = useCatalog()
  const chapter = getChapter(Number(params.chapterId))
  const items = useMemo(() => (chapter ? byChapter(cqs, chapter.id) : []), [chapter, cqs])
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [paper, setPaper] = useState<SheetPage[] | null>(null)
  const [paperName, setPaperName] = useState('প্রশ্নপত্র')

  useTitle(chapter ? `${chapter.title} সৃজনশীল` : 'সৃজনশীল')
  if (!chapter) return <Missing />

  const allOpen = items.every((item) => item.parts.every((part) => open[`${item.id}-${part.key}`]))

  function toggleAll(show: boolean) {
    const next: Record<string, boolean> = {}
    if (show) {
      for (const item of items) {
        for (const part of item.parts) next[`${item.id}-${part.key}`] = true
      }
    }
    setOpen(next)
  }

  return (
    <div className="wrap page">
      <div className="page-head">
        <p className="crumbs">
          <Link to="/cq">সৃজনশীল</Link>
          <span>/</span>
          {chapter.title}
        </p>
        <h1>{chapter.title}</h1>
        <p className="lede">দুটি সৃজনশীল প্রশ্ন। সমাধান আলাদা করে খুলতে পারো।</p>
        <div className="hero-actions">
          <button type="button" className="btn btn-ghost" onClick={() => toggleAll(!allOpen)}>
            {allOpen ? 'সমাধান লুকাও' : 'সব সমাধান'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPaperName('প্রশ্নপত্র')
              setPaper(chapterCqPaper(items, chapter, false, chapters))
            }}
          >
            প্রশ্নপত্র PDF
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPaperName('সমাধানসহ')
              setPaper(chapterCqPaper(items, chapter, true, chapters))
            }}
          >
            সমাধানসহ PDF
          </button>
        </div>
      </div>
      <ChapterJump base="/cq" current={chapter.id} />
      <div className="reader">
        <SideChapters base="/cq" current={chapter.id} />
        <div className="cq-list">
          {items.map((item, index) => (
            <article key={item.id} className="cq-card">
              <p className="eyebrow">প্রশ্ন {bn(index + 1)} · ১০ নম্বর</p>
              <h2>{item.title}</h2>
              <div className="stimulus">
                <RichText text={item.stimulus} />
              </div>
              {item.parts.map((part) => {
                const key = `${item.id}-${part.key}`
                const shown = open[key] ?? false
                return (
                  <section key={part.key} className="part">
                    <div className="part-top">
                      <p>
                        <b>{part.key}.</b> <RichText text={part.prompt} />
                      </p>
                      <span>{bn(part.marks)}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setOpen((state) => ({ ...state, [key]: !shown }))}
                    >
                      {shown ? 'সমাধান লুকাও' : 'সমাধান দেখো'}
                    </button>
                    {shown ? (
                      <div className="solution">
                        <RichText text={part.solution} />
                      </div>
                    ) : null}
                  </section>
                )
              })}
            </article>
          ))}
        </div>
      </div>
      <ChapterPager base="/cq" current={chapter.id} />
      <Modal open={paper !== null} title={paperName} onClose={() => setPaper(null)} wide>
        {paper ? <PdfViewer pages={paper} filename={`অঙ্কশালা-CQ-${pad(chapter.id)}-${chapter.title}.pdf`} /> : null}
      </Modal>
    </div>
  )
}
