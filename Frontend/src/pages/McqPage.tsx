import { ChapterGrid } from '../components/ChapterGrid'
import { readScores } from '../lib/storage'
import { bn } from '../lib/format'
import { useTitle } from '../useTitle'

export function McqPage() {
  useTitle('MCQ')
  const scores = readScores()
  return (
    <div className="wrap page">
      <div className="page-head">
        <p className="eyebrow">বহুনির্বাচনি</p>
        <h1>অধ্যায়ভিত্তিক MCQ</h1>
        <p className="lede">প্রতি অধ্যায়ে ছয়টি প্রশ্ন। উত্তর বাছলেই সঠিকটি আর ব্যাখ্যা খুলে যায়। সেরা স্কোর এই ব্রাউজারেই থাকে।</p>
      </div>
      <ChapterGrid
        hrefFor={(chapter) => `/mcq/${chapter.id}`}
        info={(chapter) => {
          const score = scores[String(chapter.id)]
          return score ? `৬টি MCQ · সেরা ${bn(score.best)}/${bn(score.total)}` : '৬টি MCQ'
        }}
      />
    </div>
  )
}
