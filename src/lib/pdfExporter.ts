import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Procedure } from '../types/procedure';

export interface PdfExportOptions {
  filename?: string;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Exporta o procedimento slide a slide diretamente para um arquivo PDF em A4 Paisagem,
 * garantindo:
 * 1. 100% Full-bleed (a cor de fundo cobre toda a folha, sem margens brancas).
 * 2. Cada slide ocupa estritamente 1 página (impossível vazar ou ultrapassar páginas).
 * 3. Alta resolução Retina 2x nítida e sem distorção.
 */
export async function exportProcedurePdf(
  procedure: Procedure,
  elementId: string = 'printable-procedure',
  options?: PdfExportOptions
): Promise<void> {
  const container = document.getElementById(elementId);
  if (!container) {
    console.warn(`Elemento #${elementId} não encontrado. Acionando window.print()...`);
    window.print();
    return;
  }

  // Busca todos os slides dentro do container
  const slides = Array.from(container.querySelectorAll<HTMLElement>('.slide'));
  if (slides.length === 0) {
    console.warn('Nenhum slide encontrado para exportação. Acionando window.print()...');
    window.print();
    return;
  }

  // Nome do arquivo seguro e amigável
  const titleSafe = (procedure.title || 'Procedimento_Digifarma')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const finalFilename = options?.filename || `${titleSafe}.pdf`;

  // Salva posição original de scroll para garantir que a captura não sofra com deslocamentos
  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;
  window.scrollTo(0, 0);

  // Aplica classe de captura temporária para eliminar bordas arredondadas e margens de tela
  container.classList.add('pdf-capture-active');

  try {
    // Inicializa o documento PDF em A4 Paisagem (297mm x 210mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const totalSlides = slides.length;

    for (let i = 0; i < totalSlides; i++) {
      const slide = slides[i];

      if (options?.onProgress) {
        options.onProgress(i + 1, totalSlides);
      }

      // Adiciona nova página para os slides subsequentes (a primeira já existe)
      if (i > 0) {
        pdf.addPage('a4', 'landscape');
      }

      // Garante que todas as imagens deste slide estejam carregadas antes da captura
      const slideImages = Array.from(slide.querySelectorAll<HTMLImageElement>('img'));
      if (slideImages.length > 0) {
        await Promise.all(
          slideImages.map((img) => {
            if (img.complete) return Promise.resolve(true);
            return new Promise((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              setTimeout(() => resolve(false), 1500);
            });
          })
        );
      }

      // Determina a cor de fundo nativa do slide (#131419 para escuro, #ffffff para claro)
      const isDark =
        slide.classList.contains('deep') ||
        slide.classList.contains('dark') ||
        slide.classList.contains('cover') ||
        slide.classList.contains('cta');

      const bgColor = isDark ? '#131419' : '#ffffff';

      // Renderiza o slide isoladamente em alta definição Retina 2x
      const canvas = await html2canvas(slide, {
        scale: 2, // 2x Retina para textos e ícones super nítidos
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: bgColor,
        scrollX: 0,
        scrollY: 0,
      });

      // Converte para JPEG de altíssima fidelidade (0.96)
      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      // Insere a imagem cobrindo exatamente toda a folha A4 paisagem (0, 0, 297mm, 210mm)
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
    }

    // Salva o arquivo PDF diretamente no computador do usuário
    pdf.save(finalFilename);
  } catch (err) {
    console.error('Erro na geração slide-a-slide do PDF:', err);
    // Fallback gracioso para a impressão nativa
    window.print();
  } finally {
    // Remove a classe temporária e restaura o layout normal da tela
    container.classList.remove('pdf-capture-active');
    window.scrollTo(originalScrollX, originalScrollY);
  }
}
