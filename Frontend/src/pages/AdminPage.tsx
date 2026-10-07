import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { adminCopy, readAdminLang, saveAdminLang, type AdminLang, type AdminText } from '../admin/copy'
import type { Chapter, Cq, Mcq, Strand, Worked } from '../data/types'
import { AdminError, adminLogin, adminRequest, clearAdminToken, readAdminToken, saveAdminToken } from '../lib/adminApi'
import { bn, pad } from '../lib/format'
import { useTitle } from '../useTitle'

type PdfItem = {
  id: string
  title: string
  chapterId: number
  kind: 'book' | 'solution' | 'other'
  filename: string
  size: number
}

type Tab = 'dashboard' | 'chapter' | 'mcq' | 'cq' | 'solution' | 'pdf'
type AdminTheme = 'light' | 'dark'
type IconName = 'board' | 'book' | 'mcq' | 'pen' | 'steps' | 'file' | 'sun' | 'moon'

const THEME_KEY = 'ankashala-admin-theme'

const kindKeys = { book: 'kindBook', solution: 'kindSolution', other: 'kindOther' } as const

export function AdminPage() {
  const [lang, setLang] = useState<AdminLang>(readAdminLang)
  const text = adminCopy[lang]
  const [token, setToken] = useState(readAdminToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<Tab>('dashboard')
  const [theme, setTheme] = useState<AdminTheme>(readAdminTheme)
  const [side, setSide] = useState(() => window.matchMedia('(min-width: 980px)').matches)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [mcqs, setMcqs] = useState<Mcq[]>([])
  const [cqs, setCqs] = useState<Cq[]>([])
  const [solutions, setSolutions] = useState<Worked[]>([])
  const [pdfs, setPdfs] = useState<PdfItem[]>([])
  const [filter, setFilter] = useState(0)

  useTitle(text.brandSub)

  function chooseLang(next: AdminLang) {
    saveAdminLang(next)
    setLang(next)
  }

  function chooseTheme(next: AdminTheme) {
    localStorage.setItem(THEME_KEY, next)
    setTheme(next)
  }

  function pick(next: Tab) {
    setTab(next)
    if (window.matchMedia('(max-width: 980px)').matches) setSide(false)
  }

  function explain(reason: unknown) {
    if (reason instanceof AdminError) {
      if (reason.code === 'invalid_login') return text.errors.invalid_login
      if (reason.code === 'admin_unconfigured') return text.errors.admin_unconfigured
      if (lang === 'bn' && reason.message) return reason.message
    }
    return text.errors.generic
  }

  async function enter(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const next = await adminLogin(email, password)
      saveAdminToken(next)
      setToken(next)
      setPassword('')
    } catch (reason) {
      setError(explain(reason))
    }
  }

  function leave() {
    clearAdminToken()
    setToken('')
  }

  function refresh() {
    return Promise.all([
      fetch('/api/chapters').then((response) => response.json()),
      fetch('/api/mcqs').then((response) => response.json()),
      fetch('/api/cqs').then((response) => response.json()),
      fetch('/api/solutions').then((response) => response.json()),
      fetch('/api/pdfs').then((response) => response.json()),
    ]).then(([nextChapters, nextMcqs, nextCqs, nextSolutions, nextPdfs]) => {
      setChapters(Array.isArray(nextChapters) ? nextChapters : [])
      setMcqs(Array.isArray(nextMcqs) ? nextMcqs : [])
      setCqs(Array.isArray(nextCqs) ? nextCqs : [])
      setSolutions(Array.isArray(nextSolutions) ? nextSolutions : [])
      setPdfs(Array.isArray(nextPdfs) ? nextPdfs : [])
    })
  }

  useEffect(() => {
    if (!token) return
    refresh().catch(() => setError(text.loadFailed))
  }, [token, text.loadFailed])

  async function remove(path: string, warning: string) {
    if (!window.confirm(warning)) return
    setError('')
    setNotice('')
    try {
      await adminRequest(path, token, { method: 'DELETE' })
      setNotice(text.deleted)
      await refresh()
    } catch (reason) {
      if (reason instanceof AdminError && reason.status === 401) leave()
      setError(explain(reason))
    }
  }

  async function send(path: string, body: object | FormData) {
    setError('')
    setNotice('')
    try {
      const file = body instanceof FormData
      await adminRequest(path, token, { method: 'POST', body: file ? body : JSON.stringify(body) })
      setNotice(text.saved)
      await refresh()
      return true
    } catch (reason) {
      if (reason instanceof AdminError && reason.status === 401) leave()
      setError(explain(reason))
      return false
    }
  }

  const names = useMemo(() => new Map(chapters.map((chapter) => [chapter.id, chapter.title])), [chapters])
  const visibleMcq = mcqs.filter((item) => filter === 0 || item.chapterId === filter)
  const visibleCq = cqs.filter((item) => filter === 0 || item.chapterId === filter)
  const visibleSolutions = solutions.filter((item) => filter === 0 || item.chapterId === filter)
  const visiblePdfs = pdfs.filter((item) => filter === 0 || item.chapterId === filter)
  const nav: { id: Tab; label: string; count?: number; icon: IconName }[] = [
    { id: 'dashboard', label: text.dashboard, icon: 'board' },
    { id: 'chapter', label: text.chapters, count: chapters.length, icon: 'book' },
    { id: 'mcq', label: text.mcq, count: mcqs.length, icon: 'mcq' },
    { id: 'cq', label: text.creative, count: cqs.length, icon: 'pen' },
    { id: 'solution', label: text.solutions, count: solutions.length, icon: 'steps' },
    { id: 'pdf', label: text.pdf, count: pdfs.length, icon: 'file' },
  ]
  const section = nav.find((item) => item.id === tab) ?? nav[0]
  const rootClass = `admin-root${theme === 'dark' ? ' is-dark' : ''}`

  if (!token) {
    return (
      <div className={rootClass}>
        <div className="admin-gate">
        <form className="admin-card" onSubmit={enter}>
          <div className="admin-card-top">
            <div>
              <p className="eyebrow">{text.brand}</p>
              <h1>{text.loginTitle}</h1>
            </div>
            <div className="admin-tools">
              <ThemeSwitch theme={theme} light={text.light} dark={text.dark} onChange={chooseTheme} />
              <LangSwitch lang={lang} onChange={chooseLang} />
            </div>
          </div>
          <p className="lede">{text.loginLead}</p>
          <label className="field">
            {text.email}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
          </label>
          <label className="field">
            {text.password}
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn btn-primary" type="submit">
            {text.signIn}
          </button>
        </form>
        </div>
      </div>
    )
  }

  return (
    <div className={`${rootClass} ${side ? 'admin-shell' : 'admin-shell is-closed'}`}>
      <aside className="admin-side" aria-hidden={!side}>
        <div className="admin-brand">
          <span>অ</span>
          <div>
            <strong>{text.brand}</strong>
            <small>{text.brandSub}</small>
          </div>
        </div>
        <nav className="admin-nav" aria-label={text.brandSub}>
          {nav.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? 'on' : ''} onClick={() => pick(item.id)}>
              <span className="admin-nav-label">
                <Icon name={item.icon} />
                {item.label}
              </span>
              {item.count == null ? <span /> : <b>{count(lang, item.count)}</b>}
            </button>
          ))}
        </nav>
        <div className="admin-side-foot">
          <LangSwitch lang={lang} onChange={chooseLang} />
          <ThemeSwitch theme={theme} light={text.light} dark={text.dark} onChange={chooseTheme} />
          <button type="button" className="admin-logout" onClick={leave}>
            {text.logout}
          </button>
        </div>
      </aside>

      <button type="button" className="admin-edge" aria-expanded={side} aria-label={side ? text.closeSidebar : text.openSidebar} onClick={() => setSide((value) => !value)}>
        <Chevron left={side} />
      </button>

      <main className="admin-main">
        <header className="admin-top">
          <div>
            <p className="eyebrow">{text.brandSub}</p>
            <h1>
              {section.label}
              {section.count == null ? null : <span>{count(lang, section.count)}</span>}
            </h1>
            <p className="lede">{lead(text, tab)}</p>
          </div>
        </header>
        {notice ? <p className="hint">{notice}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {tab === 'dashboard' ? (
          <Dashboard
            lang={lang}
            text={text}
            chapters={chapters}
            cards={nav.filter((item) => item.id !== 'dashboard')}
            onOpen={pick}
          />
        ) : null}

        {tab === 'dashboard' ? null : (
        <section className="admin-work">
          {tab === 'chapter' ? <ChapterForm text={text} onSubmit={(body) => send('/api/admin/chapters', body)} /> : null}
          {tab === 'mcq' ? <McqForm text={text} lang={lang} chapters={chapters} onSubmit={(body) => send('/api/admin/mcqs', body)} /> : null}
          {tab === 'cq' ? <CqForm text={text} lang={lang} chapters={chapters} onSubmit={(body) => send('/api/admin/cqs', body)} /> : null}
          {tab === 'solution' ? <SolutionForm text={text} lang={lang} chapters={chapters} onSubmit={(body) => send('/api/admin/solutions', body)} /> : null}
          {tab === 'pdf' ? <PdfForm text={text} lang={lang} chapters={chapters} onSubmit={(body) => send('/api/admin/pdfs', body)} /> : null}

          <div className="admin-list">
            {tab !== 'chapter' ? (
              <label className="field">
                {text.filter}
                <select value={filter} onChange={(event) => setFilter(Number(event.target.value))}>
                  <option value={0}>{text.allChapters}</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {count(lang, chapter.id)}. {chapter.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <ItemList
              deleteLabel={text.delete}
              empty={emptyText(text, tab)}
              rows={rowsFor(tab, text, lang, chapters, visibleMcq, visibleCq, visibleSolutions, visiblePdfs, names)}
              onDelete={(id, warning) => remove(deletePath(tab, id), warning)}
            />
          </div>
        </section>
        )}
      </main>
    </div>
  )
}

function lead(text: AdminText, tab: Tab) {
  if (tab === 'dashboard') return text.dashboardLead
  if (tab === 'chapter') return text.chapterLead
  if (tab === 'mcq') return text.mcqLead
  if (tab === 'cq') return text.creativeLead
  if (tab === 'solution') return text.solutionLead
  return text.pdfLead
}

function readAdminTheme(): AdminTheme {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function Dashboard({
  lang,
  text,
  chapters,
  cards,
  onOpen,
}: {
  lang: AdminLang
  text: AdminText
  chapters: Chapter[]
  cards: { id: Tab; label: string; count?: number; icon: IconName }[]
  onOpen: (tab: Tab) => void
}) {
  const strands = [
    ['algebra', text.algebra],
    ['geometry', text.geometry],
    ['trig', text.trig],
    ['measure', text.measure],
  ] as const

  return (
    <div className="admin-board">
      <div className="admin-stats">
        {cards.map((card) => (
          <button key={card.id} type="button" className="admin-stat" onClick={() => onOpen(card.id)}>
            <span className="admin-stat-icon">
              <Icon name={card.icon} />
            </span>
            <strong>{count(lang, card.count ?? 0)}</strong>
            <em>{card.label}</em>
          </button>
        ))}
      </div>
      <div className="admin-strands">
        {strands.map(([id, label]) => (
          <article key={id}>
            <b>{count(lang, chapters.filter((chapter) => chapter.strand === id).length)}</b>
            <span>{label}</span>
          </article>
        ))}
      </div>
    </div>
  )
}

function emptyText(text: AdminText, tab: Tab) {
  if (tab === 'chapter') return text.emptyChapter
  if (tab === 'mcq') return text.emptyMcq
  if (tab === 'cq') return text.emptyCq
  if (tab === 'solution') return text.emptySolution
  return text.emptyPdf
}

function deletePath(tab: Tab, id: string) {
  if (tab === 'chapter') return `/api/admin/chapters/${id}`
  if (tab === 'mcq') return `/api/admin/mcqs/${id}`
  if (tab === 'cq') return `/api/admin/cqs/${id}`
  if (tab === 'solution') return `/api/admin/solutions/${id}`
  return `/api/admin/pdfs/${id}`
}

function rowsFor(
  tab: Tab,
  text: AdminText,
  lang: AdminLang,
  chapters: Chapter[],
  mcqs: Mcq[],
  cqs: Cq[],
  solutions: Worked[],
  pdfs: PdfItem[],
  names: Map<number, string>,
) {
  if (tab === 'chapter') {
    return chapters.map((chapter) => ({
      id: String(chapter.id),
      title: `${mark(lang, chapter.id)} ${chapter.title}`,
      meta: `${chapter.titleEn} · ${strandName(text, chapter.strand)}`,
      warning: text.deleteChapter.replace('{name}', chapter.title),
    }))
  }
  if (tab === 'mcq') {
    return mcqs.map((item) => ({
      id: item.id,
      title: item.question,
      meta: names.get(item.chapterId) ?? `${text.chapterField} ${count(lang, item.chapterId)}`,
      warning: text.deleteAsk,
    }))
  }
  if (tab === 'cq') {
    return cqs.map((item) => ({
      id: item.id,
      title: item.title,
      meta: names.get(item.chapterId) ?? `${text.chapterField} ${count(lang, item.chapterId)}`,
      warning: text.deleteAsk,
    }))
  }
  if (tab === 'solution') {
    return solutions.map((item) => ({
      id: item.id,
      title: item.title,
      meta: names.get(item.chapterId) ?? `${text.chapterField} ${count(lang, item.chapterId)}`,
      warning: text.deleteAsk,
    }))
  }
  return pdfs.map((item) => ({
    id: item.id,
    title: item.title,
    meta: `${names.get(item.chapterId) ?? text.chapterField} · ${text[kindKeys[item.kind]]}`,
    warning: text.deleteAsk,
  }))
}

function strandName(text: AdminText, strand: Strand) {
  if (strand === 'geometry') return text.geometry
  if (strand === 'trig') return text.trig
  if (strand === 'measure') return text.measure
  return text.algebra
}

function count(lang: AdminLang, value: number) {
  return lang === 'bn' ? bn(value) : String(value)
}

function mark(lang: AdminLang, value: number) {
  return lang === 'bn' ? pad(value) : String(value).padStart(2, '0')
}

function ThemeSwitch({ theme, light, dark, onChange }: { theme: AdminTheme; light: string; dark: string; onChange: (theme: AdminTheme) => void }) {
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button type="button" className="admin-theme" aria-label={theme === 'dark' ? light : dark} onClick={() => onChange(next)}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      <span>{theme === 'dark' ? light : dark}</span>
    </button>
  )
}

function Icon({ name }: { name: IconName }) {
  const pen = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      {name === 'board' ? (
        <>
          <rect {...pen} x="3" y="3" width="7.5" height="7.5" rx="1.6" />
          <rect {...pen} x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
          <rect {...pen} x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
          <rect {...pen} x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
        </>
      ) : null}
      {name === 'book' ? (
        <>
          <path {...pen} d="M4 5.5 A2 2 0 0 1 6 4 H20 V20 H6 A2 2 0 0 0 4 18.5 Z" />
          <path {...pen} d="M4 5.5 V18.5 A2 2 0 0 1 6 20" />
        </>
      ) : null}
      {name === 'mcq' ? (
        <>
          <circle {...pen} cx="12" cy="12" r="8" />
          <path {...pen} d="M8.5 12.2 L11 14.6 L15.8 9.4" />
        </>
      ) : null}
      {name === 'pen' ? (
        <>
          <path {...pen} d="M4 20 H20" />
          <path {...pen} d="M14.2 4.8 L19.2 9.8 L9 20 H4 V15 Z" />
        </>
      ) : null}
      {name === 'steps' ? (
        <>
          <path {...pen} d="M5 19 H19" />
          <path {...pen} d="M7 19 V14 H12 V9 H17 V5" />
        </>
      ) : null}
      {name === 'file' ? (
        <>
          <path {...pen} d="M7 3.5 H14 L19 8.5 V20.5 H7 Z" />
          <path {...pen} d="M14 3.5 V8.5 H19" />
          <path {...pen} d="M9.5 13 H16.5 M9.5 16.5 H14.5" />
        </>
      ) : null}
      {name === 'sun' ? (
        <>
          <circle {...pen} cx="12" cy="12" r="3.5" />
          <path {...pen} d="M12 3 V5.2 M12 18.8 V21 M3 12 H5.2 M18.8 12 H21 M5.6 5.6 L7.2 7.2 M16.8 16.8 L18.4 18.4 M18.4 5.6 L16.8 7.2 M7.2 16.8 L5.6 18.4" />
        </>
      ) : null}
      {name === 'moon' ? <path {...pen} d="M16 3.5 A8 8 0 1 0 20.5 14 6.2 6.2 0 0 1 16 3.5 Z" /> : null}
    </svg>
  )
}

function LangSwitch({ lang, onChange }: { lang: AdminLang; onChange: (lang: AdminLang) => void }) {
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <button type="button" className={lang === 'bn' ? 'on' : ''} onClick={() => onChange('bn')}>
        বাংলা
      </button>
      <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => onChange('en')}>
        English
      </button>
    </div>
  )
}

