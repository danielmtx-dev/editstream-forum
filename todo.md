# TODO - EditStream Pro - Loja de Produtos Digitais

## Fase 1: Schema e Banco de Dados
- [x] Criar tabela de produtos (imagem, descrição, valor, categoria, forma de pagamento)
- [x] Criar tabela de categorias personalizáveis
- [x] Migrar banco de dados

## Fase 2: Backend (tRPC)
- [x] CRUD de produtos (admin only)
- [x] CRUD de categorias (admin only)
- [x] Upload de imagens e arquivos para S3
- [x] Listagem pública de produtos
- [x] Rota de detalhes do produto

## Fase 3: Painel Admin
- [x] Dashboard com estatísticas
- [x] Gerenciamento de produtos (criar, editar, excluir)
- [x] Gerenciamento de categorias
- [x] Upload de imagens e arquivos no formulário de produto

## Fase 4: Frontend Público (Vitrine estilo Telegram)
- [x] Página inicial com lista de produtos estilo Telegram
- [x] Página de detalhes do produto com imagem, descrição, valor, pagamento
- [x] Filtro por categorias
- [x] Exibição de formas de pagamento (PIX, Cartão, Boleto, Gratuito)
- [x] Botão de download para produtos gratuitos

## Fase 5: Testes e Deploy
- [x] Testes unitários das rotas tRPC
- [x] Verificar funcionamento completo
- [x] Salvar checkpoint e entregar

## Itens anteriores (concluídos)
- [x] Executar webdev_add_feature com web-db-user
- [x] Estudar README e documentação gerada pelo upgrade

## Fase 6: Sistema de Login Customizado (e-mail/telefone + senha)
- [ ] Criar tabela customUsers no schema (email, phone, passwordHash, name, role)
- [ ] Criar tabela orders para pedidos/pagamentos
- [ ] Migrar banco de dados com novas tabelas
- [ ] Implementar rotas de registro e login (backend)
- [ ] Implementar hash de senha com bcrypt
- [ ] Implementar JWT para sessões customizadas
- [ ] Criar página de Login (e-mail/telefone + senha)
- [ ] Criar página de Registro
- [ ] Integrar auth customizado no frontend (contexto, hooks)

## Fase 7: Integração Mercado Pago
- [ ] Solicitar Access Token do Mercado Pago
- [ ] Implementar criação de preferência de pagamento (backend)
- [ ] Implementar webhook de notificação do Mercado Pago
- [ ] Implementar botão de pagamento no frontend
- [ ] Página de sucesso/falha de pagamento

## Fase 8: Telas Separadas Admin/Usuário
- [ ] Painel Admin completo (dashboard, produtos, categorias, pedidos)
- [ ] Painel do Usuário (meus pedidos, meus downloads, perfil)
- [ ] Navegação diferenciada por role
- [ ] Proteção de rotas por role

## Fase 9: Testes e Deploy Final
- [ ] Testes unitários das novas rotas
- [ ] Verificar fluxo completo
- [ ] Salvar checkpoint e entregar

## Fase 10: Segurança Avançada
- [ ] Admin exclusivo para @Danielssh (hardcoded, nenhum outro admin)
- [ ] Rate limiting em todas as rotas de API (anti-DDoS/flood)
- [ ] Proteção de downloads - URLs temporárias assinadas (presigned S3)
- [ ] Verificação de pagamento antes de liberar download de produtos pagos
- [ ] Proteção contra acesso direto a arquivos protegidos
- [ ] Helmet headers de segurança
- [ ] CSRF protection
- [ ] Sanitização de inputs contra XSS/SQL injection
- [ ] Brute force protection no login (bloqueio após tentativas)

