# Especificação — Módulo Importação de Dados

> Documentação "as-built" de `apps/api/src/imports`, testado ponta a ponta em 2026-09-17. Último módulo do backend do MVP.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/imports` | Upload multipart (`file`) de `.csv`, `.xlsx` ou `.ofx` → gera um preview, **sem persistir nada** |
| POST | `/imports/:previewId/confirm` | `{ selectedIndexes, accountId, categoryId, paymentMethodId }` → persiste as transações selecionadas |

## Formatos suportados e como são lidos

- **CSV** (`papaparse`): espera colunas de cabeçalho reconhecíveis (case-insensitive) — data: `data`/`date`/`dt`; descrição: `descricao`/`descrição`/`description`/`histórico`/`memo`; valor: `valor`/`amount`/`value`. Aceita datas `DD/MM/YYYY` ou `YYYY-MM-DD`, e valores no formato BR (`1.234,56`) ou US (`1234.56`).
- **XLSX** (`xlsx`/SheetJS): lê a primeira aba da planilha, mesma lógica de reconhecimento de colunas do CSV (função compartilhada `rowsToParsedResult`).
- **OFX**: parser próprio (regex), sem dependência externa — extrai cada bloco `<STMTTRN>…</STMTTRN>`, lendo `DTPOSTED` (data), `TRNAMT` (valor, com sinal) e `MEMO`/`NAME` (descrição).

Em todos os formatos, **valor negativo → `EXPENSE`, valor positivo → `INCOME`** (o preview já devolve `amount` sempre positivo + o `type` derivado do sinal). Linhas com data/valor/descrição ausentes ou inválidos não quebram o processo — viram um item em `warnings` e são excluídas do preview.

## Fluxo (preview → confirmação)

1. `POST /imports`: o arquivo é parseado **na hora**, nada é gravado no banco. O preview (linhas parseadas + avisos) fica em memória (`Map` no processo da API), associado ao `userId` e a um `previewId` (UUID), com **TTL de 30 minutos**.
2. `POST /imports/:previewId/confirm`: recebe os **índices** das linhas que o usuário decidiu importar (a tela deixa desmarcar linhas problemáticas) + `accountId`/`categoryId`/`paymentMethodId` (aplicados a todas as linhas selecionadas — sem mapeamento de categoria por linha nesta primeira versão). Cada linha vira uma transação de verdade via `TransactionsService.create` — ou seja, **reaproveita toda a validação e o efeito no saldo da conta** já testados no módulo de Transações, sem duplicar lógica.
3. O preview é apagado após a confirmação (uso único) — uma segunda tentativa de confirmar o mesmo `previewId` retorna `404`.

## ⚠️ Limitação conhecida: preview em memória

O preview vive em memória local do processo Node, não no banco. Funciona bem para um único servidor (o cenário atual), mas **quebra num deploy com múltiplas instâncias** (preview criado numa instância não é visto pela outra) — se a VPS um dia escalar horizontalmente, isso precisa virar uma tabela temporária no Postgres (ou Redis). Documentado aqui para não esquecer.

## Testado manualmente em 2026-09-17

- **CSV**: 3 linhas (1 receita, 1 despesa, 1 inválida) → preview trouxe as 2 válidas certas e sinalizou a inválida em `warnings`; confirmação das 2 ajustou o saldo da conta corretamente (`400 → 655`).
- **OFX**: 2 transações (`<STMTTRN>`) parseadas corretamente (datas `YYYYMMDD` convertidas, valores com sinal → `type` certo); confirmação de **apenas uma das duas** (seleção parcial) ajustou o saldo exatamente como esperado (`655 → 565.10`).
- Reuso de um `previewId` já confirmado → `404` corretamente.

## Pendências

- Sem teste do formato `.xlsx` ainda (a lógica é idêntica à do CSV após a leitura da planilha, então o risco é baixo, mas fica registrado).
- Mapeamento de categoria por transação (hoje é uma categoria única para todo o lote) fica para quando o frontend definir essa tela.
- Preview em memória (ver limitação acima).

## MVP do backend: concluído

Com este módulo, todos os módulos previstos no plano original (Auth → Contas → Cartões → Transações → Relatórios → Importação) estão implementados e testados. O que resta do projeto é construir o frontend (Next.js) e o app mobile (Expo) — hoje ambos são só placeholders.
