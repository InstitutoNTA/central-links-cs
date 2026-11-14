-- Etapa 1 / Migração 3: os 5 cursos do contexto institucional.
-- Sem links e sem categorias: esses dados entram pelo painel administrativo.
-- As cores são provisórias e editáveis no painel (a de Defesa Cibernética será ajustada e aprovada na etapa 3).

insert into public.courses (name, slug, color, sort_order) values
  ('Engenharia de Dados e Inteligência Artificial', 'engenharia-de-dados-ia', '#F2994A', 1),
  ('Inteligência Artificial Aplicada a Negócios', 'ia-aplicada-a-negocios', '#B39DDB', 2),
  ('Arquitetura Avançada de Cloud com Azure', 'arquitetura-cloud-azure', '#4A90E2', 3),
  ('MBA em Inteligência Artificial Aplicada ao Direito', 'mba-ia-direito', '#F2C94C', 4),
  ('Defesa Cibernética com Inteligência Artificial Generativa Aplicada', 'defesa-cibernetica-ia', '#7E57C2', 5)
on conflict (slug) do nothing;
