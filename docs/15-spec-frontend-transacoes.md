# Especificação — Frontend Web: tela de Transações

> Testada ponta a ponta no navegador em 2026-09-17. Tela mais complexa do frontend até aqui.

## O que foi construído

Backend: dois endpoints novos que faltavam para o formulário funcionar — `GET /categories` (pré-cadastradas + custom do usuário, com subcategorias aninhadas) e `GET /payment-methods` (lista fixa).

Frontend `/transacoes`:
- Toggle **Lista**/**Tabela** (mesmo dado, dois layouts — lista em cards, tabela com cabeçalho de colunas)
- Filtro por tipo (Despesas/Receitas/Todos)
- Painel lateral "Nova transação" (`TransactionForm.tsx`, componente reutilizável): toggle Despesa/Receita, valor, descrição, data, categoria (achatada com indentação para subcategorias), forma de pagamento — e a **conta ou o cartão trocam dinamicamente** conforme a forma de pagamento escolhida exigir cartão ou não (`paymentMethod.requiresCreditCard`)
- Seção "Avançado": Única / Recorrente (dia do mês) / Parcelado (nº de parcelas) + checkbox "Ignorar transação"
- Cada linha tem "Ignorar"/"Incluir" e "Excluir" (confirmação inline, mesmo padrão das outras telas)

## Testado manualmente no navegador em 2026-09-17

1. Lista carregou as 7 transações reais já existentes no banco (parcelas, débito, pix, etc.) com categoria/forma de pagamento corretas
2. Criação de transação simples (Café, R$ 25, Dinheiro) → apareceu na lista imediatamente
3. "Ignorar" → mostrou `(ignorada)` e opacidade reduzida na linha
4. "Excluir" com confirmação inline → linha some, **saldo da conta restaurado exatamente** (confirmado em `/contas`)
5. Alternância Lista/Tabela → visual conferido por screenshot, bate com o wireframe
6. Fluxo parcelado pela UI: forma de pagamento "Crédito" → campo trocou de "Conta" para "Cartão" automaticamente; parcelamento de R$ 60 em 2x gerou duas transações de R$ 30 em meses consecutivos, cada uma com o rótulo `(1/2)`/`(2/2)` — testado e depois removido (limpeza)

## Pendências

- Filtro de categoria/conta/cartão/período (`from`/`to`) não tem UI ainda — o backend já suporta via query params, só falta expor
- Edição de transação (`PATCH`) não tem UI — só criação, ignorar e exclusão
- "Excluir" numa transação parcelada/recorrente remove só aquela ocorrência (mesma limitação já documentada no backend); a UI não avisa isso ao usuário ainda
