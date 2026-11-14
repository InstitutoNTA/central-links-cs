-- Teste da etapa 5 (roda dentro de uma transação revertida: não grava nada).
-- Antes de rodar, troque ADMIN_UUID pelo id de um administrador ativo real.
-- Resultado esperado: erro final "TESTE_OK ok3 ok4 ok5 ok7 ok8 ok9 (revertido)".
do $$
declare
  adm uuid := 'ADMIN_UUID';
  c1 uuid; c2 uuid; l1 uuid; l2 uuid; l3 uuid; n int; res text := '';
begin
  select id into c1 from public.courses order by sort_order, name limit 1;
  select id into c2 from public.courses order by sort_order, name offset 1 limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;

  l1 := public.admin_save_link(null, ' Teste A ', 'https://exemplo.invalid/a', ' desc ', null, 'standard', true, array[c1, c2]);
  select count(*) into n from public.link_courses where link_id = l1;
  if n <> 2 then raise exception 'FALHA 1: esperado 2 cursos, veio %', n; end if;

  l2 := public.admin_save_link(null, 'MEC 1', 'https://exemplo.invalid/mec', null, null, 'mec', true, array[c1]);

  begin
    l3 := public.admin_save_link(null, 'MEC 2', 'https://exemplo.invalid/mec2', null, null, 'mec', true, array[c1]);
    raise exception 'FALHA 3: aceitou 2o MEC';
  exception when check_violation then res := res || 'ok3 ';
  end;

  begin
    l3 := public.admin_save_link(null, 'MEC 3', 'https://exemplo.invalid/mec3', null, null, 'mec', true, array[c1, c2]);
    raise exception 'FALHA 4: aceitou MEC com 2 cursos';
  exception when check_violation then res := res || 'ok4 ';
  end;

  begin
    l3 := public.admin_save_link(null, 'X', 'http://exemplo.invalid/x', null, null, 'standard', true, '{}');
    raise exception 'FALHA 5: aceitou http';
  exception when check_violation then res := res || 'ok5 ';
  end;

  perform public.admin_save_link(l1, 'Teste A2', 'https://exemplo.invalid/a', null, null, 'standard', false, array[c2]);
  select count(*) into n from public.link_courses where link_id = l1 and course_id = c2;
  if n <> 1 then raise exception 'FALHA 6'; end if;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.admin_save_link(null, 'Intruso', 'https://exemplo.invalid/i', null, null, 'standard', true, '{}');
    raise exception 'FALHA 7: usuário comum criou link';
  exception when insufficient_privilege then res := res || 'ok7 ';
  end;
  reset role;

  begin
    update public.profiles set role = 'colaborador' where id = adm;
    raise exception 'FALHA 8: rebaixou último admin';
  exception when check_violation then res := res || 'ok8 ';
  end;
  begin
    update public.profiles set active = false where id = adm;
    raise exception 'FALHA 9: desativou último admin';
  exception when check_violation then res := res || 'ok9 ';
  end;

  raise exception 'TESTE_OK % (revertido)', res;
end $$;
