import type { Procedure, SystemMenu, SystemVersion } from '../types/procedure';
import { getSupabase } from './supabase';

const LOCAL_STORAGE_KEY = 'digifarma_local_procedures';
const MENUS_STORAGE_KEY = 'digifarma_system_menus';
const ACTIVE_VERSION_KEY = 'digifarma_active_version';

export function getSavedSystemVersion(): SystemVersion | null {
  const saved = localStorage.getItem(ACTIVE_VERSION_KEY);
  if (saved === 'classico' || saved === 'v10') {
    return saved;
  }
  return null;
}

export function saveSystemVersion(version: SystemVersion | null): void {
  if (version) {
    localStorage.setItem(ACTIVE_VERSION_KEY, version);
  } else {
    localStorage.removeItem(ACTIVE_VERSION_KEY);
  }
}

export const DEFAULT_SYSTEM_MENUS: SystemMenu[] = [
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: 'FolderPlus',
    version: 'ambos',
    submenus: [
      { id: 'produtos', label: 'Medicamentos & Produtos', icon: 'Package' },
      { id: 'clientes', label: 'Clientes & Convênios', icon: 'Users' },
      { id: 'fornecedores', label: 'Fornecedores & Distribuidoras', icon: 'Truck' },
      { id: 'precos', label: 'Tabela de Preços & PMC', icon: 'Tag' },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque & Entradas',
    icon: 'Boxes',
    version: 'ambos',
    submenus: [
      { id: 'entrada-notas', label: 'Entrada de Notas XML', icon: 'FileInput' },
      { id: 'inventario', label: 'Inventário & Balanço', icon: 'ClipboardCheck' },
      { id: 'validade-lotes', label: 'Lotes & Validades (PVPS)', icon: 'CalendarAlert' },
      { id: 'transferencias', label: 'Transferências entre Lojas', icon: 'ArrowLeftRight' },
    ],
  },
  {
    id: 'vendas',
    label: 'Vendas & Balcão',
    icon: 'ShoppingCart',
    version: 'ambos',
    submenus: [
      { id: 'atendimento-f7', label: 'Consulta Rápida F7 com IA', icon: 'Search' },
      { id: 'balcao-pdv', label: 'Atendimento & Pré-Venda', icon: 'UserCheck' },
      { id: 'fidelidade', label: 'Fidelidade & Cashback 360º', icon: 'Award' },
      { id: 'pbm', label: 'PBM & Convênios Farmácia', icon: 'ShieldCheck' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro & Caixa',
    icon: 'DollarSign',
    version: 'ambos',
    submenus: [
      { id: 'caixa-cego', label: 'Fechamento de Caixa Cego', icon: 'Lock' },
      { id: 'contas-pagar', label: 'Contas a Pagar', icon: 'FileText' },
      { id: 'contas-receber', label: 'Contas a Receber', icon: 'CreditCard' },
      { id: 'fluxo-caixa', label: 'Fluxo de Caixa', icon: 'TrendingUp' },
    ],
  },
  {
    id: 'fiscal',
    label: 'Fiscal & Tributário',
    icon: 'FileSpreadsheet',
    version: 'ambos',
    submenus: [
      { id: 'nfce-nfe', label: 'Emissão NFC-e e NF-e', icon: 'Receipt' },
      { id: 'tributacao', label: 'Regras de ICMS & PIS/COFINS', icon: 'Percent' },
      { id: 'sped', label: 'SPED Fiscal & Sintegra', icon: 'FileCode' },
    ],
  },
  {
    id: 'sngpc',
    label: 'SNGPC & Controlados',
    icon: 'ShieldCheck',
    version: 'ambos',
    submenus: [
      { id: 'portaria344', label: 'Portaria 344/98 e Retenção', icon: 'ShieldAlert' },
      { id: 'livro-sngpc', label: 'Livro Eletrônico Anvisa', icon: 'BookOpen' },
      { id: 'transmissao-anvisa', label: 'Transmissão de Arquivos XML', icon: 'Send' },
    ],
  },
  {
    id: 'utilitarios',
    label: 'Configurações & Sistema',
    icon: 'Settings',
    version: 'ambos',
    submenus: [
      { id: 'usuarios', label: 'Usuários, Alçadas & Permissões', icon: 'UserCog' },
      { id: 'backup', label: 'Backup & Banco de Dados', icon: 'Database' },
      { id: 'parametros', label: 'Parâmetros Gerais do ERP', icon: 'Sliders' },
    ],
  },
];

export const INITIAL_PROCEDURES: Procedure[] = [
  // ==========================================
  // PROCEDIMENTOS DO DIGIFARMA CLÁSSICO
  // ==========================================
  {
    id: 'proc-classico-cadastro-produto',
    title: 'Cadastro de Medicamento e Código de Barras (EAN)',
    subtitle: 'Passo a passo no ERP Digifarma Clássico para cadastrar medicamento, código EAN, lote e parametrização tributária',
    category: 'Cadastros',
    systemVersion: 'classico',
    menuId: 'cadastros',
    submenuId: 'produtos',
    systemPath: 'Menu Principal ➔ Cadastros ➔ Produtos ➔ Incluir Novo (F2)',
    author: 'Farmacêutico Responsável',
    tags: ['Produtos', 'Medicamentos', 'Tributação', 'ERP Clássico'],
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    blocks: [
      {
        id: 'cp-1',
        type: 'heading',
        content: '1. Acesso à Tela de Inclusão de Produtos (Atalho F2)',
        level: 2,
      },
      {
        id: 'cp-2',
        type: 'text',
        content: 'No menu superior do Digifarma Clássico, clique em "Cadastros", selecione "Produtos" e pressione o botão "Incluir" (ou tecle F2 no teclado para acesso instantâneo).',
      },
      {
        id: 'cp-3',
        type: 'callout',
        calloutType: 'info',
        title: 'Dica de Agilidade com Leitor de Código de Barras',
        content: 'Com a tela aberta, aponte o leitor de código de barras para o código EAN-13 na caixa do medicamento. O Digifarma buscará automaticamente a descrição oficial na base nacional da Anvisa.',
      },
      {
        id: 'cp-4',
        type: 'heading',
        content: '2. Dados Cadastrais e Registro Anvisa',
        level: 2,
      },
      {
        id: 'cp-5',
        type: 'text',
        content: 'Confira a descrição completa do produto (ex: Dipirona Monoidratada 500mg/ml Gotas 20ml), o laboratório farmacêutico fabricante e o número de Registro MS de 13 dígitos.',
      },
      {
        id: 'cp-6',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80',
        caption: 'Figura 1: Conferência do código de barras EAN-13 e do registro MS na embalagem primária',
        altText: 'Embalagem de medicamento',
      },
      {
        id: 'cp-7',
        type: 'step',
        content: 'Verificar se o NCM correto (ex: 3004.90.99) foi preenchido conforme a DANFE do fornecedor.',
        completed: false,
      },
      {
        id: 'cp-8',
        type: 'step',
        content: 'Definir a classificação do produto: Medicamento Genérico, Referência, Similar ou Perfumaria.',
        completed: false,
      },
      {
        id: 'cp-9',
        type: 'heading',
        content: '3. Medicamentos Controlados e Portaria 344 (SNGPC)',
        level: 2,
      },
      {
        id: 'cp-10',
        type: 'callout',
        calloutType: 'warning',
        title: 'Atenção com Medicamentos Controlados',
        content: 'Caso o item pertença às listas A1, A2, B1, B2 ou C1 da Portaria 344/98, marque impreterivelmente a caixa "Controlado SNGPC" para que o PDV exija retenção de receita médica na venda.',
      },
      {
        id: 'cp-11',
        type: 'step',
        content: 'Pressione a tecla F10 ou clique em "Gravar (F10)" para salvar o cadastro e liberar o produto para venda imediata.',
        completed: false,
      },
    ],
  },
  {
    id: 'proc-classico-cadastro-cliente',
    title: 'Cadastro de Cliente e Limite de Convênio',
    subtitle: 'Procedimento para registrar novos clientes particulares ou conveniados, limites a prazo e bloqueios',
    category: 'Cadastros',
    systemVersion: 'classico',
    menuId: 'cadastros',
    submenuId: 'clientes',
    systemPath: 'Menu Principal ➔ Cadastros ➔ Clientes ➔ Incluir Novo',
    author: 'Atendimento & Caixa',
    tags: ['Cadastros', 'Clientes', 'Convênios', 'Crédito'],
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    blocks: [
      {
        id: 'cc-1',
        type: 'heading',
        content: '1. Consulta Prévia de CPF para Evitar Duplicidades',
        level: 2,
      },
      {
        id: 'cc-2',
        type: 'text',
        content: 'Acesse Cadastros > Clientes. Antes de clicar em "Novo", digite o CPF do cliente no campo de busca para certificar-se de que ele ainda não possui registro ativo no banco de dados.',
      },
      {
        id: 'cc-3',
        type: 'heading',
        content: '2. Preenchimento de Dados e Endereço',
        level: 2,
      },
      {
        id: 'cc-4',
        type: 'text',
        content: 'Preencha o Nome Completo, CPF, Telefone Celular (com DDD para envio de comprovante via WhatsApp) e o CEP residencial. O sistema auto-completa logradouro e bairro.',
      },
      {
        id: 'cc-5',
        type: 'callout',
        calloutType: 'info',
        title: 'Vínculo de Convênio Empresarial',
        content: 'Se o cliente for funcionário de empresa conveniada, selecione o convênio correspondente na aba "Convênio" e informe a matrícula interna.',
      },
      {
        id: 'cc-6',
        type: 'step',
        content: 'Definir o limite máximo de compra a prazo (ex: R$ 300,00) autorizado pelo convênio.',
        completed: false,
      },
      {
        id: 'cc-7',
        type: 'step',
        content: 'Clicar em "Confirmar Cadastro" para emitir a ficha cadastral do cliente.',
        completed: false,
      },
    ],
  },
  {
    id: 'proc-classico-entrada-xml',
    title: 'Entrada de Nota Fiscal por Importação de XML',
    subtitle: 'Importação do arquivo XML da distribuidora, amarração de produtos, conferência cega e cálculo de custo',
    category: 'Estoque',
    systemVersion: 'classico',
    menuId: 'estoque',
    submenuId: 'entrada-notas',
    systemPath: 'Menu Principal ➔ Estoque ➔ Entrada de Notas ➔ Importar XML (F5)',
    author: 'Equipe de Logística',
    tags: ['Estoque', 'Conferência', 'Boas Práticas', 'XML'],
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    blocks: [
      {
        id: 'b-1',
        type: 'heading',
        content: '1. Importação do Arquivo XML da Distribuidora',
        level: 2,
      },
      {
        id: 'b-2',
        type: 'text',
        content: 'No menu principal, acesse Estoque > Entrada de Notas. Clique no botão "Importar XML" (ou pressione F5). Selecione o arquivo XML recebido da distribuidora ou insira a Chave de Acesso de 44 dígitos.',
      },
      {
        id: 'b-3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Figura 1: Triagem de volumes físicos e conferência dos lotes das caixas recebidas',
        altText: 'Bancada de conferência de estoque',
      },
      {
        id: 'b-4',
        type: 'callout',
        calloutType: 'warning',
        title: 'Conferência Cega Obrigatória',
        content: 'Nunca valide a nota sem abrir as caixas físicas. Todos os frascos e caixas devem ter lote e data de validade conferidos contra os dados da nota.',
      },
      {
        id: 'b-5',
        type: 'step',
        content: 'Conferir se os códigos do fornecedor foram associados corretamente aos códigos internos da farmácia.',
        completed: false,
      },
      {
        id: 'b-6',
        type: 'step',
        content: 'Verificar a margem de lucro sugerida e atualizar os preços de venda caso haja alteração de custo.',
        completed: false,
      },
      {
        id: 'b-7',
        type: 'step',
        content: 'Clicar em "Confirmar Entrada" para atualizar o estoque físico e alimentar o contas a pagar.',
        completed: false,
      },
    ],
  },

  // ==========================================
  // PROCEDIMENTOS DO DIGIFARMA V10 (NOVA GERAÇÃO)
  // ==========================================
  {
    id: 'proc-v10-cadastro-produto',
    title: 'Cadastro Inteligente de Produtos no V10 Web',
    subtitle: 'Cadastro ágil em nuvem com consulta automática na base Anvisa, foto do produto e sincronização em tempo real',
    category: 'Cadastros',
    systemVersion: 'v10',
    menuId: 'cadastros',
    submenuId: 'produtos',
    systemPath: 'Digifarma V10 ➔ Cadastros ➔ Produtos ➔ + Novo Produto',
    author: 'Equipe de Implantação V10',
    tags: ['V10', 'Web', 'Medicamentos', 'Cloud', 'IA'],
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    blocks: [
      {
        id: 'vp-1',
        type: 'heading',
        content: '1. Acesso ao Catálogo Central no V10',
        level: 2,
      },
      {
        id: 'vp-2',
        type: 'text',
        content: 'No painel lateral do Digifarma V10, clique em "Cadastros" e selecione "Produtos". No canto superior direito, clique no botão vermelho "+ Novo Produto".',
      },
      {
        id: 'vp-3',
        type: 'callout',
        calloutType: 'success',
        title: 'Preenchimento Automático por IA',
        content: 'Ao digitar ou bipar o código de barras (EAN), o Digifarma V10 preenche automaticamente a foto oficial em alta resolução, bula resumida, princípio ativo e posologia.',
      },
      {
        id: 'vp-4',
        type: 'heading',
        content: '2. Formação do Preço de Venda e Margem',
        level: 2,
      },
      {
        id: 'vp-5',
        type: 'text',
        content: 'Informe o custo de aquisição. O motor de precificação do V10 sugere automaticamente o PMC (Preço Máximo ao Consumidor) e calcula a margem líquida considerando o regime tributário da loja.',
      },
      {
        id: 'vp-6',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        caption: 'Figura 1: Painel analítico de precificação e margem em tempo real no V10',
        altText: 'Dashboard de precificação V10',
      },
      {
        id: 'vp-7',
        type: 'step',
        content: 'Selecionar as categorias do e-commerce/delivery para disponibilização no catálogo digital.',
        completed: false,
      },
      {
        id: 'vp-8',
        type: 'step',
        content: 'Clicar em "Salvar e Publicar" para sincronizar com todos os caixas e filiais conectadas em segundos.',
        completed: false,
      },
    ],
  },
  {
    id: 'proc-v10-inventario-balanco',
    title: 'Contagem de Inventário com Coletor e Celular no V10',
    subtitle: 'Procedimento para realizar contagem de estoque e balanço periódico usando a câmera do celular ou leitor bluetooth',
    category: 'Estoque',
    systemVersion: 'v10',
    menuId: 'estoque',
    submenuId: 'inventario',
    systemPath: 'Digifarma V10 ➔ Estoque ➔ Inventário & Balanço ➔ Iniciar Nova Contagem',
    author: 'Coordenação de Estoque',
    tags: ['V10', 'Inventário', 'Balanço', 'Mobile', 'Coletor'],
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 14400000).toISOString(),
    blocks: [
      {
        id: 'vi-1',
        type: 'heading',
        content: '1. Abertura da Sessão de Inventário',
        level: 2,
      },
      {
        id: 'vi-2',
        type: 'text',
        content: 'No Digifarma V10, acesse Estoque > Inventário & Balanço. Clique em "Nova Sessão" e defina o filtro (por Seção, Prateleira ou Laboratório). O sistema congelará o saldo contábil daquela área sem interromper as vendas.',
      },
      {
        id: 'vi-3',
        type: 'heading',
        content: '2. Bipagem com Aplicativo Móvel',
        level: 2,
      },
      {
        id: 'vi-4',
        type: 'text',
        content: 'Abra o app "Digifarma Coletor" no celular corporativo ou no coletor de dados Android. Faça login e escaneie os itens prateleira por prateleira.',
      },
      {
        id: 'vi-5',
        type: 'callout',
        calloutType: 'info',
        title: 'Modo Offline Ativo',
        content: 'Mesmo sem sinal Wi-Fi no estoque do fundo da loja, o app grava as contagens localmente e sincroniza assim que o sinal for restabelecido.',
      },
      {
        id: 'vi-6',
        type: 'step',
        content: 'Escanear todos os produtos físicos e confirmar as quantidades contadas.',
        completed: false,
      },
      {
        id: 'vi-7',
        type: 'step',
        content: 'Abrir a tela de divergências no V10 Web e recontar apenas os itens com diferença apontada.',
        completed: false,
      },
      {
        id: 'vi-8',
        type: 'step',
        content: 'Solicitar aprovação do gerente e clicar em "Ajustar Saldos de Estoque".',
        completed: false,
      },
    ],
  },
  {
    id: 'proc-v10-usuarios-permissoes',
    title: 'Criação de Usuários e Alçadas de Desconto no V10',
    subtitle: 'Instruções para cadastrar operadores de caixa, balconistas e gerentes com permissões de acesso específicas',
    category: 'Utilitários',
    systemVersion: 'v10',
    menuId: 'utilitarios',
    submenuId: 'usuarios',
    systemPath: 'Digifarma V10 ➔ Utilitários ➔ Usuários & Permissões ➔ Novo Operador',
    author: 'Administrador de TI',
    tags: ['V10', 'Segurança', 'Permissões', 'Usuários', 'Controle'],
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    blocks: [
      {
        id: 'vu-1',
        type: 'heading',
        content: '1. Acesso à Gestão de Acessos e Usuários',
        level: 2,
      },
      {
        id: 'vu-2',
        type: 'text',
        content: 'No menu Utilitários, clique em "Usuários & Permissões". Clique em "+ Convidar Usuário" e informe o e-mail corporativo do colaborador.',
      },
      {
        id: 'vu-3',
        type: 'callout',
        calloutType: 'danger',
        title: 'Alçadas de Desconto no PDV Web',
        content: 'Balconistas e operadores de caixa só devem receber permissão de desconto até 12%. Qualquer valor superior exige liberação por PIN ou biometria do supervisor.',
      },
      {
        id: 'vu-4',
        type: 'step',
        content: 'Vincular o usuário ao perfil correspondente (ex: Operador de PDV, Balcão, Comprador ou Gerente Geral).',
        completed: false,
      },
      {
        id: 'vu-5',
        type: 'step',
        content: 'Configurar se o usuário tem permissão para cancelar cupons fiscais e realizar sangrias de caixa.',
        completed: false,
      },
      {
        id: 'vu-6',
        type: 'step',
        content: 'Gerar o PIN de 4 dígitos para liberação rápida no caixa e enviar convite de ativação.',
        completed: false,
      },
    ],
  },
  {
    id: 'proc-v10-tabela-f7-ia',
    title: 'Consulta F7 Inteligente, Pesquisa por Sintoma (IA) e Bula Completa',
    subtitle: 'Procedimento de atendimento no balcão usando o F7 inteligente: pesquisa por necessidade com IA (Ctrl+Enter), equivalente genérico com máxima economia e conferência de bula',
    category: 'Vendas & Balcão',
    systemVersion: 'v10',
    menuId: 'cadastros',
    submenuId: 'produtos',
    systemPath: 'Digifarma V10 ➔ Balcão / PDV ➔ Tabela de Preços (F7) ➔ Pesquisa IA (Ctrl+Enter)',
    author: 'Farmacêutico RT / Coordenação de Atendimento',
    tags: ['V10', 'F7', 'Tabela de Preços', 'Inteligência Artificial', 'Genéricos', 'Bula', 'Balcão'],
    is_favorite: true,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date().toISOString(),
    blocks: [
      {
        id: 'f7-1',
        type: 'heading',
        content: '1. Abertura da Tabela de Preços F7 no Balcão',
        level: 2,
      },
      {
        id: 'f7-2',
        type: 'text',
        content: 'Durante a conversa com o cliente no balcão ou caixa, pressione a tecla F7. O sistema abrirá a Tabela de Preços com exibição simultânea da foto do medicamento, valor da última compra, PMC oficial e a coluna tabloide de ofertas da loja.',
      },
      {
        id: 'f7-3',
        type: 'callout',
        calloutType: 'info',
        title: 'Pesquisa por Sintoma com IA (Ctrl + Enter)',
        content: 'Quando o cliente não souber o nome do medicamento e descrever apenas o sintoma (ex: "dor de garganta com febre"), pressione Ctrl + Enter. A IA integrada do Digifarma V10 sugere imediatamente os medicamentos e genéricos com as substâncias ativas adequadas.',
      },
      {
        id: 'f7-4',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1200&q=80',
        caption: 'Figura 1: Tabela de Preços F7 no V10 com foto do produto, pesquisa preditiva e equivalente genérico',
        altText: 'Tabela de Preços F7 Digifarma V10',
      },
      {
        id: 'f7-5',
        type: 'heading',
        content: '2. Apresentação do Genérico com Máxima Economia',
        level: 2,
      },
      {
        id: 'f7-6',
        type: 'text',
        content: 'Na coluna de equivalentes, verifique o genérico correspondente com a indicação em destaque da porcentagem de economia (ex: "Até 65% de economia"). Apresente a opção mais vantajosa para o cliente.',
      },
      {
        id: 'f7-7',
        type: 'callout',
        calloutType: 'success',
        title: 'Bula Completa Integrada (Ctrl + B)',
        content: 'Para verificar a posologia, modo de usar e contraindicações sem sair do balcão, tecle Ctrl + B. A bula oficial da Anvisa é exibida instantaneamente.',
      },
      {
        id: 'f7-8',
        type: 'step',
        content: 'Validar com o cliente a dosagem e apresentação recomendada (gotas, comprimidos ou xarope).',
        completed: false,
      },
      {
        id: 'f7-9',
        type: 'step',
        content: 'Pressionar Enter para carregar o produto selecionado diretamente na pré-venda do caixa.',
        completed: false,
      },
    ],
  },
  {
    id: 'proc-v10-painel-360-cliente',
    title: 'Painel 360º do Cliente, Histórico de Compras e Programa de Fidelidade',
    subtitle: 'Como utilizar a visão unificada 360º do cliente: consulta de pontos, saldo de cashback, ticket médio e perfil por estrelas',
    category: 'Cadastros',
    systemVersion: 'v10',
    menuId: 'cadastros',
    submenuId: 'clientes',
    systemPath: 'Digifarma V10 ➔ Cadastros ➔ Clientes ➔ Painel 360º (Ctrl + Espaço)',
    author: 'Gestão de Relacionamento & Fidelidade',
    tags: ['V10', 'Clientes', 'Fidelidade', 'Cashback', 'CRM', '360º'],
    is_favorite: true,
    created_at: new Date(Date.now() - 60000000).toISOString(),
    updated_at: new Date().toISOString(),
    blocks: [
      {
        id: 'p360-1',
        type: 'heading',
        content: '1. Localização Instantânea via Busca Global (Ctrl + Espaço)',
        level: 2,
      },
      {
        id: 'p360-2',
        type: 'text',
        content: 'Pressione o atalho global Ctrl + Espaço em qualquer tela do Digifarma V10 e digite o nome, CPF ou celular do cliente. Ao selecionar o registro, o Painel 360º abrirá com todos os dados consolidados.',
      },
      {
        id: 'p360-3',
        type: 'callout',
        calloutType: 'success',
        title: 'Fidelidade Ativa no Balcão',
        content: 'O saldo acumulado de pontos e o valor disponível em reais de cashback são exibidos logo abaixo da foto do cliente, permitindo resgate imediato de prêmios ou desconto na venda atual.',
      },
      {
        id: 'p360-4',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1556742049-0a67e5574f73?auto=format&fit=crop&w=1200&q=80',
        caption: 'Figura 1: Visão 360º com histórico de compras, frequência, ticket médio e estrelas do cliente',
        altText: 'Painel 360 do Cliente Digifarma V10',
      },
      {
        id: 'p360-5',
        type: 'heading',
        content: '2. Histórico de Compras e Alerta de Clientes em Risco',
        level: 2,
      },
      {
        id: 'p360-6',
        type: 'text',
        content: 'Analise a frequência de compras e os produtos habituais do cliente. Clientes classificados com 4 ou 5 estrelas devem receber tratamento preferencial da equipe de balcão.',
      },
      {
        id: 'p360-7',
        type: 'step',
        content: 'Conferir se o cliente possui compras a prazo em aberto ou convênio empresarial ativo.',
        completed: false,
      },
      {
        id: 'p360-8',
        type: 'step',
        content: 'Oferecer o resgate do cashback acumulado para abater no pagamento da compra.',
        completed: false,
      },
    ],
  },
  {
    id: 'proc-v10-caixa-cego-gestor',
    title: 'Fechamento de Caixa Cego e Alçadas de Segurança do Gestor',
    subtitle: 'Procedimento de segurança para conferência cega do operador de caixa e ocultação de custos e estoques no balcão',
    category: 'Utilitários',
    systemVersion: 'v10',
    menuId: 'utilitarios',
    submenuId: 'configuracoes',
    systemPath: 'Digifarma V10 ➔ Caixa & Financeiro ➔ Fechamento Cego de Turno',
    author: 'Gestão Financeira & Prevenção de Perdas',
    tags: ['V10', 'Caixa Cego', 'Segurança', 'Auditoria', 'Prevenção de Perdas'],
    is_favorite: true,
    created_at: new Date(Date.now() - 72000000).toISOString(),
    updated_at: new Date().toISOString(),
    blocks: [
      {
        id: 'ccg-1',
        type: 'heading',
        content: '1. Execução do Fechamento Cego pelo Operador',
        level: 2,
      },
      {
        id: 'ccg-2',
        type: 'text',
        content: 'Ao encerrar o turno de trabalho, o operador realiza a contagem física das cédulas, moedas, comprovantes de cartão e PIX. No sistema, ele digita apenas os valores apurados fisicamente, sem que a tela mostre o valor esperado pelo sistema ou eventuais diferenças.',
      },
      {
        id: 'ccg-3',
        type: 'callout',
        calloutType: 'warning',
        title: 'Conferência Honesta e Prevenção de Fraudes',
        content: 'O fechamento cego impede que o operador ajuste valores ou oculte sobras/faltas de caixa durante o encerramento do turno.',
      },
      {
        id: 'ccg-4',
        type: 'heading',
        content: '2. Conferência e Aprovação Exclusiva do Gestor',
        level: 2,
      },
      {
        id: 'ccg-5',
        type: 'text',
        content: 'O gestor acessa o Painel de Caixas com sua senha master, visualiza a conciliação completa entre o saldo do sistema e a contagem física do operador, e valida as divergências.',
      },
      {
        id: 'ccg-6',
        type: 'step',
        content: 'Verificar se todas as sangrias e suprimentos do dia foram homologados com comprovante assinado.',
        completed: false,
      },
      {
        id: 'ccg-7',
        type: 'step',
        content: 'Emitir o Termo de Encerramento do Caixa e arquivar junto ao envelope numerado do malote.',
        completed: false,
      },
    ],
  },
];

// Gerenciamento de Menus e Submenus
export async function fetchSystemMenus(): Promise<SystemMenu[]> {
  const local = localStorage.getItem(MENUS_STORAGE_KEY);
  if (local !== null) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(DEFAULT_SYSTEM_MENUS));
  return DEFAULT_SYSTEM_MENUS;
}