function Chevron({ left }: { left: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d={left ? 'M12 4 L6 10 L12 16' : 'M8 4 L14 10 L8 16'} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ItemList({
  rows,
  empty,
  deleteLabel,
  onDelete,
}: {
  rows: { id: string; title: string; meta: string; warning: string }[]
  empty: string
  deleteLabel: string
  onDelete: (id: string, warning: string) => void
}) {
  if (rows.length === 0) return <p className="empty">{empty}</p>
  return (
    <div className="admin-rows">
      {rows.map((row) => (
        <article key={row.id} className="admin-row">
          <div>
            <strong>{row.title}</strong>
            <p>{row.meta}</p>
          </div>
          <button type="button" className="btn btn-danger" onClick={() => onDelete(row.id, row.warning)}>
            {deleteLabel}
          </button>
        </article>
      ))}
    </div>
  )
}

function ChapterForm({ text, onSubmit }: { text: AdminText; onSubmit: (body: object) => Promise<boolean> }) {
  const [title, setTitle] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [strand, setStrand] = useState<Strand>('algebra')
  const [blurb, setBlurb] = useState('')
  const [topics, setTopics] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault()
        const ok = await onSubmit({ title, titleEn, strand, blurb, topics, notes })
        if (!ok) return
        setTitle('')
        setTitleEn('')
        setBlurb('')
        setTopics('')
        setNotes('')
      }}
    >
      <h2>{text.newChapter}</h2>
      <label className="field">
        {text.name}
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label className="field">
        {text.nameEn}
        <input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} required />
      </label>
      <label className="field">
        {text.strand}
        <select value={strand} onChange={(event) => setStrand(event.target.value as Strand)}>
          <option value="algebra">{text.algebra}</option>
          <option value="geometry">{text.geometry}</option>
          <option value="trig">{text.trig}</option>
          <option value="measure">{text.measure}</option>
        </select>
      </label>
      <label className="field">
        {text.blurb}
        <textarea value={blurb} onChange={(event) => setBlurb(event.target.value)} required />
      </label>
      <label className="field">
        {text.topics}
        <textarea value={topics} onChange={(event) => setTopics(event.target.value)} />
      </label>
      <label className="field">
        {text.notes}
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <button className="btn btn-saffron" type="submit">
        {text.addChapter}
      </button>
    </form>
  )
}

