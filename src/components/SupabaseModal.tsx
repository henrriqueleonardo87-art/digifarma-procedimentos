import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, X } from 'lucide-react';
import { getSavedConfig, saveConfig, testConnection } from '../lib/supabase';
import type { SupabaseConfig } from '../types/procedure';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(getSavedConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    saveConfig(config);
    setTesting(true);
    setTestResult(null);

    const res = await testConnection();
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      setTimeout(() => {
        onConnected();
        onClose();
      }, 1200);
    }
  };

  const handleTestOnly = async () => {
    saveConfig(config);
    setTesting(true);
    setTestResult(null);
    const res = await testConnection();
    setTesting(false);
    setTestResult(res);
  };

  const copySqlScript = () => {
    const sql = `-- Script de Configuração Digifarma
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

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissao Total Procedimentos" ON public.procedures FOR ALL USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('procedure-media', 'procedure-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Storage Acesso Publico Leitura" ON storage.objects FOR SELECT USING (bucket_id = 'procedure-media');
CREATE POLICY "Storage Acesso Publico Insercao" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'procedure-media');`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Database size={22} className="text-primary" />
            Configuração da Conexão Supabase
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Este repositório funciona <strong>localmente no seu computador</strong> (sem precisar ser publicado na web),
            mas se comunica perfeitamente com seu <strong>Supabase</strong> para armazenar procedimentos e imagens na nuvem.
          </p>

          <div className="form-group">
            <label className="form-label">Project URL (Supabase)</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://seu-projeto.supabase.co"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anon / Public API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={config.anonKey}
              onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bucket de Imagens (Storage)</label>
            <input
              type="text"
              className="form-input"
              placeholder="procedure-media"
              value={config.bucketName}
              onChange={(e) => setConfig({ ...config, bucketName: e.target.value })}
            />
          </div>

          {testResult && (
            <div
              className={`block-callout ${testResult.success ? 'success' : 'danger'}`}
              style={{ marginTop: '0.5rem' }}
            >
              {testResult.success ? (
                <CheckCircle2 size={20} className="callout-icon" />
              ) : (
                <AlertCircle size={20} className="callout-icon" />
              )}
              <div className="callout-body">
                <div className="callout-title">
                  {testResult.success ? 'Conexão Estabelecida' : 'Aviso de Conexão'}
                </div>
                <div>{testResult.message}</div>
              </div>
            </div>
          )}

          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Script SQL da Tabela e Storage
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                onClick={copySqlScript}
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                {copiedSql ? 'Copiado!' : 'Copiar SQL'}
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Cole e rode este script no <strong>SQL Editor</strong> do painel Supabase para criar a tabela de procedimentos e o bucket de fotos automaticamente.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleTestOnly} disabled={testing}>
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={testing}>
            Salvar e Conectar
          </button>
        </div>
      </div>
    </div>
  );
};
