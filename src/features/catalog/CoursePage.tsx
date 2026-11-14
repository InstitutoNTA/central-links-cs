import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CategoryChips, EmptyNote, GroupedLinks, MecLink, SearchBox } from './components'
import { filterLinks, groupByCategory, linksForCourse, mecFor } from './filters'
import { useCategories, useCourses, useLinks } from './queries'

export function CoursePage() {
  const { slug } = useParams()
  const courses = useCourses()
  const categories = useCategories()
  const links = useLinks()
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const course = courses.data?.find((c) => c.slug === slug)
  const allLinks = useMemo(() => links.data ?? [], [links.data])
  const cats = useMemo(() => categories.data ?? [], [categories.data])

  if (courses.isPending || links.isPending || categories.isPending) return <p role="status" className="text-sm text-slate-400">Carregando…</p>
  if (courses.isError || links.isError || categories.isError) return <p role="alert" className="text-sm text-vermelho">Não foi possível carregar os dados. Atualize a página.</p>
  if (!course) {
    return (
      <div className="space-y-3">
        <p className="text-slate-300">Curso não encontrado.</p>
        <Link to="/" className="text-sm text-azul hover:underline">Voltar ao início</Link>
      </div>
    )
  }

  const courseLinks = linksForCourse(allLinks, course.id)
  const shown = filterLinks(courseLinks, { query, categoryId })

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-azul hover:underline">← Início</Link>
      <header className="rounded-xl border border-grafite-700 bg-grafite-900 p-5" style={{ borderLeft: `4px solid ${course.color}` }}>
        <h1 className="text-2xl font-semibold text-slate-100">{course.name}</h1>
        <div className="mt-1.5">
          <MecLink mec={mecFor(allLinks, course.id)} />
        </div>
      </header>
      <div className="space-y-3">
        <SearchBox value={query} onChange={setQuery} />
        <CategoryChips categories={cats} value={categoryId} onChange={setCategoryId} />
      </div>
      {courseLinks.length === 0 ? (
        <EmptyNote>Este curso ainda não tem links cadastrados.</EmptyNote>
      ) : shown.length === 0 ? (
        <EmptyNote>Nenhum link encontrado com esse filtro.</EmptyNote>
      ) : (
        <GroupedLinks groups={groupByCategory(shown, cats)} />
      )}
    </div>
  )
}
