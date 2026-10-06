-- ============================================================
-- BASE DE PROCEDIMENTOS / MANUAIS DIGIFARMA
-- Execute este script no SQL Editor do seu Supabase Dashboard:
-- https://supabase.com/dashboard/project/yhmlaynltzwuksyzmzsg/sql
-- ============================================================

-- 1. Criação da tabela principal de Procedimentos
CREATE TABLE IF NOT EXISTS public.procedures (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL DEFAULT 'Geral',
    "systemVersion" TEXT DEFAULT 'v10',
    "menuId" TEXT DEFAULT 'geral',
    "submenuId" TEXT DEFAULT 'geral',
    "systemPath" TEXT,
    author TEXT DEFAULT 'Administrador',
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir que as colunas adicionais existam caso a tabela já tenha sido criada anteriormente
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "systemVersion" TEXT DEFAULT 'v10';
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "menuId" TEXT DEFAULT 'geral';
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "submenuId" TEXT DEFAULT 'geral';
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "systemPath" TEXT;
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "createdBy" TEXT DEFAULT 'Leonardo';
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "updatedBy" TEXT DEFAULT 'Leonardo';
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "history" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "formatType" TEXT;
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "pdfFileUrl" TEXT;
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "pdfFileName" TEXT;
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "pdfFileSize" BIGINT;
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "htmlFileData" TEXT;
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "htmlFileName" TEXT;
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "htmlFileSize" BIGINT;
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS "activeViewFormat" TEXT;

-- 2. Tabela de Usuários e Autenticação Simples
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso completo a app_users" ON public.app_users;
CREATE POLICY "Permitir acesso completo a app_users"
    ON public.app_users FOR ALL
    USING (true)
    WITH CHECK (true);

INSERT INTO public.app_users (id, username, name, password, must_change_password)
VALUES
    ('user-icaro', 'Icaro', 'Icaro', 'Trein@mento123', true),
    ('user-leonardo', 'Leonardo', 'Leonardo', 'Trein@mento123', true),
    ('user-wallace', 'Wallace', 'Wallace', 'Trein@mento123', true),
    ('user-whitalo', 'Whitalo', 'Whitalo', 'Trein@mento123', true)
ON CONFLICT (username) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre para a aplicação
DROP POLICY IF EXISTS "Permitir leitura pública/anônima de procedimentos" ON public.procedures;
CREATE POLICY "Permitir leitura pública/anônima de procedimentos"
    ON public.procedures FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Permitir inserção de procedimentos" ON public.procedures;
CREATE POLICY "Permitir inserção de procedimentos"
    ON public.procedures FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de procedimentos" ON public.procedures;
CREATE POLICY "Permitir atualização de procedimentos"
    ON public.procedures FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Permitir exclusão de procedimentos" ON public.procedures;
CREATE POLICY "Permitir exclusão de procedimentos"
    ON public.procedures FOR DELETE
    USING (true);

-- 2. Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_procedures_updated_at ON public.procedures;
CREATE TRIGGER trigger_procedures_updated_at
    BEFORE UPDATE ON public.procedures
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Configuração do Storage para Imagens de Procedimentos
-- Criação do bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('procedure-media', 'procedure-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de acesso ao Storage para upload e visualização das imagens
DROP POLICY IF EXISTS "Imagens de procedimentos públicas para leitura" ON storage.objects;
CREATE POLICY "Imagens de procedimentos públicas para leitura"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'procedure-media');

DROP POLICY IF EXISTS "Permitir upload de imagens de procedimentos" ON storage.objects;
CREATE POLICY "Permitir upload de imagens de procedimentos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'procedure-media');

DROP POLICY IF EXISTS "Permitir atualização de imagens de procedimentos" ON storage.objects;
CREATE POLICY "Permitir atualização de imagens de procedimentos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'procedure-media');

DROP POLICY IF EXISTS "Permitir exclusão de imagens de procedimentos" ON storage.objects;
CREATE POLICY "Permitir exclusão de imagens de procedimentos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'procedure-media');

-- 4. Exemplo inicial de procedimento pronto para visualização
INSERT INTO public.procedures (
    id,
    title,
    subtitle,
    category,
    "systemVersion",
    "menuId",
    "submenuId",
    "systemPath",
    author,
    tags,
    blocks
)
VALUES (
    'proc-recebimento-mercadorias',
    'Recebimento e Conferência de Mercadorias',
    'Guia passo a passo operacional para entrada de notas fiscais e checagem de lotes',
    'Estoque',
    'v10',
    'estoque',
    'entrada-notas',
    'Digifarma V10 ➔ Estoque ➔ Entrada de Notas XML',
    'Farmacêutico Responsável',
    ARRAY['Estoque', 'Conferência', 'Boas Práticas', 'SOP'],
    '[
        {
            "id": "block-1",
            "type": "heading",
            "content": "1. Recepção da Transportadora e Nota Fiscal"
        },
        {
            "id": "block-2",
            "type": "text",
            "content": "Ao chegar a mercadoria, confira se o número de volumes físicos corresponde exatamente ao especificado no Conhecimento de Transporte (CT-e) e na DANFE do fornecedor."
        },
        {
            "id": "block-3",
            "type": "callout",
            "calloutType": "warning",
            "content": "Atenção: Se a embalagem apresentar qualquer indício de violação, umidade ou avaria, registre fotos imediatamente e faça a ressalva no canhoto antes de assinar."
        },
        {
            "id": "block-4",
            "type": "heading",
            "content": "2. Verificação de Lote, Validade e Temperatura"
        },
        {
            "id": "block-5",
            "type": "text",
            "content": "Abra as caixas na área de triagem limpa. Para cada item recebido, faça o batimento de código de barras, número do lote e data de validade (mínimo de 12 meses exigido por padrão)."
        },
        {
            "id": "block-6",
            "type": "image",
            "url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
            "caption": "Exemplo da etiqueta de conferência de lote e validade no recebimento"
        },
        {
            "id": "block-7",
            "type": "heading",
            "content": "3. Lançamento no Sistema ERP"
        },
        {
            "id": "block-8",
            "type": "text",
            "content": "Importe o arquivo XML da NFe no sistema da Digifarma. Valide os preços de custo e finalize a conciliação do estoque."
        },
        {
            "id": "block-9",
            "type": "callout",
            "calloutType": "success",
            "content": "Finalização: Guarde os produtos nas prateleiras identificadas seguindo o padrão PVPS (Primeiro que Vence, Primeiro que Sai)."
        }
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
