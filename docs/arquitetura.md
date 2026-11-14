# Arquitetura — Central de Links CS

Versão aprovada em 13/11/2026. Atualize este arquivo sempre que uma decisão mudar.

## Visão geral

Site React + TypeScript + Tailwind publicado no Netlify. Login, banco de dados e regras de acesso ficam no Supabase (projeto `central-links-cs`). Não há servidor próprio. O código fica no GitHub (`InstitutoNTA/central-links-cs`, público).

## Decisões confirmadas

- Repositório **público**. Por isso nenhum link, chave secreta ou dado institucional pode entrar no código: os links vivem só no banco.
- Gestor: **apenas vê métricas e histórico**. Não edita links.
- Um link pode valer para **mais de um curso** (tabela `link_courses`). Sem curso = link geral.
- Primeiro administrador: definido na etapa de acesso (e-mail informado pelo responsável do projeto).
- Curso de Defesa Cibernética: **roxo suave** (a ser distinguido do lilás de IA Aplicada a Negócios na etapa 3).
- A Central **começa vazia**. Nenhum link é cadastrado sem autorização.
- Convites de usuários: duas opções ficam previstas (criação manual no painel do Supabase ou Edge Function `admin-users`). A Edge Function só será publicada quando for pedida.

## Cursos e identidade visual

| Curso | Cor |
|---|---|
| Engenharia de Dados e Inteligência Artificial | laranja |
| Inteligência Artificial Aplicada a Negócios | lilás |
| Arquitetura Avançada de Cloud com Azure | azul |
| MBA em Inteligência Artificial Aplicada ao Direito | amarelo |
| Defesa Cibernética com IA Generativa Aplicada | roxo suave |

O acesso ao **MEC** aparece como link clicável abaixo do nome de cada curso, no padrão visual da lista de cursos. Não existe seção separada para o MEC.

## Banco de dados

| Tabela | Conteúdo |
|---|---|
| `profiles` | nome, e-mail, perfil (admin, gestor, colaborador), ativo |
| `courses` | nome, slug, cor, ordem, ativo |
| `categories` | nome, slug, ícone, ordem |
| `links` | título, url, descrição, categoria, tipo (padrão ou MEC), ativo, ordem |
| `link_courses` | liga um link a vários cursos |
| `favorites` | usuário + link |
| `link_clicks` | link, usuário, data e hora |
| `audit_log` | tabela, registro, ação, quem, antes/depois, data |

Nada é apagado de verdade: usamos `ativo = false`.

## Perfis e permissões

| Ação | Colaborador | Gestor | Admin |
|---|---|---|---|
| Ver links, buscar, favoritar | Sim | Sim | Sim |
| Ver métricas e histórico | Não | Sim | Sim |
| Criar e editar links e categorias | Não | Não | Sim |
| Gerenciar cursos e usuários | Não | Não | Sim |

A regra é aplicada no banco (RLS em todas as tabelas). Esconder botões na tela é só conforto visual.

## Páginas

- Todos: `/login`, `/esqueci-senha`, `/redefinir-senha`, `/`, `/cursos/:slug`, `/categorias/:slug`, `/favoritos`, `/buscar`, `/perfil`.
- Gestor e admin: `/admin/metricas`, `/admin/historico`.
- Só admin: `/admin/links`, `/admin/categorias`, `/admin/cursos`, `/admin/usuarios`.

## Hospedagem

- GitHub → Netlify (build `npm run build`, pasta `dist`).
- Variáveis públicas no Netlify: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Domínio próprio: depois, se for preciso.

## Segurança do banco (etapa 1)

- **Contas novas nascem inativas.** O cadastro cria o perfil como `colaborador` e `active = false`. Sem um admin ativar, a pessoa não vê nenhum dado (cursos, links, favoritos). Isso vale mesmo que o cadastro público do Supabase esteja ligado.
- **Visitantes sem login** não têm permissão nenhuma nas tabelas.
- **Funções de apoio** (`is_member`, `is_manager`, `is_admin`, `check_mec`) ficam no schema `private`, que a API não expõe.
- **Cliques e favoritos:** cada pessoa só grava os próprios. A data do clique é sempre a do servidor.
- **Links:** só `https://` (bloqueia `http:` e `javascript:`).
- **MEC:** um link `mec` pertence a um único curso, e cada curso tem no máximo um MEC ativo.
- **Histórico:** `audit_log` registra inclusões, alterações e exclusões de perfis, cursos, categorias, links e vínculos, com autor, antes e depois.
- **Testes:** `supabase/tests/rls.sql` cria usuários fictícios, confere 38 situações de permissão e desfaz tudo.
- **Primeiro administrador:** será promovido na etapa 2, depois do primeiro login, por comando direto no banco. O e-mail não fica gravado no código, porque o repositório é público.

## Migrações

`supabase/migrations/` guarda, em ordem: estrutura (1), regras de acesso (2), cursos (3), correção da validação do MEC (4) e índice (5). Cores dos cursos são provisórias e editáveis.

## Observação sobre versões

O esqueleto foi criado com as versões atuais das ferramentas (React 19, Vite 8, Tailwind 4, TypeScript 7), que são mais novas que as citadas na primeira proposta (React 18).

## Etapas

0 Fundação · 1 Banco · 2 Acesso · 3 Catálogo · 4 Uso diário · 5 Admin · 6 Gestão · 7 Qualidade · 8 Publicação
