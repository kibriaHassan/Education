import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { chapters as localChapters, cqs as localCqs, mcqs as localMcqs, solutions as localSolutions } from './data'
import type { Chapter, Cq, Mcq, Worked } from './data/types'

export type Catalog = {
  chapters: Chapter[]
  solutions: Worked[]
  mcqs: Mcq[]
  cqs: Cq[]
  source: 'mongodb' | 'local'
  getChapter: (id: number) => Chapter | undefined
}

const CatalogContext = createContext<Catalog | null>(null)

function buildCatalog(
  chapters: Chapter[],
  solutions: Worked[],
  mcqs: Mcq[],
  cqs: Cq[],
  source: Catalog['source'],
): Catalog {
  return {
    chapters,
    solutions,
    mcqs,
    cqs,
    source,
    getChapter: (id) => chapters.find((chapter) => chapter.id === id),
  }
}

const localCatalog = buildCatalog(localChapters, localSolutions, localMcqs, localCqs, 'local')

function isChapter(value: unknown): value is Chapter {
  if (!value || typeof value !== 'object') return false
  const chapter = value as Chapter
  return typeof chapter.id === 'number' && typeof chapter.title === 'string' && Array.isArray(chapter.formulas)
}

function readCatalog(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const data = value as { chapters?: unknown; solutions?: unknown; mcqs?: unknown; cqs?: unknown }
  if (!Array.isArray(data.chapters) || !data.chapters.every(isChapter)) return null
  if (!Array.isArray(data.solutions) || !Array.isArray(data.mcqs) || !Array.isArray(data.cqs)) return null
  if (data.chapters.length === 0) return null
  return buildCatalog(data.chapters, data.solutions as Worked[], data.mcqs as Mcq[], data.cqs as Cq[], 'mongodb')
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(localCatalog)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 4000)
    let active = true

    fetch('/api/catalog', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null
        return readCatalog(await response.json())
      })
      .then((remote) => {
        if (active && remote) setCatalog(remote)
      })
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(timer)
        if (active) setReady(true)
      })

    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [])

  const value = useMemo(() => catalog, [catalog])

  if (!ready) {
    return (
      <div className="wrap page">
        <p className="eyebrow">অঙ্কশালা</p>
        <h1>পাঠ লোড হচ্ছে</h1>
        <p className="lede">MongoDB যুক্ত থাকলে সেখান থেকে আসবে। না থাকলে সাইটের নিজের পাঠ খুলবে।</p>
      </div>
    )
  }

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const catalog = useContext(CatalogContext)
  if (!catalog) throw new Error('useCatalog অবশ্যই CatalogProvider-এর ভিতরে ডাকতে হবে।')
  return catalog
}
