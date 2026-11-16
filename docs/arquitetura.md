# Arquitetura — Central de Links CS

Atualizado na etapa 8 (14/11/2026). Atualize este arquivo sempre que uma decisão mudar.

## Visão geral

Site React + TypeScript + Tailwind publicado no Cloudflare Pages (https://central-links-cs.pages.dev). Login, banco de dados e regras de acesso ficam no Supabase (projeto `central-links-cs`). Não há servidor próprio. O código fica no GitHub (`InstitutoNTA/central-links-cs`, público).

## Decisões confirmadas

- Repositório **público**. Por isso nenhum link, chave secreta ou dado institucional entra no código: os links vivem só no banco.
- Gestor: **apenas vê métricas e histórico**. Não edita links.
- Um link pode valer para **mais de um curso** (tabela `link_courses`). Sem curso = link geral.
- A Central **começa vazia**. Nenhum link é cadastrado sem autorização.
- Nada é apagado: itens são **desativados** (`active = false`) e podem ser reativados.
- Novos usuários: criados manualmente no painel do Supabase. A Edge Function `admin-users` só será feita se for pedida.
- **Escopo ampliado (14/11/2026):** a Central reúne os links de toda a empresa InstitutoNTA, não só das pós-graduações. Entram aulas ao vivo (inglês para profissionais de Dados e IA e de TI, Aceleração EmpregaDados, Estágio, Projeto EmpregaDados), planilhas de uso diário, OneDrive e CRM. Esses links são **gerais** (sem curso), organizados por categoria.
- Categorias iniciais: Aulas ao vivo, Planilhas, Arquivos (OneDrive) e CRM. Edite em Administração > Categorias.
- **Aulas ao vivo:** o link tem um campo opcional "dia da semana" (1 = segunda ... 7 = domingo). A tela inicial mostra a área "Aulas ao vivo", agrupada por dia, com o dia de hoje (horário de Brasília) em destaque. Link com dia da semana não repete em "Links gerais".
- Logo e domínio próprio: na etapa 8.

## Cursos e identidade visual

Fundo grafite, detalhes em azul e vermelho suaves. Cada curso tem sua cor, editável em Administração > Cursos.

| Curso | Cor |
|---|---|
| Engenharia de Dados e Inteligência Artificial | laranja |
| Inteligência Artificial Aplicada a Negócios | lilás |
| Arquitetura Avançada de Cloud com Azure | azul |
| MBA em Inteligência Artificial Aplicada ao Direito | amarelo |
| Defesa Cibernética com IA Generativa Aplicada | rosa suave |

Abaixo do nome de cada curso (no início e na página do curso) aparecem duas linhas de acesso, cada uma com os botões **Abrir** e **Copiar link**: **Plataforma** (link de login da plataforma dos alunos, o mesmo para vários cursos) e **MEC**. Não existe seção separada para eles. Sem link cadastrado, a tela mostra "ainda não cadastrada/cadastrado". Todo link da Central (cartões, MEC, Plataforma e painel admin) tem Abrir e Copiar link; só o Abrir das telas normais registra clique.

## Código

```
src/
  app/          rotas, proteção por perfil (guards), layout, tela de erro
  components/ui botões, campos, cartão de login
  features/
    auth/       login, recuperação e troca de senha, contexto do usuário
    catalog/    leitura de cursos, categorias e links; busca; favoritos; registro de cliques
    home/       página inicial
    profile/    meu perfil
    admin/      painel do administrador (links, cursos, categorias, usuários)
    management/ métricas de uso e histórico (gestor e admin)
  lib/          cliente Supabase, nomes dos perfis
  types/        tipos gerados do banco
supabase/
  migrations/   estrutura do banco, em ordem
  tests/        testes SQL (permissões, painel, métricas)
```

Regras de negócio que não dependem de tela ficam em arquivos puros, com testes: `catalog/filters.ts`, `admin/validation.ts`, `management/describeChange.ts`, `auth/messages.ts`.

## Banco de dados

| Tabela | Conteúdo |
|---|---|
| `profiles` | nome, e-mail, perfil (admin, gestor, colaborador), ativo |
| `courses` | nome, slug, cor, ordem, ativo |
| `categories` | nome, slug, ícone, ordem, ativo |
| `links` | título, url, descrição, categoria, tipo (padrão, MEC ou plataforma), dia da semana (opcional), ativo, ordem |
| `link_courses` | liga um link a vários cursos |
| `favorites` | usuário + link |
| `link_clicks` | link, usuário, data e hora |
| `audit_log` | tabela, registro, ação, quem, antes/depois, data |

Funções do banco usadas pelo site:

- `admin_save_link`: salva link e cursos numa única transação (só administrador consegue usar).
- `usage_overview`, `usage_top_links`, `usage_by_course`, `usage_by_day`, `usage_by_user`: métricas de uso (só gestor e admin recebem dados).

## Perfis e permissões

| Ação | Colaborador | Gestor | Admin |
|---|---|---|---|
| Ver links, buscar, favoritar | Sim | Sim | Sim |
| Ver métricas e histórico | Não | Sim | Sim |
| Criar e editar links e categorias | Não | Não | Sim |
| Gerenciar cursos e usuários | Não | Não | Sim |

A regra é aplicada no banco (RLS em todas as tabelas). Esconder botões na tela é só conforto visual.

## Páginas

- Públicas: `/login`, `/esqueci-senha`, `/redefinir-senha`.
- Conta ainda não ativada: `/aguardando-ativacao`.
- Todos os usuários ativos: `/`, `/cursos/:slug`, `/perfil`.
- Gestor e admin: `/gestao/uso`, `/gestao/historico`.
- Só admin: `/admin/links`, `/admin/cursos`, `/admin/categorias`, `/admin/usuarios`.

## Segurança

- **Contas novas nascem inativas** (`colaborador`, `active = false`). Sem um admin ativar, a pessoa não vê nenhum dado.
- **Visitantes sem login** não têm permissão nenhuma nas tabelas.
- **Funções de apoio** (`is_member`, `is_manager`, `is_admin`, `check_mec`) ficam no schema `private`, que a API não expõe.
- **Cliques e favoritos:** cada pessoa só grava os próprios; a data do clique é a do servidor.
- **Links:** só `https://` (bloqueia `http:` e `javascript:`), validado na tela e no banco. Abrem em nova aba com `noopener noreferrer`.
- **MEC:** pertence a um único curso; cada curso tem no máximo um MEC ativo.
- **Plataforma:** tipo `platform`; um único link pode valer para vários cursos (`link_courses`). Não aparece nas listas de links comuns nem em "Links gerais".
- **Último administrador:** o banco recusa rebaixar ou desativar o último admin ativo.
- **Histórico:** `audit_log` registra inclusões, alterações e exclusões, com autor, antes e depois.
- **Navegador:** cabeçalhos de segurança no Cloudflare Pages (arquivo `public/_headers`) (política de conteúdo restrita ao próprio site e ao Supabase, bloqueio de iframe, sem indexação em buscadores). Só a chave **pública** do Supabase vai ao navegador.
- **Dependências:** `npm audit` sem vulnerabilidades conhecidas na data desta revisão.

## Hospedagem

- GitHub → Cloudflare Pages (build `npm run build`, pasta `dist`), publicação automática a cada envio para `main`.
- Hospedagem anterior: Netlify, abandonada em 14/11/2026 por falta de créditos. O `netlify.toml` permanece no repositório apenas como referência e não é usado.
- Variáveis públicas no Cloudflare Pages: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- A verificação automática do GitHub (CI) roda análise de código, testes e build.

## Migrações

`supabase/migrations/`, em ordem: estrutura (1), regras de acesso (2), cursos (3), correção da validação do MEC (4), índice (5), cor do Defesa Cibernética (6), salvar link e proteção do último admin (7), métricas de uso (8), dia da semana das aulas ao vivo (9), tipo de link "plataforma" (10).

## Etapas

0 Fundação ✔ · 1 Banco ✔ · 2 Acesso ✔ · 3 Catálogo ✔ · 4 Uso diário ✔ · 5 Admin ✔ · 6 Gestão ✔ · 7 Qualidade ✔ · 8 Publicação
