import '../../Frontend/src/data/index.ts'
import { chapters } from '../../Frontend/src/data/chapters.ts'
import { cqs } from '../../Frontend/src/data/cq.ts'
import { mcqs } from '../../Frontend/src/data/mcq.ts'
import { solutions } from '../../Frontend/src/data/solutions.ts'
import { connectDb } from './db.ts'
import { Chapter } from './models/Chapter.ts'
import { Cq } from './models/Cq.ts'
import { Mcq } from './models/Mcq.ts'
import { Solution } from './models/Solution.ts'

await connectDb()

await Chapter.deleteMany({})
await Solution.deleteMany({})
await Mcq.deleteMany({})
await Cq.deleteMany({})

await Chapter.insertMany(chapters)
await Solution.insertMany(solutions)
await Mcq.insertMany(mcqs)
await Cq.insertMany(cqs)

console.log(`সিড হয়েছে: অধ্যায় ${chapters.length}, সমাধান ${solutions.length}, MCQ ${mcqs.length}, সৃজনশীল ${cqs.length}`)
await Chapter.db.close()
