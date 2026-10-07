import { ChapterGrid } from '../components/ChapterGrid'
import { useTitle } from '../useTitle'

export function CqPage() {
  useTitle('সৃজনশীল')
  return (
    <div className="wrap page">
      <div className="page-head">
        <p className="eyebrow">সৃজনশীল প্রশ্ন</p>
        <h1>অধ্যায়ভিত্তিক CQ</h1>
        <p className="lede">প্রতি অধ্যায়ে দুটি উদ্দীপক। ক, খ, গ আলাদা, সমাধান চাইলেই খুলবে।</p>
      </div>
      <ChapterGrid hrefFor={(chapter) => `/cq/${chapter.id}`} info={() => '২টি সৃজনশীল · প্রতিটি ১০'} />
    </div>
  )
}