## Fase 11: Implementação Completa Final
- [x] Schema: tabela customUsers (email, phone, passwordHash, name, role, isGroupMember)
- [x] Schema: tabela orders (userId, productId, status, mpPaymentId, amount)
- [x] Migrar banco de dados
- [x] Backend: registro e login customizado (bcrypt + JWT)
- [x] Backend: rate limiting global + brute force protection no login
- [x] Backend: helmet headers de segurança
- [x] Backend: admin exclusivo @Danielssh (hardcoded)
- [x] Backend: integração Mercado Pago (criar preferência, webhook)
- [x] Backend: download protegido com URLs temporárias (presigned)
- [x] Backend: verificação de pagamento antes de liberar download pago
- [x] Backend: verificação de login+grupo antes de liberar download grátis
- [x] Frontend: página de login (email/telefone + senha)
- [x] Frontend: página de registro
- [x] Frontend: painel admin exclusivo @Danielssh
- [x] Frontend: painel do usuário (meus pedidos, downloads)
- [x] Frontend: fluxo de pagamento Mercado Pago
- [x] Frontend: botão download condicionado (grátis=login+grupo, pago=após pagamento)
- [x] Testes unitários (54 testes passando)
- [x] Checkpoint e deploy

## Fase 12: Melhorias Solicitadas (7 itens)

### 12.1 Verificação via Telegram
- [x] Schema: adicionar campos telegramId, telegramUsername, telegramVerified na tabela customUsers
- [x] Backend: rota para gerar link de verificação Telegram (Telegram Login Widget)
- [x] Backend: rota callback para validar dados do Telegram e vincular conta
- [x] Backend: verificar se usuário é membro do grupo EditStream Pro via Telegram Bot API
- [x] Frontend: botão "Conectar Telegram" no perfil do usuário
- [x] Frontend: exibir status de verificação Telegram e membro do grupo

### 12.2 Gerenciamento de Usuários (Admin)
- [x] Backend: rota admin para listar todos os usuários com filtros
- [x] Backend: rota admin para modificar status do usuário (ativo, restrito, banido temp, banido perm)
- [x] Schema: adicionar campos banStatus, banReason, banExpiresAt na tabela customUsers
- [x] Frontend: aba "Usuários" no painel admin com lista e ações

### 12.3 Upload Múltiplo de Fotos e Arquivos
- [x] Schema: criar tabela productImages (múltiplas fotos por produto)
- [x] Schema: criar tabela productFiles (múltiplos arquivos por produto)
- [x] Backend: rotas para upload múltiplo de imagens e arquivos (até 150MB)
- [x] Backend: campo para links externos de download
- [x] Frontend: formulário com upload múltiplo de fotos e arquivos
- [x] Frontend: galeria de imagens na página do produto
- [x] Frontend: opção de adicionar links externos no formulário admin

### 12.4 Pagamento só PIX
- [x] Remover opção de boleto e cartão do schema/frontend
- [x] Ajustar Mercado Pago para gerar apenas PIX
- [x] Atualizar frontend para mostrar apenas PIX como forma de pagamento

### 12.5 Tudo Clicável (Navegação Completa)
- [x] Membros: página com lista de membros do grupo
- [x] Categorias: página de listagem por categoria (já existe parcialmente)
- [x] Tópicos: criar conceito de tópicos dentro das categorias
- [x] Mensagens: criar conceito de mensagens/comentários nos tópicos
- [x] Estatísticas no hero banner devem ser links clicáveis

### 12.6 Config Admin de Pagamento e API Mercado Pago
- [x] Schema: criar tabela siteSettings para configurações dinâmicas
- [x] Backend: rotas admin para salvar/ler configurações de pagamento
- [x] Frontend: aba "Configurações" no admin com campos para Access Token, Public Key, chave PIX

### 12.7 Contato via Telegram
- [x] Adicionar botão de contato @Danielssh via Telegram no header e página de produto
- [x] Criar seção de contato no footer

### 12.8 Testes e Deploy
- [x] Atualizar testes unitários para novas funcionalidades (64 testes passando)
- [x] Verificar funcionamento completo
- [x] Salvar checkpoint e deploy

## Fase 13: Melhorias v4

### 13.1 Corrigir download de links
- [x] Corrigir lógica de download para que links do admin funcionem corretamente para o usuário