export async function saveSystemMenus(menus: SystemMenu[]): Promise<void> {
  localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(menus));
}

// Gerenciamento de Procedimentos
export async function fetchAllProcedures(): Promise<Procedure[]> {
  const client = getSupabase();

  if (client) {
    try {
      const { data, error } = await client
        .from('procedures')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        if (data.length > 0) {
          const normalized = (data as Record<string, unknown>[]).map((p) => {
            // Se houver metadados salvos dentro dos blocks
            const blocks = Array.isArray(p.blocks) ? p.blocks : [];
            const metaBlock = blocks.find((b: Record<string, unknown>) => b && b._isProcMeta) as Record<string, unknown> | undefined;

            return {
              ...p,
              systemVersion: (p.systemVersion || p.systemversion || metaBlock?.systemVersion || 'v10') as SystemVersion,
              menuId: (p.menuId || p.menuid || metaBlock?.menuId || 'geral') as string,
              submenuId: (p.submenuId || p.submenuid || metaBlock?.submenuId || 'geral') as string,
              systemPath: (p.systemPath || p.systempath || metaBlock?.systemPath || '') as string,
              status: (p.status || metaBlock?.status || 'aprovado') as 'aprovado' | 'pendente' | 'ajustes_solicitados' | 'despublicado',
              isActive: p.isActive !== undefined ? Boolean(p.isActive) : metaBlock?.isActive !== undefined ? Boolean(metaBlock.isActive) : true,
              formatType: (p.formatType || metaBlock?.formatType || (p.htmlFileData ? (p.pdfFileUrl ? 'both' : 'html') : 'pdf')),
              pdfFileUrl: (p.pdfFileUrl || metaBlock?.pdfFileUrl) as string | undefined,
              pdfFileName: (p.pdfFileName || metaBlock?.pdfFileName) as string | undefined,
              pdfFileSize: (p.pdfFileSize || metaBlock?.pdfFileSize) as number | undefined,
              htmlFileData: (p.htmlFileData || metaBlock?.htmlFileData) as string | undefined,
              htmlFileName: (p.htmlFileName || metaBlock?.htmlFileName) as string | undefined,
              htmlFileSize: (p.htmlFileSize || metaBlock?.htmlFileSize) as number | undefined,
              activeViewFormat: (p.activeViewFormat || metaBlock?.activeViewFormat || 'pdf') as 'pdf' | 'html',
              reviewedBy: (p.reviewedBy || metaBlock?.reviewedBy) as string | undefined,
              blocks: blocks.filter((b: Record<string, unknown>) => !b || !b._isProcMeta),
            };
          }) as unknown as Procedure[];

          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
          return normalized;
        } else {
          // Se o banco retornou 0 procedimentos, verifica se o usuário tem itens no localStorage para sincronizar
          const local = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Sobe os itens locais para o Supabase para que fiquem disponíveis em qualquer máquina
                for (const item of parsed) {
                  await saveProcedure(item);
                }
                return parsed;
              }
            } catch {
              // ignore
            }
          }
          return [];
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar do Supabase, buscando cache local:', err);
    }
  }

  // Fallback LocalStorage caso o Supabase não esteja acessível
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Ignora erro de parse
    }
  }

  return [];
}

