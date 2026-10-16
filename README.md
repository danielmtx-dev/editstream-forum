# EditStream Pro

> Fórum e plataforma de recursos digitais do EditStream Pro.

**🚀 Prévia do site:** [Abrir EditStream Pro](https://editstream-forum-2rabq1287-danielxyzds-projects.vercel.app/)  
**💻 Código-fonte:** [danielmtx-dev/editstream-forum](https://github.com/danielmtx-dev/editstream-forum)  
**👤 Responsável:** [@Danielssh no Telegram](https://t.me/Danielssh)  
**💬 Comunidade:** [@EditStreamPr no Telegram](https://t.me/EditStreamPr)

O EditStream Pro reúne a base de uma plataforma web com interface de fórum, contas de usuário e recursos administrativos. Este repositório está aberto para consulta do código e acompanhamento do desenvolvimento.

> **Estado do projeto:** em desenvolvimento. O site está publicado na Vercel; as funções de backend, autenticação, banco de dados e pagamentos precisam ser validadas separadamente antes do uso em produção. Não use dados pessoais ou credenciais reais em demonstrações públicas.

## Sobre o projeto

O EditStream Pro é uma plataforma web em desenvolvimento para reunir recursos digitais, comunidade e funcionalidades de fórum em uma experiência única. [Abra a prévia online](https://editstream-forum-2rabq1287-danielxyzds-projects.vercel.app/) para conhecer a interface e acompanhe este repositório para ver o código e a evolução do projeto.

**Tópicos sugeridos para o GitHub:** `forum`, `react`, `typescript`, `vite`, `nodejs`, `express`, `trpc`, `drizzle-orm`, `digital-platform`, `editstream-pro`.

## Conteúdo

- [Funcionalidades planejadas e componentes](#funcionalidades-e-componentes)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Requisitos](#requisitos)
- [Executar localmente](#executar-localmente)
- [Configuração](#configuração)
- [Build e testes](#build-e-testes)
- [Publicação](#publicação)
- [Segurança](#segurança)
- [Contribuir](#contribuir)
- [Contato](#contato)

## Funcionalidades e componentes

O projeto contém código para desenvolver e integrar recursos como:

- Interface web de fórum e listagem de tópicos;
- contas e gerenciamento de usuários;
- área administrativa e permissões;
- integrações externas, incluindo serviços de autenticação e pagamentos, conforme a configuração disponível no ambiente.

A presença de um recurso na documentação ou no código não significa que ele esteja pronto ou configurado em produção. Confira o código e teste cada fluxo no seu ambiente antes de disponibilizá-lo ao público.

## Tecnologias

Com base nas dependências e scripts do projeto:

- **Frontend:** React, TypeScript e Vite;
- **Servidor:** Node.js e Express;
- **API:** tRPC;
- **Banco de dados:** Drizzle ORM e driver MySQL;
- **Estilização e componentes:** Tailwind CSS e Radix UI;
- **Testes:** Vitest;
- **Build:** Vite e esbuild.

## Estrutura do projeto

| Caminho | Finalidade |
| --- | --- |
| `client/` | Aplicação web |
| `server/` | Servidor e lógica de API |
| `shared/` | Código compartilhado |
| `drizzle/` | Arquivos relacionados ao banco de dados |
| `drizzle.config.ts` | Configuração do Drizzle |
| `package.json` | Dependências e comandos do projeto |
| `ENVIRONMENT_VARIABLES.md` | Referência de variáveis de ambiente |
| `README-VERCEL.md` | Notas existentes sobre publicação na Vercel |

## Requisitos

- Node.js compatível com as dependências do projeto;
- pnpm (versão indicada no campo `packageManager` do `package.json`);
- um banco MySQL compatível se a funcionalidade que você testar precisar dele;
- variáveis de ambiente válidas para as integrações que forem usadas.

## Executar localmente

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/danielmtx-dev/editstream-forum.git
cd editstream-forum
corepack enable
pnpm install
```

Crie seu arquivo local a partir do modelo e confira a documentação das variáveis:

```bash
cp .env.example .env
```

Edite `.env` e preencha apenas os valores necessários ao ambiente. Consulte [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) e confirme no código quais variáveis são realmente usadas. **Não coloque credenciais reais em arquivos versionados.**

Inicie o ambiente de desenvolvimento:

```bash
pnpm dev
```

O terminal informará se o servidor iniciou e qual endereço local usar. Se ocorrer erro de configuração, banco ou variável ausente, resolva-o antes de testar as funcionalidades.

## Configuração

A lista de variáveis documentadas está em [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md). Ela inclui configurações para banco de dados, autenticação e integrações opcionais.

- Use valores próprios para desenvolvimento.
- Mantenha tokens, senhas, chaves privadas e strings de conexão fora do Git.
- Não coloque segredos em variáveis com prefixo `VITE_`: valores com esse prefixo podem ser incluídos no código enviado ao navegador.
- Nunca publique credenciais reais em capturas de tela, logs, issues ou demonstrações.

## Build e testes

Os comandos definidos atualmente em `package.json` incluem:

```bash
pnpm check
pnpm test
pnpm build
```

Execute-os no ambiente local e verifique os resultados. A documentação não representa uma garantia de que build, testes ou integrações estejam passando neste momento.

## Publicação

O projeto inclui [README-VERCEL.md](./README-VERCEL.md) com notas de publicação. Antes de disponibilizar uma demonstração pública:

1. confirme que o build de produção termina sem erros;
2. configure as variáveis no painel do provedor de hospedagem;
3. configure um banco persistente e compatível, se necessário;
4. teste autenticação, permissões e rotas da API;
5. use credenciais de teste para pagamentos e integrações;
6. verifique logs e erros após a publicação.

A hospedagem estática do frontend, sozinha, não substitui o servidor de API nem o banco de dados. Não considere o deploy concluído até validar o sistema no endereço publicado.

## Segurança

Se encontrar uma possível vulnerabilidade, não publique tokens, dados privados nem detalhes exploráveis em uma issue pública. Consulte [SECURITY.md](./SECURITY.md) para orientações.

## Contribuir

Sugestões e correções são bem-vindas. Leia [CONTRIBUTING.md](./CONTRIBUTING.md) antes de abrir uma issue ou pull request.

## Contato

- Telegram: [@Danielssh](https://t.me/Danielssh)
- Grupo: [@EditStreamPr](https://t.me/EditStreamPr)

---

Feito por Daniel Ssh. Consulte os arquivos do repositório para verificar o estado atual do código e das integrações.
