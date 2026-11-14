# Guia de operação — Central de Links CS

Para quem administra a Central. Todas as tarefas do dia a dia são feitas dentro do site, em **Administração**.

## Tarefas do dia a dia

| Quero… | Onde |
|---|---|
| Cadastrar ou editar um link | Administração > Links |
| Cadastrar o MEC de um curso | Administração > Links > marcar "Este é o link do MEC" e escolher o curso |
| Cadastrar uma aula ao vivo (com dia fixo) | Administração > Links > escolher o "Dia da aula ao vivo" e a categoria "Aulas ao vivo". Ela aparece na área "Aulas ao vivo" da tela inicial |
| Cadastrar planilha, OneDrive ou CRM | Administração > Links > escolher a categoria (Planilhas, Arquivos (OneDrive) ou CRM) e deixar os cursos em branco |
| Tirar um link do ar | Administração > Links > Desativar (dá para reativar) |
| Criar categorias | Administração > Categorias |
| Mudar nome ou cor de um curso | Administração > Cursos |
| Ver quem usa e o que mais é usado | Gestão > Uso da Central |
| Ver quem alterou o quê | Gestão > Histórico de alterações |

## Dar acesso a uma nova pessoa

1. No Supabase: **Authentication > Users > Add user**. Informe o e-mail, defina uma senha provisória e marque "Auto Confirm User".
2. A pessoa aparece em Administração > Usuários como "Aguardando ativação".
3. Escolha o perfil (Colaborador, Gestor ou Administrador) e clique em **Ativar**.
4. Peça para a pessoa trocar a senha em "Meu perfil" no primeiro acesso.

## Tirar o acesso de alguém

Administração > Usuários > **Desativar**. A pessoa continua com o cadastro, mas não vê mais nada. Reativar devolve o acesso.

## Esqueci minha senha

Na tela de login, "Esqueci minha senha". Se o e-mail não chegar, confira o spam. Se continuar, um administrador pode redefinir a senha em Supabase > Authentication > Users.

## Perdi o acesso de administrador

O banco impede ficar sem administrador ativo. Se mesmo assim ninguém conseguir entrar, no SQL Editor do Supabase:

```sql
update public.profiles set role = 'admin', active = true where email = 'EMAIL_DA_PESSOA';
```

## Pontos de atenção

- **Projeto gratuito do Supabase pausa após cerca de 7 dias sem uso.** Se a Central ficar fora do ar e o login falhar, entre em supabase.com, abra o projeto `central-links-cs` e clique em restaurar. O uso diário do time evita a pausa.
- **Cópias de segurança:** no plano gratuito não há restauração para um ponto no tempo. Para guardar uma cópia dos links, exporte as tabelas `links`, `courses`, `categories` e `link_courses` pelo Table Editor (botão de exportar CSV).
- **Chave secreta** (`service_role`): nunca colocar no código, no Cloudflare Pages do site nem no GitHub.
- **Nenhum item é apagado de verdade.** Use sempre "Desativar".
