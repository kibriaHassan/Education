import { Link, useNavigate } from 'react-router-dom'
import { useCatalog } from '../catalog'
import { bn, pad } from '../lib/format'

export function ChapterJump({ base, current }: { base: string; current: number }) {
  const { chapters } = useCatalog()
  const navigate = useNavigate()
  return (
    <label className="jump">
      <span>অধ্যায়</span>
      <select value={current} onChange={(event) => navigate(`${base}/${event.target.value}`)}>
        {chapters.map((chapter) => (
          <option key={chapter.id} value={chapter.id}>
            {bn(chapter.id)}. {chapter.title}
          </option>
        ))}
      </select>
    </label>
  )
}

export function SideChapters({ base, current }: { base: string; current: number }) {
  const { chapters } = useCatalog()
  return (
    <aside className="side">
      <p>সতেরোটি অধ্যায়</p>
      <div className="side-list">
        {chapters.map((chapter) => (
          <Link key={chapter.id} to={`${base}/${chapter.id}`} className={chapter.id === current ? 'on' : ''}>
            <span>{pad(chapter.id)}</span>
            {chapter.title}
          </Link>
        ))}
      </div>
    </aside>
  )
}

export function ChapterPager({ base, current }: { base: string; current: number }) {
  const { chapters } = useCatalog()
  const previous = chapters.find((chapter) => chapter.id === current - 1)
  const next = chapters.find((chapter) => chapter.id === current + 1)
  return (
    <div className="chapter-pager">
      {previous ? <Link to={`${base}/${previous.id}`}>← {previous.title}</Link> : <span />}
      {next ? <Link to={`${base}/${next.id}`}>{next.title} →</Link> : <span />}
    </div>
  )
}
