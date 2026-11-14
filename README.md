# Central de Links CS | InstitutoNTA

Portal interno do time de Customer Success para reunir os acessos usados no dia a dia
(pós-graduações, plataformas, CRM, formulários, relatórios).

**Stack:** React + TypeScript + Tailwind CSS · Supabase (login, banco, regras de acesso) · Netlify · GitHub.

## Rodar localmente

```bash
cp .env.example .env   # preencha com a URL e a chave pública do Supabase
npm install
npm run dev
```

Verificações: `npm run lint`, `npm test`, `npm run build`.

## Segurança

- Só a chave **pública** do Supabase vai para o navegador. A chave secreta (`service_role`) nunca entra neste repositório.
- Nenhum link institucional é cadastrado por código. Os links entram pelo painel administrativo.

## Documentação

- [Arquitetura](docs/arquitetura.md)
- [Guia de operação](docs/operacao.md)
- [Testes](docs/testes.md)

## Etapas

0 Fundação · 1 Banco · 2 Acesso · 3 Catálogo · 4 Uso diário · 5 Admin · 6 Gestão · 7 Qualidade · 8 Publicação
