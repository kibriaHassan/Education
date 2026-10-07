import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChapterJump, ChapterPager, SideChapters } from '../components/ChapterNav'
import { UploadedPdfs } from '../components/UploadedPdfs'
import { PdfViewer } from '../components/PdfViewer'
import { useCatalog } from '../catalog'
import { byChapter, pad } from '../lib/format'
import { solutionPages } from '../lib/sheets'
import { useTitle } from '../useTitle'
import { Missing } from './Missing'

export function SolutionReader() {
  const params = useParams()
  const { solutions, getChapter } = useCatalog()
  const chapter = getChapter(Number(params.chapterId))
  const worked = useMemo(() => (chapter ? byChapter(solutions, chapter.id) : []), [chapter, solutions])
  const pages = useMemo(() => (chapter ? solutionPages(chapter, worked) : []), [chapter, worked])

  useTitle(chapter ? `${chapter.title} সমাধান` : 'সমাধান')
  if (!chapter) return <Missing />

  return (
    <div className="wrap page">
      <div className="page-head">
        <p className="crumbs">
          <Link to="/solutions">সমাধান</Link>
          <span>/</span>
          {chapter.title}
        </p>
        <h1>{chapter.title}</h1>
        <p className="lede">{chapter.titleEn} · ধাপে ধাপে সমাধান পড়ো বা PDF নাও।</p>
      </div>
      <ChapterJump base="/solutions" current={chapter.id} />
      <div className="reader">
        <SideChapters base="/solutions" current={chapter.id} />
        <PdfViewer pages={pages} filename={`অঙ্কশালা-সমাধান-${pad(chapter.id)}-${chapter.title}.pdf`} />
      </div>
      <ChapterPager base="/solutions" current={chapter.id} />
      <section className="page-head">
        <h2>আপলোড করা সমাধান PDF</h2>
        <UploadedPdfs chapterId={chapter.id} kinds="solution" />
      </section>
    </div>
  )
}
