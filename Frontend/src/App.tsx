import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminPage } from './pages/AdminPage'
import { BookPage } from './pages/BookPage'
import { CqPage } from './pages/CqPage'
import { CqReader } from './pages/CqReader'
import { GeneratorPage } from './pages/GeneratorPage'
import { Home } from './pages/Home'
import { McqPage } from './pages/McqPage'
import { McqPractice } from './pages/McqPractice'
import { Missing } from './pages/Missing'
import { SolutionReader } from './pages/SolutionReader'
import { SolutionsPage } from './pages/SolutionsPage'

export default function App() {
  return (
    <Routes>
      <Route path="admin" element={<AdminPage />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="book" element={<BookPage />} />
        <Route path="book/:chapterId" element={<BookPage />} />
        <Route path="solutions" element={<SolutionsPage />} />
        <Route path="solutions/:chapterId" element={<SolutionReader />} />
        <Route path="mcq" element={<McqPage />} />
        <Route path="mcq/:chapterId" element={<McqPractice />} />
        <Route path="cq" element={<CqPage />} />
        <Route path="cq/:chapterId" element={<CqReader />} />
        <Route path="generator" element={<GeneratorPage />} />
        <Route path="*" element={<Missing />} />
      </Route>
    </Routes>
  )
}
