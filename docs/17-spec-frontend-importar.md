# Especificação — Frontend Web: tela de Importar Dados

> Testada ponta a ponta em 2026-09-17. Fecha as 5 telas principais + a última tela secundária relevante do menu (falta só Categorias).

## O que foi construído

- `lib/api.ts` ganhou `api.upload()` — um caminho separado de `request()`, porque upload multipart não pode ter `Content-Type` fixado manualmente (o navegador precisa gerar o `boundary` sozinho); reaproveita a mesma lógica de refresh automático de sessão em `401`.
- `/configuracoes/importar`: dropzone (clique ou arrastar-e-soltar) → `POST /imports` → preview com checkboxes por linha (todas marcadas por padrão, dá pra desmarcar), avisos do parser em destaque, depois um formulário único (conta/categoria/forma de pagamento aplicados a todas as linhas selecionadas) → `POST /imports/:previewId/confirm`.

## Como foi testado (upload de arquivo em automação de navegador)

O ambiente de automação de navegador usado aqui não tem um seletor de arquivo nativo do SO disponível. Para testar o fluxo real (não só a lógica isolada), simulei a seleção de arquivo via JavaScript no console da página — criando um `File` real a partir de um `Blob` com conteúdo CSV, atribuindo via `DataTransfer` ao `<input type="file">` e disparando o evento `change` manualmente. Isso exercita o componente React, o `fetch`/`FormData` reais e a resposta real da API — só o clique físico no diálogo do SO é que foi substituído.

## Testado manualmente em 2026-09-17

1. CSV com 2 linhas (1 receita PIX R$ 200, 1 despesa R$ 75,50) → preview mostrou as duas corretamente, com checkboxes marcados
2. Confirmação das duas → `"2 transação(ões) importada(s) com sucesso."`
3. Saldo da conta atualizado corretamente: R$ 115,10 → R$ 239,60 (115,10 + 200 − 75,50)
4. Transações aparecem em `/transacoes` com a categoria/forma de pagamento escolhidas no formulário de confirmação
5. Transações de teste removidas depois — saldo voltou exatamente a R$ 115,10

## Pendências

- Sem teste de `.xlsx` e `.ofx` pela UI (a lógica é a mesma testada no backend — [docs/11-spec-imports.md](11-spec-imports.md) — e o parser CSV validado agora na UI usa o mesmo código compartilhado)
- Mapeamento de categoria por linha não existe (uma categoria só pra todo o lote), mesma limitação já documentada no backend