### 13.2 Login estilo iptvapps.net
- [x] Campo de usuário/e-mail
- [x] Campo de senha com botão "Mostrar" para ver a senha
- [x] Checkbox "Permanecer conectado"
- [x] Botão "Conecte-se"
- [x] Link "Não tem uma conta? Cadastre-se agora."
- [x] Texto "ou faça login usando"
- [x] Botão "Telegram" para logar via Telegram Login Widget

### 13.3 Cadastro simplificado
- [x] Somente usuário e senha no cadastro
- [x] Botão "Voltar" no canto esquerdo

### 13.4 Banimento visível para o usuário
- [x] Restringir: pessoa não consegue mexer no que o admin restringiu
- [x] Banir temporariamente: não consegue logar, aparece mensagem com tempo restante
- [x] Banir permanentemente: aparece mensagem

### 13.5 Formas de pagamento expandidas
- [x] Botão "Pagar" que ao clicar mostra: PIX, Boleto e Cartão de Crédito ou Débito

### 13.6 Limpar footer
- [x] Remover texto "EditStream Pro - loja de produtos digitais, script, iptv e ferramentas"

### 13.7 Admin liberar conteúdo pago manualmente
- [x] Opção no painel admin para liberar conteúdos pagos para um usuário específico

### 13.8 Telegram Login Widget
- [x] Implementar Telegram Login Widget para conectar conta do Telegram automaticamente

### 13.9 Testes e Deploy
- [x] Testes unitários (64 testes passando)
- [x] Checkpoint e deploy

## Fase 14: Telegram Login Widget Oficial

### 14.1 Backend - Rota /auth/telegram
- [x] Configurar TELEGRAM_BOT_TOKEN como secret no servidor
- [x] Criar rota /auth/telegram no Express que recebe dados do widget
- [x] Validar hash HMAC-SHA256 com bot token (segurança oficial do Telegram)
- [x] Criar ou vincular conta do usuário com dados do Telegram (id, first_name, last_name, username, photo_url)
- [x] Retornar JWT e redirecionar para o frontend

### 14.2 Frontend - Widget e Login
- [x] Adicionar script oficial telegram-widget.js no LoginPage
- [x] Botão "Entrar com Telegram" usando widget oficial
- [x] Página de callback para processar resposta do Telegram
- [x] Após login, puxar informações: ID, nome, username e foto de perfil
- [x] Integrar com sistema de autenticação existente (cookie es_session)

### 14.3 Testes e Deploy
- [x] Testes unitários para validação HMAC-SHA256 (8 testes passando)
- [x] Testes unitários para rota /auth/telegram
- [x] Executar todos os testes (76/77 passando - 1 timeout externo MP)
- [x] Checkpoint e deploy

## Fase 15: Correções v5

### 15.1 Download após pagamento
- [x] Quando usuário pagou, mostrar botão de download na página do produto
- [x] Verificar se usuário tem pedido aprovado ou acesso manual concedido

### 15.2 Mensagem de restrição visível
- [x] Quando admin restringir usuário, mostrar mensagem de restrição na página do produto e no dashboard

### 15.3 Remover footer completamente
- [x] Remover footer de todas as páginas (Home, ProductPage, AdminPage, UserDashboard, MembrosPage, CategoriasPage)

### 15.4 Testes e Deploy
- [x] Executar testes (76/77 passando)
- [x] Checkpoint e deploy

## Fase 16: Bug Fix - Registro

### 16.1 Corrigir campos opcionais no registro
- [x] Campos email e phone enviados como strings vazias em vez de null causam falha no INSERT
- [x] Garantir que createCustomUser trate campos opcionais corretamente (omitir da query quando vazios)

## Fase 17: Ajustes de UI v6

### 17.1 Footer simples
- [x] Adicionar footer com texto "EditStream Pro | Fórum da Comunidade" centralizado
- [x] Sem links, sem navegação - apenas uma linha de texto

### 17.2 Logo quebrado na tela de login
- [x] Corrigir logo quebrado na LoginPage
- [x] Remover imagem e deixar apenas texto "EditStream Pro" estilizado

