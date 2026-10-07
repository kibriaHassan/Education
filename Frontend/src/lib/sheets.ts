import type { Chapter, Cq, Mcq, Worked } from '../data/types'
import { bn, optionKey, pad } from './format'

export type FormulaBlock = { name: string; expr: string; note?: string }

export type Block =
  | { kind: 'lead'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'formulas'; items: FormulaBlock[] }
  | { kind: 'worked'; index: number; title: string; prompt: string; steps: string[]; answer: string }
  | { kind: 'callout'; title: string; text: string }
  | { kind: 'meta'; items: { label: string; value: string }[] }
  | { kind: 'mcq'; index: number; chapter: string; question: string; options: string[] }
  | {
      kind: 'cq'
      index: number
      chapter: string
      stimulus: string
      showSolution: boolean
      parts: { key: string; marks: number; prompt: string; solution: string }[]
    }
  | { kind: 'key'; title: string; lines: string[] }

export type SheetPage = {
  kicker: string
  title: string
  running: string
  blocks: Block[]
}

export type PaperInfo = {
  school: string
  exam: string
  minutes: number
  includeKey: boolean
}

function chunk<T>(items: T[], size: number) {
  const pages: T[][] = []
  for (let index = 0; index < items.length; index += size) pages.push(items.slice(index, index + size))
  return pages
}

function groupsOf<T>(items: T[], firstSize: number, restSize: number) {
  if (items.length === 0) return [] as T[][]
  const groups = [items.slice(0, firstSize)]
  for (let index = firstSize; index < items.length; index += restSize) {
    groups.push(items.slice(index, index + restSize))
  }
  return groups.filter((group) => group.length > 0)
}

export function bookPages(chapter: Chapter): SheetPage[] {
  const running = `অধ্যায় ${pad(chapter.id)}`
  return [
    {
      kicker: `${running} · ${chapter.titleEn}`,
      title: chapter.title,
      running,
      blocks: [
        { kind: 'lead', text: chapter.blurb },
        { kind: 'h2', text: 'এই অধ্যায়ে যা আছে' },
        { kind: 'bullets', items: chapter.topics },
        { kind: 'h2', text: 'খেয়াল রাখো' },
        { kind: 'bullets', items: chapter.notes },
      ],
    },
    {
      kicker: `${running} · সূত্র`,
      title: chapter.title,
      running,
      blocks: [
        { kind: 'h2', text: 'সূত্র' },
        { kind: 'formulas', items: chapter.formulas },
        { kind: 'h2', text: 'এক নজরে উদাহরণ' },
        {
          kind: 'worked',
          index: 1,
          title: 'নমুনা',
          prompt: chapter.spotlight.prompt,
          steps: chapter.spotlight.steps,
          answer: chapter.spotlight.answer,
        },
      ],
    },
  ]
}

function findChapter(chapters: Chapter[], id: number) {
  return chapters.find((chapter) => chapter.id === id)
}

export function allBookPages(chapters: Chapter[]) {
  const cover: SheetPage = {
    kicker: 'নবম–দশম শ্রেণি',
    title: 'গণিত পাঠ',
    running: 'অঙ্কশালা',
    blocks: [
      {
        kind: 'lead',
        text: 'সতেরোটি অধ্যায়ের সূত্র, খেয়াল রাখার কথা এবং একটি করে নমুনা। এনসিটিবি অধ্যায়ক্রম অনুসারে সাজানো অঙ্কশালার নিজস্ব পাঠ।',
      },
      { kind: 'h2', text: 'অধ্যায়সূচি' },
      { kind: 'bullets', items: chapters.map((chapter) => `${pad(chapter.id)}  ${chapter.title}`) },
    ],
  }
  return [cover, ...chapters.flatMap((chapter) => bookPages(chapter))]
}

export function solutionPages(chapter: Chapter, worked: Worked[]): SheetPage[] {
  const running = `সমাধান · অধ্যায় ${pad(chapter.id)}`
  let cursor = 0
  return chunk(worked, 2).map((group) => {
    const blocks: Block[] = group.map((item, index) => ({
      kind: 'worked' as const,
      index: cursor + index + 1,
      title: item.title,
      prompt: item.prompt,
      steps: item.steps,
      answer: item.answer,
    }))
    cursor += group.length
    return {
      kicker: chapter.titleEn,
      title: chapter.title,
      running,
      blocks,
    }
  })
}

