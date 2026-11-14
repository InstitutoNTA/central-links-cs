# Testes — Central de Links CS

## Automáticos no código (a cada envio ao GitHub)

```bash
npm run lint    # análise do código
npm test        # testes (Vitest + Testing Library)
npm run build   # confirma que o site compila
```

Cobrem: mensagens de erro e regra de senha, proteção de rotas por perfil, busca e filtros do catálogo, regra do MEC, favoritos e registro de clique, validação de links, texto do histórico.

## No banco (rodar no SQL Editor do Supabase)

Todos desfazem o que criam e devolvem o resultado como mensagem de erro final.

| Arquivo | Confere | Resultado esperado |
|---|---|---|
| `supabase/tests/rls.sql` | 38 situações de permissão por perfil | "RESULTADO (0 falhas)" |
| `supabase/tests/admin.sql` | salvar link com cursos, regras do MEC, último administrador (trocar `ADMIN_UUID`) | "TESTE_OK ok3 ok4 ok5 ok7 ok8 ok9" |
| `supabase/tests/metricas.sql` | métricas de uso e bloqueio para colaborador (trocar `ADMIN_UUID`) | "TESTE_OK ok1-5 ok6" |

## Verificação manual antes de liberar para o time

1. Entrar como administrador, gestor e colaborador e conferir o menu de cada um.
2. Colaborador digitar `/admin/links` e `/gestao/uso` no endereço: deve voltar ao início.
3. Cadastrar um link comum, favoritar, abrir e conferir o clique em Gestão > Uso.
4. Cadastrar o MEC de um curso e ver o link abaixo do nome do curso.
5. Tentar cadastrar um segundo MEC no mesmo curso: deve ser recusado.
6. Tentar cadastrar endereço com `http://`: deve ser recusado.
7. Pedir recuperação de senha e concluir pelo e-mail.
8. Abrir no celular e conferir busca, filtros e a página de um curso.

## Última execução (14/11/2026)

- Código: lint, build e 54 testes passaram.
- Banco: permissões 38/38, painel e métricas passaram. Alertas do Supabase: só "proteção contra senhas vazadas desligada" (configuração de Authentication).
