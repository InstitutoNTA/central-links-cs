import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { CatalogLink, Category, Course } from './filters'

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('active', true)
        .order('sort_order')
        .order('name')
      if (error) throw error
      return data
    },
  })
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort_order')
        .order('name')
      if (error) throw error
      return data
    },
  })
}

export function useLinks() {
  return useQuery<CatalogLink[]>({
    queryKey: ['links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('links')
        .select('*, link_courses(course_id)')
        .eq('active', true)
        .order('sort_order')
        .order('title')
      if (error) throw error
      return data as CatalogLink[]
    },
  })
}
