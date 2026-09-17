# Especificação — Frontend Web: tela de Relatórios

> Testada ponta a ponta no navegador em 2026-09-17. Nenhum endpoint novo de backend foi necessário — os três relatórios (`/reports/by-category`, `/reports/comparison`, `/reports/evolution`) já existiam e estavam testados desde a Fase 4.

## O que foi construído

`/relatorios` com as três abas do wireframe (`Categorias`, `Comparação`, `Evolução de gastos`), todas com gráficos em **SVG puro** (sem lib de gráficos):

- **Categorias**: `CategoryPieChart.tsx` — gráfico de pizza desenhado calculando os arcos manualmente (trigonometria: `polarToCartesian` + `describeArc`), com legenda ao lado (cor, nome, valor, percentual). Toggle Despesas/Receitas reusando `type` do `by-category`.
- **Comparação**: mês atual vs. anterior lado a lado (cards), mais uma linha de variação (`+R$ x` / `-R$ x`, com % quando aplicável, cor verde/vermelha conforme piora ou melhora).
- **Evolução**: `EvolutionChart.tsx` — gráfico de barras agrupadas (receita/despesa) dos últimos 6 meses, eixo X com os meses.

## Testado manualmente no navegador em 2026-09-17

1. Categorias (despesas): inicialmente só "Mercado" (100%, círculo cheio) — criei uma transação de teste em "Transporte" (R$ 50) e o gráfico **dividiu corretamente em duas fatias** (96%/4%), confirmando que o cálculo do arco SVG funciona também para frações parciais, não só o caso trivial de 100%
2. Comparação: mês atual (Set/2026) mostrou despesas R$ 584,90 — bate exatamente com a soma manual das transações de setembro (R$ 300 + R$ 100 + R$ 50 + R$ 45 + R$ 89,90); mês anterior (Ago/2026) corretamente zerado
3. Evolução (6 meses): barras aparecem só em Set/2026 (único mês com dados), verde (receita R$ 300) menor que vermelho (despesa R$ 584,90), proporcional à escala máxima exibida
4. Transação de teste removida depois de validar os gráficos

## Pendências

- Sem seletor de período nas abas Categorias/Comparação (o backend aceita `from`/`to` e `month`, a UI usa sempre o padrão — mês atual / sem filtro de data)
- `Evolução` está fixa em 6 meses (o backend aceita `months` até 24) — sem seletor na UI
