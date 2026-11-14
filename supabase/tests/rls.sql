-- Teste das regras de acesso por perfil.
-- Cria usuários e dados fictícios, confere cada permissão e DESFAZ TUDO no final (o resultado volta como mensagem de erro "RESULTADO").
-- Rodar no SQL Editor do Supabase ou via execute_sql.
do $$
declare
  u_str uuid := gen_random_uuid();  -- estranho: criou conta, mas não foi ativado
  u_col uuid := gen_random_uuid();  -- colaborador
  u_ges uuid := gen_random_uuid();  -- gestor
  u_adm uuid := gen_random_uuid();  -- admin
  v_cat uuid;
  t record;
  n bigint;
  got text;
  res text[] := '{}';
  fails int := 0;
  -- Contagens reais já existentes no banco, para o teste continuar valendo com dados de verdade.
  b_cursos bigint := (select count(*) from public.courses where active);
  b_links bigint := (select count(*) from public.links where active);
  b_cliques bigint := (select count(*) from public.link_clicks);
  b_perfis bigint := (select count(*) from public.profiles);
begin
  insert into auth.users (id, email) values
    (u_str, 'estranho@teste.invalid'), (u_col, 'colab@teste.invalid'),
    (u_ges, 'gestor@teste.invalid'), (u_adm, 'admin@teste.invalid');
  update public.profiles set active = true where id in (u_col, u_ges, u_adm);
  update public.profiles set role = 'gestor' where id = u_ges;
  update public.profiles set role = 'admin' where id = u_adm;

  insert into public.categories (name, slug) values ('Teste', 'teste') returning id into v_cat;
  insert into public.links (title, url, category_id) values ('L1', 'https://exemplo.invalid/a', v_cat);

  for t in
    select * from (values
      (1,  'visitante nao le cursos',                 null::uuid, 'anon',          'select * from public.courses', 'error'),
      (2,  'visitante nao le links',                  null, 'anon',          'select * from public.links', 'error'),
      (3,  'conta nao ativada nao ve cursos',         u_str, 'authenticated', 'select * from public.courses', 'rows:0'),
      (4,  'conta nao ativada nao ve links',          u_str, 'authenticated', 'select * from public.links', 'rows:0'),
      (5,  'conta nao ativada ve so o proprio perfil',u_str, 'authenticated', 'select * from public.profiles', 'rows:1'),
      (6,  'colaborador ve os 5 cursos',              u_col, 'authenticated', 'select * from public.courses', 'rows:' || b_cursos),
      (7,  'colaborador ve links ativos',             u_col, 'authenticated', 'select * from public.links', 'rows:' || (b_links + 1)),
      (8,  'colaborador ve so o proprio perfil',      u_col, 'authenticated', 'select * from public.profiles', 'rows:1'),
      (9,  'colaborador nao cria link',               u_col, 'authenticated', $q$insert into public.links (title, url) values ('X', 'https://exemplo.invalid/x')$q$, 'error'),
      (10, 'colaborador nao edita link',              u_col, 'authenticated', $q$update public.links set title = 'X'$q$, 'ok:0'),
      (11, 'colaborador nao muda o proprio perfil',   u_col, 'authenticated', $q$update public.profiles set role = 'admin' where id = auth.uid()$q$, 'ok:0'),
      (12, 'colaborador nao ve historico',            u_col, 'authenticated', 'select * from public.audit_log', 'rows:0'),
      (13, 'colaborador nao ve cliques de outros',    u_col, 'authenticated', 'select * from public.link_clicks', 'rows:0'),
      (14, 'colaborador favorita',                    u_col, 'authenticated', $q$insert into public.favorites (user_id, link_id) select auth.uid(), id from public.links limit 1$q$, 'ok:1'),
      (15, 'colaborador nao favorita por outro',      u_col, 'authenticated', format($q$insert into public.favorites (user_id, link_id) select %L::uuid, id from public.links limit 1$q$, u_ges), 'error'),
      (16, 'colaborador ve so seus favoritos',        u_col, 'authenticated', 'select * from public.favorites', 'rows:1'),
      (17, 'colaborador registra clique proprio',     u_col, 'authenticated', $q$insert into public.link_clicks (link_id, user_id) select id, auth.uid() from public.links limit 1$q$, 'ok:1'),
      (18, 'colaborador nao registra clique de outro',u_col, 'authenticated', format($q$insert into public.link_clicks (link_id, user_id) select id, %L::uuid from public.links limit 1$q$, u_adm), 'error'),
      (19, 'colaborador nao forja data do clique',    u_col, 'authenticated', $q$insert into public.link_clicks (link_id, user_id, clicked_at) select id, auth.uid(), now() - interval '30 days' from public.links limit 1$q$, 'error'),
      (20, 'colaborador nao apaga link',              u_col, 'authenticated', 'delete from public.links', 'error'),
      (21, 'gestor ve historico',                     u_ges, 'authenticated', 'select * from public.audit_log limit 1', 'rows:1'),
      (22, 'gestor ve cliques',                       u_ges, 'authenticated', 'select * from public.link_clicks', 'rows:' || (b_cliques + 1)),
      (23, 'gestor ve todos os perfis',               u_ges, 'authenticated', 'select * from public.profiles', 'rows:' || (b_perfis + 4)),
      (24, 'gestor nao cria link',                    u_ges, 'authenticated', $q$insert into public.links (title, url) values ('X', 'https://exemplo.invalid/x')$q$, 'error'),
      (25, 'gestor nao edita curso',                  u_ges, 'authenticated', $q$update public.courses set color = '#000000'$q$, 'ok:0'),
      (26, 'admin cria categoria',                    u_adm, 'authenticated', $q$insert into public.categories (name, slug) values ('Teste 2', 'teste-2')$q$, 'ok:1'),
      (27, 'admin cria link MEC 1',                   u_adm, 'authenticated', $q$insert into public.links (title, url, kind) values ('MEC1', 'https://exemplo.invalid/mec1', 'mec')$q$, 'ok:1'),
      (28, 'admin liga MEC 1 a um curso',             u_adm, 'authenticated', $q$insert into public.link_courses (link_id, course_id) select l.id, c.id from public.links l, public.courses c where l.title = 'MEC1' and c.slug = 'engenharia-de-dados-ia'$q$, 'ok:1'),
      (29, 'admin cria link MEC 2',                   u_adm, 'authenticated', $q$insert into public.links (title, url, kind) values ('MEC2', 'https://exemplo.invalid/mec2', 'mec')$q$, 'ok:1'),
      (30, 'curso nao aceita 2o MEC ativo',           u_adm, 'authenticated', $q$insert into public.link_courses (link_id, course_id) select l.id, c.id from public.links l, public.courses c where l.title = 'MEC2' and c.slug = 'engenharia-de-dados-ia'$q$, 'error'),
      (31, 'MEC nao vale para 2 cursos',              u_adm, 'authenticated', $q$insert into public.link_courses (link_id, course_id) select l.id, c.id from public.links l, public.courses c where l.title = 'MEC1' and c.slug = 'mba-ia-direito'$q$, 'error'),
      (32, 'link exige https',                        u_adm, 'authenticated', $q$insert into public.links (title, url) values ('X', 'http://exemplo.invalid/x')$q$, 'error'),
      (33, 'link nao aceita javascript:',             u_adm, 'authenticated', $q$insert into public.links (title, url) values ('X', 'javascript:alert(1)')$q$, 'error'),
      (34, 'admin ve todos os perfis',                u_adm, 'authenticated', 'select * from public.profiles', 'rows:' || (b_perfis + 4)),
      (35, 'admin desativa um usuario',               u_adm, 'authenticated', $q$update public.profiles set active = false where email = 'estranho@teste.invalid'$q$, 'ok:1'),
      (36, 'admin nao apaga link',                    u_adm, 'authenticated', 'delete from public.links', 'error'),
      (38, 'MEC 2 liga a outro curso sem conflito',   u_adm, 'authenticated', $q$insert into public.link_courses (link_id, course_id) select l.id, c.id from public.links l, public.courses c where l.title = 'MEC2' and c.slug = 'mba-ia-direito'$q$, 'ok:1')
    ) as x (ord, label, uid, rl, q, expect)
    order by ord
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', t.uid, 'role', t.rl)::text, true);
    perform set_config('request.jwt.claim.sub', coalesce(t.uid::text, ''), true);
    execute format('set local role %I', t.rl);
    begin
      if left(t.q, 6) = 'select' then
        execute 'select count(*) from (' || t.q || ') s' into n;
        got := 'rows:' || n;
      else
        execute t.q;
        get diagnostics n = row_count;
        got := 'ok:' || n;
      end if;
    exception when others then
      got := 'error';
    end;
    reset role;
    if got = t.expect then
      res := res || ('PASSOU  ' || t.ord || ' ' || t.label);
    else
      fails := fails + 1;
      res := res || ('FALHOU  ' || t.ord || ' ' || t.label || ' (esperado ' || t.expect || ', obteve ' || got || ')');
    end if;
  end loop;

  -- Auditoria: a criacao do MEC 1 foi registrada com o autor correto
  select count(*) into n from public.audit_log
   where table_name = 'links' and action = 'INSERT' and new_data ->> 'title' = 'MEC1' and changed_by = u_adm;
  if n = 1 then res := res || 'PASSOU  37 historico registra quem criou o link'::text;
  else fails := fails + 1; res := res || ('FALHOU  37 historico (obteve ' || n || ')'); end if;

  raise exception 'RESULTADO (% falhas):%', fails, E'\n' || array_to_string(res, E'\n');
end;
$$;
