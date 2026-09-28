-- ============================================================
-- BASE DE PROCEDIMENTOS / MANUAIS DIGIFARMA
-- Execute este script no SQL Editor do seu Supabase Dashboard
-- ============================================================

-- 1. Criação da tabela principal de Procedimentos
CREATE TABLE IF NOT EXISTS public.procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL DEFAULT 'Geral',
    author TEXT DEFAULT 'Administrador',
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre (perfeito para uso interno/local sem necessidade de login complexo inicial)
CREATE POLICY "Permitir leitura pública/anônima de procedimentos"
    ON public.procedures FOR SELECT
    USING (true);

CREATE POLICY "Permitir inserção de procedimentos"
    ON public.procedures FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Permitir atualização de procedimentos"
    ON public.procedures FOR UPDATE
    USING (true);

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

DROP POLICY IF EXISTS "Permitir exclusão de imagens de procedimentos" ON storage.objects;
CREATE POLICY "Permitir exclusão de imagens de procedimentos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'procedure-media');

-- 4. Exemplo inicial de procedimento pronto para visualização
INSERT INTO public.procedures (title, subtitle, category, author, tags, blocks)
VALUES (
    'Procedimento de Recebimento e Conferência de Mercadorias',
    'Guia passo a passo operacional para entrada de notas fiscais e checagem de lotes',
    'Operacional / Estoque',
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
ON CONFLICT DO NOTHING;
