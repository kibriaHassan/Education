import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { strandLabel } from '../data'
import { useCatalog } from '../catalog'
import type { Chapter, Strand } from '../data/types'
import { bn, pad } from '../lib/format'

function hasTerm(field: string, term: string) {
  let from = 0
  while (from < field.length) {
    const index = field.indexOf(term, from)
    if (index < 0) return false
    const before = index > 0 ? field[index - 1] : ''
    if (!before || !/[\u0980-\u09FF]/.test(before)) return true
    from = index + 1
  }
  return false
}

const filters: { id: 'all' | Strand; title: string }[] = [
  { id: 'all', title: 'সব' },
  { id: 'algebra', title: 'বীজগণিত' },
  { id: 'geometry', title: 'জ্যামিতি' },
  { id: 'trig', title: 'ত্রিকোণমিতি' },
  { id: 'measure', title: 'পরিমাপ ও উপাত্ত' },
]

export function ChapterGrid({
  hrefFor,
  info,
  extra,
}: {
  hrefFor: (chapter: Chapter) => string
  info?: (chapter: Chapter) => string
  extra?: (chapter: Chapter) => ReactNode
}) {
  const { chapters } = useCatalog()
  const [query, setQuery] = useState('')
  const [strand, setStrand] = useState<(typeof filters)[number]['id']>('all')

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    return chapters.filter((chapter) => {
      if (strand !== 'all' && chapter.strand !== strand) return false
      if (!text) return true
      const fields = [chapter.title, chapter.titleEn, chapter.blurb, String(chapter.id), bn(chapter.id), ...chapter.topics]
      return fields.some((field) => hasTerm(field.toLowerCase(), text))
    })
  }, [chapters, query, strand])

  return (
    <div>
      <div className="toolbar">
        <label className="search">
          <span className="sr">অধ্যায় খোঁজো</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="অধ্যায় খোঁজো, যেমন বৃত্ত বা ৮"
          />
        </label>
        <div className="chips" role="group" aria-label="ধরন">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={strand === filter.id ? 'chip on' : 'chip'}
              onClick={() => setStrand(filter.id)}
            >
              {filter.title}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="empty">এই খোঁজে কোনো অধ্যায় মেলেনি।</p>
      ) : (
        <div className="chapter-grid">
          {visible.map((chapter) => (
            <article key={chapter.id} className="chapter-card">
              <div className="card-top">
                <span className="chapter-num">{pad(chapter.id)}</span>
                <span className={`strand strand-${chapter.strand}`}>{strandLabel[chapter.strand]}</span>
              </div>
              <h3>
                <Link to={hrefFor(chapter)}>{chapter.title}</Link>
              </h3>
              <p className="en">{chapter.titleEn}</p>
              <p className="blurb">{chapter.blurb}</p>
              {info ? <p className="card-info">{info(chapter)}</p> : null}
              {extra ? <div className="card-links">{extra(chapter)}</div> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
