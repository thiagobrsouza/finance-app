# Fase 3 — Setup do projeto

## O que foi montado

Monorepo com **pnpm workspaces** + **Turborepo**:

```
apps/
  api/       -> NestJS (schema Prisma completo + seed) — só o esqueleto, módulos (Auth, Accounts...) ficam para a Fase 4
  web/       -> Next.js (App Router) — página inicial placeholder
  mobile/    -> Expo (React Native) — tela placeholder
packages/
  shared/    -> categorias, instituições financeiras (com domínio p/ ícone) e formas de pagamento pré-cadastradas
```

Outros arquivos de raiz: `turbo.json`, `pnpm-workspace.yaml`, `.prettierrc.json`, `.env.example`, `docker-compose.yml` (Postgres para desenvolvimento local), `.github/workflows/ci.yml` (lint + build no push/PR para `main`).

O `docker-compose.yml` de produção (API + Web + Traefik/Nginx na VPS) fica para a Fase 4, quando as imagens Docker de cada app existirem.

## Banco de dados

`apps/api/prisma/schema.prisma` implementa todas as entidades definidas em [`02-modelagem-dados.md`](02-modelagem-dados.md). `apps/api/prisma/seed.ts` popula:
- 12 categorias pré-cadastradas
- 38 instituições financeiras, cada uma com um campo `domain` (usado para resolver o ícone via serviço de logo — ver estratégia em `02-modelagem-dados.md`)
- 6 formas de pagamento fixas (Dinheiro, Débito, Crédito, Pix, Boleto, Transferência)

## Como rodar localmente (quando formos para a Fase 4)

```bash
pnpm install
docker compose up -d          # sobe o Postgres local
cp .env.example .env          # e ajustar DATABASE_URL/segredos
pnpm db:migrate                # cria as tabelas a partir do schema.prisma
pnpm db:seed                   # popula categorias, instituições e formas de pagamento
pnpm dev                       # roda api + web (e mobile via `pnpm --filter mobile dev`)
```

## Pendências para revisão antes da Fase 4

1. **Domínios das instituições** (`packages/shared/src/institutions.ts`): mapeei o domínio oficial de cada uma das 38 instituições do escopo para a resolução de ícone — vale uma conferência rápida, alguns (Next, Modal, Votorantim) podem ter mudado de domínio/marca.
2. Nenhuma dependência foi instalada ainda (`pnpm install` não foi rodado) — não executei porque é a primeira mudança "pesada" do projeto e prefiro confirmar com você antes.
3. Módulos reais da API (Auth, Accounts, Cards, Transactions...) ainda não existem — `app.module.ts` está vazio de propósito, conforme o plano de implementação incremental por módulo da Fase 4.
