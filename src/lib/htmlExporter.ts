import type { Procedure, StepBlock, ImageBlock, CalloutBlock } from '../types/procedure';

export function generateProcedureHtml(procedure: Procedure): string {
  const isV10 = procedure.systemVersion === 'v10';
  const versionTag = isV10 ? 'DIGIFARMA V10' : 'DIGIFARMA R78';

  const stepBlocks = procedure.blocks.filter((b): b is StepBlock => b.type === 'step');
  const imageBlocks = procedure.blocks.filter((b): b is ImageBlock => b.type === 'image');
  const calloutBlocks = procedure.blocks.filter((b): b is CalloutBlock => b.type === 'callout');

  const slidesConfig = procedure.slidesConfig || [];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${procedure.title} — Procedimento Digifarma</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --ink: #050608;
      --ink-2: #12141a;
      --paper: #ffffff;
      --paper-sub: #f8fafc;
      --red: #e74c3c;
      --red-soft: rgba(231, 76, 60, 0.15);
      --font: 'Inter', system-ui, -apple-system, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--font);
      background-color: var(--ink);
      color: #ffffff;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .slide {
      min-height: 100vh;
      width: 100%;
      padding: 60px 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      box-sizing: border-box;
    }

    .slide.deep {
      background: radial-gradient(1200px 700px at 80% 15%, rgba(231, 76, 60, 0.14), transparent 60%), #050608;
      color: #ffffff;
    }

    .slide.light {
      background: #ffffff;
      color: #0f172a;
      border-bottom-color: #e2e8f0;
    }

    .slide .inner {
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .logo {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.03em;
      margin-bottom: 24px;
    }
    .logo .a { color: #ffffff; }
    .logo .b { color: var(--red); }
    .slide.light .logo .a { color: #0f172a; }

    .v10-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--red);
      background: var(--red-soft);
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 20px;
    }

    h1.display {
      font-size: clamp(34px, 5.5vw, 68px);
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.03em;
      margin-bottom: 18px;
    }

    .lead {
      font-size: clamp(16px, 1.6vw, 20px);
      color: #94a3b8;
      max-width: 65ch;
      line-height: 1.5;
    }
    .slide.light .lead { color: #475569; }

    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 48px;
      background: rgba(255, 255, 255, 0.04);
      padding: 24px;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .slide.light .stats {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .stat .n {
      font-size: 32px;
      font-weight: 800;
      color: var(--red);
      line-height: 1.1;
    }
    .stat .n small { font-size: 14px; margin-left: 4px; color: #94a3b8; }
    .stat .l { font-size: 13px; color: #94a3b8; margin-top: 4px; }
    .slide.light .stat .l { color: #64748b; }

    .eyebrow {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--red);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    h2.head {
      font-size: clamp(26px, 3.5vw, 44px);
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 12px;
    }

    .feature-split {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 36px;
      margin-top: 28px;
      align-items: start;
    }

    .fitem {
      display: flex;
      gap: 14px;
      padding: 14px 18px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 14px;
    }
    .fitem.warning {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.25);
    }
    .fitem .fico {
      font-size: 20px;
    }
    .fitem .ftxt h4 {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 3px;
    }
    .fitem .ftxt p {
      font-size: 13.5px;
      color: #475569;
    }

    .shotframe {
      position: relative;
      background: #0f172a;
      border-radius: 14px;
      padding: 8px;
      border: 1px solid #334155;
      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.35);
    }
    .shotframe .frame {
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      background: #000;
      min-height: 260px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .shotframe .frame img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }
    .shotframe-caption {
      font-size: 12px;
      color: #94a3b8;
      padding: 8px 6px 4px;
      text-align: center;
    }

    /* Mãozinha Animada & Indicadores de Passo a Passo */
    .pointing-hand {
      position: absolute;
      font-size: 38px;
      z-index: 10;
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6));
      animation: fingerBounce 1.4s ease-in-out infinite;
      cursor: pointer;
      user-select: none;
    }
    .pointing-hand.up { animation: fingerBounceUp 1.4s ease-in-out infinite; }
    .pointing-hand.down { animation: fingerBounceDown 1.4s ease-in-out infinite; }
    .pointing-hand.left { animation: fingerBounceLeft 1.4s ease-in-out infinite; }
    .pointing-hand.right { animation: fingerBounceRight 1.4s ease-in-out infinite; }

    @keyframes fingerBounceUp {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes fingerBounceDown {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(10px); }
    }
    @keyframes fingerBounceLeft {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(-10px); }
    }
    @keyframes fingerBounceRight {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(10px); }
    }

    /* Spotlight Radar Pulsante no Campo da Tela */
    .spotlight-beacon {
      position: absolute;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 3px solid var(--red);
      background: rgba(231, 76, 60, 0.25);
      z-index: 9;
      transform: translate(-50%, -50%);
      animation: spotlightPulse 1.8s infinite;
      pointer-events: none;
    }
    @keyframes spotlightPulse {
      0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.8); }
      70% { box-shadow: 0 0 0 20px rgba(231, 76, 60, 0); }
      100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
    }

    .floating-badge {
      position: absolute;
      background: var(--red);
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 999px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      z-index: 10;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Checklist Interativo */
    .interactive-check-box {
      margin-top: 18px;
      padding: 12px 16px;
      background: #e2e8f0;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
    .interactive-check-box input {
      width: 18px;
      height: 18px;
      accent-color: var(--red);
      cursor: pointer;
    }
    .interactive-check-box span {
      font-size: 13.5px;
      font-weight: 600;
      color: #1e293b;
    }

    .print-signatures-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
      margin-top: 48px;
    }
    .print-sign-col {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .print-sign-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: var(--red);
      margin-bottom: 36px;
    }
    .print-sign-line {
      width: 100%;
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      margin-bottom: 8px;
    }
    .print-sign-name {
      font-size: 13.5px;
      font-weight: 700;
      color: #ffffff;
    }
    .print-sign-role {
      font-size: 12px;
      color: #94a3b8;
    }

    @media (max-width: 768px) {
      .slide { padding: 36px 20px; }
      .feature-split { grid-template-columns: 1fr; }
      .stats { grid-template-columns: 1fr 1fr; }
      .print-signatures-grid { grid-template-columns: 1fr; gap: 20px; }
    }
  </style>
</head>
<body>

  <!-- SLIDE 1: CAPA EDITORIAL -->
  <section class="slide deep">
    <div class="inner">
      <div>
        <div class="logo">
          <span class="a">Digi</span><span class="b">farma</span>
        </div>
        <div class="v10-badge">${versionTag}</div>
        <h1 class="display">${procedure.title}</h1>
        <p class="lead">${procedure.subtitle || 'Procedimento Operacional Padrão e Roteiro de Treinamento Oficial do Digifarma ERP.'}</p>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="n">${stepBlocks.length || 1}<small>etapas</small></div>
          <div class="l">Roteiro operacional documentado</div>
        </div>
        <div class="stat">
          <div class="n">100<small>%</small></div>
          <div class="l">Conformidade com Boas Práticas (BPF)</div>
        </div>
        <div class="stat">
          <div class="n">${procedure.category || 'Geral'}</div>
          <div class="l">Módulo integrado do sistema</div>
        </div>
        <div class="stat">
          <div class="n">${procedure.author || 'Gestor'}</div>
          <div class="l">Responsável técnico / homologação</div>
        </div>
      </div>
    </div>
  </section>

  <!-- SLIDES DE ETAPAS OPERACIONAIS COM INDICADORES E MÃOZINHA -->
  ${stepBlocks
    .map((step, idx) => {
      const stepNum = String(idx + 1).padStart(2, '0');
      const associatedImg = imageBlocks[idx] || (idx === 0 && imageBlocks.length > 0 ? imageBlocks[0] : null);
      const slideCfg = slidesConfig.find((s) => s.stepIndex === idx);
      const indicators = slideCfg?.indicators || [];

      return `
  <section class="slide light">
    <div class="inner">
      <div>
        <p class="eyebrow">
          <span>ETAPA ${stepNum}</span> · Digifarma Treinamento
        </p>
        <h2 class="head">${step.title || `Etapa ${stepNum}`}</h2>
        <p class="lead">${step.instruction || step.content}</p>

        <div class="feature-split">
          <div class="feature-left">
            ${
              step.expectedResult
                ? `<div class="fitem">
                    <div class="fico">✓</div>
                    <div class="ftxt">
                      <h4>Resultado Esperado</h4>
                      <p>${step.expectedResult}</p>
                    </div>
                  </div>`
                : ''
            }

            ${
              step.tips
                ? `<div class="fitem">
                    <div class="fico">💡</div>
                    <div class="ftxt">
                      <h4>Dica de Agilidade</h4>
                      <p>${step.tips}</p>
                    </div>
                  </div>`
                : ''
            }

            ${
              step.warnings
                ? `<div class="fitem warning">
                    <div class="fico">⚠️</div>
                    <div class="ftxt">
                      <h4 style="color:#d97706;">Ponto Crítico</h4>
                      <p>${step.warnings}</p>
                    </div>
                  </div>`
                : ''
            }

            <label class="interactive-check-box">
              <input type="checkbox" onchange="this.parentElement.style.opacity = this.checked ? '0.6' : '1.0'" />
              <span>Marcar esta etapa como conferida no sistema</span>
            </label>
          </div>

          <div class="shotframe">
            <div class="frame">
              ${
                associatedImg?.url
                  ? `<img src="${associatedImg.url}" alt="${associatedImg.caption || step.title}" />`
                  : `<div style="color:#64748b;font-weight:600;padding:40px;text-align:center;">Captura de Tela do ERP Digifarma</div>`
              }

              <!-- Indicadores Interativos e Mãozinha -->
              ${indicators
                .map((ind) => {
                  if (ind.type === 'hand') {
                    const handEmoji = ind.direction === 'down' ? '👇' : ind.direction === 'left' ? '👈' : ind.direction === 'right' ? '👉' : '👆';
                    return `<div class="pointing-hand ${ind.direction || 'up'}" style="left:${ind.x}%;top:${ind.y}%;" title="${ind.label || 'Clique aqui'}">${handEmoji}</div>`;
                  }
                  if (ind.type === 'spotlight') {
                    return `<div class="spotlight-beacon" style="left:${ind.x}%;top:${ind.y}%;"></div>`;
                  }
                  if (ind.type === 'badge') {
                    return `<div class="floating-badge" style="left:${ind.x}%;top:${ind.y}%;">${ind.label || 'Atenção'}</div>`;
                  }
                  if (ind.type === 'gif' && ind.gifUrl) {
                    return `<img src="${ind.gifUrl}" style="position:absolute;left:${ind.x}%;top:${ind.y}%;max-width:80px;border-radius:8px;z-index:10;" alt="GIF Indicador" />`;
                  }
                  return '';
                })
                .join('')}

              ${
                /* Se não houver indicadores customizados, adiciona a mãozinha padrão demonstrativa na tela */
                indicators.length === 0 && associatedImg?.url
                  ? `<div class="pointing-hand up" style="left:52%;top:58%;" title="Campo do Digifarma">👆</div>`
                  : ''
              }
            </div>
            ${associatedImg?.caption ? `<div class="shotframe-caption">${associatedImg.caption}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  </section>`;
    })
    .join('')}

  ${
    calloutBlocks.length > 0
      ? `<!-- SLIDE BPF / DIRETRIZES -->
  <section class="slide light">
    <div class="inner">
      <p class="eyebrow"><span>BPF</span> · Boas Práticas &amp; Diretrizes</p>
      <h2 class="head">Orientações de Segurança &amp; Auditoria</h2>
      <p class="lead">Recomendações técnicas homologadas para garantia da qualidade operacional.</p>
      <div style="margin-top:24px;display:flex;flex-direction:column;gap:12px;">
        ${calloutBlocks
          .map(
            (c) => `
          <div class="fitem">
            <div class="fico">ℹ️</div>
            <div class="ftxt">
              <h4>${c.title || 'Diretriz de Segurança'}</h4>
              <p>${c.content}</p>
            </div>
          </div>`
          )
          .join('')}
      </div>
    </div>
  </section>`
      : ''
  }

  <!-- SLIDE FINAL: HOMOLOGAÇÃO & ASSINATURAS -->
  <section class="slide deep">
    <div class="inner">
      <div>
        <div class="logo">
          <span class="a">Digi</span><span class="b">farma</span>
        </div>
        <div class="v10-badge">HOMOLOGAÇÃO TÉCNICA OFICIAL</div>
        <h1 class="display" style="font-size:38px;">Controle de Qualidade &amp; BPF</h1>
        <p class="lead">
          Procedimento homologado e integrado à base de conhecimento do Digifarma ERP. Válido para auditorias de processos e treinamento de equipe.
        </p>

        <div class="print-signatures-grid">
          <div class="print-sign-col">
            <span class="print-sign-title">ELABORADO POR</span>
            <div class="print-sign-line"></div>
            <span class="print-sign-name">${procedure.author || 'Analista de Processos'}</span>
            <span class="print-sign-role">Digifarma Sistemas</span>
          </div>

          <div class="print-sign-col">
            <span class="print-sign-title">REVISADO POR</span>
            <div class="print-sign-line"></div>
            <span class="print-sign-name">Garantia da Qualidade (BPF)</span>
            <span class="print-sign-role">Controle de Procedimentos</span>
          </div>

          <div class="print-sign-col">
            <span class="print-sign-title">APROVADO POR</span>
            <div class="print-sign-line"></div>
            <span class="print-sign-name">Leonardo Henrique B. Trevas</span>
            <span class="print-sign-role">Responsável Técnico / Gestor</span>
          </div>
        </div>
      </div>

      <div style="font-size:13px;color:#94a3b8;margin-top:36px;">
        Digifarma Sistemas LTDA · Digitalmente fácil
      </div>
    </div>
  </section>

</body>
</html>`;
}

export function downloadProcedureHtml(procedure: Procedure) {
  const htmlContent = generateProcedureHtml(procedure);
  const cleanTitle = (procedure.title || 'procedimento')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-');

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `digifarma-pop-${cleanTitle}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
