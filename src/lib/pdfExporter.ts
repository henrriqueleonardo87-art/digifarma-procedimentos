// @ts-ignore
import html2pdf from 'html2pdf.js';
import type { Procedure } from '../types/procedure';

export interface PdfExportOptions {
  filename?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Exporta o procedimento diretamente como um arquivo PDF em A4 Paisagem de alta definição,
 * idêntico ao layout visual do HTML, sem depender das caixas de diálogo do navegador.
 */
export async function exportProcedurePdf(
  procedure: Procedure,
  elementId: string = 'printable-procedure',
  options?: PdfExportOptions
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Elemento #${elementId} não encontrado. Acionando window.print()...`);
    window.print();
    return;
  }

  // Nome seguro para o arquivo PDF
  const titleSafe = (procedure.title || 'Procedimento_Digifarma')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const finalFilename = options?.filename || `${titleSafe}.pdf`;

  // Configuração ultra precisa para A4 Paisagem (297mm x 210mm) com retina 2x
  const opt = {
    margin: 0,
    filename: finalFilename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2, // Resolução Retina 2x cristalina
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'landscape' as const,
      compress: true,
    },
    pagebreak: {
      mode: ['css', 'legacy'],
      before: '.slide + .slide',
      avoid: ['.flist', '.shotframe', '.fitem', '.why', '.row', '.print-signatures-grid'],
    },
  };

  try {
    // Clonagem temporária rápida para garantir estilos de impressão perfeitos
    await html2pdf().from(element).set(opt).save();
  } catch (err) {
    console.error('Erro ao gerar PDF via html2pdf:', err);
    // Fallback gracioso para window.print
    window.print();
  }
}
