-- Novo tipo de link: "platform" (acesso à plataforma dos alunos).
-- Diferente do MEC, um link de plataforma pode valer para vários cursos (tabela link_courses).
-- O valor novo só pode ser usado em uma transação seguinte; por isso esta migração só o cria.
alter type public.link_kind add value if not exists 'platform';