function paperHead(info: PaperInfo, marks: number, note: string): Block[] {
  return [
    {
      kind: 'meta',
      items: [
        { label: 'শ্রেণি', value: 'নবম–দশম' },
        { label: 'বিষয়', value: 'গণিত' },
        { label: 'সময়', value: `${bn(info.minutes)} মিনিট` },
        { label: 'পূর্ণমান', value: bn(marks) },
      ],
    },
    { kind: 'p', text: 'নাম: ________________________    রোল: ____________' },
    { kind: 'callout', title: 'নির্দেশনা', text: note },
  ]
}

export function mcqPaper(questions: Mcq[], info: PaperInfo, chapters: Chapter[]): SheetPage[] {
  const marks = questions.length
  const groups = groupsOf(questions, 3, 4)
  let cursor = 0
  const pages: SheetPage[] = groups.map((group, pageIndex) => {
    const blocks: Block[] = [
      ...(pageIndex === 0 ? paperHead(info, marks, 'প্রতিটি প্রশ্নের মান ১। সঠিক উত্তরটি বাছাই করো।') : []),
      ...group.map((item, index) => {
        const chapter = findChapter(chapters, item.chapterId)
        return {
          kind: 'mcq' as const,
          index: cursor + index + 1,
          chapter: chapter ? `অধ্যায় ${pad(chapter.id)} · ${chapter.title}` : '',
          question: item.question,
          options: [...item.options],
        }
      }),
    ]
    cursor += group.length
    return {
      kicker: info.school.trim() || 'অঙ্কশালা',
      title: info.exam.trim() || 'MCQ প্রশ্নপত্র',
      running: 'বহুনির্বাচনি',
      blocks,
    }
  })

  if (info.includeKey && questions.length > 0) {
    pages.push({
      kicker: 'উত্তরপত্র',
      title: info.exam.trim() || 'MCQ প্রশ্নপত্র',
      running: 'উত্তর',
      blocks: [
        { kind: 'h2', text: 'সঠিক উত্তর' },
        {
          kind: 'key',
          title: 'MCQ',
          lines: questions.map((item, index) => `${bn(index + 1)}. ${optionKey(item.answer)}`),
        },
      ],
    })
  }

  return pages
}

export function cqPaper(questions: Cq[], info: PaperInfo, chapters: Chapter[]): SheetPage[] {
  const marks = questions.length * 10
  const pages: SheetPage[] = questions.map((item, index) => {
    const chapter = findChapter(chapters, item.chapterId)
    return {
      kicker: info.school.trim() || 'অঙ্কশালা',
      title: info.exam.trim() || 'সৃজনশীল প্রশ্নপত্র',
      running: 'সৃজনশীল',
      blocks: [
        ...(index === 0
          ? paperHead(info, marks, 'প্রতিটি প্রশ্নের পূর্ণমান ১০। ক = ২, খ = ৪, গ = ৪।')
          : []),
        {
          kind: 'cq',
          index: index + 1,
          chapter: chapter ? `অধ্যায় ${pad(chapter.id)} · ${chapter.title}` : '',
          stimulus: item.stimulus,
          showSolution: false,
          parts: item.parts.map((part) => ({ ...part })),
        },
      ],
    }
  })

  if (info.includeKey) {
    questions.forEach((item, index) => {
      const chapter = findChapter(chapters, item.chapterId)
      pages.push({
        kicker: 'সমাধান',
        title: info.exam.trim() || 'সৃজনশীল প্রশ্নপত্র',
        running: 'সমাধান',
        blocks: [
          {
            kind: 'cq',
            index: index + 1,
            chapter: chapter ? `অধ্যায় ${pad(chapter.id)} · ${chapter.title}` : '',
            stimulus: item.stimulus,
            showSolution: true,
            parts: item.parts.map((part) => ({ ...part })),
          },
        ],
      })
    })
  }

  return pages
}

export function chapterMcqPaper(questions: Mcq[], chapter: Chapter, withKey: boolean, chapters: Chapter[]) {
  return mcqPaper(
    questions,
    {
      school: 'অঙ্কশালা',
      exam: `${chapter.title} · MCQ`,
      minutes: Math.max(questions.length, 5),
      includeKey: withKey,
    },
    chapters,
  )
}

export function chapterCqPaper(questions: Cq[], chapter: Chapter, withSolution: boolean, chapters: Chapter[]) {
  return cqPaper(
    questions,
    {
      school: 'অঙ্কশালা',
      exam: `${chapter.title} · সৃজনশীল`,
      minutes: Math.max(questions.length * 15, 20),
      includeKey: withSolution,
    },
    chapters,
  )
}
