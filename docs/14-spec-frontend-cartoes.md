# Especificação — Frontend Web: tela de Cartões de Crédito

> Testada ponta a ponta no navegador em 2026-09-17.

## O que foi construído

`/cartoes` segue o layout de duas colunas do wireframe: lista de cartões à esquerda (cartão selecionado destacado com o fundo teal da navbar), detalhe da fatura à direita.

- Lista de cartões + formulário inline "+ Adicionar cartão" (nome, instituição, limite, dia de fechamento/vencimento)
- Fatura atual do cartão selecionado: status (`Badge` colorido — aberto/fechada/paga/atrasada), valor total, tabela de transações daquele ciclo (filtra `GET /transactions?creditCardId=` pelo `invoiceId` da fatura em exibição)
- "Liquidar fatura" (seleciona conta, `POST /invoices/:id/pay`) — some automaticamente quando a fatura já está paga
- Arquivar cartão com confirmação inline (mesmo padrão da tela de Contas)

## Bug visual encontrado e corrigido

O card do cartão selecionado usava a classe `bg-navbar`, que **não existe** no Tailwind (a cor não foi registrada em `tailwind.config.ts` com esse nome) — resultado: nenhum fundo era aplicado e o texto branco ficava ilegível sobre o fundo claro da página. Corrigido para `bg-[var(--navbar)]` (sintaxe de valor arbitrário), mesmo padrão já usado no `Navbar.tsx`. Vale conferir se esse mesmo engano não se repete nas próximas telas.

## Testado manualmente no navegador em 2026-09-17

1. Cartão existente (Nubank Ultravioleta) carregado com a fatura real de setembro (R$ 300,00, transação "Notebook (1/3)" corretamente filtrada)
2. Liquidação da fatura usando a conta → status mudou para "Paga", formulário de liquidação some, saldo da conta debitado corretamente (R$ 415,10 → R$ 115,10, conferido em `/contas`)
3. Criação de um segundo cartão (Itaú Click) → apareceu na lista, selecionado automaticamente, fatura vazia mostrando "Nenhuma transação nesta fatura ainda."
4. Arquivamento do cartão de teste com confirmação inline → some da lista

## Pendências

- Sem edição de cartão (só criação/arquivamento) — a tela de Contas tem edição, aqui ainda não; considerar adicionar pelo mesmo padrão
- Sem histórico de faturas passadas na UI (o endpoint `GET /credit-cards/:id/invoices` existe e já é testado no backend, só falta expor na tela)
