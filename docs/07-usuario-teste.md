# Usuário de teste padrão

A partir de 2026-09-17, todos os testes manuais de API (feitos durante o desenvolvimento, com a API local do usuário rodando) usam este usuário fixo em vez de contas avulsas:

- **Nome**: Teste Teste
- **E-mail**: `teste@email.com`
- **Senha**: `Senha@123`

Esse usuário já está cadastrado e ativado no banco de desenvolvimento local. Ele possui uma conta bancária de exemplo ("Conta Teste", Nubank, saldo inicial R$ 500).

## Fluxo de teste (API rodando localmente, com MFA)

Como o MFA é obrigatório no login, e em desenvolvimento os e-mails não são enviados de verdade (sem `RESEND_API_KEY`), o token/código aparece no **log do terminal onde a API está rodando** — não no terminal do Claude Code. Ao testar um fluxo que dispara e-mail (signup, login, forgot-password), é preciso copiar o token/código de lá.
