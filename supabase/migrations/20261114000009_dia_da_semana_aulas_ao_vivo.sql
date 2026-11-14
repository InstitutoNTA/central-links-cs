-- Etapa 8: aulas ao vivo. Um link pode ter um dia da semana (1 = segunda ... 7 = domingo, padrão ISO).
-- Sem dia = link comum. A Central usa o campo para montar a área "Aulas ao vivo".
alter table public.links
  add column weekday smallint check (weekday between 1 and 7);

-- Recria a função de salvar link com o novo campo (a assinatura antiga sai).
drop function public.admin_save_link(uuid, text, text, text, uuid, public.link_kind, boolean, uuid[]);

create function public.admin_save_link(
  p_id uuid,
  p_title text,
  p_url text,
  p_description text,
  p_category_id uuid,
  p_kind public.link_kind,
  p_active boolean,
  p_course_ids uuid[],
  p_weekday smallint default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_id is null then
    insert into public.links (title, url, description, category_id, kind, active, weekday, created_by)
    values (btrim(p_title), btrim(p_url), nullif(btrim(coalesce(p_description, '')), ''), p_category_id, p_kind, p_active, p_weekday, auth.uid())
    returning id into v_id;
  else
    delete from public.link_courses where link_id = p_id;
    update public.links
       set title = btrim(p_title),
           url = btrim(p_url),
           description = nullif(btrim(coalesce(p_description, '')), ''),
           category_id = p_category_id,
           kind = p_kind,
           active = p_active,
           weekday = p_weekday
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Link não encontrado ou sem permissão.' using errcode = '42501';
    end if;
  end if;

  insert into public.link_courses (link_id, course_id)
  select v_id, c from unnest(coalesce(p_course_ids, '{}'::uuid[])) as c;

  return v_id;
end;
$$;

revoke execute on function public.admin_save_link(uuid, text, text, text, uuid, public.link_kind, boolean, uuid[], smallint) from public, anon;
grant execute on function public.admin_save_link(uuid, text, text, text, uuid, public.link_kind, boolean, uuid[], smallint) to authenticated;
