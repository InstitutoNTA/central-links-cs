import { useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { CategoryChips, CourseCard, EmptyNote, GroupedLinks, LinkItem, LiveClasses, SearchBox } from '../catalog/components'
import { filterLinks, generalLinks, groupByCategory, linksForCourse, liveClassesByDay, mecFor, platformFor, todayWeekday } from '../catalog/filters'
import { useFavoriteIds } from '../catalog/favorites'
import { useCategories, useCourses, useLinks } from '../catalog/queries'

export function HomePage() {
  const { profile } = useAuth()
  const firstName = (profile?.full_name?.trim() || profile?.email || '').split(/[\s@]/)[0]
  const courses = useCourses()
  const categories = useCategories()
  const links = useLinks()
  const favoriteIds = useFavoriteIds()
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const allLinks = useMemo(() => links.data ?? [], [links.data])
  const cats = useMemo(() => categories.data ?? [], [categories.data])
  const searching = query.trim() !== '' || categoryId !== null
  const results = useMemo(() => filterLinks(allLinks, { query, categoryId }), [allLinks, query, categoryId])
  const general = useMemo(() => filterLinks(generalLinks(allLinks), { categoryId }), [allLinks, categoryId])
  const liveClasses = useMemo(() => liveClassesByDay(allLinks), [allLinks])
  const favoriteLinks = useMemo(() => allLinks.filter((l) => favoriteIds.data?.includes(l.id)), [allLinks, favoriteIds.data])
  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name

  const failed = courses.isError || categories.isError || links.isError
  const loading = courses.isPending || categories.isPending || links.isPending

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">Olá, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-400">Encontre rapidamente os acessos do dia a dia do time de CS.</p>
      </header>

      <div className="space-y-3">
        <SearchBox value={query} onChange={setQuery} />
        <CategoryChips categories={cats} value={categoryId} onChange={setCategoryId} />
      </div>

      {failed && <p role="alert" className="text-sm text-vermelho">Não foi possível carregar os dados. Atualize a página.</p>}
      {loading && !failed && <p role="status" className="text-sm text-slate-400">Carregando…</p>}

      {!loading && !failed && searching && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-slate-100">Resultados ({results.length})</h2>
          {results.length === 0 ? (
            <EmptyNote>Nenhum link encontrado. Tente outras palavras.</EmptyNote>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((l) => (
                <LinkItem key={l.id} link={l} categoryName={catName(l.category_id)} />
              ))}
            </ul>
          )}
        </section>
      )}

      {!loading && !failed && !searching && (
        <>
          {favoriteLinks.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-medium text-slate-100">Meus favoritos</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteLinks.map((l) => (
                  <LinkItem key={l.id} link={l} categoryName={catName(l.category_id)} />
                ))}
              </ul>
            </section>
          )}

          {liveClasses.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-medium text-slate-100">Aulas ao vivo</h2>
              <LiveClasses groups={liveClasses} today={todayWeekday()} />
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-medium text-slate-100">Cursos</h2>
            {(courses.data ?? []).length === 0 ? (
              <EmptyNote>Nenhum curso cadastrado.</EmptyNote>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {courses.data!.map((c) => (
                  <CourseCard key={c.id} course={c} platform={platformFor(allLinks, c.id)} mec={mecFor(allLinks, c.id)} count={linksForCourse(allLinks, c.id).length} />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium text-slate-100">Links gerais</h2>
            {general.length === 0 ? (
              <EmptyNote>Ainda não há links gerais cadastrados.</EmptyNote>
            ) : (
              <GroupedLinks groups={groupByCategory(general, cats)} />
            )}
          </section>
        </>
      )}
    </div>
  )
}
