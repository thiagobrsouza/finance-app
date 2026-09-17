# Especificação — Frontend Web: tela de Contas

> Testada ponta a ponta no navegador em 2026-09-17.

## O que foi construído

- **`GET /institutions`** (novo endpoint no backend, faltava desde o módulo de Contas — [docs/06-spec-accounts.md](06-spec-accounts.md) já registrava essa pendência): lista instituições pré-cadastradas + custom do usuário, usado no seletor do formulário.
- **`/contas`**: lista de contas em cards (ícone/logo da instituição via domínio, com fallback de iniciais — `InstitutionLogo`), formulário inline de "Nova conta", seção de transferência entre contas com formulário e histórico das últimas transferências.
- **`/contas/[id]`**: detalhe da conta — editar (nome/instituição/tipo), arquivar (com confirmação **inline**, não `window.confirm()` — ver decisão abaixo), e histórico de saldo num gráfico de linha em SVG puro (`BalanceChart`, sem depender de lib de gráficos).

## Decisão: sem `window.confirm()`

O primeiro rascunho da confirmação de arquivamento usava `confirm()` nativo do navegador. Troquei por um estado de confirmação inline no próprio card (mostra a pergunta + botões "Cancelar"/"Confirmar" no lugar dos botões de ação) — além de mais confiável para automação de testes, é a prática de UX recomendada hoje (diálogos nativos do navegador são inconsistentes entre navegadores e ruins de estilizar).

## Testado manualmente no navegador em 2026-09-17

1. Lista mostrou a conta real existente (Conta Teste, Nubank, R$ 565,10)
2. Criação de nova conta (Poupança Itaú, saldo inicial R$ 0) → apareceu na lista imediatamente
3. Transferência de R$ 150 entre as duas contas → saldos atualizados corretamente (R$ 565,10 → R$ 415,10 e R$ 0,00 → R$ 150,00), com o registro aparecendo na lista de transferências
4. Detalhe da conta: gráfico de histórico de saldo renderizou (mesma simplificação documentada no módulo de Contas — snapshot só do dia atual)
5. Edição de nome → salvo e refletido imediatamente
6. Arquivamento com confirmação inline → conta some da lista, redireciona para `/contas`

## Limitação conhecida

Depois de arquivar uma conta que já tinha uma transferência associada, o histórico de transferências mostra `?` no lugar do nome da conta arquivada (a busca de nome só olha as contas ativas, já que `GET /accounts` não retorna arquivadas por padrão). Não afeta o saldo/dado real, só a exibição do nome — ajustar quando o `GET /accounts` ganhar um parâmetro `includeArchived` ou a tela buscar contas arquivadas à parte.

## Pendências

- Sem paginação/busca na lista de contas (ok para poucas contas, mas não escala)
- Formulário de nova instituição customizada (upload de ícone) não existe — só usa o seletor com as pré-cadastradas
