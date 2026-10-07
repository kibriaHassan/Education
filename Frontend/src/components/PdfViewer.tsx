import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { bn } from '../lib/format'
import { downloadSheets } from '../lib/pdf'
import type { SheetPage } from '../lib/sheets'
import { Sheet } from './Sheet'

type Extra = {
  label: string
  filename: string
  pages: SheetPage[]
}

function waitFrames(count: number) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) resolve()
      else requestAnimationFrame(() => step(left - 1))
    }
    step(count)
  })
}

export function PdfViewer({
  pages,
  filename,
  extras = [],
}: {
  pages: SheetPage[]
  filename: string
  extras?: Extra[]
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'page' | 'flow'>(() => (window.innerWidth < 860 ? 'flow' : 'page'))
  const [index, setIndex] = useState(0)
  const [trackedPages, setTrackedPages] = useState(pages)
  if (trackedPages !== pages) {
    setTrackedPages(pages)
    setIndex(0)
  }
  const [zoom, setZoom] = useState(1)
  const [fit, setFit] = useState(1)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [pack, setPack] = useState<SheetPage[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const node = stageRef.current
    if (!node || mode === 'flow') return
    const apply = () => setFit(Math.min(1, (node.clientWidth - 28) / 794))
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(node)
    return () => observer.disconnect()
  }, [mode, pages])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (mode !== 'page') return
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(pages.length - 1, value + 1))
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, pages.length])

  const current = pages[Math.min(index, Math.max(pages.length - 1, 0))]
  const scale = fit * zoom

  async function save(target: SheetPage[], name: string) {
    if (busy || target.length === 0) return
    setError(null)
    setBusy(true)
    setProgress('প্রস্তুত হচ্ছে')
    flushSync(() => setPack(target))
    try {
      await document.fonts.ready
      await waitFrames(2)
      const nodes = Array.from(exportRef.current?.querySelectorAll<HTMLElement>('.sheet') ?? [])
      if (nodes.length === 0) throw new Error('empty')
      await downloadSheets(nodes, name, (done, total) => setProgress(`পৃষ্ঠা ${bn(done)} / ${bn(total)}`))
    } catch {
      setError('PDF তৈরি হয়নি। আরেকবার চেষ্টা করো।')
    } finally {
      setPack(null)
      setBusy(false)
      setProgress(null)
    }
  }

  if (!current) {
    return <p className="empty">দেখানোর মতো পৃষ্ঠা নেই।</p>
  }

  return (
    <div className="viewer">
      <div className="viewer-bar">
        <div className="mode-switch" role="group" aria-label="পড়ার ধরন">
          <button type="button" className={mode === 'page' ? 'on' : ''} onClick={() => setMode('page')}>
            পৃষ্ঠা
          </button>
          <button type="button" className={mode === 'flow' ? 'on' : ''} onClick={() => setMode('flow')}>
            প্রবাহ
          </button>
        </div>
        {mode === 'page' ? (
          <div className="zoom-tools">
            <button type="button" onClick={() => setZoom((value) => Math.max(1, Number((value - 0.15).toFixed(2))))} aria-label="ছোট করো">
              −
            </button>
            <span>{bn(Math.round(scale * 100))}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(2.4, Number((value + 0.15).toFixed(2))))} aria-label="বড় করো">
              +
            </button>
          </div>
        ) : (
          <span className="bar-note">পড়তে সুবিধা হয়</span>
        )}
        <div className="bar-actions">
          <button type="button" onClick={() => stageRef.current?.requestFullscreen?.()} disabled={mode === 'flow'}>
            পূর্ণ পর্দা
          </button>
          {extras.map((extra) => (
            <button key={extra.label} type="button" onClick={() => save(extra.pages, extra.filename)} disabled={busy}>
              {extra.label}
            </button>
          ))}
          <button type="button" className="bar-solid" onClick={() => save(pages, filename)} disabled={busy}>
            PDF ডাউনলোড
          </button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {mode === 'page' ? (
        <>
          <div
            className="viewer-stage"
            ref={stageRef}
            onTouchStart={(event) => {
              stageRef.current?.setAttribute('data-x', String(event.changedTouches[0]?.clientX ?? 0))
            }}
            onTouchEnd={(event) => {
              const start = Number(stageRef.current?.getAttribute('data-x') ?? 0)
              const delta = (event.changedTouches[0]?.clientX ?? 0) - start
              if (delta < -48) setIndex((value) => Math.min(pages.length - 1, value + 1))
              if (delta > 48) setIndex((value) => Math.max(0, value - 1))
            }}
          >
            <div className="sheet-scale" style={{ width: 794 * scale, height: 1123 * scale }}>
              <div className="sheet-scale-inner" style={{ transform: `scale(${scale})` }}>
                <Sheet page={current} pageNo={index + 1} total={pages.length} />
              </div>
            </div>
          </div>
          <div className="page-nav">
            <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
              আগের পৃষ্ঠা
            </button>
            <span>
              পৃষ্ঠা {bn(index + 1)} / {bn(pages.length)}
            </span>
            <button
              type="button"
              onClick={() => setIndex((value) => Math.min(pages.length - 1, value + 1))}
              disabled={index >= pages.length - 1}
            >
              পরের পৃষ্ঠা
            </button>
          </div>
        </>
      ) : (
        <div className="flow-stack" ref={stageRef}>
          {pages.map((page, pageIndex) => (
            <Sheet key={`${page.title}-${pageIndex}`} page={page} pageNo={pageIndex + 1} total={pages.length} flow />
          ))}
        </div>
      )}

      {pack ? (
        <div className="overlay" role="status">
          <div className="overlay-card">
            <p>PDF তৈরি হচ্ছে</p>
            <strong>{progress}</strong>
          </div>
          <div className="export-root" ref={exportRef}>
            {pack.map((page, pageIndex) => (
              <Sheet key={`${page.running}-${pageIndex}`} page={page} pageNo={pageIndex + 1} total={pack.length} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