export async function saveProcedure(procedure: Procedure): Promise<Procedure> {
  const now = new Date().toISOString();
  const updatedProcedure: Procedure = {
    ...procedure,
    updated_at: now,
    created_at: procedure.created_at || now,
  };

  const client = getSupabase();

  if (client) {
    try {
      // Tentativa 1: upsert completo direto
      const { error } = await client
        .from('procedures')
        .upsert(updatedProcedure)
        .select()
        .single();

      if (error) {
        // Se falhou por coluna ausente no banco Supabase (ex: isActive ou status não criados ainda via SQL)
        // Empacotamos os metadados com segurança dentro de blocks para garantir persistência 100% no Supabase!
        const metaBlock = {
          _isProcMeta: true,
          status: updatedProcedure.status || 'aprovado',
          isActive: updatedProcedure.isActive !== false,
          systemVersion: updatedProcedure.systemVersion || 'v10',
          menuId: updatedProcedure.menuId,
          submenuId: updatedProcedure.submenuId,
          systemPath: updatedProcedure.systemPath,
          formatType: updatedProcedure.formatType,
          pdfFileUrl: updatedProcedure.pdfFileUrl,
          pdfFileName: updatedProcedure.pdfFileName,
          pdfFileSize: updatedProcedure.pdfFileSize,
          htmlFileData: updatedProcedure.htmlFileData,
          htmlFileName: updatedProcedure.htmlFileName,
          htmlFileSize: updatedProcedure.htmlFileSize,
          activeViewFormat: updatedProcedure.activeViewFormat,
          reviewedBy: updatedProcedure.reviewedBy,
        };

        const safePayload: Record<string, unknown> = {
          id: updatedProcedure.id,
          title: updatedProcedure.title,
          subtitle: updatedProcedure.subtitle,
          category: updatedProcedure.category || 'Geral',
          author: updatedProcedure.author || 'Administrador',
          blocks: [metaBlock, ...(updatedProcedure.blocks || [])],
          tags: updatedProcedure.tags || [],
          is_favorite: Boolean(updatedProcedure.is_favorite),
          created_at: updatedProcedure.created_at,
          updated_at: updatedProcedure.updated_at,
        };

        const { error: safeError } = await client
          .from('procedures')
          .upsert(safePayload);

        if (safeError) {
          console.warn('Erro ao salvar no Supabase (modo compatibilidade):', safeError.message);
        }
      }
    } catch (err) {
      console.warn('Exceção ao salvar no Supabase:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  let list: Procedure[] = local ? JSON.parse(local) : [];
  const existingIndex = list.findIndex((p) => p.id === updatedProcedure.id);

  if (existingIndex >= 0) {
    list[existingIndex] = updatedProcedure;
  } else {
    list.unshift(updatedProcedure);
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  return updatedProcedure;
}

export async function deleteProcedure(id: string): Promise<boolean> {
  const client = getSupabase();

  if (client) {
    try {
      await client.from('procedures').delete().eq('id', id);
    } catch (err) {
      console.warn('Erro ao deletar no Supabase:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    const list: Procedure[] = JSON.parse(local);
    const filtered = list.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }

  return true;
}

export async function toggleFavoriteProcedure(id: string): Promise<Procedure | null> {
  const procedures = await fetchAllProcedures();
  const target = procedures.find((p) => p.id === id);
  if (!target) return null;

  target.is_favorite = !target.is_favorite;
  return await saveProcedure(target);
}
