# Especificação — Módulo Cartões de Crédito

> Documentação "as-built" de `apps/api/src/credit-cards`, testado ponta a ponta em 2026-09-17. Todos os endpoints exigem `Authorization: Bearer <accessToken>` e são escopados ao usuário autenticado.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/credit-cards` | Lista os cartões não arquivados do usuário |
| POST | `/credit-cards` | Cria um cartão (`name`, `institutionId`, `limit`, `closingDay`, `dueDay`) |
| GET | `/credit-cards/:id` | Detalha um cartão |
| PATCH | `/credit-cards/:id` | Edita o cartão |
| DELETE | `/credit-cards/:id` | Arquiva (soft delete) — `204` |
| GET | `/credit-cards/:id/invoices` | Lista o histórico de faturas (cria a atual se ainda não existir) |
| GET | `/credit-cards/:id/invoices/current` | Fatura do ciclo em aberto (cria sob demanda) |
| POST | `/invoices/:id/pay` | Liquida a fatura: `{ method: "ACCOUNT_BALANCE", accountId }` |

## Cálculo do ciclo de fatura

Implementado em `credit-cards/invoice-period.util.ts`, sem job agendado — o período "atual" é calculado sob demanda a partir de `closingDay`/`dueDay` do cartão e da data de hoje:

- Se hoje ainda não passou do dia de fechamento deste mês, o ciclo atual fecha **este mês**.
- Senão, o ciclo atual fecha **no próximo mês**.
- Se `dueDay >= closingDay`, o vencimento é no mesmo mês do fechamento; senão, no mês seguinte (padrão comum: fecha dia 28, vence dia 5 do mês seguinte).
- Dias como 31 em meses menores são ajustados (clamp) para o último dia do mês, evitando estourar para o mês seguinte por acidente.

A fatura (`Invoice`) é criada de forma preguiçosa (lazy): só existe no banco quando alguém consulta `/invoices` ou `/invoices/current` pela primeira vez naquele ciclo — chave única `(creditCardId, referenceMonth)` evita duplicar.

**Status exibido** (`OPEN`/`CLOSED`/`PAID`/`OVERDUE`) é sempre recalculado na leitura, nunca lido cru do banco: `PAID` se `paidAt` setado; senão `OVERDUE` se hoje passou do vencimento; senão `CLOSED` se hoje passou do fechamento; senão `OPEN`.

## Liquidação de fatura

Único método suportado hoje: `ACCOUNT_BALANCE` (usar saldo de uma conta do usuário), conforme o escopo. Debita `invoice.totalAmount` da conta informada (numa transaction), marca a fatura como `PAID` com `paidAmount`/`paidAt`/`paidFromAccountId`, e atualiza o snapshot de saldo do dia. Retorna `400` se a fatura já estiver paga ou se a conta não pertencer ao usuário.

## ⚠️ Pendência importante

**`totalAmount` da fatura está sempre zerado** — ele deveria ser a soma das transações no cartão dentro do ciclo, mas o módulo de Transações ainda não existe. Ou seja, hoje dá pra criar cartão, consultar a fatura (vazia) e "liquidar" uma fatura de R$ 0,00. Isso será resolvido quando o módulo de Transações for implementado (próximo passo natural): toda transação com forma de pagamento "Crédito" precisa ser associada à `Invoice` do ciclo correspondente e recalcular `totalAmount`.

## Testado manualmente em 2026-09-17

Fluxo completo: criar cartão (Nubank, fecha dia 20, vence dia 27) → `GET /invoices/current` gerou a fatura de setembro/2026 corretamente (fechamento 20/09, vencimento 27/09, status `OPEN`, pois hoje era 17/09) → `POST /invoices/:id/pay` liquidou com sucesso → segunda tentativa de pagamento retornou `400` corretamente → `PATCH` e `DELETE` (arquivar) testados.

## Próximos módulos

- Transações (próximo passo): vai preencher `totalAmount` das faturas de verdade.
- Notificação de fatura atrasada/próxima do vencimento no dashboard (in-app, conforme decisão do usuário) depende do módulo de Relatórios/Dashboard.
