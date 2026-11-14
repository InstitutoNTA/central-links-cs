-- Etapa 1 / Migração 1: estrutura do banco da Central de Links CS
-- Nada é apagado de verdade: registros são desativados (active = false).

create type public.app_role as enum ('admin', 'gestor', 'colaborador');
create type public.link_kind as enum ('standard', 'mec');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Perfis (um por usuário do login). Novos usuários nascem INATIVOS: só veem algo depois que um admin ativa.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'colaborador',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 160),
  url text not null check (url ~* '^https://[^[:space:]]+$' and length(url) <= 2048),
  description text check (length(description) <= 500),
  category_id uuid references public.categories (id) on delete restrict,
  kind public.link_kind not null default 'standard',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index links_category_idx on public.links (category_id);
create index links_active_idx on public.links (active);

-- Um link pode valer para vários cursos. Sem nenhum curso = link geral.
create table public.link_courses (
  link_id uuid not null references public.links (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete restrict,
  primary key (link_id, course_id)
);
create index link_courses_course_idx on public.link_courses (course_id);

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  link_id uuid not null references public.links (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, link_id)
);
create index favorites_link_idx on public.favorites (link_id);

create table public.link_clicks (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.links (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  clicked_at timestamptz not null default now()
);
create index link_clicks_link_idx on public.link_clicks (link_id, clicked_at desc);
create index link_clicks_user_idx on public.link_clicks (user_id, clicked_at desc);
create index link_clicks_time_idx on public.link_clicks (clicked_at desc);

create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_at timestamptz not null default now()
);
create index audit_log_time_idx on public.audit_log (changed_at desc);
create index audit_log_table_idx on public.audit_log (table_name, changed_at desc);

-- updated_at automático
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger courses_updated_at before update on public.courses for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger links_updated_at before update on public.links for each row execute function public.set_updated_at();

-- Regra do MEC: um link "mec" pertence a um único curso, e cada curso tem no máximo um MEC ativo.
create function public.check_mec(p_link uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  l public.links%rowtype;
begin
  select * into l from public.links where id = p_link;
  if not found or l.kind <> 'mec' then
    return;
  end if;

  if (select count(*) from public.link_courses where link_id = p_link) > 1 then
    raise exception 'Um link do MEC pertence a um único curso.' using errcode = '23514';
  end if;

  if l.active and exists (
    select 1
    from public.link_courses a
    join public.link_courses b on b.course_id = a.course_id and b.link_id <> a.link_id
    join public.links m on m.id = b.link_id and m.kind = 'mec' and m.active
    where a.link_id = p_link
  ) then
    raise exception 'Este curso já tem um link do MEC ativo.' using errcode = '23514';
  end if;
end;
$$;

create function public.trg_check_mec_link_courses()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.check_mec(new.link_id);
  return null;
end;
$$;

create function public.trg_check_mec_links()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.check_mec(new.id);
  return null;
end;
$$;

create trigger link_courses_check_mec after insert or update on public.link_courses
  for each row execute function public.trg_check_mec_link_courses();
create trigger links_check_mec after update of kind, active on public.links
  for each row execute function public.trg_check_mec_links();

-- Histórico de alterações (quem mudou o quê, com antes e depois)
create function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r jsonb;
  v_id text;
begin
  r := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  v_id := coalesce(r ->> 'id', (r ->> 'link_id') || ':' || (r ->> 'course_id'));
  insert into public.audit_log (table_name, record_id, action, old_data, new_data, changed_by)
  values (
    tg_table_name,
    v_id,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    auth.uid()
  );
  return null;
end;
$$;

create trigger profiles_audit after insert or update or delete on public.profiles for each row execute function public.audit_row();
create trigger courses_audit after insert or update or delete on public.courses for each row execute function public.audit_row();
create trigger categories_audit after insert or update or delete on public.categories for each row execute function public.audit_row();
create trigger links_audit after insert or update or delete on public.links for each row execute function public.audit_row();
create trigger link_courses_audit after insert or update or delete on public.link_courses for each row execute function public.audit_row();

-- Criação automática do perfil quando um usuário é criado/convidado (nasce inativo, perfil colaborador)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Funções de trigger não são chamáveis por ninguém via API
revoke execute on function public.audit_row() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.check_mec(uuid) from public, anon, authenticated;
revoke execute on function public.trg_check_mec_link_courses() from public, anon, authenticated;
revoke execute on function public.trg_check_mec_links() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
