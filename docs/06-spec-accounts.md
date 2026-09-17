# Especificação — Módulo Contas

> Documentação "as-built" do módulo de contas bancárias implementado em `apps/api/src/accounts`, testado ponta a ponta em 2026-09-17. Todos os endpoints exigem `Authorization: Bearer <accessToken>` e são sempre escopados ao usuário autenticado (uma conta de outro usuário retorna `403`/`404`).

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/accounts` | Lista as contas não arquivadas do usuário, com a instituição incluída |
| POST | `/accounts` | Cria uma conta. `currentBalance` inicia igual a `initialBalance` (padrão 0) |
| GET | `/accounts/:id` | Detalha uma conta |
| PATCH | `/accounts/:id` | Edita `name`/`institutionId`/`type` — saldo não é editável por aqui |
| DELETE | `/accounts/:id` | Arquiva (soft delete, `archivedAt`) — `204`, preserva histórico |
| GET | `/accounts/:id/balance-history` | Snapshots diários de saldo, ordenados por data |
| POST | `/transfers` | Transfere valor entre duas contas do usuário |
| GET | `/transfers` | Lista as transferências do usuário |

## Regras implementadas

- **Saldo (`currentBalance`)** é mantido pela API, nunca editado diretamente: muda só por transferência (e, no próximo módulo, por transações).
- **Snapshot de saldo**: a cada criação de conta ou transferência, é feito um *upsert* do snapshot do dia (`AccountBalanceSnapshot`, único por `accountId + snapshotDate`) — não um histórico de cada movimento, mas o saldo consolidado do dia.
- **Transferência**: `fromAccountId` e `toAccountId` precisam ser diferentes (`400` se iguais) e pertencer ao usuário autenticado; debita/credita as duas contas numa transaction do Postgres.
- **Arquivamento** é soft-delete: a conta some da listagem (`GET /accounts`), mas continua acessível por `GET /accounts/:id` e mantém histórico/transferências associadas.

## Exemplo real testado

```
POST /accounts { name: "Conta Corrente", institutionId: "<uuid Nubank>", type: "CORRENTE", initialBalance: 1000 }
POST /accounts { name: "Reserva", institutionId: "<uuid Itaú>", type: "POUPANCA", initialBalance: 500 }

POST /transfers { fromAccountId: "<Conta Corrente>", toAccountId: "<Reserva>", amount: 200, date: "2026-09-17" }

GET /accounts
→ Conta Corrente: currentBalance "800"
→ Reserva:        currentBalance "700"

GET /accounts/<Conta Corrente>/balance-history
→ [{ balance: "800", snapshotDate: "2026-09-17" }]
```

## Bug encontrado e corrigido durante o teste

O seed (`prisma/seed.ts`) usava IDs customizados tipo `seed-institution-Nubank` em vez de UUID real, para viabilizar `upsert` idempotente. Isso quebrava a validação `@IsUUID()` do `institutionId` no `CreateAccountDto`. Corrigido: o seed agora busca por `name` (`findFirst` + `create`/`update`) e deixa o Prisma gerar o UUID padrão — consistente com o restante do schema.

## Pendências / próximos módulos

- Endpoint `GET /institutions` (listar instituições pré-cadastradas + custom) ainda não existe — por ora, o `institutionId` precisa ser obtido diretamente do banco. Fica para quando implementarmos o módulo de Contas no frontend ou um módulo dedicado de Instituições.
- Tipo de conta (`AccountType`: `CORRENTE`, `POUPANCA`, `CARTEIRA`) ainda não foi validado com o usuário quanto à nomenclatura final (ponto já sinalizado na Fase 2).
- Sem testes automatizados ainda (mesma pendência do módulo Auth).
