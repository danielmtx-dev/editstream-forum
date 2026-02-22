# Deploy do EditStream Pro na Vercel

Este guia explica como fazer deploy do projeto EditStream Pro na Vercel.

## Pré-requisitos

1. **Conta na Vercel** — Crie uma conta em https://vercel.com
2. **Repositório Git** — Faça upload do projeto para GitHub, GitLab ou Bitbucket
3. **Banco de Dados** — MySQL ou TiDB hospedado (recomendado: PlanetScale, Render, ou AWS RDS)
4. **Credenciais Manus** — Tenha as credenciais OAuth e Forge API prontas

## Passo 1: Preparar o Repositório Git

```bash
# Clone ou crie um repositório
git init
git add .
git commit -m "Initial commit: EditStream Pro"
git remote add origin https://github.com/seu-usuario/editstream-pro.git
git push -u origin main
```

## Passo 2: Criar Projeto na Vercel

1. Acesse https://vercel.com/new
2. Selecione seu repositório (GitHub, GitLab ou Bitbucket)
3. Clique em **Import**
4. Configure o projeto:
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`

## Passo 3: Configurar Variáveis de Ambiente

No painel da Vercel, vá para **Settings > Environment Variables** e adicione todas as variáveis listadas em `ENVIRONMENT_VARIABLES.md`:

### Obrigatórias:
- `DATABASE_URL` — String de conexão do banco de dados
- `JWT_SECRET` — Chave secreta para sessões (gere uma chave aleatória)
- `VITE_APP_ID` — ID da aplicação Manus
- `OAUTH_SERVER_URL` — https://api.manus.im
- `VITE_OAUTH_PORTAL_URL` — https://oauth.manus.im
- `OWNER_OPEN_ID` — OpenID do proprietário
- `OWNER_NAME` — Nome do proprietário
- `BUILT_IN_FORGE_API_URL` — https://api.manus.im/forge
- `BUILT_IN_FORGE_API_KEY` — Chave de API Manus
- `VITE_FRONTEND_FORGE_API_URL` — https://api.manus.im/forge
- `VITE_FRONTEND_FORGE_API_KEY` — Chave de API Manus (frontend)
- `TELEGRAM_BOT_TOKEN` — Token do bot Telegram

### Opcionais:
- `VITE_APP_TITLE` — Título da aplicação
- `VITE_APP_LOGO` — URL do logo
- `MP_ACCESS_TOKEN` — Token Mercado Pago (se usar pagamentos)
- `VITE_MP_PUBLIC_KEY` — Chave pública Mercado Pago

## Passo 4: Configurar Webhook do Telegram

Após o deploy, você precisará atualizar o webhook do bot Telegram para apontar para a URL da Vercel:

```bash
curl -X POST https://api.telegram.org/bot{BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-projeto.vercel.app/api/webhooks/telegram",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Substitua `seu-projeto` pelo nome do seu projeto na Vercel.

## Passo 5: Migrar Banco de Dados

Após o primeiro deploy, execute as migrações do banco:

```bash
# Localmente, execute:
pnpm db:push

# Ou via Vercel CLI:
vercel env pull
pnpm db:push
```

## Passo 6: Deploy

Após configurar as variáveis de ambiente, clique em **Deploy** no painel da Vercel. O projeto será construído e implantado automaticamente.

## Troubleshooting

### Erro 403 no Webhook do Telegram
Se o webhook retorna 403, verifique:
1. A URL do webhook está correta (https://seu-projeto.vercel.app/api/webhooks/telegram)
2. O domínio não está bloqueado por WAF (Cloudflare, etc.)
3. As variáveis de ambiente estão configuradas corretamente

### Erro de Banco de Dados
Se houver erro de conexão ao banco:
1. Verifique se `DATABASE_URL` está correta
2. Verifique se o banco de dados está acessível da Vercel (whitelist de IPs)
3. Teste a conexão localmente com `pnpm db:push`

### Build Falha
Se o build falha:
1. Verifique se todas as variáveis de ambiente obrigatórias estão configuradas
2. Verifique os logs do build no painel da Vercel
3. Teste o build localmente com `pnpm build`

## Domínio Customizado

Para usar um domínio customizado (ex: streamvip.shop):

1. No painel da Vercel, vá para **Settings > Domains**
2. Clique em **Add Domain**
3. Digite seu domínio
4. Siga as instruções para configurar os registros DNS

## Próximos Passos

1. **Testar fluxo de registro** — Crie uma conta nova para verificar se o bot Telegram funciona
2. **Configurar notificações** — Implemente notificações em tempo real para novos tópicos
3. **Monitorar performance** — Use o painel de Analytics da Vercel para monitorar uso

## Suporte

Para mais informações sobre deploy na Vercel, consulte: https://vercel.com/docs