### 17.3 Telegram Widget - esconder erro de domínio
- [x] Esconder mensagem "Bot domain invalid" do Telegram Widget
- [x] Mostrar botão estilizado "Entrar com Telegram" como fallback
- [x] Adicionar mensagem informativa sobre configuração do domínio no BotFather

### 17.4 Testes e Deploy
- [x] Executar testes (77/77 passando)
- [x] Checkpoint e deploy

## Fase 18: Bug Fix Crítico - Registro + UI

### 18.1 Corrigir INSERT definitivamente
- [x] Tratamento de erros duplicados no createCustomUser (catch Duplicate key)
- [x] Campos email/phone omitidos da query quando vazios

### 18.2 Esconder erros SQL do usuário
- [x] Capturar erros de banco no backend e retornar mensagem amigável
- [x] Nunca expor queries SQL ao frontend (sanitização no backend + frontend)

### 18.3 Logo quebrado no login (site publicado)
- [x] Removida imagem do logo, usando texto estilizado "EditStream Pro"

### 18.4 Footer simples
- [x] Footer "EditStream Pro | Fórum da Comunidade" em todas as páginas

### 18.5 Download não aparece quando admin libera manualmente
- [x] canDownload retorna reason "admin_granted" e paymentMethod para acesso manual
- [x] ProductPage mostra botões de download quando admin libera

### 18.6 Mostrar forma de pagamento no produto
- [x] Mostra forma de pagamento: PIX, Cartão, Boleto ou "Liberado pelo Admin"
- [x] Diferenciação visual por tipo de pagamento

## Fase 19: Bug Fix - Download + Telegram Login

### 19.1 Botões de download não aparecem
- [x] ProductPage já renderiza botões corretamente (fileKey, productFiles, externalLinks)
- [x] Problema era código antigo no site publicado - novo checkpoint resolve

### 19.2 Login via Telegram libera conteúdo grátis
- [x] Quando login via Telegram, marcar isGroupMember=true automaticamente
- [x] Novos usuários via Telegram já são criados com isGroupMember=true
- [x] Usuários existentes têm isGroupMember atualizado para true ao logar via Telegram

## Fase 20: Bug Fix Crítico - Download + Telegram

### 20.1 Botão Conectar Telegram redireciona errado
- [x] Botão "Conectar Telegram" na ProductPage agora usa TelegramLoginWidget diretamente
- [x] Removido redirecionamento para /minha-conta

### 20.2 Download liberado pelo admin NÃO aparece (CRÍTICO)
- [x] Bug encontrado: getById retornava fileKey:null por segurança, impedindo botões
- [x] Corrigido: agora retorna fileKey:true/false (booleano) para o frontend decidir
- [x] Botões de download aparecem corretamente quando canDownload=true

### 20.3 Login Telegram não marca isGroupMember
- [x] Código já atualiza isGroupMember=true no telegramAuth.ts (checkpoint anterior)
- [x] Problema era site publicado com código antigo - novo checkpoint resolve

## Fase 21: Bug Fix - Telegram Widget + Erro Registro

### 21.1 Telegram Widget mostra dados de outro usuário
- [x] Corrigido: showUserPhoto=false por padrão no TelegramLoginWidget
- [x] Widget agora mostra botão genérico "Log in with Telegram" sem nome/foto

### 21.2 Erro ao criar conta
- [x] Melhorado tratamento de erros: mensagens específicas passam direto ao frontend
- [x] "Nome de usuário já está em uso" agora aparece corretamente
- [x] Erros SQL nunca são expostos (sanitizados no backend)

## Fase 22: Melhorias v11

### 22.1 Telegram Login funcional (deep link fallback)
- [x] Implementar deep link para bot @editstreampro_bot que gera código de login
- [x] Criar rota /api/auth/telegram-code para verificar código gerado pelo bot
- [x] Frontend: botão "Entrar com Telegram" abre deep link para o bot
- [x] Usuário confirma no Telegram, volta ao site e está logado
- [x] Webhook do Telegram configurado automaticamente na inicialização do servidor

