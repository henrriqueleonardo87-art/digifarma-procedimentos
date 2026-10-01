import React from 'react';
import {
  Printer,
  FileDown,
  FileCheck,
} from 'lucide-react';
import type { Procedure, SlideIndicator } from '../types/procedure';

interface StandardPdfDocumentProps {
  procedure: Procedure;
  isEditable?: boolean;
  onUpdateTitle?: (title: string) => void;
  onUpdateSubtitle?: (subtitle: string) => void;
  onUpdateStep?: (stepIdx: number, field: string, value: string) => void;
  onPrint?: () => void;
  onExportHtml?: () => void;
}

export const StandardPdfDocument: React.FC<StandardPdfDocumentProps> = ({
  procedure,
  isEditable = false,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateStep,
  onPrint,
  onExportHtml,
}) => {
  const steps = procedure.blocks.filter((b) => b.type === 'step') as any[];
  const images = procedure.blocks.filter((b) => b.type === 'image') as any[];
  const callouts = procedure.blocks.filter((b) => b.type === 'callout') as any[];
  const isV10 = procedure.systemVersion === 'v10';
  const versionLabel = isV10 ? 'Digifarma V10' : 'Digifarma Clássico';

  const popCode = `POP-DF-${(procedure.id || '001').slice(-4).toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const signatures = procedure.signatures || {
    elaboratedByTitle: 'ELABORADO POR',
    elaboratedByName: procedure.author || 'Leonardo Henrique B. Trevas',
    elaboratedByRole: 'Digifarma Sistemas',
    reviewedByTitle: 'REVISADO POR',
    reviewedByName: procedure.reviewedBy || 'Garantia da Qualidade (BPF)',
    reviewedByRole: 'Controle de Procedimentos',
    approvedByTitle: 'APROVADO POR',
    approvedByName: 'Leonardo Henrique B. Trevas',
    approvedByRole: 'Responsável Técnico / Gestor',
    companyName: 'Digifarma Sistemas LTDA',
    slogan: 'Digitalmente fácil · Homologado ISO 9001 & Boas Práticas Farmacêuticas',
  };

  // Helper para buscar indicadores de uma etapa
  const getStepIndicators = (stepIdx: number): SlideIndicator[] => {
    if (!procedure.slidesConfig) return [];
    const found = procedure.slidesConfig.find(
      (s) => s.slideType === 'step' && s.stepIndex === stepIdx
    );
    return found?.indicators || [];
  };

  return (
    <div className="standard-pdf-page-container">
      {/* Barra de Ações Rápidas no Modo PDF Normal (Oculta na impressão) */}
      <div className="pdf-doc-toolbar no-print">
        <div className="pdf-doc-toolbar-left">
          <span className="pdf-doc-badge">
            <FileCheck size={14} /> MODELO OFICIAL DE DOCUMENTO POP (A4)
          </span>
          <span className="pdf-doc-subtitle">
            Folha normal padronizada para impressão oficial, auditoria e vigilância sanitária.
          </span>
        </div>

        <div className="pdf-doc-toolbar-actions">
          {onExportHtml && (
            <button type="button" className="btn secondary sm" onClick={onExportHtml}>
              <FileDown size={14} /> Exportar HTML
            </button>
          )}
          <button
            type="button"
            className="btn primary sm"
            onClick={onPrint || (() => window.print())}
          >
            <Printer size={14} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* ── CORPO DO DOCUMENTO FORMAL A4 (IMPRESSÃO PERFEITA) ── */}
      <article className="official-pop-sheet" id="printable-procedure">
        {/* 1. CABEÇALHO FORMAL INSTITUCIONAL DO POP */}
        <header className="pop-formal-header">
          <table className="pop-header-table">
            <tbody>
              <tr>
                <td className="pop-hdr-logo-cell">
                  <div className="pop-hdr-brand">
                    <span className="brand-digi">Digi</span>
                    <span className="brand-farma">farma</span>
                  </div>
                  <span className="pop-hdr-tagline">Sistemas de Gestão</span>
                </td>
                <td className="pop-hdr-title-cell">
                  <span className="pop-doc-type">PROCEDIMENTO OPERACIONAL PADRÃO (POP)</span>
                  {isEditable && onUpdateTitle ? (
                    <input
                      type="text"
                      className="pop-inline-title-input"
                      value={procedure.title}
                      onChange={(e) => onUpdateTitle(e.target.value)}
                      placeholder="Título Oficial do POP..."
                    />
                  ) : (
                    <h1 className="pop-title-heading">{procedure.title}</h1>
                  )}
                  <span className="pop-hdr-module">
                    Módulo: <strong>{procedure.category || 'Operacional ERP'}</strong>
                  </span>
                </td>
                <td className="pop-hdr-meta-cell">
                  <div className="pop-meta-row">
                    <span>CÓDIGO:</span> <strong>{popCode}</strong>
                  </div>
                  <div className="pop-meta-row">
                    <span>VERSÃO:</span> <strong>1.0 ({versionLabel})</strong>
                  </div>
                  <div className="pop-meta-row">
                    <span>EMISSÃO:</span> <strong>{currentDate}</strong>
                  </div>
                  <div className="pop-meta-row">
                    <span>STATUS:</span>{' '}
                    <strong style={{ color: procedure.status === 'aprovado' ? '#10b981' : '#f59e0b' }}>
                      {procedure.status === 'aprovado' ? 'HOMOLOGADO' : 'EM REVISÃO'}
                    </strong>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </header>

        {/* 2. DADOS DE CONTROLE & CAMINHO NO SISTEMA */}
        <section className="pop-meta-strip">
          <div className="pop-meta-item">
            <span className="lbl">Sistema ERP:</span>
            <span className="val">{versionLabel}</span>
          </div>
          <div className="pop-meta-item">
            <span className="lbl">Setor / Rotina:</span>
            <span className="val">{procedure.category || 'Geral'}</span>
          </div>
          <div className="pop-meta-item" style={{ flex: 1.5 }}>
            <span className="lbl">Caminho de Acesso:</span>
            <span className="val path">{procedure.systemPath || `${versionLabel} ➔ ${procedure.category}`}</span>
          </div>
          <div className="pop-meta-item">
            <span className="lbl">Responsável Técnico:</span>
            <span className="val">{procedure.author}</span>
          </div>
        </section>

        {/* 3. SEÇÃO 1: OBJETIVO & CAMPO DE APLICAÇÃO */}
        <section className="pop-section-block">
          <div className="pop-sec-header">
            <span className="sec-num">1.</span>
            <h2>OBJETIVO &amp; DIRETRIZES DE APLICAÇÃO</h2>
          </div>
          <div className="pop-sec-content">
            {isEditable && onUpdateSubtitle ? (
              <textarea
                className="pop-inline-textarea"
                rows={2}
                value={procedure.subtitle}
                onChange={(e) => onUpdateSubtitle(e.target.value)}
                placeholder="Descreva a finalidade e objetivo operacional deste POP..."
              />
            ) : (
              <p className="pop-lead-text">
                {procedure.subtitle ||
                  `Padronizar e homologar a execução da rotina ${procedure.title} no sistema ${versionLabel}, garantindo a conformidade sanitária com as Boas Práticas Farmacêuticas (BPF), rastreabilidade de dados e segurança operacional.`}
              </p>
            )}
          </div>
        </section>

        {/* 4. SEÇÃO 2: ROTEIRO PASSO A PASSO OPERACIONAL */}
        <section className="pop-section-block">
          <div className="pop-sec-header">
            <span className="sec-num">2.</span>
            <h2>ROTEIRO OPERACIONAL PASSO A PASSO</h2>
          </div>

          <div className="pop-steps-list">
            {steps.map((step, idx) => {
              const stepImg = images[idx]?.url;
              const indicators = getStepIndicators(idx);

              return (
                <div key={step.id || `step-${idx}`} className="pop-step-card">
                  <div className="pop-step-card-header">
                    <span className="pop-step-number-badge">PASSO {(idx + 1).toString().padStart(2, '0')}</span>
                    {isEditable && onUpdateStep ? (
                      <input
                        type="text"
                        className="pop-inline-step-title-input"
                        value={step.title || ''}
                        onChange={(e) => onUpdateStep(idx, 'title', e.target.value)}
                        placeholder="Título da Etapa..."
                      />
                    ) : (
                      <h3 className="pop-step-card-title">{step.title}</h3>
                    )}
                  </div>

                  <div className="pop-step-card-body">
                    {/* Instrução Detalhada */}
                    <div className="pop-step-instruction">
                      {isEditable && onUpdateStep ? (
                        <textarea
                          className="pop-inline-textarea"
                          rows={2}
                          value={step.instruction || step.content}
                          onChange={(e) => onUpdateStep(idx, 'instruction', e.target.value)}
                          placeholder="Instrução técnica detalhada da etapa..."
                        />
                      ) : (
                        <p>{step.instruction || step.content}</p>
                      )}
                    </div>

                    {/* Screenshot Centralizado Proporcional com Indicadores */}
                    {stepImg && (
                      <div className="pop-step-screenshot-box">
                        <div className="pop-step-screenshot-inner">
                          <img src={stepImg} alt={step.title} />
                          {indicators.map((ind) => (
                            <div
                              key={ind.id}
                              className="pop-doc-indicator"
                              style={{
                                position: 'absolute',
                                left: `${ind.x}%`,
                                top: `${ind.y}%`,
                                transform: `translate(-50%, -50%) scale(${ind.scale || 1.0})`,
                                color: ind.color || '#ef4444',
                                pointerEvents: 'none',
                              }}
                            >
                              {ind.type === 'hand' && <span style={{ fontSize: '24px' }}>👉</span>}
                              {ind.type === 'arrow' && <span style={{ fontSize: '26px' }}>➔</span>}
                              {ind.type === 'rect' && (
                                <div
                                  style={{
                                    border: `2px solid ${ind.color || '#ef4444'}`,
                                    background: ind.fillMode === 'filled' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                  }}
                                >
                                  {ind.label || ''}
                                </div>
                              )}
                              {ind.type === 'badge' && (
                                <div
                                  style={{
                                    background: ind.color || '#ef4444',
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                  }}
                                >
                                  {ind.label || 'Atenção'}
                                </div>
                              )}
                              {ind.type === 'circle' && (
                                <div
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: `2px solid ${ind.color || '#ef4444'}`,
                                    background: ind.fillMode === 'filled' ? ind.color : 'transparent',
                                  }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blocos de Informação Complementar */}
                    <div className="pop-step-callouts-grid">
                      {/* Resultado Esperado */}
                      <div className="pop-callout-box success">
                        <div className="callout-icon">✓</div>
                        <div className="callout-text">
                          <strong>Resultado Esperado:</strong>
                          {isEditable && onUpdateStep ? (
                            <input
                              type="text"
                              value={step.expectedResult || ''}
                              onChange={(e) => onUpdateStep(idx, 'expectedResult', e.target.value)}
                              placeholder="O que deve ocorrer..."
                            />
                          ) : (
                            <p>{step.expectedResult || 'Registro validado e confirmado no sistema.'}</p>
                          )}
                        </div>
                      </div>

                      {/* Dica de Agilidade */}
                      {(step.tips || isEditable) && (
                        <div className="pop-callout-box tip">
                          <div className="callout-icon">💡</div>
                          <div className="callout-text">
                            <strong>Dica Operacional:</strong>
                            {isEditable && onUpdateStep ? (
                              <input
                                type="text"
                                value={step.tips || ''}
                                onChange={(e) => onUpdateStep(idx, 'tips', e.target.value)}
                                placeholder="Atalhos e dicas de tela..."
                              />
                            ) : (
                              <p>{step.tips || 'Utilize a tecla de atalho indicada para agilidade.'}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Ponto Crítico */}
                      {(step.warnings || isEditable) && (
                        <div className="pop-callout-box warning">
                          <div className="callout-icon">⚠️</div>
                          <div className="callout-text">
                            <strong>Ponto Crítico:</strong>
                            {isEditable && onUpdateStep ? (
                              <input
                                type="text"
                                value={step.warnings || ''}
                                onChange={(e) => onUpdateStep(idx, 'warnings', e.target.value)}
                                placeholder="Atenção especial para evitar erros..."
                              />
                            ) : (
                              <p>{step.warnings || 'Valide a integridade dos dados fiscais e cadastrais.'}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. SEÇÃO 3: BOAS PRÁTICAS & DIRETRIZES SANITÁRIAS (BPF) */}
        <section className="pop-section-block">
          <div className="pop-sec-header">
            <span className="sec-num">3.</span>
            <h2>BOAS PRÁTICAS FARMACÊUTICAS &amp; AUDITORIA</h2>
          </div>
          <div className="pop-sec-content">
            <table className="pop-bpf-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Item</th>
                  <th style={{ width: '38%' }}>Diretriz Sanitária / Segurança</th>
                  <th style={{ width: '50%' }}>Recomendação Técnica Homologada</th>
                </tr>
              </thead>
              <tbody>
                {callouts.length > 0 ? (
                  callouts.map((c, i) => (
                    <tr key={c.id || i}>
                      <td><strong>BPF-{(i + 1).toString().padStart(2, '0')}</strong></td>
                      <td><strong>{c.title}</strong></td>
                      <td>{c.content}</td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr>
                      <td><strong>BPF-01</strong></td>
                      <td><strong>Rastreabilidade de Dados</strong></td>
                      <td>Todas as operações devem conter identificação do operador e gravação com carimbo de data/hora (log).</td>
                    </tr>
                    <tr>
                      <td><strong>BPF-02</strong></td>
                      <td><strong>Conformidade Regulatória</strong></td>
                      <td>Validação obrigatória de lotes, vencimentos e regras da RDC ANVISA antes da conclusão do registro.</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. SEÇÃO 4: CHECKLIST DE HOMOLOGAÇÃO */}
        <section className="pop-section-block">
          <div className="pop-sec-header">
            <span className="sec-num">4.</span>
            <h2>CHECKLIST DE AUDITORIA &amp; HOMOLOGAÇÃO</h2>
          </div>
          <div className="pop-sec-content">
            <table className="pop-checklist-table">
              <thead>
                <tr>
                  <th style={{ width: '8%', textAlign: 'center' }}>Nº</th>
                  <th style={{ width: '42%' }}>Etapa Operacional</th>
                  <th style={{ width: '35%' }}>Critério de Aceite</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Visto / Conf.</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((s, idx) => (
                  <tr key={s.id || idx}>
                    <td style={{ textAlign: 'center' }}><strong>{(idx + 1).toString().padStart(2, '0')}</strong></td>
                    <td>{s.title}</td>
                    <td>{s.expectedResult || 'Registro concluído com sucesso.'}</td>
                    <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 800 }}>[ CONFORME ]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. SEÇÃO 5: TERMO FORMAL DE HOMOLOGAÇÃO & ASSINATURAS */}
        <section className="pop-section-block pop-signatures-section">
          <div className="pop-sec-header">
            <span className="sec-num">5.</span>
            <h2>HOMOLOGAÇÃO TÉCNICA &amp; ASSINATURAS</h2>
          </div>

          <div className="pop-signatures-table-wrapper">
            <table className="pop-signatures-table">
              <thead>
                <tr>
                  <th>{signatures.elaboratedByTitle || 'ELABORADO POR'}</th>
                  <th>{signatures.reviewedByTitle || 'REVISADO POR'}</th>
                  <th>{signatures.approvedByTitle || 'APROVADO POR'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="sign-cell">
                    <div className="sign-role-top">{signatures.elaboratedByRole || 'Digifarma Sistemas'}</div>
                    <div className="sign-blank-space" />
                    <div className="sign-line" />
                    <strong className="sign-name">{signatures.elaboratedByName || procedure.author}</strong>
                    <span className="sign-date">Data: {currentDate}</span>
                  </td>
                  <td className="sign-cell">
                    <div className="sign-role-top">{signatures.reviewedByRole || 'Controle de Procedimentos'}</div>
                    <div className="sign-blank-space" />
                    <div className="sign-line" />
                    <strong className="sign-name">{signatures.reviewedByName || 'Garantia da Qualidade (BPF)'}</strong>
                    <span className="sign-date">Data: {currentDate}</span>
                  </td>
                  <td className="sign-cell">
                    <div className="sign-role-top">{signatures.approvedByRole || 'Responsável Técnico / Gestor'}</div>
                    <div className="sign-blank-space" />
                    <div className="sign-line" />
                    <strong className="sign-name">{signatures.approvedByName || 'Leonardo Henrique B. Trevas'}</strong>
                    <span className="sign-date">Data: {currentDate}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer className="pop-doc-footer">
            <div className="footer-left">
              <strong>{signatures.companyName || 'Digifarma Sistemas LTDA'}</strong> • {signatures.slogan || 'Digitalmente fácil · Homologado ISO 9001 & BPF'}
            </div>
            <div className="footer-right">
              {popCode} • Emissão: {currentDate}
            </div>
          </footer>
        </section>
      </article>
    </div>
  );
};
