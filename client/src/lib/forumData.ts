/**
 * Forum data - EditStream Pro categories and topics
 * Design: "Dark Telegram" — Fidelidade ao Telegram com refinamentos web
 */

export interface ForumCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  description: string;
  lastMessage: string;
  lastAuthor: string;
  lastDate: string;
  isLocked: boolean;
  messageCount: number;
  memberCount: number;
  isPinned?: boolean;
  topics: ForumTopic[];
}

export interface ForumTopic {
  id: string;
  title: string;
  author: string;
  date: string;
  content: string;
  replies: number;
  views: number;
  isPinned?: boolean;
  isLocked?: boolean;
  tags?: string[];
}

export const FORUM_STATS = {
  members: 704,
  categories: 15,
  topics: 1247,
  messages: 8934,
};

export const FORUM_CATEGORIES: ForumCategory[] = [
  {
    id: "1",
    slug: "chat-geral",
    name: "Chat Geral",
    icon: "#",
    iconColor: "#ffffff",
    iconBg: "#5865F2",
    description: "Discussões gerais da comunidade EditStream Pro",
    lastMessage: "Carnaval e diversão são na Betan...",
    lastAuthor: "Magfi Ads",
    lastDate: "4:20 PM",
    isLocked: false,
    messageCount: 2341,
    memberCount: 680,
    topics: [
      { id: "t1", title: "Bem-vindos ao EditStream Pro!", author: "Admin", date: "15 fev.", content: "Sejam todos bem-vindos à nossa comunidade!", replies: 156, views: 3200, isPinned: true, tags: ["importante"] },
      { id: "t2", title: "Carnaval e diversão são na Betano", author: "Magfi Ads", date: "15 fev.", content: "Confira as melhores promoções de carnaval...", replies: 23, views: 450, tags: ["anúncio"] },
      { id: "t3", title: "Apresentem-se aqui!", author: "Admin", date: "14 fev.", content: "Conte um pouco sobre você para a comunidade.", replies: 89, views: 1200, isPinned: true },
      { id: "t4", title: "Regras do grupo", author: "Admin", date: "10 fev.", content: "Leia as regras antes de postar.", replies: 5, views: 2800, isPinned: true, isLocked: true, tags: ["regras"] },
    ],
  },
  {
    id: "2",
    slug: "paineis",
    name: "Painéis",
    icon: "⚙️",
    iconColor: "#a78bfa",
    iconBg: "#4c1d95",
    description: "Painéis de controle, dashboards e ferramentas de gestão",
    lastMessage: "ATUALIZAÇÃO v1.1.19 🎉 R...",
    lastAuthor: "Você",
    lastDate: "qua.",
    isLocked: true,
    messageCount: 567,
    memberCount: 420,
    topics: [
      { id: "t5", title: "ATUALIZAÇÃO v1.1.19", author: "Admin", date: "12 fev.", content: "Nova versão do painel com melhorias de performance.", replies: 45, views: 890, isPinned: true, tags: ["atualização"] },
      { id: "t6", title: "Como configurar seu painel", author: "Daniel", date: "10 fev.", content: "Tutorial completo de configuração.", replies: 32, views: 670 },
      { id: "t7", title: "Painel v1.1.18 - Changelog", author: "Admin", date: "5 fev.", content: "Lista de mudanças da versão anterior.", replies: 18, views: 340, tags: ["atualização"] },
    ],
  },
  {
    id: "3",
    slug: "ibo-player",
    name: "Ibo Player",
    icon: "🔄",
    iconColor: "#34d399",
    iconBg: "#064e3b",
    description: "Tudo sobre o Ibo Player - configurações, listas e dicas",
    lastMessage: "Ícone do tópico alterado",
    lastAuthor: "Você",
    lastDate: "21 de dez.",
    isLocked: true,
    messageCount: 234,
    memberCount: 310,
    topics: [
      { id: "t8", title: "Como configurar o Ibo Player", author: "Wagner", date: "20 dez.", content: "Passo a passo para configurar.", replies: 67, views: 1500, isPinned: true },
      { id: "t9", title: "Melhores listas IPTV", author: "Carlos", date: "18 dez.", content: "Compartilhem suas melhores listas.", replies: 89, views: 2100 },
    ],
  },
  {
    id: "4",
    slug: "edicao-de-apps",
    name: "Edição de Apps",
    icon: "</>",
    iconColor: "#60a5fa",
    iconBg: "#1e3a5f",
    description: "Edição, modificação e customização de aplicativos",
    lastMessage: "wcine V1.05.apk",
    lastAuthor: "Wagner",
    lastDate: "8:04 AM",
    isLocked: false,
    messageCount: 892,
    memberCount: 520,
    topics: [
      { id: "t10", title: "wcine V1.05.apk", author: "Wagner", date: "15 fev.", content: "Nova versão do wcine disponível para download.", replies: 34, views: 780, tags: ["release"] },
      { id: "t11", title: "Tutorial: Como editar APKs", author: "Daniel", date: "12 fev.", content: "Guia completo para iniciantes.", replies: 56, views: 1200, isPinned: true },
      { id: "t12", title: "Ferramentas de decompilação", author: "Max", date: "8 fev.", content: "Lista das melhores ferramentas.", replies: 23, views: 560, tags: ["ferramentas"] },
    ],
  },
  {
    id: "5",
    slug: "anuncios",
    name: "Anúncios",
    icon: "🎁",
    iconColor: "#fbbf24",
    iconBg: "#78350f",
    description: "Anúncios oficiais e novidades da comunidade",
    lastMessage: "Eu tenho",
    lastAuthor: "Wagner",
    lastDate: "sáb.",
    isLocked: false,
    messageCount: 156,
    memberCount: 704,
    topics: [
      { id: "t13", title: "Novidades de Fevereiro", author: "Admin", date: "1 fev.", content: "Confira as novidades do mês.", replies: 12, views: 890, isPinned: true, tags: ["importante"] },
      { id: "t14", title: "Parceria com novo serviço", author: "Admin", date: "28 jan.", content: "Anunciamos parceria exclusiva.", replies: 8, views: 450 },
    ],
  },
  {
    id: "6",
    slug: "servicos-ativos",
    name: "Serviços Ativos",
    icon: "🛡️",
    iconColor: "#34d399",
    iconBg: "#064e3b",
    description: "Lista de serviços ativos e funcionais",
    lastMessage: "Daniel Ssh fixou uma mensagem",
    lastAuthor: "Daniel Ssh",
    lastDate: "03 de fev.",
    isLocked: true,
    messageCount: 345,
    memberCount: 580,
    isPinned: true,
    topics: [
      { id: "t15", title: "Lista de serviços ativos - Fevereiro 2026", author: "Daniel Ssh", date: "3 fev.", content: "Serviços funcionando neste mês.", replies: 67, views: 2300, isPinned: true, tags: ["fixado"] },
      { id: "t16", title: "Serviços inativos - Reportar aqui", author: "Admin", date: "1 fev.", content: "Reporte serviços que não estão funcionando.", replies: 34, views: 890 },
    ],
  },
  {
    id: "7",
    slug: "tutoriais",
    name: "Tutoriais",
    icon: "▶️",
    iconColor: "#ef4444",
    iconBg: "#7f1d1d",
    description: "Tutoriais em vídeo e texto para todas as ferramentas",
    lastMessage: "install-plugin.ps1",
    lastAuthor: "Você",
    lastDate: "27 de jan.",
    isLocked: true,
    messageCount: 478,
    memberCount: 650,
    topics: [
      { id: "t17", title: "install-plugin.ps1 - Script de instalação", author: "Admin", date: "27 jan.", content: "Script PowerShell para instalação automática.", replies: 23, views: 670, tags: ["script"] },
      { id: "t18", title: "Como usar o CustomizationTool", author: "Wagner", date: "20 jan.", content: "Tutorial completo em vídeo.", replies: 45, views: 1200, isPinned: true },
      { id: "t19", title: "Configurando SSH pela primeira vez", author: "Daniel Ssh", date: "15 jan.", content: "Guia para iniciantes.", replies: 34, views: 890 },
    ],
  },
  {
    id: "8",
    slug: "duvidas",
    name: "Dúvidas",
    icon: "❓",
    iconColor: "#a78bfa",
    iconBg: "#4c1d95",
    description: "Tire suas dúvidas com a comunidade",
    lastMessage: "apontamento etc..",
    lastAuthor: "Max",
    lastDate: "17 de jan.",
    isLocked: false,
    messageCount: 1234,
    memberCount: 690,
    topics: [
      { id: "t20", title: "Apontamento etc..", author: "Max", date: "17 jan.", content: "Alguém pode me ajudar com apontamento?", replies: 12, views: 230 },
      { id: "t21", title: "Como resolver erro de conexão", author: "Lucas", date: "15 jan.", content: "Estou tendo problemas de conexão.", replies: 8, views: 180 },
      { id: "t22", title: "Qual melhor painel para iniciantes?", author: "Pedro", date: "10 jan.", content: "Sou novo e preciso de recomendações.", replies: 34, views: 560 },
    ],
  },
  {
    id: "9",
    slug: "ferramentas",
    name: "Ferramentas",
    icon: "🔧",
    iconColor: "#f97316",
    iconBg: "#7c2d12",
    description: "Ferramentas úteis para edição, customização e automação",
    lastMessage: "CustomizationToolv10_1_0FreeVersionAMLogi...",
    lastAuthor: "Você",
    lastDate: "02 de jan.",
    isLocked: true,
    messageCount: 567,
    memberCount: 480,
    topics: [
      { id: "t23", title: "CustomizationTool v10.1.0 Free Version", author: "Admin", date: "2 jan.", content: "Nova versão gratuita disponível.", replies: 78, views: 2100, isPinned: true, tags: ["release"] },
      { id: "t24", title: "Lista de ferramentas essenciais", author: "Wagner", date: "28 dez.", content: "Ferramentas que todo membro precisa.", replies: 45, views: 1500, tags: ["lista"] },
    ],
  },
  {
    id: "10",
    slug: "windows",
    name: "Windows",
    icon: "💻",
    iconColor: "#60a5fa",
    iconBg: "#1e3a5f",
    description: "Dicas, scripts e ferramentas para Windows",
    lastMessage: "Ícone do tópico alterado",
    lastAuthor: "Você",
    lastDate: "21 de dez.",
    isLocked: true,
    messageCount: 345,
    memberCount: 410,
    topics: [
      { id: "t25", title: "Ativação do Windows 11", author: "Admin", date: "20 dez.", content: "Métodos de ativação atualizados.", replies: 56, views: 1800, isPinned: true },
      { id: "t26", title: "Scripts úteis para PowerShell", author: "Daniel", date: "15 dez.", content: "Coleção de scripts PowerShell.", replies: 34, views: 890, tags: ["script"] },
    ],
  },
  {
    id: "11",
    slug: "vu-player",
    name: "Vu Player",
    icon: "🎬",
    iconColor: "#ef4444",
    iconBg: "#7f1d1d",
    description: "Configurações e dicas para o Vu Player",
    lastMessage: "Ícone do tópico alterado",
    lastAuthor: "Você",
    lastDate: "21 de dez.",
    isLocked: true,
    messageCount: 189,
    memberCount: 290,
    topics: [
      { id: "t27", title: "Configuração básica do Vu Player", author: "Admin", date: "20 dez.", content: "Como configurar do zero.", replies: 23, views: 670, isPinned: true },
      { id: "t28", title: "Melhores configurações de qualidade", author: "Carlos", date: "18 dez.", content: "Otimize a qualidade do streaming.", replies: 12, views: 340 },
    ],
  },
  {
    id: "12",
    slug: "atencao",
    name: "Atenção",
    icon: "⚠️",
    iconColor: "#fbbf24",
    iconBg: "#78350f",
    description: "Avisos importantes e alertas da comunidade",
    lastMessage: "Ícone do tópico alterado",
    lastAuthor: "Você",
    lastDate: "21 de dez.",
    isLocked: true,
    messageCount: 67,
    memberCount: 704,
    topics: [
      { id: "t29", title: "CUIDADO com golpes!", author: "Admin", date: "20 dez.", content: "Fiquem atentos a golpes e fraudes.", replies: 34, views: 2100, isPinned: true, tags: ["importante"] },
      { id: "t30", title: "Serviços falsos - Lista negra", author: "Admin", date: "15 dez.", content: "Lista de serviços fraudulentos.", replies: 23, views: 1500, isLocked: true },
    ],
  },
  {
    id: "13",
    slug: "cursos",
    name: "Cursos",
    icon: "📚",
    iconColor: "#34d399",
    iconBg: "#064e3b",
    description: "Cursos gratuitos e pagos compartilhados pela comunidade",
    lastMessage: "Ícone do tópico alterado",
    lastAuthor: "Você",
    lastDate: "21 de dez.",
    isLocked: true,
    messageCount: 234,
    memberCount: 560,
    topics: [
      { id: "t31", title: "Curso completo de edição de apps", author: "Wagner", date: "20 dez.", content: "Curso do básico ao avançado.", replies: 67, views: 2300, isPinned: true, tags: ["curso"] },
      { id: "t32", title: "Curso de redes e SSH", author: "Daniel Ssh", date: "15 dez.", content: "Aprenda redes do zero.", replies: 45, views: 1200 },
    ],
  },
  {
    id: "14",
    slug: "filmes-series-animes",
    name: "Filmes / Séries / Animes",
    icon: "🎬",
    iconColor: "#ef4444",
    iconBg: "#991b1b",
    description: "Compartilhamento de filmes, séries e animes",
    lastMessage: "Vídeo",
    lastAuthor: "Você",
    lastDate: "20 de out.",
    isLocked: true,
    messageCount: 456,
    memberCount: 620,
    topics: [
      { id: "t33", title: "Melhores apps para assistir", author: "Carlos", date: "19 out.", content: "Lista dos melhores aplicativos.", replies: 89, views: 3400, isPinned: true },
      { id: "t34", title: "Lançamentos da semana", author: "Admin", date: "15 out.", content: "Novos filmes e séries.", replies: 34, views: 890 },
    ],
  },
  {
    id: "15",
    slug: "ofertas-imperdivel",
    name: "Ofertas Imperdível",
    icon: "🎯",
    iconColor: "#ec4899",
    iconBg: "#831843",
    description: "Ofertas exclusivas e promoções para membros",
    lastMessage: "ACELERA ESSA MÁQUINA AÍ 🖥️ Ssd M.2...",
    lastAuthor: "Você",
    lastDate: "18 de out.",
    isLocked: true,
    messageCount: 123,
    memberCount: 540,
    topics: [
      { id: "t35", title: "ACELERA ESSA MÁQUINA AÍ - SSD M.2", author: "Admin", date: "18 out.", content: "Promoção imperdível de SSD M.2.", replies: 23, views: 670, tags: ["promoção"] },
      { id: "t36", title: "Ofertas de hospedagem", author: "Wagner", date: "10 out.", content: "Melhores preços de hospedagem.", replies: 12, views: 340 },
    ],
  },
];

export function getCategoryBySlug(slug: string): ForumCategory | undefined {
  return FORUM_CATEGORIES.find((cat) => cat.slug === slug);
}

export function formatMessageCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
