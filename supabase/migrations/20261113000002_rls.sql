-- Etapa 1 / Migração 2: regras de acesso (RLS) e permissões mínimas

-- Funções auxiliares ficam em um schema privado (não exposto pela API)
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Membro = usuário logado com perfil ativo
create function private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

-- Gestor ou admin (ativos)
create function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role in ('gestor', 'admin')
  );
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role = 'admin'
  );
$$;

revoke execute on function private.is_member() from public, anon;
revoke execute on function private.is_manager() from public, anon;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_member() to authenticated;
grant execute on function private.is_manager() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Permissões mínimas: nada para visitantes (anon); o resto passa pelas políticas abaixo
revoke all on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.courses to authenticated;
grant select, insert, update on public.categories to authenticated;
grant select, insert, update on public.links to authenticated;
grant select, insert, update, delete on public.link_courses to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select on public.link_clicks to authenticated;
grant insert (link_id, user_id) on public.link_clicks to authenticated;
grant select on public.audit_log to authenticated;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.categories enable row level security;
alter table public.links enable row level security;
alter table public.link_courses enable row level security;
alter table public.favorites enable row level security;
alter table public.link_clicks enable row level security;
alter table public.audit_log enable row level security;

-- profiles: cada um vê o próprio; gestor e admin veem todos; só admin altera
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_manager()));
create policy profiles_update on public.profiles for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- courses
create policy courses_select on public.courses for select to authenticated
  using ((select private.is_member()) and (active or (select private.is_admin())));
create policy courses_insert on public.courses for insert to authenticated
  with check ((select private.is_admin()));
create policy courses_update on public.courses for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- categories
create policy categories_select on public.categories for select to authenticated
  using ((select private.is_member()) and (active or (select private.is_admin())));
create policy categories_insert on public.categories for insert to authenticated
  with check ((select private.is_admin()));
create policy categories_update on public.categories for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- links
create policy links_select on public.links for select to authenticated
  using ((select private.is_member()) and (active or (select private.is_admin())));
create policy links_insert on public.links for insert to authenticated
  with check ((select private.is_admin()));
create policy links_update on public.links for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- link_courses
create policy link_courses_select on public.link_courses for select to authenticated
  using ((select private.is_member()));
create policy link_courses_insert on public.link_courses for insert to authenticated
  with check ((select private.is_admin()));
create policy link_courses_update on public.link_courses for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy link_courses_delete on public.link_courses for delete to authenticated
  using ((select private.is_admin()));

-- favorites: só os próprios
create policy favorites_select on public.favorites for select to authenticated
  using (user_id = (select auth.uid()) and (select private.is_member()));
create policy favorites_insert on public.favorites for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_member()));
create policy favorites_delete on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()) and (select private.is_member()));

-- link_clicks: cada membro registra só o próprio clique; gestor e admin consultam
create policy link_clicks_select on public.link_clicks for select to authenticated
  using ((select private.is_manager()));
create policy link_clicks_insert on public.link_clicks for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_member()));

-- audit_log: só leitura para gestor e admin (a escrita é feita pelo gatilho)
create policy audit_log_select on public.audit_log for select to authenticated
  using ((select private.is_manager()));
