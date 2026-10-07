import { ChapterGrid } from '../components/ChapterGrid'
import { useTitle } from '../useTitle'

export function SolutionsPage() {
  useTitle('সমাধান')
  return (
    <div className="wrap page">
      <div className="page-head">
        <p className="eyebrow">অধ্যায়ভিত্তিক সমাধান</p>
        <h1>ধাপে ধাপে সমাধান</h1>
        <p className="lede">প্রতিটি অধ্যায়ে তিনটি কাজ। ধাপগুলো পৃষ্ঠায় দেখো, চাইলে PDF নাও।</p>
      </div>
      <ChapterGrid hrefFor={(chapter) => `/solutions/${chapter.id}`} info={() => '৩টি সমাধান'} />
    </div>
  )
}
