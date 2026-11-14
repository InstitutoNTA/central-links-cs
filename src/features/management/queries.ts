import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { AuditEntry } from './describeChange'

export type Period = 7 | 30 | 90

export function useUsage(days: Period) {
  return useQuery({
    queryKey: ['usage', days],
    queryFn: async () => {
      const [overview, top, byCourse, byDay, byUser] = await Promise.all([
        supabase.rpc('usage_overview', { p_days: days }),
        supabase.rpc('usage_top_links', { p_days: days, p_limit: 10 }),
        supabase.rpc('usage_by_course', { p_days: days }),
        supabase.rpc('usage_by_day', { p_days: days }),
        supabase.rpc('usage_by_user', { p_days: days }),
      ])
      for (const r of [overview, top, byCourse, byDay, byUser]) if (r.error) throw r.error
      return {
        overview: overview.data?.[0] ?? { total_clicks: 0, active_users: 0, links_clicked: 0 },
        top: top.data ?? [],
        byCourse: byCourse.data ?? [],
        byDay: byDay.data ?? [],
        byUser: byUser.data ?? [],
      }
    },
  })
}

export const PAGE_SIZE = 50

/** Histórico em páginas de 50, do mais recente para o mais antigo. `table` vazio = tudo (sem vínculos de curso). */
export function useAuditLog(table: string) {
  return useInfiniteQuery({
    queryKey: ['audit', table],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let q = supabase.from('audit_log').select('*').order('changed_at', { ascending: false }).order('id', { ascending: false })
      q = table ? q.eq('table_name', table) : q.neq('table_name', 'link_courses')
      const { data, error } = await q.range(pageParam, pageParam + PAGE_SIZE - 1)
      if (error) throw error
      return data as AuditEntry[]
    },
    getNextPageParam: (last, pages) => (last.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE),
  })
}

/** Nomes de quem fez as alterações. */
export function useProfileNames() {
  return useQuery({
    queryKey: ['profile-names'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email')
      if (error) throw error
      return new Map(data.map((p) => [p.id, p.full_name?.trim() || p.email]))
    },
  })
}