function McqForm({
  text,
  lang,
  chapters,
  onSubmit,
}: {
  text: AdminText
  lang: AdminLang
  chapters: Chapter[]
  onSubmit: (body: object) => Promise<boolean>
}) {
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? 1)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [answer, setAnswer] = useState(0)
  const [explanation, setExplanation] = useState('')

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault()
        const ok = await onSubmit({ chapterId, question, options, answer, explanation })
        if (!ok) return
        setQuestion('')
        setOptions(['', '', '', ''])
        setExplanation('')
      }}
    >
      <h2>{text.newMcq}</h2>
      <ChapterPick text={text} lang={lang} chapters={chapters} value={chapterId} onChange={setChapterId} />
      <label className="field">
        {text.question}
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} required />
      </label>
      {options.map((option, index) => (
        <label className="field" key={text.options[index]}>
          {text.option} {text.options[index]}
          <input
            value={option}
            onChange={(event) => setOptions((current) => current.map((item, place) => (place === index ? event.target.value : item)))}
            required
          />
        </label>
      ))}
      <label className="field">
        {text.correct}
        <select value={answer} onChange={(event) => setAnswer(Number(event.target.value))}>
          {text.options.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        {text.explanation}
        <textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} required />
      </label>
      <button className="btn btn-saffron" type="submit">
        {text.addMcq}
      </button>
    </form>
  )
}

