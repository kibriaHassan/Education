import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChapterJump, ChapterPager, SideChapters } from '../components/ChapterNav'
import { Modal } from '../components/Modal'
import { PdfViewer } from '../components/PdfViewer'
import { MathText } from '../components/RichText'
import { useCatalog } from '../catalog'
import type { Mcq } from '../data/types'
import { bn, byChapter, optionKey, pad, shuffle } from '../lib/format'
import { chapterMcqPaper, type SheetPage } from '../lib/sheets'
import { readScores, writeScore } from '../lib/storage'
import { useTitle } from '../useTitle'
import { Missing } from './Missing'

function freshQuiz(chapterId: number, bank: Mcq[]) {
  const order = shuffle(byChapter(bank, chapterId))
  return { chapterId, order, answers: Array<number | null>(order.length).fill(null) }
}

export function McqPractice() {
  const { chapters, mcqs, getChapter } = useCatalog()
  const params = useParams()
  const id = Number(params.chapterId)
  const chapter = getChapter(id)
  const bank = useMemo(() => byChapter(mcqs, id), [id, mcqs])
  const [cursor, setCursor] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [paper, setPaper] = useState<SheetPage[] | null>(null)
  const [paperName, setPaperName] = useState('প্রশ্নপত্র')
  const [best, setBest] = useState(() => readScores()[String(id)])
  const [quiz, setQuiz] = useState(() => freshQuiz(id, mcqs))
  if (quiz.chapterId !== id) {
    setQuiz(freshQuiz(id, mcqs))
    setCursor(0)
    setShowResult(false)
    setBest(readScores()[String(id)])
  }
  const order = quiz.order
  const answers = quiz.answers

  useTitle(chapter ? `${chapter.title} MCQ` : 'MCQ')

  const current = order[cursor]
  const chosen = answers[cursor] ?? null
  const score = answers.reduce<number>((sum, answer, index) => sum + (answer === order[index]?.answer ? 1 : 0), 0)
  const done = order.length > 0 && answers.every((answer) => answer !== null)

  function pick(option: number) {
    if (chosen !== null || !current) return
    const next = [...answers]
    next[cursor] = option
    setQuiz({ chapterId: id, order, answers: next })
    if (next.every((answer) => answer !== null) && chapter) {
      const total = next.reduce<number>((sum, answer, index) => sum + (answer === order[index]?.answer ? 1 : 0), 0)
      const saved = writeScore(chapter.id, total, order.length)
      setBest(saved)
      setShowResult(true)
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (event.key < '1' || event.key > '4') return
      pick(Number(event.key) - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function restart() {
    setQuiz(freshQuiz(id, mcqs))
    setCursor(0)
    setShowResult(false)
  }

  if (!chapter) return <Missing />

  return (
    <div className="wrap page">
      <div className="page-head">
        <p className="crumbs">
          <Link to="/mcq">MCQ</Link>
          <span>/</span>
          {chapter.title}
        </p>
        <h1>{chapter.title}</h1>
        <p className="lede">
          {bn(bank.length)}টি প্রশ্ন। ক, খ, গ, ঘ বা ১–৪ চাপো।
          {best ? ` সেরা স্কোর ${bn(best.best)}/${bn(best.total)}।` : ''}
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPaperName('প্রশ্নপত্র')
              setPaper(chapterMcqPaper(bank, chapter, false, chapters))
            }}
          >
            প্রশ্নপত্র PDF
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPaperName('উত্তরসহ')
              setPaper(chapterMcqPaper(bank, chapter, true, chapters))
            }}
          >
            উত্তরসহ PDF
          </button>
        </div>
      </div>
      <ChapterJump base="/mcq" current={chapter.id} />
      <div className="reader">
        <SideChapters base="/mcq" current={chapter.id} />
        {current ? (
          <section className="quiz">
            <div className="q-top">
              <span>
                প্রশ্ন {bn(cursor + 1)} / {bn(order.length)}
              </span>
              <span>স্কোর {bn(score)}</span>
            </div>
            <div className="q-progress" aria-hidden="true">
              <span style={{ width: `${((cursor + 1) / order.length) * 100}%` }} />
            </div>
            <h2>
              <MathText text={current.question} />
            </h2>
            <div className="quiz-options">
              {current.options.map((option, index) => {
                let state = ''
                if (chosen !== null && index === current.answer) state = 'right'
                else if (chosen !== null && index === chosen) state = 'bad'
                return (
                  <button key={option} type="button" className={`option ${state}`} onClick={() => pick(index)}>
                    <span>{optionKey(index)}</span>
                    <MathText text={option} />
                  </button>
                )
              })}
            </div>
            {chosen !== null ? (
              <p className="explain">
                <MathText text={current.explanation} />
              </p>
            ) : (
              <p className="hint">একটি উত্তর বাছো।</p>
            )}
            <div className="page-nav plain">
              <button type="button" onClick={() => setCursor((value) => Math.max(0, value - 1))} disabled={cursor === 0}>
                আগের প্রশ্ন
              </button>
              <button type="button" onClick={restart}>
                নতুন সেট
              </button>
              <button
                type="button"
                onClick={() => (done ? setShowResult(true) : setCursor((value) => Math.min(order.length - 1, value + 1)))}
                disabled={chosen === null}
              >
                {cursor === order.length - 1 || done ? 'ফলাফল' : 'পরের প্রশ্ন'}
              </button>
            </div>
          </section>
        ) : (
          <p className="empty">প্রশ্ন লোড হচ্ছে।</p>
        )}
      </div>
      <ChapterPager base="/mcq" current={chapter.id} />

      <Modal open={showResult} title="ফলাফল" onClose={() => setShowResult(false)}>
        <p className="score-line">
          {bn(score)} / {bn(order.length)}
        </p>
        <ul className="review">
          {order.map((item, index) => {
            const answer = answers[index]
            const ok = answer === item.answer
            return (
              <li key={item.id} className={ok ? 'ok' : 'no'}>
                <span>
                  {bn(index + 1)}. {ok ? 'ঠিক' : 'ভুল'} · সঠিক {optionKey(item.answer)}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={restart}>
            আবার চেষ্টা
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowResult(false)}>
            বন্ধ করো
          </button>
        </div>
      </Modal>

      <Modal open={paper !== null} title={paperName} onClose={() => setPaper(null)} wide>
        {paper ? (
          <PdfViewer pages={paper} filename={`অঙ্কশালা-MCQ-${pad(chapter.id)}-${chapter.title}.pdf`} />
        ) : null}
      </Modal>
    </div>
  )
}
