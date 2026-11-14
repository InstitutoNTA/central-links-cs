-- Etapa 1 / Migração 5: índice sugerido pela verificação de desempenho do Supabase.
create index if not exists links_created_by_idx on public.links (created_by);
