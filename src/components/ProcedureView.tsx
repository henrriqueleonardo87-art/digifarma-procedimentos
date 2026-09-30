import React, { useState, useMemo } from 'react';
import {
  Edit3,
  Printer,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ArrowLeft,
  Lightbulb,
  Info,
  History,
  FileDown,
} from 'lucide-react';
import type {
  Procedure,
  StepBlock,
  ImageBlock,
  CalloutBlock,
  SystemMenu,
} from '../types/procedure';
import { ProcedureTimelineModal } from './ProcedureTimelineModal';
import { downloadProcedureHtml } from '../lib/htmlExporter';

interface ProcedureViewProps {
  procedure: Procedure;
  menus: SystemMenu[];
  onEdit: () => void;
  onDelete: () => void;
  onOpenImageLightbox: (url: string, caption?: string) => void;
  onUpdateStepCompletion: (blockId: string, completed: boolean) => void;
  onBack?: () => void;
  autoPrint?: boolean;
}

export const ProcedureView: React.FC<ProcedureViewProps> = ({
  procedure,
  menus,
  onEdit,
  onDelete,
  onOpenImageLightbox,
  onUpdateStepCompletion,
  onBack,
  autoPrint = false,
}) => {
  // Disparo automático de impressão quando solicitado direto do card
  React.useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);
  // Encontrar nomes amigáveis para Menus e Submenus
  const menuInfo = useMemo(() => {
    const foundMenu = menus.find(
      (m) => m.id === procedure.menuId || m.label.toLowerCase() === procedure.category?.toLowerCase()
    );
    const foundSubmenu = foundMenu?.submenus.find((s) => s.id === procedure.submenuId);
    return {
      menuLabel: foundMenu?.label || procedure.category || 'Operacional ERP',
      submenuLabel: foundSubmenu?.label || null,
    };
  }, [menus, procedure]);

  // Lista de passos operacionais
  const stepBlocks = useMemo(() => {
    return procedure.blocks.filter((b): b is StepBlock => b.type === 'step');
  }, [procedure.blocks]);

  // Imagens associadas
  const imageBlocks = useMemo(() => {
    return procedure.blocks.filter((b): b is ImageBlock => b.type === 'image');
  }, [procedure.blocks]);

  // Callouts / Alertas
  const calloutBlocks = useMemo(() => {
    return procedure.blocks.filter((b): b is CalloutBlock => b.type === 'callout');
  }, [procedure.blocks]);

  const completedSteps = useMemo(() => {
    return stepBlocks.filter((s) => s.completed).length;
  }, [stepBlocks]);

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const isV10 = procedure.systemVersion === 'v10';
  const versionTag = isV10 ? 'DIGIFARMA V10' : 'DIGIFARMA R78';

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  return (
    <article className="presentation-manual-root" id="printable-procedure">
      {/* ── BARRA FIXA DE AÇÕES DO POP (NÃO APARECE NA IMPRESSÃO) ── */}
      <div className="proc-action-bar no-print">
        {onBack && (
          <button type="button" className="btn-proc-action" onClick={onBack}>
            <ArrowLeft size={15} />
            <span>Voltar</span>
          </button>
        )}

        <div className="proc-action-center">
          <span className={`version-pill ${isV10 ? 'v10' : 'classico'}`}>
            {versionTag}
          </span>
          <span className="proc-action-title">{procedure.title}</span>
          {procedure.systemPath && (
            <span className="proc-action-path">{procedure.systemPath}</span>
          )}
        </div>

        <div className="proc-action-right">
          <button
            type="button"
            className="btn-proc-action"
            onClick={() => setIsTimelineOpen(true)}
            title="Ver linha do tempo e histórico de alterações"
          >
            <History size={15} color="var(--red)" />
            <span>Histórico</span>
          </button>

          <button
            type="button"
            className="btn-proc-action"
            onClick={() => downloadProcedureHtml(procedure)}
            title="Baixar arquivo HTML dinâmico com animações e GIFs"
          >
            <FileDown size={15} />
            <span>Exportar HTML</span>
          </button>

          <button type="button" className="btn-proc-action primary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Imprimir PDF</span>
          </button>

          <button type="button" className="btn-proc-action" onClick={onEdit}>
            <Edit3 size={15} />
            <span>Editar</span>
          </button>

          <button type="button" className="btn-proc-action danger" onClick={onDelete} title="Excluir POP">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Modal / Drawer de Histórico e Linha do Tempo */}
      <ProcedureTimelineModal
        procedure={procedure}
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
      />

      {/* ── 01 · SLIDE / PÁGINA 1: CAPA EDITORIAL DIGIFARMA V10 ── */}
      <section className="slide deep cover">
        <div className="inner">
          <div className="logo">
            <span className="a">Digi</span>
            <span className="b">farma</span>
          </div>

          <div className="v10">{versionTag}</div>

          <h1 className="display">{procedure.title}</h1>

          <p className="lead muted" style={{ marginTop: '22px' }}>
            {procedure.subtitle ||
              'Procedimento Operacional Padrão (POP) e Instrução de Trabalho do ERP Digifarma.'}
          </p>

          <div className="slogan muted">
            Digitalmente <b>fácil</b> · Homologado ISO 9001 &amp; Boas Práticas Farmacêuticas
          </div>

          {/* Faixa de 4 Números / Estatísticas do Procedimento */}
          <div className="stats">
            <div className="stat">
              <div className="n">
                {stepBlocks.length || 1}
                <small>etapas</small>
              </div>
              <div className="l muted">roteiro passo a passo documentado</div>
            </div>

            <div className="stat">
              <div className="n">
                {stepBlocks.length}
                <small>itens</small>
              </div>
              <div className="l muted">
                {completedSteps}/{stepBlocks.length} itens checados ({stepBlocks.length > 0 ? Math.round((completedSteps / stepBlocks.length) * 100) : 100}%)
              </div>
            </div>

            <div className="stat">
              <div className="n">
                100<small>%</small>
              </div>
              <div className="l muted">conformidade com regras fiscais e BPF</div>
            </div>

            <div className="stat">
              <div className="n" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
                {menuInfo.menuLabel}
              </div>
              <div className="l muted">módulo integrado do sistema ERP</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 · ETAPAS OPERACIONAIS FORMATADAS EM SLIDES ── */}
      {stepBlocks.map((step, idx) => {
        const stepNum = String(idx + 1).padStart(2, '0');
        // Imagem associada a este passo (ou imagem correspondente pelo índice)
        const associatedImg = imageBlocks[idx] || (idx === 0 && imageBlocks.length > 0 ? imageBlocks[0] : null);

        return (
          <section key={step.id} className="slide light step-slide" data-title={`Etapa ${stepNum}`}>
            <div className="inner">
              <p className="eyebrow">
                <span className="num">{stepNum}</span>
                Etapa Operacional
              </p>

              <h2 className="head">{step.title}</h2>

              <p className="lead muted">{step.instruction}</p>

              {/* Layout Dividido: Instruções + Benefícios à esquerda, Screenshot à direita */}
              <div className="feature-split">
                <div className="feature-list">
                  {/* Resultado Esperado */}
                  {step.expectedResult && (
                    <div className="fitem">
                      <div className="fico">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="ftxt">
                        <h4>Resultado Esperado</h4>
                        <p>
                          {step.expectedResult} <b>Validado no ERP.</b>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dica Operacional */}
                  {step.tips && (
                    <div className="fitem">
                      <div className="fico">
                        <Lightbulb size={20} />
                      </div>
                      <div className="ftxt">
                        <h4>Dica de Agilidade</h4>
                        <p>
                          {step.tips} <b>Menos cliques.</b>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Alerta de Atenção */}
                  {step.warnings && (
                    <div className="fitem">
                      <div className="fico" style={{ backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' }}>
                        <AlertTriangle size={20} />
                      </div>
                      <div className="ftxt">
                        <h4 style={{ color: '#d97706' }}>Ponto Crítico</h4>
                        <p>{step.warnings}</p>
                      </div>
                    </div>
                  )}

                  {/* Checklist Interativo do Passo */}
                  <div className="step-interactive-check no-print">
                    <label className="step-check-label">
                      <input
                        type="checkbox"
                        checked={step.completed || false}
                        onChange={(e) => onUpdateStepCompletion(step.id, e.target.checked)}
                      />
                      <span>Marcar esta etapa como executada e conferida</span>
                    </label>
                  </div>
                </div>

                {/* Captura de Tela no Padrão Shotframe com Glow da Apresentação */}
                <div className="shotframe">
                  <div className="glow" />
                  <span className="themetag">Tela Real do Digifarma</span>
                  <div
                    className="frame"
                    onClick={() => {
                      if (associatedImg?.url) {
                        onOpenImageLightbox(associatedImg.url, associatedImg.caption || step.title);
                      }
                    }}
                    title="Clique para ampliar tela"
                  >
                    {associatedImg?.url ? (
                      <img src={associatedImg.url} alt={associatedImg.caption || step.title} />
                    ) : (
                      <div className="frame-placeholder">
                        <ZoomIn size={32} color="var(--red)" />
                        <span>Interface do ERP vinculada a esta etapa</span>
                      </div>
                    )}

                    {/* Indicadores Visuais da Etapa e Mãozinha */}
                    {(
                      procedure.slidesConfig?.find((s) => s.stepIndex === idx)?.indicators || []
                    ).map((ind) => {
                      if (ind.type === 'hand') {
                        const handIcon =
                          ind.direction === 'down'
                            ? '👇'
                            : ind.direction === 'left'
                            ? '👈'
                            : ind.direction === 'right'
                            ? '👉'
                            : '👆';
                        return (
                          <div
                            key={ind.id}
                            className={`pointing-hand ${ind.direction || 'up'}`}
                            style={{ left: `${ind.x}%`, top: `${ind.y}%` }}
                            title={ind.label || 'Campo'}
                          >
                            {handIcon}
                          </div>
                        );
                      }
                      if (ind.type === 'spotlight') {
                        return (
                          <div
                            key={ind.id}
                            className="spotlight-beacon"
                            style={{ left: `${ind.x}%`, top: `${ind.y}%` }}
                          />
                        );
                      }
                      if (ind.type === 'badge') {
                        return (
                          <div
                            key={ind.id}
                            className="floating-badge"
                            style={{ left: `${ind.x}%`, top: `${ind.y}%` }}
                          >
                            {ind.label || 'Atenção'}
                          </div>
                        );
                      }
                      if (ind.type === 'gif' && ind.gifUrl) {
                        return (
                          <img
                            key={ind.id}
                            src={ind.gifUrl}
                            alt="GIF"
                            style={{
                              position: 'absolute',
                              left: `${ind.x}%`,
                              top: `${ind.y}%`,
                              maxWidth: '90px',
                              borderRadius: '8px',
                              zIndex: 10,
                            }}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                  {associatedImg?.caption && (
                    <div className="shotframe-caption-text">{associatedImg.caption}</div>
                  )}
                </div>
              </div>

              {/* Antes / Depois quando houver contexto histórico */}
              {isV10 && idx === 0 && (
                <div className="ba">
                  <div className="col old">
                    <span className="tag">Versão Clássica 7.8</span>
                    <ul>
                      <li>Menus fixos e múltiplos cliques manuais</li>
                      <li>Sem pré-validação automática em tempo real</li>
                      <li>Consultas isoladas em janelas cinzas</li>
                    </ul>
                  </div>
                  <div className="col new">
                    <span className="tag">Digifarma V10</span>
                    <ul>
                      <li>Fluxo inteligente integrado em tela única</li>
                      <li>IA assistiva e preenchimento de campos instantâneo</li>
                      <li>Rastreabilidade visual e modo escuro nativo</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* ── 03 · ALERTAS E BOAS PRÁTICAS ADICIONAIS ── */}
      {calloutBlocks.length > 0 && (
        <section className="slide light" data-title="Observações Importantes">
          <div className="inner">
            <p className="eyebrow">
              <span className="num">BPF</span>
              Diretrizes &amp; Recomendações
            </p>
            <h2 className="head">Orientações de Segurança</h2>
            <div className="grid g2">
              {calloutBlocks.map((c) => (
                <div key={c.id} className="card">
                  <div className="ico">
                    <Info size={22} />
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                  <span className="benefit">
                    Conformidade: <b>Boas Práticas Farmacêuticas</b>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 04 · CHECKLIST FINAL DE AUDITORIA & QUALIDADE ── */}
      <section className="slide light" data-title="Checklist de Validação">
        <div className="inner">
          <p className="eyebrow">
            <span className="num">CHECKLIST</span>
            Auditoria Operacional
          </p>
          <h2 className="head">Critérios de Homologação</h2>
          <p className="lead muted">
            Confirme que todas as etapas foram concluídas em conformidade antes de liberar a rotina.
          </p>

          <div className="why">
            {stepBlocks.map((s, i) => (
              <div key={s.id} className="row">
                <div className="ck">✓</div>
                <div>
                  <b>
                    Etapa {String(i + 1).padStart(2, '0')}: {s.title}
                  </b>
                  <span>
                    {s.expectedResult || 'Procedimento verificado e aprovado pelo operador.'}
                  </span>
                </div>
              </div>
            ))}
            <div className="row">
              <div className="ck">✓</div>
              <div>
                <b>Rastreabilidade &amp; Registro</b>
                <span>Todos os dados e comprovantes foram devidamente arquivados no banco de dados.</span>
              </div>
            </div>
            <div className="row">
              <div className="ck">✓</div>
              <div>
                <b>Dupla Checagem Farmacêutica</b>
                <span>Valores, lotes e rotas fiscais validados conforme a legislação sanitária.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 05 · SLIDE FINAL: ASSINATURAS E APROVAÇÃO OFICIAL BPF ── */}
      <section className="slide deep cta print-sop-signatures-block" data-title="Homologação">
        <div className="inner">
          <div className="logo">
            <span className="a">Digi</span>
            <span className="b">farma</span>
            <span style={{ fontSize: '.4em', fontWeight: 700, letterSpacing: '.2em', color: 'var(--red)', verticalAlign: 'middle', marginLeft: '12px' }}>
              POP HOMOLOGADO
            </span>
          </div>

          <p className="big">
            Homologação Técnica &amp;<br />
            <b>Controle de Qualidade</b>.
          </p>

          <p className="lead muted" style={{ maxWidth: '58ch' }}>
            Procedimento Operacional Padrão aprovado segundo as diretrizes de Boas Práticas Farmacêuticas (RDC ANVISA) e normas de gestão da qualidade ISO 9001.
          </p>

          {/* Bloco Oficial de Assinaturas */}
          <div className="print-signatures-grid" style={{ marginTop: '48px' }}>
            <div className="print-sign-col">
              <span className="print-sign-title">ELABORADO POR</span>
              <div className="print-sign-line" />
              <span className="print-sign-name">Farmacêutico / Analista de Processos</span>
              <span className="print-sign-role">Digifarma Sistemas</span>
            </div>

            <div className="print-sign-col">
              <span className="print-sign-title">REVISADO POR</span>
              <div className="print-sign-line" />
              <span className="print-sign-name">Garantia da Qualidade (BPF)</span>
              <span className="print-sign-role">Controle de Procedimentos</span>
            </div>

            <div className="print-sign-col">
              <span className="print-sign-title">APROVADO POR</span>
              <div className="print-sign-line" />
              <span className="print-sign-name">Leonardo Henrique B. Trevas</span>
              <span className="print-sign-role">Responsável Técnico / Gestor</span>
            </div>
          </div>

          <div className="contact" style={{ marginTop: '48px' }}>
            <b>Digifarma Sistemas LTDA</b> · Digitalmente <b style={{ color: 'var(--red)' }}>fácil</b>
          </div>
        </div>
      </section>
    </article>
  );
};
