# Variáveis de Ambiente Necessárias para Vercel

Copie e configure as seguintes variáveis no painel da Vercel (Settings > Environment Variables):

## Banco de Dados
- **DATABASE_URL** - String de conexão MySQL/TiDB (obrigatório)
  - Formato: `mysql://user:password@host:port/database`

## Autenticação & JWT
- **JWT_SECRET** - Chave secreta para assinar cookies de sessão (obrigatório)
  - Gere uma chave aleatória forte

## Manus OAuth (obrigatório)
- **VITE_APP_ID** - ID da aplicação Manus
- **OAUTH_SERVER_URL** - https://api.manus.im
- **VITE_OAUTH_PORTAL_URL** - https://oauth.manus.im
- **OWNER_OPEN_ID** - OpenID do proprietário
- **OWNER_NAME** - Nome do proprietário

## Manus Built-in APIs (obrigatório)
- **BUILT_IN_FORGE_API_URL** - https://api.manus.im/forge
- **BUILT_IN_FORGE_API_KEY** - Chave de API Manus (servidor)
- **VITE_FRONTEND_FORGE_API_URL** - https://api.manus.im/forge
- **VITE_FRONTEND_FORGE_API_KEY** - Chave de API Manus (frontend)

## Telegram Bot (obrigatório)
- **TELEGRAM_BOT_TOKEN** - Token do bot Telegram
  - Formato: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

## Analytics (opcional)
- **VITE_ANALYTICS_WEBSITE_ID** - ID do site para analytics
- **VITE_ANALYTICS_ENDPOINT** - URL do endpoint de analytics

## Mercado Pago (opcional)
- **MP_ACCESS_TOKEN** - Token de acesso Mercado Pago
- **VITE_MP_PUBLIC_KEY** - Chave pública Mercado Pago

## App Settings
- **VITE_APP_TITLE** - Título da aplicação (padrão: EditStream Pro)
- **VITE_APP_LOGO** - URL do logo da aplicação

## Node Environment
- **NODE_ENV** - Deve ser `production` na Vercel