function CqForm({
  text,
  lang,
  chapters,
  onSubmit,
}: {
  text: AdminText
  lang: AdminLang
  chapters: Chapter[]
  onSubmit: (body: object) => Promise<boolean>
}) {
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? 1)
  const [title, setTitle] = useState('')
  const [stimulus, setStimulus] = useState('')
  const [prompts, setPrompts] = useState(['', '', ''])
  const [solutions, setSolutions] = useState(['', '', ''])

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault()
        const ok = await onSubmit({
          chapterId,
          title,
          stimulus,
          kaPrompt: prompts[0],
          kaSolution: solutions[0],
          khaPrompt: prompts[1],
          khaSolution: solutions[1],
          gaPrompt: prompts[2],
          gaSolution: solutions[2],
        })
        if (!ok) return
        setTitle('')
        setStimulus('')
        setPrompts(['', '', ''])
        setSolutions(['', '', ''])
      }}
    >
      <h2>{text.newCq}</h2>
      <ChapterPick text={text} lang={lang} chapters={chapters} value={chapterId} onChange={setChapterId} />
      <label className="field">
        {text.title}
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label className="field">
        {text.stimulus}
        <textarea value={stimulus} onChange={(event) => setStimulus(event.target.value)} required />
      </label>
      {text.parts.map((part, index) => (
        <div key={part}>
          <label className="field">
            {part} {text.partQuestion}
            <textarea
              value={prompts[index]}
              onChange={(event) => setPrompts((current) => current.map((item, place) => (place === index ? event.target.value : item)))}
              required
            />
          </label>
          <label className="field">
            {part} {text.partSolution}
            <textarea
              value={solutions[index]}
              onChange={(event) => setSolutions((current) => current.map((item, place) => (place === index ? event.target.value : item)))}
              required
            />
          </label>
        </div>
      ))}
      <button className="btn btn-saffron" type="submit">
        {text.addCq}
      </button>
    </form>
  )
}