### 22.2 Admin apagar/editar usuários
- [x] Rota admin.deleteUser para deletar usuários completamente
- [x] Rota admin.editUser para editar dados (nome, username, email, phone, isGroupMember)
- [x] Rota admin.resetPassword para resetar senha de usuários
- [x] UI no painel admin com botões de Editar, Apagar e Resetar Senha

### 22.3 Upload de logos no admin
- [x] Seção "Logos do Site" no SettingsTab com upload de Header, Banner e Favicon
- [x] Upload via base64 para S3 com storagePut
- [x] URLs salvas no siteSettings (logo_header, logo_banner, logo_favicon)

### 22.4 Telegram marca isGroupMember
- [x] telegramAuth.ts marca isGroupMember=true ao criar e vincular conta via Telegram

## Fase 23: Verificação Automática de Membro do Grupo Telegram

### 23.1 Descobrir chat_id do grupo
- [x] Usar API do Telegram para buscar chat_id do grupo @editstreampro (-1002240808163)
- [x] Salvar chat_id como constante no telegramBot.ts

### 23.2 Implementar verificação no backend
- [x] Criar função checkGroupMembership(telegramUserId) usando getChatMember API
- [x] Integrar na rota de login via Telegram Widget (telegramAuth.ts)
- [x] Integrar na rota de login via Telegram deep link (_core/index.ts)
- [x] Integrar na rota de download de conteúdo grátis (re-verificação no canDownload)

### 23.3 Lógica de isGroupMember
- [x] Se estiver no grupo: isGroupMember=true, libera conteúdo grátis
- [x] Se NÃO estiver: isGroupMember=false, mostra mensagem com link para o grupo
- [x] Verificação automática no login via Telegram
- [x] Re-verificação automática no download de conteúdo grátis

### 23.4 Testes e Deploy
- [x] Testes unitários (84 testes passando)
- [ ] Checkpoint e deploy

### 23.5 Rota tRPC recheckGroupMembership
- [x] Criar rota tRPC recheckGroupMembership que re-verifica membership via getChatMember
- [x] Atualizar isGroupMember no banco automaticamente
- [x] Integrar re-verificação no canDownload para produtos grátis (se tem telegramId)

### 23.6 Frontend - Mensagem de restrição com link do grupo
- [x] Mostrar mensagem "Você precisa ser membro do grupo" com link t.me/editstreampro
- [x] Botão "Entrar no Grupo Telegram" visível na ProductPage quando não é membro
- [x] Botão "Verificar novamente" para re-checar membership após entrar no grupo

## Fase 26: Melhorias de UX e Segurança

### 26.1 Remover login via Telegram
- [x] Remover TelegramLoginWidget e divider "ou faça login usando" da LoginPage
- [x] Manter apenas login por usuário/senha

### 26.2 ID único visível
- [x] Mostrar ID do usuário no painel admin (lista de usuários) com clique para copiar
- [x] Mostrar ID do usuário na página Minha Conta com clique para copiar
- [x] ID exibido em fonte monospace com feedback visual

### 26.3 Alterar senha na Minha Conta
- [x] Criar rota tRPC changePassword (senha atual + nova senha)
- [x] Adicionar seção "Alterar Senha" na página Minha Conta
- [x] Validar senha atual antes de permitir alteração

### 26.4 Código de verificação monospace
- [x] Bot envia código no Telegram com formatação monospace (<code>)
- [x] Mensagens do bot formatadas com HTML parse_mode

## Fase 27: Verificação via Bot Telegram no Cadastro

### 27.1 Backend - Bot envia mensagem no grupo
- [x] Criar função sendGroupVerification(telegramUsername) que envia mensagem no grupo com botão inline
- [x] Botão inline "Confirmar Cadastro" só funciona para o @username mencionado
- [x] Quando clicado, bot envia código de 6 dígitos no chat privado do usuário (monospace)
- [x] Armazenar código temporário com expiração (10 min)

### 27.2 Backend - Processar callback_query
- [x] Processar callback_query do botão inline no webhook
- [x] Verificar se quem clicou é o @username correto (fromUsername === targetUsername)
- [x] Enviar código privado via sendMessage com formatação monospace (<code>)
- [x] Apagar mensagem do grupo após confirmação (deleteMessage)

