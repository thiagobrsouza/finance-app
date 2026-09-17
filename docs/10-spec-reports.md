# Especificação — Módulo Relatórios / Dashboard

> Documentação "as-built" de `apps/api/src/reports`, testado ponta a ponta em 2026-09-17. Fecha o ciclo do MVP: agrega os dados reais criados pelo módulo de Transações.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/reports/by-category` | `?from=&to=&type=EXPENSE\|INCOME` (padrão `EXPENSE`) — totais agrupados por categoria |
| GET | `/reports/comparison` | `?month=YYYY-MM` (padrão: mês atual) — compara o mês informado com o anterior |
| GET | `/reports/evolution` | `?months=N` (padrão 6, máx 24) — série mensal de receitas/despesas |
| GET | `/dashboard/summary` | Saldo total, gastos/entradas do mês, alertas de fatura |

## Regras

- Todas as agregações **excluem transações com `ignoreInReports: true`** — é exatamente para isso que a flag existe (o dinheiro continua contando no saldo/fatura, só não entra nos relatórios).
- `by-category`: `groupBy` no Postgres via Prisma, uma única query; nomes de categoria resolvidos depois.
- `comparison`/`evolution`: usam o mesmo helper de totais por período (`periodTotals`), que agrupa por `type` (INCOME/EXPENSE) dentro do intervalo do mês.
- `dashboard/summary.totalBalance`: soma de `Account.currentBalance` das contas não arquivadas (não é "patrimônio líquido" — não subtrai fatura em aberto de cartão, é só o saldo em conta).
- `dashboard/summary.invoicesOverdue` / `invoicesDueSoon`: reaproveita o cálculo de status dinâmico do módulo de Cartões (`withDerivedStatus`, extraído para `credit-cards/invoice-status.util.ts` nesta implementação). Antes de calcular, garante que a fatura do ciclo atual de cada cartão ativo existe (mesma criação preguiçosa do módulo de Cartões). "Próximo do vencimento" = vencimento nos próximos 7 dias e ainda não paga.

## Testado manualmente em 2026-09-17

Reaproveitando os dados criados no teste do módulo de Transações (Supermercado R$100 em conta, Notebook R$900 em 3x no cartão):

- `GET /reports/by-category` → `[{ categoryName: "Mercado", total: 1000 }]` (100 + 300 + 300 + 300, todas na categoria Mercado)
- `GET /reports/comparison` (mês atual = setembro) → `{ current: { month: "2026-09", expense: 400 }, previous: { month: "2026-08", expense: 0 } }` — bate: R$100 (supermercado) + R$300 (1ª parcela, vencendo em setembro)
- `GET /reports/comparison?month=2026-10` → `expense: 300` (só a 2ª parcela, que cai em outubro)
- `GET /reports/evolution?months=3` → `[jul: 0, ago: 0, set: 400]` (só considera até o mês atual, parcelas futuras não aparecem numa janela retroativa)
- `GET /dashboard/summary` → `{ totalBalance: 400, monthExpense: 400, monthIncome: 0, invoicesOverdue: 0, invoicesDueSoon: 0 }` — bate com o saldo real da conta e com a fatura de setembro (vence dia 27, mais de 7 dias à frente do teste, então corretamente não conta como "próxima do vencimento")
- `GET /reports/by-category?type=INCOME` → `[]` (nenhuma transação de receita criada ainda)

## Refatoração feita neste módulo

`withDerivedStatus` (cálculo de status de fatura: OPEN/CLOSED/PAID/OVERDUE a partir das datas) estava só dentro de `credit-cards.service.ts`; extraí para `credit-cards/invoice-status.util.ts` para reusar aqui no dashboard sem duplicar a lógica.

## Pendências

- Este é o último módulo do MVP conforme o plano original (Auth → Contas → Cartões → Transações → Relatórios → Importação). Falta apenas **Importação de dados** (OFX/XLSX/CSV) para fechar o backend do MVP.
- Frontend (Next.js) e mobile (Expo) ainda são só placeholders — nenhuma tela real foi construída, só a API.
