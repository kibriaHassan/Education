import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChapterJump, ChapterPager, SideChapters } from '../components/ChapterNav'
import { UploadedPdfs } from '../components/UploadedPdfs'
import { PdfViewer } from '../components/PdfViewer'
import { useCatalog } from '../catalog'
import { allBookPages, bookPages } from '../lib/sheets'
import { pad } from '../lib/format'
import { useTitle } from '../useTitle'
import { Missing } from './Missing'

export function BookPage() {
  const params = useParams()
  const { chapters, getChapter } = useCatalog()
  const chapter = getChapter(Number(params.chapterId ?? 1))
  const [tab, setTab] = useState<'guide' | 'upload' | 'file'>('guide')
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const pages = useMemo(() => (chapter ? bookPages(chapter) : []), [chapter])
  const wholeBook = useMemo(() => allBookPages(chapters), [chapters])

  useTitle(chapter ? chapter.title : 'গণিত বই')

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    }
  }, [fileUrl])

  if (!chapter) return <Missing />

  return (
    <div className="wrap page">
      <div className="page-head">
        <p className="eyebrow">গণিত বই</p>
        <h1>{chapter.title}</h1>
        <p className="lede">
          অধ্যায়ের সূত্র, খেয়াল রাখার কথা ও একটি নমুনা। পৃষ্ঠা ঘুরিয়ে পড়ো, অথবা PDF নাও। নিজের বইয়ের ফাইলও এখানে খোলা যায়—
          ফাইল ব্রাউজারেই থাকে।
        </p>
        <div className="tabs" role="tablist">
          <button type="button" className={tab === 'guide' ? 'on' : ''} onClick={() => setTab('guide')}>
            পাঠ
          </button>
          <button type="button" className={tab === 'upload' ? 'on' : ''} onClick={() => setTab('upload')}>
            আপলোড করা PDF
          </button>
          <button type="button" className={tab === 'file' ? 'on' : ''} onClick={() => setTab('file')}>
            নিজের PDF
          </button>
        </div>
      </div>

      {tab === 'upload' ? (
        <UploadedPdfs chapterId={chapter.id} kinds="book,other" />
      ) : tab === 'file' ? (
        <section className="pdf-drop">
          <label className="drop">
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                if (fileUrl) URL.revokeObjectURL(fileUrl)
                setFileName(file.name)
                setFileUrl(URL.createObjectURL(file))
              }}
            />
            <strong>PDF বেছে নাও</strong>
            <span>ফোন বা কম্পিউটার থেকে বইয়ের ফাইল খুলবে। সার্ভারে যায় না।</span>
          </label>
          {fileUrl ? (
            <>
              <div className="file-actions">
                <span>{fileName}</span>
                <a className="btn btn-primary" href={fileUrl} download={fileName}>
                  ডাউনলোড
                </a>
              </div>
              <iframe className="pdf-frame" src={fileUrl} title={fileName} />
            </>
          ) : (
            <p className="empty">এখনো কোনো ফাইল খোলা হয়নি।</p>
          )}
        </section>
      ) : (
        <>
          <ChapterJump base="/book" current={chapter.id} />
          <div className="reader">
            <SideChapters base="/book" current={chapter.id} />
            <PdfViewer
              pages={pages}
              filename={`অঙ্কশালা-অধ্যায়-${pad(chapter.id)}-${chapter.title}.pdf`}
              extras={[{ label: 'পুরো বই', filename: 'অঙ্কশালা-নবম-দশম-গণিত.pdf', pages: wholeBook }]}
            />
          </div>
          <ChapterPager base="/book" current={chapter.id} />
        </>
      )}
    </div>
  )
}
