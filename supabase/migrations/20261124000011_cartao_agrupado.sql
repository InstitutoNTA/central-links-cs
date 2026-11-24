-- Cartão agrupado: links com o mesmo "group_name" (na mesma categoria) aparecem juntos em UM cartão,
-- cada um como uma linha com Abrir e Copiar link (ex.: cartão "TMB" com "Plataforma" e "Renegociação").
-- O nome da linha é o próprio título do link. Sem group_name = cartão comum.
alter table public.links
  add column group_name text check (group_name is null or (char_length(btrim(group_name)) between 1 and 80));

-- Recria a função de salvar link com o novo campo (a assinatura anterior sai).
-- Obs.: o novo parâmetro não tem valor padrão de propósito, para não haver chamada ambígua entre assinaturas.
drop function if exists public.admin_save_link(uuid, text, text, text, uuid, public.link_kind, boolean, uuid[], smallint);

create function public.admin_save_link(
  p_id uuid,
  p_title text,
  p_url text,
  p_description text,
  p_category_id uuid,
  p_kind public.link_kind,
  p_active boolean,
  p_course_ids uuid[],
  p_weekday smallint,
  p_group_name text
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_id is null then
    insert into public.links (title, url, description, category_id, kind, active, weekday, group_name, created_by)
    values (btrim(p_title), btrim(p_url), nullif(btrim(coalesce(p_description, '')), ''), p_category_id, p_kind, p_active, p_weekday,
            nullif(btrim(coalesce(p_group_name, '')), ''), auth.uid())
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
           weekday = p_weekday,
           group_name = nullif(btrim(coalesce(p_group_name, '')), '')
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

revoke execute on function public.admin_save_link(uuid, text, text, text, uuid, public.link_kind, boolean, uuid[], smallint, text) from public, anon;
grant execute on function public.admin_save_link(uuid, text, text, text, uuid, public.link_kind, boolean, uuid[], smallint, text) to authenticated;