function SolutionForm({
  text,
  lang,
  chapters,
  onSubmit,
}: {
  text: AdminText
  lang: AdminLang
  chapters: Chapter[]
  onSubmit: (body: object) => Promise<boolean>
}) {
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? 1)
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [steps, setSteps] = useState('')
  const [answer, setAnswer] = useState('')

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault()
        const ok = await onSubmit({ chapterId, title, prompt, steps, answer })
        if (!ok) return
        setTitle('')
        setPrompt('')
        setSteps('')
        setAnswer('')
      }}
    >
      <h2>{text.newSolution}</h2>
      <ChapterPick text={text} lang={lang} chapters={chapters} value={chapterId} onChange={setChapterId} />
      <label className="field">
        {text.title}
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label className="field">
        {text.question}
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} required />
      </label>
      <label className="field">
        {text.steps}
        <textarea value={steps} onChange={(event) => setSteps(event.target.value)} required />
      </label>
      <label className="field">
        {text.answer}
        <input value={answer} onChange={(event) => setAnswer(event.target.value)} required />
      </label>
      <button className="btn btn-saffron" type="submit">
        {text.addSolution}
      </button>
    </form>
  )
}

function PdfForm({
  text,
  lang,
  chapters,
  onSubmit,
}: {
  text: AdminText
  lang: AdminLang
  chapters: Chapter[]
  onSubmit: (body: FormData) => Promise<boolean>
}) {
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? 1)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('book')
  const [file, setFile] = useState<File | null>(null)

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!file) return
        const body = new FormData()
        body.set('chapterId', String(chapterId))
        body.set('title', title)
        body.set('kind', kind)
        body.set('file', file)
        const ok = await onSubmit(body)
        if (!ok) return
        setTitle('')
        setFile(null)
        event.currentTarget.reset()
      }}
    >
      <h2>{text.newPdf}</h2>
      <ChapterPick text={text} lang={lang} chapters={chapters} value={chapterId} onChange={setChapterId} />
      <label className="field">
        {text.pdfName}
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={text.pdfNameHint} />
      </label>
      <label className="field">
        {text.pdfKind}
        <select value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="book">{text.kindBook}</option>
          <option value="solution">{text.kindSolution}</option>
          <option value="other">{text.kindOther}</option>
        </select>
      </label>
      <label className="field">
        {text.pdfFile}
        <input type="file" accept="application/pdf" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>
      <button className="btn btn-saffron" type="submit">
        {text.addPdf}
      </button>
    </form>
  )
}

function ChapterPick({
  text,
  lang,
  chapters,
  value,
  onChange,
}: {
  text: AdminText
  lang: AdminLang
  chapters: Chapter[]
  value: number
  onChange: (id: number) => void
}) {
  return (
    <label className="field">
      {text.chapterField}
      <select value={value} onChange={(event) => onChange(Number(event.target.value))} required>
        {chapters.map((chapter) => (
          <option key={chapter.id} value={chapter.id}>
            {count(lang, chapter.id)}. {chapter.title}
          </option>
        ))}
      </select>
    </label>
  )
}
