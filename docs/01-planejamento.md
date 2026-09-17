# Fase 1 — Planejamento

> Baseado em [`ESCOPO.md`](../ESCOPO.md) e nas decisões confirmadas com o usuário em 2026-09-16.

## 1. Decisões de arquitetura (confirmadas)

| Decisão | Escolha |
|---|---|
| Mobile | React Native (Expo) |
| Backend | Node.js + NestJS |
| Banco de dados | PostgreSQL |
| Escopo de investimentos | Fora do MVP — fase futura |
| Serviço de e-mail (MFA/cadastro/reset) | Resend |

## 2. Stack proposta

### Monorepo
- **Turborepo** (ou Nx) para compartilhar tipos/DTOs e regras de validação entre `web`, `mobile` e `api`.
- Estrutura sugerida:
  ```
  apps/
    web/       -> Next.js (App Router)
    mobile/    -> Expo (React Native)
    api/       -> NestJS
  packages/
    shared/    -> tipos, DTOs, Zod schemas, constantes (categorias, instituições)
    ui/        -> design tokens / tema claro-escuro compartilhado
  ```

### Frontend Web
- **Next.js** + TypeScript
- **Tailwind CSS** + **shadcn/ui** (componentes acessíveis, fácil tema claro/escuro)
- **TanStack Query** para cache/state de dados do servidor
- **Zustand** para estado local leve (ex: tema, filtros de UI)
- **React Hook Form + Zod** para formulários (cadastro de conta, cartão, transação)

### Mobile
- **Expo (React Native)** + TypeScript
- **NativeWind** (Tailwind no RN) para reaproveitar tema/design tokens do web
- Mesma stack de data-fetching (TanStack Query) e formulários (RHF + Zod)
- Push notification nativa (Expo Notifications) para alertas de fatura — ver seção 5

### Backend
- **NestJS** + TypeScript
- **PostgreSQL** via **Prisma ORM** (migrations, type-safety)
- **Passport + JWT** (access + refresh token) para sessão
- **MFA por e-mail**: código OTP de 6 dígitos, expiração configurável (30 min cadastro / 5 min reset, conforme escopo), hash do código armazenado (nunca em texto puro)
- **Resend** para envio de e-mails transacionais (cadastro, MFA, reset de senha, alertas de fatura)
- **bcrypt/argon2** para hash de senha
- Importação de extratos:
  - CSV → `papaparse` ou `csv-parse`
  - XLSX → `xlsx` (SheetJS)
  - OFX → `ofx-js` ou parser próprio (formato OFX é razoavelmente simples)

### Infraestrutura / Hospedagem (confirmado)
- **VPS dedicada** com **Docker** (self-hosted)
  - `docker-compose` com serviços: `postgres`, `api` (NestJS), `web` (Next.js), reverse proxy (**Traefik** ou **Nginx**) para TLS (Let's Encrypt) e roteamento por domínio/subdomínio
  - Volumes persistentes para o Postgres e para uploads (ícones de instituições custom)
  - Deploy: build das imagens via GitHub Actions (ou script manual inicialmente) + `docker compose up -d` na VPS via SSH
  - Backups: dump agendado do Postgres (cron na VPS) — a detalhar na Fase 2/3
  - **Mobile**: Expo EAS Build + distribuição via TestFlight/Play Console (ou uso interno via Expo Go durante desenvolvimento) — não depende da VPS

### Qualidade
- **ESLint + Prettier** consistentes entre os 3 apps
- **Vitest/Jest** para testes unitários da API (regras de negócio: parcelamento, recorrência, fechamento de fatura)
- **Playwright** para testes E2E do fluxo crítico (cadastro, login com MFA, criar transação)
- CI (GitHub Actions) — a confirmar se o repositório será hospedado no GitHub

## 3. Modelagem de dados (alto nível — a detalhar na Fase 2)

Entidades principais identificadas no escopo:
- `User` (nome, sobrenome, e-mail, senha hash, tema preferido)
- `AuthToken` (tipo: cadastro/reset, hash do código, expiração, usado_em)
- `Account` (conta bancária: nome, instituição, saldo inicial, tipo, saldo atual calculado)
- `AccountBalanceHistory` (histórico de saldo)
- `CreditCard` (nome, instituição, limite, dia de fechamento, dia de vencimento)
- `Invoice` (fatura do cartão por período/mês, status: aberta/fechada/paga/atrasada)
- `Transaction` (valor, descrição, data, categoria, forma de pagamento, recorrente?, parcelado?, ignorar?, conta ou cartão associado)
- `Installment` (parcela individual de uma transação parcelada)
- `RecurringRule` (regra de recorrência de uma transação)
- `Category` / `Subcategory` (pré-cadastradas + custom por usuário)
- `FinancialInstitution` (pré-cadastradas + custom com upload de ícone)
- `Transfer` (transferência entre contas do próprio usuário)

Pontos que precisam de definição mais fina na Fase 2 (modelagem detalhada):
- Como "Ignorar transação" interage com parcelas/recorrência já geradas
- Regra exata de "liquidar fatura": ela vira uma `Transaction` de saída na conta usada?
- Formas de pagamento: é uma lista fixa (Dinheiro, Débito, Crédito, Pix, etc.) ou caminho custom por conta/cartão?

## 4. Segurança (pontos de atenção — projeto de dados financeiros pessoais)

- Dados sensíveis (saldo, valores) devem trafegar sempre via HTTPS; nunca logar valores/PII em logs de aplicação
- Senhas: hash com argon2id (ou bcrypt custo 12+)
- Tokens de MFA: hash + expiração + limite de tentativas (rate limit) para evitar brute force
- Ao trocar senha: invalidar todas as sessões ativas (JWT refresh tokens revogados) — já previsto no escopo
- Rate limiting geral na API (ex: `@nestjs/throttler`) contra brute force de login/MFA
- Considerar LGPD: como app pessoal (uso próprio), o risco é baixo, mas vale já nascer com boas práticas (dados criptografados em repouso quando possível, política de retenção)

## 5. Decisões confirmadas (2026-09-16)

1. **Notificação de fatura** — apenas in-app (badge/dashboard), sem push ou e-mail
2. **Formas de pagamento** — lista fixa pré-definida (a detalhar a lista exata na Fase 2: Dinheiro, Débito, Crédito, Pix, Boleto, Transferência, etc.)
3. **Moeda** — apenas BRL (Real)
4. **Hospedagem** — VPS dedicada com Docker (self-hosted, ver seção 2)
5. **Repositório Git** — inicializado localmente; GitHub ainda será criado pelo usuário (remoto a adicionar depois)

Pendente para a Fase 2:
- **Relatórios** — o escopo cita "Categorias", "Comparação", "Evolução de gastos" no menu, mas não detalha os gráficos/métricas de cada um — detalhar na especificação de UI
- Lista final e exata das formas de pagamento fixas

## 6. Próximos passos propostos

- **Fase 2 — Especificação detalhada**: modelagem de banco de dados (ERD completo), contratos de API (endpoints, DTOs), wireframes de baixa fidelidade das telas principais (login/cadastro/MFA, dashboard, contas, cartões, transações, relatórios)
- **Fase 3 — Setup do projeto**: scaffolding do monorepo, configuração de lint/CI, seed de categorias e instituições financeiras
- **Fase 4 — Implementação incremental**: por módulo (Auth → Contas → Cartões → Transações → Relatórios → Importação)

Nenhuma implementação será iniciada sem aprovação explícita a cada etapa, conforme regras do [`CLAUDE.md`](../CLAUDE.md).
