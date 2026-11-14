-- Etapa 5: (1) salvar link + cursos numa única operação; (2) impedir ficar sem administrador.

-- Roda com os direitos de quem chama (security invoker): as regras de acesso (RLS) continuam valendo,
-- então só administrador consegue usar. Tudo acontece em uma transação: ou salva tudo, ou nada.
create function public.admin_save_link(
  p_id uuid,
  p_title text,
  p_url text,
  p_description text,
  p_category_id uuid,
  p_kind public.link_kind,
  p_active boolean,
  p_course_ids uuid[]
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_id is null then
    insert into public.links (title, url, description, category_id, kind, active, created_by)
    values (btrim(p_title), btrim(p_url), nullif(btrim(coalesce(p_description, '')), ''), p_category_id, p_kind, p_active, auth.uid())
    returning id into v_id;
  else
    delete from public.link_courses where link_id = p_id;
    update public.links
       set title = btrim(p_title),
           url = btrim(p_url),
           description = nullif(btrim(coalesce(p_description, '')), ''),
           category_id = p_category_id,
           kind = p_kind,
           active = p_active
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

revoke execute on function public.admin_save_link(uuid, text, text, text, uuid, public.link_kind, boolean, uuid[]) from public, anon;
grant execute on function public.admin_save_link(uuid, text, text, text, uuid, public.link_kind, boolean, uuid[]) to authenticated;

-- Nunca deixar o sistema sem um administrador ativo.
create function private.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin' and old.active and (new.role <> 'admin' or not new.active) then
    if not exists (
      select 1 from public.profiles where role = 'admin' and active and id <> old.id
    ) then
      raise exception 'Não é possível remover ou desativar o último administrador ativo.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_last_admin
before update on public.profiles
for each row execute function private.protect_last_admin();
