# Especificação — Frontend Web: infraestrutura + Auth + Dashboard

> Primeira leva do frontend (Next.js), testada ponta a ponta no navegador em 2026-09-17.

## O que foi construído

- **Infra**: Tailwind configurado com a paleta da Fase 2 (`#319085` como `primary`, navbar `#21665c`), variáveis CSS para tema claro/escuro (`:root[data-theme="dark"]`, ainda sem o toggle de UI — só a base pronta), React Query (`Providers`), cliente HTTP (`lib/api.ts`) e estado de auth (`store/auth-store.ts`, Zustand com persist em `localStorage`).
- **Fluxo de autenticação completo**, batendo com os wireframes da Fase 2 e a API do módulo Auth:
  - `/login` — formulário de e-mail/senha; ao submeter, transiciona **na mesma tela** (sem trocar de rota) para o passo de código MFA, igual ao wireframe
  - `/cadastro` — formulário de nome/sobrenome/e-mail; ao enviar, mostra a confirmação "e-mail enviado" inline (só depois do clique, como pedido)
  - `/cadastro/definir-senha?token=...` e `/redefinir-senha?token=...` — mesma UI (`SetPasswordForm` compartilhado), chamando os endpoints diferentes (`signup/complete` vs `reset-password`)
  - `/esqueci-senha` — dispara o reset, sempre com mensagem genérica
  - `/perfil` — dados do usuário logado + botão "Alterar senha" (dispara o mesmo fluxo de e-mail do reset)
- **Layout autenticado**: `(app)/layout.tsx` com `AuthGuard` (redireciona para `/login` se não houver token) + `Navbar` (links do menu da Fase 2, avatar com iniciais, dropdown com "Meu perfil"/"Sair")
- **Dashboard real**, consumindo `GET /dashboard/summary` via React Query
- Páginas placeholder ("em construção") para Transações, Relatórios, Contas, Cartões, Categorias, Importar dados — só para a navegação não quebrar; serão substituídas nos próximos passos

## Bug encontrado e corrigido: CORS

A API não tinha CORS habilitado — todo request do frontend (`localhost:3000`) para a API (`localhost:3333`) era bloqueado pelo navegador. Corrigido em `apps/api/src/main.ts` com `app.enableCors({ origin: FRONTEND_URL, credentials: true })`.

## Decisão técnica: tokens em `localStorage`

Para entregar o fluxo funcionando rápido, o `accessToken`/`refreshToken` ficam no `localStorage` (via Zustand persist), não em cookie `httpOnly`. É a abordagem mais simples e comum em SPAs, mas tem uma desvantagem conhecida: fica exposto a XSS. Para um app financeiro, o ideal a médio prazo é mover para cookies `httpOnly` (via Route Handlers do Next.js fazendo proxy para a API). Registrado aqui como débito técnico a revisitar, não bloqueia o MVP.

## Testado manualmente no navegador em 2026-09-17

Fluxo completo, com o usuário de teste fixo (`teste@email.com`):
1. `/` → redireciona para `/login` (sem sessão)
2. Login com e-mail/senha → transição para tela de MFA
3. Código MFA (obtido do log da API) → redireciona para `/dashboard`
4. Dashboard mostrou os números reais do banco (`Saldo total: R$ 565,10`, `Gastos do mês: R$ 534,90`, `Entradas do mês: R$ 300,00`) — batendo exatamente com o estado deixado pelos testes do módulo de Importação
5. Navegação para `/cartoes` (placeholder) e `/perfil` (dados reais do usuário) funcionando, sessão mantida entre páginas
6. "Sair" → limpa a sessão e redireciona para `/login`
7. Acesso direto a `/dashboard` sem sessão → redireciona para `/login` (guarda de rota funcionando)

## Pendências

- Tema claro/escuro: variáveis CSS prontas, falta o botão de toggle
- Tokens em `localStorage` (ver decisão técnica acima)
- Navbar não tem os submenus de "Relatórios" (Categorias/Comparação/Evolução) e "Contas" (Contas/Cartões) como dropdown — hoje são links diretos únicos; os wireframes previam dropdown
- Próximos passos: telas reais de Contas, Cartões, Transações, Relatórios e Importação (hoje placeholders)
