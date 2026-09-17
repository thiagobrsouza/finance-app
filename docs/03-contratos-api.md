# Fase 2 — Contratos de API

> Endpoints REST propostos para a API NestJS, organizados por módulo. Prefixo base: `/api/v1`.
> Autenticação via `Authorization: Bearer <access_token>` (JWT), exceto onde marcado como público.

## Auth

| Método | Rota | Público | Descrição |
|---|---|---|---|
| POST | `/auth/signup` | sim | `{ firstName, lastName, email }` → dispara e-mail com token de cadastro (30 min) |
| POST | `/auth/signup/complete` | sim | `{ token, password, passwordConfirmation }` → define senha e ativa a conta |
| POST | `/auth/login` | sim | `{ email, password }` → se válido, dispara MFA por e-mail e retorna `{ mfaRequired: true, mfaSessionId }` |
| POST | `/auth/login/verify-mfa` | sim | `{ mfaSessionId, code }` → retorna `{ accessToken, refreshToken }` |
| POST | `/auth/refresh` | sim (refresh token) | `{ refreshToken }` → novo par de tokens |
| POST | `/auth/logout` | não | revoga o refresh token atual |
| POST | `/auth/forgot-password` | sim | `{ email }` → dispara token de reset (5 min) |
| POST | `/auth/reset-password` | sim | `{ token, password, passwordConfirmation }` → troca senha e revoga todas as sessões |
| POST | `/auth/change-password` | não | `{ currentPassword }` → dispara mesmo fluxo de token do reset, autenticado |
| GET | `/auth/me` | não | retorna perfil do usuário logado |

## Users

| Método | Rota | Descrição |
|---|---|---|
| PATCH | `/users/me` | atualiza nome, tema preferido |
| GET | `/users/me/theme` | (ou incluso em `/auth/me`) |

## Financial Institutions

| Método | Rota | Descrição |
|---|---|---|
| GET | `/institutions` | lista pré-cadastradas + custom do usuário |
| POST | `/institutions` | cria instituição custom `{ name, icon (upload) }` |

## Accounts

| Método | Rota | Descrição |
|---|---|---|
| GET | `/accounts` | lista contas do usuário (com `currentBalance`) |
| POST | `/accounts` | `{ name, institutionId, type, initialBalance? }` |
| GET | `/accounts/:id` | detalhe |
| PATCH | `/accounts/:id` | edita nome, instituição, tipo |
| DELETE | `/accounts/:id` | soft-delete (archive) |
| GET | `/accounts/:id/balance-history` | série histórica de saldo (para gráfico) |
| POST | `/transfers` | `{ fromAccountId, toAccountId, amount, date, description? }` |
| GET | `/transfers` | lista transferências |

## Credit Cards

| Método | Rota | Descrição |
|---|---|---|
| GET | `/credit-cards` | lista cartões do usuário |
| POST | `/credit-cards` | `{ name, institutionId, limit, closingDay, dueDay }` |
| GET | `/credit-cards/:id` | detalhe |
| PATCH | `/credit-cards/:id` | edita |
| DELETE | `/credit-cards/:id` | soft-delete |
| GET | `/credit-cards/:id/invoices` | lista faturas (histórico) |
| GET | `/credit-cards/:id/invoices/current` | fatura em aberto |
| POST | `/invoices/:id/pay` | `{ method: "ACCOUNT_BALANCE", accountId }` → liquida a fatura |

## Categories

| Método | Rota | Descrição |
|---|---|---|
| GET | `/categories` | lista pré-cadastradas + custom, com subcategorias aninhadas |
| POST | `/categories` | `{ name, icon?, color?, parentId? }` |
| PATCH | `/categories/:id` | edita (apenas custom) |
| DELETE | `/categories/:id` | remove (apenas custom, se não houver transações vinculadas) |

## Payment Methods

| Método | Rota | Descrição |
|---|---|---|
| GET | `/payment-methods` | lista fixa (somente leitura) |

## Transactions

| Método | Rota | Descrição |
|---|---|---|
| GET | `/transactions` | lista com filtros: `?from=&to=&categoryId=&accountId=&creditCardId=&type=&view=list\|table` |
| POST | `/transactions` | cria transação simples, recorrente ou parcelada (ver payload abaixo) |
| GET | `/transactions/:id` | detalhe |
| PATCH | `/transactions/:id` | edita (regras especiais se fizer parte de parcelamento/recorrência) |
| DELETE | `/transactions/:id` | remove — se parcelada/recorrente, pergunta de escopo (uma ocorrência vs. todas) resolvida no frontend |
| PATCH | `/transactions/:id/ignore` | `{ ignore: true\|false }` |

**Payload de criação (`POST /transactions`)**:
```json
{
  "amount": 150.00,
  "description": "Supermercado",
  "date": "2026-09-17",
  "categoryId": "uuid",
  "paymentMethodId": "uuid",
  "accountId": "uuid | null",
  "creditCardId": "uuid | null",
  "type": "EXPENSE",
  "advanced": {
    "recurring": { "dayOfMonth": 17, "endDate": null },
    "installment": { "count": 12 },
    "ignoreInReports": false
  }
}
```
`advanced.recurring` e `advanced.installment` são mutuamente exclusivos (validação no DTO com Zod/class-validator).

## Import (OFX / CSV / XLSX)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/imports` | upload do arquivo (multipart) → parse e retorna preview `{ transactions: [...], warnings: [...] }` sem persistir |
| POST | `/imports/:previewId/confirm` | `{ mappings, selectedTransactionIds }` → persiste as transações confirmadas pelo usuário |

## Reports

| Método | Rota | Descrição |
|---|---|---|
| GET | `/reports/by-category` | totais agrupados por categoria em um período |
| GET | `/reports/comparison` | comparação entre dois períodos (ex: mês atual vs. anterior) |
| GET | `/reports/evolution` | série temporal de gastos/receitas (para gráfico de evolução) |
| GET | `/dashboard/summary` | saldo total, gastos do mês, faturas próximas do vencimento/atrasadas (para o painel) |

## Convenções gerais

- Erros seguem formato `{ statusCode, message, errors?: [{ field, message }] }`
- Paginação em listagens: `?page=&pageSize=` com resposta `{ data: [...], total, page, pageSize }`
- Todos os valores monetários em `decimal` (string) para evitar problemas de ponto flutuante, moeda fixa BRL
- Datas em ISO 8601 (`YYYY-MM-DD`)
