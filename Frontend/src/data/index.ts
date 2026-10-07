import { chapters } from './chapters'
import { cqs } from './cq'
import { mcqs } from './mcq'
import { solutions } from './solutions'

for (const chapter of chapters) {
  const mcqCount = mcqs.filter((item) => item.chapterId === chapter.id).length
  const cqCount = cqs.filter((item) => item.chapterId === chapter.id).length
  const solutionCount = solutions.filter((item) => item.chapterId === chapter.id).length
  if (mcqCount !== 6 || cqCount !== 2 || solutionCount !== 3) {
    throw new Error(`অধ্যায় ${chapter.id}: MCQ ${mcqCount}, CQ ${cqCount}, সমাধান ${solutionCount}`)
  }
}

export { chapters, getChapter, strandLabel } from './chapters'
export { cqs } from './cq'
export { mcqs } from './mcq'
export { solutions } from './solutions'
