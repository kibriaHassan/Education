export type Strand = 'algebra' | 'geometry' | 'trig' | 'measure'

export type Formula = {
  name: string
  expr: string
  note?: string
}

export type Spotlight = {
  prompt: string
  steps: string[]
  answer: string
}

export type Chapter = {
  id: number
  title: string
  titleEn: string
  strand: Strand
  blurb: string
  topics: string[]
  notes: string[]
  formulas: Formula[]
  spotlight: Spotlight
}

export type Worked = {
  id: string
  chapterId: number
  title: string
  prompt: string
  steps: string[]
  answer: string
}

export type Mcq = {
  id: string
  chapterId: number
  question: string
  options: [string, string, string, string]
  answer: 0 | 1 | 2 | 3
  explanation: string
}

export type CqPart = {
  key: 'ক' | 'খ' | 'গ'
  marks: 2 | 4
  prompt: string
  solution: string
}

export type Cq = {
  id: string
  chapterId: number
  title: string
  stimulus: string
  parts: [CqPart, CqPart, CqPart]
}
