# 🎬 EditStream Pro

**Fórum e Loja de Produtos Digitais** — Scripts, IPTV, Ferramentas e muito mais.

---

## 📋 Sobre o Projeto

EditStream Pro é uma plataforma completa de fórum e loja de produtos digitais com autenticação via Telegram Bot, pagamentos integrados com Mercado Pago e painel administrativo avançado.

---

## 🚀 Funcionalidades

### 🔐 Autenticação & Segurança
- Cadastro com verificação via **Telegram Bot** (código de 6 dígitos no privado)
- Login com usuário e senha (criptografia bcrypt + JWT)
- Proteção contra brute force, rate limiting e sanitização XSS
- Downloads protegidos com URLs temporárias

### 💳 Pagamentos
- Integração com **Mercado Pago** (PIX, Boleto, Cartão de Crédito/Débito)
- Webhook de notificação automática de pagamento
- Liberação manual de conteúdo pelo administrador

### 🤖 Bot Telegram
- Verificação de cadastro no grupo do Telegram
- Botão "Confirmar Cadastro" exclusivo para o dono do @username
- Envio de código de verificação no chat privado
- Verificação automática de membro do grupo

### 📝 Fórum
- Categorias agrupadas por seções
- Threads com tags coloridas (Resource, Selling, etc.)
- Comentários com **likes** e **dislikes**
- Paginação e filtros

### 👤 Painel do Usuário
- Upload de foto de perfil
- Alteração de senha
- Histórico de pedidos e downloads
- ID único por usuário

### ⚙️ Painel Administrativo
- Gerenciamento completo de usuários (editar, banir, restringir, apagar)
- Sistema de **cargos e permissões** personalizáveis
- Gerenciamento de categorias e produtos
- Upload de logos do site (Header, Banner, Favicon)
- Configurações do Mercado Pago e contato Telegram
- Liberação manual de conteúdos pagos para usuários

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| **React** | Frontend SPA |
| **Node.js + Express** | Backend API |
| **SQLite** | Banco de dados |
| **JWT + bcrypt** | Autenticação |
| **Mercado Pago SDK** | Pagamentos |
| **Telegram Bot API** | Verificação de usuários |
| **Helmet + Rate Limiter** | Segurança |

---

## 📦 Instalação Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/editstream-pro.git

# Acesse a pasta
cd editstream-pro

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais

# Inicie o servidor
npm run dev
```

---

## 🌐 Deploy na Vercel

1. Suba o projeto para um repositório no GitHub
2. Acesse [vercel.com/new](https://vercel.com/new) e conecte o repositório
3. Configure as variáveis de ambiente (veja `ENVIRONMENT_VARIABLES.md`)
4. Clique em **Deploy**
5. Após o deploy, configure o webhook do Telegram para a nova URL

---

## ⚙️ Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão com o banco de dados |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token do Mercado Pago |
| `MERCADOPAGO_PUBLIC_KEY` | Public Key do Mercado Pago |
| `TELEGRAM_BOT_TOKEN` | Token do bot do Telegram |
| `TELEGRAM_GROUP_ID` | ID do grupo do Telegram |
| `SITE_URL` | URL do site em produção |

---

## 📞 Contato

- **Telegram:** [@Danielssh](https://t.me/Danielssh)
- **Grupo:** [@editstreampro](https://t.me/editstreampro)

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

© 2026 EditStream Pro - Desenvolvido por Daniel Ssh
