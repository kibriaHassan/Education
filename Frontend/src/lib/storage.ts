export type Score = {
  best: number
  last: number
  total: number
}

const key = 'ankashala-mcq'

export function readScores(): Record<string, Score> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Record<string, Score>) : {}
  } catch {
    return {}
  }
}

export function writeScore(chapterId: number, last: number, total: number) {
  const all = readScores()
  const previous = all[String(chapterId)]
  const next: Score = {
    last,
    total,
    best: Math.max(previous?.best ?? 0, last),
  }
  all[String(chapterId)] = next
  localStorage.setItem(key, JSON.stringify(all))
  return next
}
