import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Enums, Tables, TablesInsert, TablesUpdate } from '../../types/database.types'
import type { CatalogLink } from '../catalog/filters'

/** O administrador enxerga também os itens desativados (a RLS permite só para ele). */
export function useAdminLinks() {
  return useQuery<CatalogLink[]>({
    queryKey: ['admin', 'links'],
    queryFn: async () => {
      const { data, error } = await supabase.from('links').select('*, link_courses(course_id)').order('title')
      if (error) throw error
      return data as CatalogLink[]
    },
  })
}

export function useAdminCategories() {
  return useQuery<Tables<'categories'>[]>({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order').order('name')
      if (error) throw error
      return data
    },
  })
}

export function useAdminCourses() {
  return useQuery<Tables<'courses'>[]>({
    queryKey: ['admin', 'courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').order('sort_order').order('name')
      if (error) throw error
      return data
    },
  })
}

export function useAdminUsers() {
  return useQuery<Tables<'profiles'>[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('email')
      if (error) throw error
      return data
    },
  })
}

/** Mutação do painel: ao salvar, atualiza o painel e o catálogo que todos veem. */
function useAdminMutation<V>(fn: (v: V) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all(
        ['admin', 'links', 'categories', 'courses'].map((k) => queryClient.invalidateQueries({ queryKey: [k] })),
      )
    },
  })
}

export interface SaveLinkVars {
  id: string | null
  title: string
  url: string
  description: string
  categoryId: string | null
  kind: Enums<'link_kind'>
  active: boolean
  courseIds: string[]
  weekday: number | null
  groupName: string | null
}

export function useSaveLink() {
  return useAdminMutation<SaveLinkVars>(async (v) => {
    const { error } = await supabase.rpc('admin_save_link', {
      p_id: v.id,
      p_title: v.title,
      p_url: v.url,
      p_description: v.description,
      p_category_id: v.categoryId,
      p_kind: v.kind,
      p_active: v.active,
      p_course_ids: v.courseIds,
      p_weekday: v.weekday,
      p_group_name: v.groupName,
    })
    if (error) throw error
  })
}

export function useSetLinkActive() {
  return useAdminMutation<{ id: string; active: boolean }>(async ({ id, active }) => {
    const { error } = await supabase.from('links').update({ active }).eq('id', id)
    if (error) throw error
  })
}

export function useSaveCategory() {
  return useAdminMutation<{ id: string | null; values: TablesInsert<'categories'> }>(async ({ id, values }) => {
    const { error } = id
      ? await supabase.from('categories').update(values as TablesUpdate<'categories'>).eq('id', id)
      : await supabase.from('categories').insert(values)
    if (error) throw error
  })
}

export function useSaveCourse() {
  return useAdminMutation<{ id: string | null; values: TablesInsert<'courses'> }>(async ({ id, values }) => {
    const { error } = id
      ? await supabase.from('courses').update(values as TablesUpdate<'courses'>).eq('id', id)
      : await supabase.from('courses').insert(values)
    if (error) throw error
  })
}

export function useUpdateUser() {
  return useAdminMutation<{ id: string; values: Pick<TablesUpdate<'profiles'>, 'full_name' | 'role' | 'active'> }>(async ({ id, values }) => {
    const { error } = await supabase.from('profiles').update(values).eq('id', id)
    if (error) throw error
  })
}
