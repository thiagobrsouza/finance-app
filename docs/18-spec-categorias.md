# Especificação — Categorias (backend + frontend)

> Testado ponta a ponta em 2026-09-17. Fecha a última tela pendente do menu principal — todas as telas do escopo agora têm uma versão funcional.

## Backend — endpoints novos

`GET /categories` já existia (Fase 4). Adicionados agora:

| Método | Rota | Descrição |
|---|---|---|
| POST | `/categories` | Cria categoria ou subcategoria custom (`name`, `icon?`, `color?`, `parentId?`) |
| PATCH | `/categories/:id` | Edita nome/ícone/cor — só de categorias custom (não pré-cadastradas) |
| DELETE | `/categories/:id` | Remove — só custom, só se **não tiver subcategorias nem transações vinculadas** |

Regras: uma subcategoria só pode ser criada sob uma categoria de nível 1 (não dá pra aninhar 3 níveis); categorias pré-cadastradas (`isSeeded`) nunca podem ser editadas/removidas pelo usuário — a API responde `403` se tentar.

## Frontend — `/categorias`

Lista todas as categorias (pré-cadastradas em cinza, sem ações; custom com "Editar"/"Excluir"), com subcategorias indentadas abaixo do pai. Formulário "+ Nova categoria" com nome, paleta de cores fixa (8 swatches) e seletor opcional de categoria pai.

## Bug de UX encontrado e corrigido durante o teste

Tentei excluir uma categoria custom ("Pets") que tinha uma subcategoria — a API corretamente respondeu `400 Bad Request` ("Remova as subcategorias antes de excluir esta categoria"), mas a tela **ficava travada** no estado de confirmação ("Excluir Pets? Cancelar / Confirmar") sem mostrar nenhum feedback do erro — porque o texto de erro só era renderizado na view normal do card, não na view de confirmação. Corrigido: em caso de erro, a mutation agora sai do estado de confirmação e volta pra view normal, onde a mensagem aparece.

## Testado manualmente em 2026-09-17

1. As 12 categorias pré-cadastradas carregam corretamente, sem botões de ação
2. Criação de categoria custom ("Pets") → aparece com Editar/Excluir
3. Criação de subcategoria ("Ração", pai = Pets) → aparece indentada sob "Pets"
4. Tentativa de excluir "Pets" com subcategoria → `400` corretamente bloqueado, **e agora a mensagem de erro aparece** (bug acima)
5. Exclusão de "Ração" (sem filhos) → sucesso
6. Edição de "Pets" → "Pets e Animais" → sucesso
7. Exclusão de "Pets e Animais" (agora sem filhos) → sucesso, lista volta ao estado original

## Pendências

- Sem seleção de ícone (só cor) — o campo `icon` existe no backend mas a UI não usa
- Sem indicação visual de quantas transações usam cada categoria antes de tentar excluir (só descobre o bloqueio ao tentar)
