# Especificação — Módulo Transações

> Documentação "as-built" de `apps/api/src/transactions`, testado ponta a ponta em 2026-09-17. O módulo mais complexo até aqui: integra com Contas (saldo) e Cartões de Crédito (fatura).

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/transactions` | Lista com filtros `?from=&to=&categoryId=&accountId=&creditCardId=&type=` |
| POST | `/transactions` | Cria transação simples, parcelada ou recorrente |
| GET | `/transactions/:id` | Detalha |
| PATCH | `/transactions/:id` | Edita os dados da ocorrência (não reestrutura parcelamento/recorrência) |
| DELETE | `/transactions/:id` | Remove uma ocorrência, revertendo o efeito no saldo/fatura |
| PATCH | `/transactions/:id/ignore` | `{ ignore: true\|false }` — marca para não entrar nos relatórios |

## Regra de forma de pagamento × destino

O `paymentMethodId` determina se a transação exige `accountId` ou `creditCardId` (nunca os dois): `PaymentMethod.requiresCreditCard` (true só para "Crédito", por enquanto). A API valida e rejeita (`400`) combinações inconsistentes (ex: forma "Crédito" sem `creditCardId`).

## Parcelamento

`advanced.installment.count` gera **N transações** vinculadas a um `InstallmentGroup`, uma por mês (`date` avança 1 mês por parcela, com clamp de dia como no cálculo de fatura). O valor é dividido igualmente, com a última parcela absorvendo a diferença de arredondamento (ex: R$ 100 em 3x → R$ 33,33 + R$ 33,33 + R$ 33,34).

**Testado**: compra de R$ 900 em 3x no cartão gerou 3 transações de R$ 300, cada uma na fatura do mês correspondente à sua própria data (setembro, outubro, novembro) — cada fatura ficou com `totalAmount: "300"`.

## Recorrência

`advanced.recurring.dayOfMonth` (+ `endDate` opcional) cria uma `RecurringRule` e a **primeira ocorrência** já é criada e aplicada imediatamente. As ocorrências seguintes são geradas por um **cron job diário** (`RecurringTransactionsJob`, `@nestjs/schedule`, `EVERY_DAY_AT_1AM`): busca regras `active` com `nextRunDate <= hoje`, cria a transação do mês, avança `nextRunDate` em +1 mês. Se `endDate` for ultrapassada, a regra é desativada (`active: false`) em vez de gerar mais ocorrências.

## Efeito em saldo/fatura

- **Conta**: `currentBalance` ajustado (`+` para `INCOME`, `-` para `EXPENSE`); snapshot do dia atualizado (mesma simplificação do módulo de Contas: representa o saldo atual, não um replay histórico por data retroativa).
- **Cartão**: a transação é vinculada à `Invoice` do ciclo correspondente à **data da transação** (não à data de hoje) — importante para lançamentos retroativos ou parcelas futuras. `Invoice.totalAmount` é ajustado incrementalmente (`+` para `EXPENSE`, `-` para `INCOME`, ex: estorno).
- **Editar (`PATCH`)**: reverte o efeito antigo por completo (saldo/fatura antigos) e reaplica o novo — inclusive se a transação mudar de conta para cartão, mudar de valor, ou a data mudar de ciclo de fatura. Testado: editar de R$ 30 para R$ 40 ajustou o saldo corretamente (370 → 360).
- **Remover (`DELETE`)**: reverte o efeito e apaga a linha. Testado: saldo voltou exatamente ao valor anterior à criação.
- **Ignorar (`ignoreInReports`)**: **não afeta** saldo/fatura — é só uma flag para os relatórios (módulo futuro) excluírem a transação das agregações.

## Testado manualmente em 2026-09-17

- Transação simples (débito, conta): saldo `500 → 400` ✅
- Parcelamento 3x de R$ 300 no cartão: 3 transações + 3 faturas mensais com `totalAmount` correto ✅
- Recorrente: `RecurringRule` criada com `nextRunDate` = +1 mês, primeira ocorrência aplicada ✅
- `PATCH` (editar valor): reversão + reaplicação corretas ✅
- `PATCH /ignore`: não altera saldo ✅
- `DELETE`: reversão completa do efeito ✅
- Validações: forma "Crédito" sem `creditCardId` → `400`; `recurring` + `installment` juntos → `400` ✅
- Filtro `?type=EXPENSE` retornou a contagem correta ✅

## Pendências / próximos módulos

- O cron de recorrência (`EVERY_DAY_AT_1AM`) ainda não foi testado em execução real (só a lógica de criação manual da primeira ocorrência) — vale validar quando o servidor rodar por mais de um ciclo, ou escrever um teste unitário chamando `RecurringTransactionsJob.run()` diretamente.
- `DELETE` em uma transação parcelada/recorrente remove **só aquela ocorrência** — "excluir todas as parcelas futuras" ou "encerrar a recorrência" ainda não têm endpoint dedicado; fica para quando o frontend definir esse fluxo.
- Módulo de Relatórios (próximo passo natural) vai consumir `ignoreInReports`, `categoryId` e as datas para os três relatórios do escopo (Categorias, Comparação, Evolução).
