-- Etapa 6: métricas de uso (para gestor e administrador).
-- Todas rodam com os direitos de quem chama (security invoker): a regra de acesso de link_clicks
-- (só gestor/admin leem) continua valendo. Colaborador recebe resultado vazio.

create function public.usage_overview(p_days integer)
returns table (total_clicks bigint, active_users bigint, links_clicked bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*), count(distinct user_id), count(distinct link_id)
  from public.link_clicks
  where clicked_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
$$;

create function public.usage_top_links(p_days integer, p_limit integer)
returns table (link_id uuid, title text, clicks bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select l.id, l.title, count(*) as clicks
  from public.link_clicks c
  join public.links l on l.id = c.link_id
  where c.clicked_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)))
  group by l.id, l.title
  order by clicks desc, l.title
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

-- Cliques por curso. Link em mais de um curso conta em cada um; link sem curso entra como "Links gerais".
create function public.usage_by_course(p_days integer)
returns table (course_id uuid, name text, color text, clicks bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select co.id, coalesce(co.name, 'Links gerais'), co.color, count(*) as clicks
  from public.link_clicks c
  left join public.link_courses lc on lc.link_id = c.link_id
  left join public.courses co on co.id = lc.course_id
  where c.clicked_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)))
  group by co.id, co.name, co.color
  order by clicks desc;
$$;

-- Cliques por dia (fuso de Brasília), incluindo dias sem clique.
create function public.usage_by_day(p_days integer)
returns table (day date, clicks bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with n as (select greatest(1, least(coalesce(p_days, 30), 365)) as d),
  days as (
    select generate_series(
      (now() at time zone 'America/Sao_Paulo')::date - ((select d from n) - 1),
      (now() at time zone 'America/Sao_Paulo')::date,
      interval '1 day'
    )::date as day
  )
  select days.day, count(c.id) as clicks
  from days
  left join public.link_clicks c on (c.clicked_at at time zone 'America/Sao_Paulo')::date = days.day
  group by days.day
  order by days.day;
$$;

create function public.usage_by_user(p_days integer)
returns table (user_id uuid, full_name text, email text, clicks bigint, last_click timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.id, p.full_name, p.email, count(c.id) as clicks, max(c.clicked_at) as last_click
  from public.profiles p
  left join public.link_clicks c
    on c.user_id = p.id
   and c.clicked_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)))
  where p.active
  group by p.id, p.full_name, p.email
  order by clicks desc, p.email;
$$;

revoke execute on function public.usage_overview(integer) from public, anon;
revoke execute on function public.usage_top_links(integer, integer) from public, anon;
revoke execute on function public.usage_by_course(integer) from public, anon;
revoke execute on function public.usage_by_day(integer) from public, anon;
revoke execute on function public.usage_by_user(integer) from public, anon;
grant execute on function public.usage_overview(integer) to authenticated;
grant execute on function public.usage_top_links(integer, integer) to authenticated;
grant execute on function public.usage_by_course(integer) to authenticated;
grant execute on function public.usage_by_day(integer) to authenticated;
grant execute on function public.usage_by_user(integer) to authenticated;
