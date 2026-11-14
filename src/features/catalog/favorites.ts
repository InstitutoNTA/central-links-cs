import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/useAuth'

/** Ids dos links favoritados pelo usuário logado (cada pessoa só enxerga os seus). */
export function useFavoriteIds() {
  const { session } = useAuth()
  const userId = session?.user.id
  return useQuery<string[]>({
    queryKey: ['favorites', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('favorites').select('link_id').eq('user_id', userId as string)
      if (error) throw error
      return data.map((f) => f.link_id)
    },
  })
}

export function useToggleFavorite() {
  const { session } = useAuth()
  const userId = session?.user.id
  const queryClient = useQueryClient()
  const key = ['favorites', userId]

  return useMutation({
    mutationFn: async ({ linkId, favorite }: { linkId: string; favorite: boolean }) => {
      if (!userId) throw new Error('Sem usuário')
      const { error } = favorite
        ? await supabase.from('favorites').insert({ link_id: linkId, user_id: userId })
        : await supabase.from('favorites').delete().eq('link_id', linkId).eq('user_id', userId)
      if (error) throw error
    },
    // Atualiza a estrela na hora e desfaz se o servidor recusar.
    onMutate: async ({ linkId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string[]>(key) ?? []
      const next = favorite ? [...new Set([...previous, linkId])] : previous.filter((id) => id !== linkId)
      queryClient.setQueryData(key, next)
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (ctx) queryClient.setQueryData(key, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

/** Registra o clique sem atrasar nem bloquear a abertura do link; falha de registro é ignorada. */
export function useTrackClick() {
  const { session } = useAuth()
  const userId = session?.user.id
  return useCallback(
    (linkId: string) => {
      if (!userId) return
      void Promise.resolve(supabase.from('link_clicks').insert({ link_id: linkId, user_id: userId })).catch(() => {})
    },
    [userId],
  )
}
