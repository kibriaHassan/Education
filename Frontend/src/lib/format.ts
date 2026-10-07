const digits = '০১২৩৪৫৬৭৮৯'

export function bn(value: number | string) {
  return String(value).replace(/\d/g, (digit) => digits[Number(digit)] ?? digit)
}

export function pad(id: number) {
  return bn(String(id).padStart(2, '0'))
}

export function optionKey(index: number) {
  return ['ক', 'খ', 'গ', 'ঘ'][index] ?? ''
}

export function shuffle<T>(list: T[]) {
  const items = [...list]
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = items[index]
    items[index] = items[swap] as T
    items[swap] = current as T
  }
  return items
}

export function byChapter<T extends { chapterId: number }>(items: T[], chapterId: number) {
  return items.filter((item) => item.chapterId === chapterId)
}
