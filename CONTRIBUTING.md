# Como contribuir

Obrigado por ajudar no EditStream Pro!

## Antes de começar

1. Confira as issues abertas e evite duplicar propostas.
2. Para mudanças grandes, abra uma issue para discutir a abordagem.
3. Nunca inclua senhas, tokens, dados pessoais ou credenciais de serviços nos commits.

## Fluxo sugerido

1. Faça um fork do repositório.
2. Crie uma branch descritiva, por exemplo `docs/improve-readme` ou `fix/login-validation`.
3. Faça uma alteração pequena e focada.
4. Execute os comandos relevantes antes de enviar:

   ```bash
   pnpm check
   pnpm test
   pnpm build
   ```

5. Abra um pull request com resumo da alteração, motivo e testes executados.

Se algum comando falhar por falta de configuração local, informe isso claramente no pull request; não declare que os testes passaram sem executá-los.
