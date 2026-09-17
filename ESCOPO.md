# ESCOPO DE PROJETO

## Objetivo Geral
- Controle financeiro pessoal e seguro
- Conta pessoal com e-mail próprio
- Controle simples de gastos, entradas, contas, investimentos
- Separação por categorias, formas de pagamento, entre outros
- Controle de fatura de cartão de crédito
- Possuir capacidade de importação via ofx, xlsx ou csv
- Possui relatórios de gastos
- Aplicação multiplataforma: Web e Aplicativo

## Escopo básico
1. Login com e-mail válido
2. Usuário cadastra uma conta bancária
3. Usuário cadastra um cartão de crédito e associa a uma instituição financeira
4. Usuário cadastra uma transação com as informações específicas
5. Usuário pode consultar no mesmo instante em dashboard, relatórios etc

## Autenticação
- Autenticação por e-mail válido
- Deve exigir MFA por token enviado por e-mail durante o logon
- `Processo de cadastro`:
  - O usuário clica em Cadastro
  - Uma tela solicita o nome, sobrenome e e-mail válido
  - Um token com duração de 30 minutos é enviado por e-mail para finalizar o cadastro
  - O link vai para tela de cadastro de senha + confirmação de senha
  - O usuário é redirecionado automaticamente para tela de login novamente
- `Processo de Esqueci a senha`:
  - O usuário clica em 'esqueci a senha'
  - Uma tela solicita o e-mail do usuário
  - Um token com duração de 5 minutos é enviado por e-mail para alterar a senha
  - O link vai para tela de cadastro de senha + confirmação de senha
  - O usuário é redirecionado automaticamente para tela de login novamente
- `Processo de alteração de senha`:
  - Quando autenticado, o usuário seleciona o seu perfil e a opção "Alterar a senha"
  - O mesmo processo disparado no "Esqueci a senha" é utilizado aqui também.
  - Ao fim do processo de cadastro de nova senha, o usuário deve ser automaticamente "deslogado" de todas as sessões do sistema

## Controle de contas bancárias
- O usuário clica em "Nova Conta"
- É solicitado um `Nome`, `Instituição financeira`, `Saldo inicial (opcional)`, `Tipo de conta`
- Posso transferir dinheiro entre minhas contas cadastradas
- Posso consultar histórico de saldo
- Posso modificar informações após cadastro

## Cartões de crédito
- O usuário clica em "Adicionar cartão"
- É solicitado `Nome`, `Instituição Financeira`, `Limite`, `Data de fechamento`, `Data de vencimento`
- Compras no período equivalente são daquele mês
- Deve existir a opção de `Liquidar fatura` com a opção `Usar saldo` de uma das contas cadastradas
- Notificar no painel se estiver atrasada ou próximo do vencimento

## Transações
- Deve ter formas de visualização `Lista`ou `Tabela`
- O usuário clica em "Adicionar transação"
- É solicitado `Valor`, `Descrição`, `Data`, `Categoria`, `Forma de Pagamento`
- Deve existir a opção `Avançado` que exibe as opções `Transação recorrente`, `Parcelado` e `Ignorar transação` para que não contabilize no relatório
- Se for recorrente, esse valor será debitado todos os meses na mesma data e valor
- Se for "Parcelado", o usuário deve apontar quantidade de parcelas e o cálculo é feito automaticamente

## Dados pré-cadastrados
- Todas as contas de usuários já devem ter dados previamente cadastrados:
- `Categorias`:
  - Alimentação
  - Assinaturas
  - Moradia
  - Compras
  - Educação
  - Fitness e Esportes
  - Impostos e taxas
  - Mercado
  - Outros
  - Serviços
  - Transporte
  - Viagens
- Usuário tem permissões para criar outras categorias e subcategorias
- `Instituições Financeiras`:
  - Banco do Brasil
  - Banco do Nordeste
  - Banco Mercantil do Brasil
  - Banrisul
  - BMG
  - Bradesco
  - BRB
  - BTG Pactual
  - BS2
  - BV
  - C6 Bank
  - Caixa
  - Citibank
  - Clear
  - Cora
  - Daycoval
  - Digio
  - HSBC
  - Inter
  - Itaú
  - Mercado Pago
  - Modal
  - Neon
  - Next
  - Nomad
  - Nubank
  - Original
  - PagBank
  - Pan
  - PicPay
  - Rico
  - Safra
  - Santander
  - Sicoob
  - Sicredi
  - Stone
  - Votorantim
  - Warren
  - XP Investimentos
- Se não existir na lista, o usuário pode cadastrar e importar um ícone do banco
- As instituições financeiras devem exibir seus ícones/logos na lista para facilitar a identificação visual (adicionado em 2026-09-17)

## Interface
- A interface deve ser simples e responsiva
- Possibilitar tema claro e escuro
- O menu deve ser superior navbar fixo e responsivo
- O navbar deve possuir os seguintes menus e submenus:
  - `Dashboard`
  - `Transações`
  - `Relatórios`
    - `Categorias`
    - `Comparação`
    - `Evolução de gastos`
  - `Contas`
    - `Contas`
    - `Cartões de crédito`
  - `Categorias`
  - `Configurações`
    - `Importar dados`
  - `Meu nome (iniciais)`
    - `Meu perfil`
    - `Sair`