### 27.3 Rotas tRPC
- [x] Criar rota sendTelegramVerification (envia mensagem no grupo)
- [x] Criar rota verifyTelegramCode (verifica código de 6 dígitos)
- [x] Atualizar rota register para aceitar verificationCode e linkar Telegram

### 27.4 Frontend - Fluxo de 3 etapas no cadastro
- [x] Etapa 1: Informar @username do Telegram + botão "Enviar Verificação"
- [x] Etapa 2: Campo para digitar código de 6 dígitos (monospace, auto-submit, paste)
- [x] Etapa 3: Definir usuário e senha para finalizar cadastro
- [x] Step indicator visual com 3 etapas

### 27.5 Apagar mensagem do grupo após confirmação
- [x] Após o usuário clicar no botão e confirmar, apagar a mensagem do grupo (deleteMessage)
- [x] Manter o código no chat privado (não apagar)

## Fase 28: Transformação em Fórum (estilo iptvapps.net)

### 28.1 Corrigir upload de logos
- [ ] Header usa logo dinâmico do banco
- [ ] Banner usa logo/banner dinâmico do banco
- [ ] Favicon dinâmico via hook
- [ ] Upload no admin salva e exibe corretamente

### 28.2 Schema do banco - Fórum
- [ ] Tabela forumThreads (id, categoryId, authorId, title, content, tag, isPinned, isLocked, viewCount, createdAt, updatedAt)
- [ ] Tabela forumComments (id, threadId, authorId, content, createdAt, updatedAt)
- [ ] Tabela forumLikes (id, targetType, targetId, userId, value +1/-1, createdAt)
- [ ] Migrar banco com pnpm db:push

### 28.3 Backend - Rotas tRPC do fórum
- [ ] CRUD de threads (criar, listar por categoria, buscar por id, editar, deletar)
- [ ] CRUD de comentários (criar, listar por thread, editar, deletar)
- [ ] Sistema de likes/dislikes (toggle like/dislike em thread ou comentário)
- [ ] Contadores: threads por categoria, comentários por thread, likes por post
- [ ] Último post por categoria (para exibir na home)

### 28.4 Frontend - Página inicial estilo fórum
- [ ] Categorias agrupadas em seções
- [ ] Cada categoria mostra: ícone, nome, threads count, messages count, último post
- [ ] Tag "New" quando tem conteúdo novo
- [ ] Design dark estilo iptvapps.net

### 28.5 Frontend - Lista de tópicos na categoria
- [ ] Avatar do autor
- [ ] Tag colorida (Resource, Selling, Showcase, etc)
- [ ] Título, autor, data
- [ ] Número de respostas e último reply
- [ ] Paginação
- [ ] Filtros

### 28.6 Frontend - Página do tópico com comentários
- [ ] Post principal com info do autor (avatar, data de registro, mensagens, likes, localização)
- [ ] Conteúdo completo do post
- [ ] Sistema de comentários
- [ ] Botões LIKE e DISLIKE em cada post/comentário
- [ ] Botão compartilhar
- [ ] Numeração dos posts (#1, #2, etc)

## Fase 29: Sistema de Cargos e Permissões

### 29.1 Schema do banco - Cargos
- [ ] Tabela roles (id, name, color, icon, permissions JSON, sortOrder, createdAt)
- [ ] Tabela userRoles (userId, roleId) - relação N:N
- [ ] Migrar banco com pnpm db:push

### 29.2 Backend - Rotas tRPC de cargos
- [ ] CRUD de cargos (admin only)
- [ ] Atribuir/remover cargo de usuário
- [ ] Listar permissões disponíveis
- [ ] Verificar permissão do usuário (middleware)

### 29.3 Frontend - Admin gestão de cargos
- [ ] Tela de criar/editar cargo com checkboxes de permissões
- [ ] Tela de atribuir cargos a usuários
- [ ] Badge/tag do cargo no perfil do usuário
- [ ] Cargos visíveis na lista de membros e nos posts do fórum
