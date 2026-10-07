import { useEffect, useState } from 'react'

type PdfItem = {
  id: string
  title: string
  chapterId: number
  kind: 'book' | 'solution' | 'other'
  filename: string
  size: number
}

export function UploadedPdfs({ chapterId, kinds }: { chapterId: number; kinds: string }) {
  const [files, setFiles] = useState<PdfItem[]>([])
  const [active, setActive] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let gone = false
    fetch(`/api/pdfs?chapterId=${chapterId}`)
      .then(async (response) => (response.ok ? response.json() : []))
      .then((data: PdfItem[]) => {
        if (gone) return
        const allowed = new Set(kinds.split(','))
        const list = Array.isArray(data) ? data.filter((item) => allowed.has(item.kind)) : []
        setFiles(list)
        setActive((current) => (list.some((item) => item.id === current) ? current : (list[0]?.id ?? '')))
        setFailed(false)
      })
      .catch(() => {
        if (!gone) setFailed(true)
      })
    return () => {
      gone = true
    }
  }, [chapterId, kinds])

  const current = files.find((item) => item.id === active)

  if (failed) return <p className="empty">PDF তালিকা লোড হয়নি।</p>
  if (files.length === 0) return <p className="empty">এই অধ্যায়ে এখনো কোনো PDF আপলোড হয়নি।</p>

  return (
    <div className="pdf-library">
      <div className="chips" role="tablist">
        {files.map((file) => (
          <button key={file.id} type="button" className={file.id === active ? 'chip on' : 'chip'} onClick={() => setActive(file.id)}>
            {file.title}
          </button>
        ))}
      </div>
      {current ? (
        <>
          <div className="file-actions">
            <span>{current.filename}</span>
            <a className="btn btn-primary" href={`/api/pdfs/${current.id}/file?download=1`}>
              ডাউনলোড
            </a>
          </div>
          <iframe className="pdf-frame" src={`/api/pdfs/${current.id}/file`} title={current.title} />
        </>
      ) : null}
    </div>
  )
}
