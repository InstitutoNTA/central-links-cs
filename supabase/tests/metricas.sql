-- Teste da etapa 6 (transação revertida: não grava nada).
-- Antes de rodar, troque ADMIN_UUID pelo id de um administrador ativo real.
-- Resultado esperado: erro final "TESTE_OK ok1-5 ok6 (revertido)".
do $$
declare
  adm uuid := 'ADMIN_UUID';
  c1 uuid; l1 uuid; n bigint; n2 bigint; res text := '';
begin
  select id into c1 from public.courses order by sort_order limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  l1 := public.admin_save_link(null, 'Teste', 'https://exemplo.invalid/t', null, null, 'standard', true, array[c1]);
  insert into public.link_clicks (link_id, user_id) values (l1, adm), (l1, adm), (l1, adm);

  select total_clicks into n from public.usage_overview(30);
  if n <> 3 then raise exception 'FALHA 1 overview: %', n; end if;
  select clicks into n from public.usage_top_links(30, 10) where link_id = l1;
  if n <> 3 then raise exception 'FALHA 2 top: %', n; end if;
  select clicks into n from public.usage_by_course(30) where course_id = c1;
  if n <> 3 then raise exception 'FALHA 3 curso: %', n; end if;
  select sum(clicks) into n from public.usage_by_day(7);
  select count(*) into n2 from public.usage_by_day(7);
  if n <> 3 or n2 <> 7 then raise exception 'FALHA 4 dia: % / %', n, n2; end if;
  select clicks into n from public.usage_by_user(30) where user_id = adm;
  if n <> 3 then raise exception 'FALHA 5 usuario: %', n; end if;
  res := 'ok1-5 ';

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
  set local role authenticated;
  select total_clicks into n from public.usage_overview(30);
  if n <> 0 then raise exception 'FALHA 6: usuário comum viu % cliques', n; end if;
  res := res || 'ok6 ';
  reset role;

  raise exception 'TESTE_OK % (revertido)', res;
end $$;
