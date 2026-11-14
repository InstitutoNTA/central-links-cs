-- Etapa 1 / Migração 4: corrige a validação da regra do MEC.
-- A função check_mec perdeu a permissão de execução para quem grava (admin) e passou a falhar.
-- Agora ela fica no schema privado, roda com direitos do dono (ignora RLS) e é chamada pelos gatilhos.

alter function public.check_mec(uuid) set schema private;
alter function private.check_mec(uuid) security definer;
revoke execute on function private.check_mec(uuid) from public, anon;
grant execute on function private.check_mec(uuid) to authenticated;

create or replace function public.trg_check_mec_link_courses()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform private.check_mec(new.link_id);
  return null;
end;
$$;

create or replace function public.trg_check_mec_links()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform private.check_mec(new.id);
  return null;
end;
$$;
