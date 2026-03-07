import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { CouncilResult, DecisionInput } from '../types';

/**
 * PDF SERVICE
 * Generates and parses strategic briefing documents.
 * Uses the legacy build to avoid worker-related extraction failures in browser environments.
 */

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

export async function generateDecisionPDF(input: DecisionInput, result: CouncilResult) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 25;

  const addHeader = (text: string, size = 18, color = [30, 41, 59]) => {
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, cursorY);
    cursorY += size / 2 + 2;
  };

  const addText = (text: string, size = 10, color = [71, 85, 105], style = 'normal') => {
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', style);
    const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
    const estimatedHeight = splitText.length * (size / 2) + 5;
    if (cursorY + estimatedHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin + 5;
    }
    doc.text(splitText, margin, cursorY);
    cursorY += estimatedHeight;
  };

  addHeader('Strategic Decision Briefing', 10, [100, 116, 139]);
  cursorY += 5;
  addHeader(input.title, 22, [15, 23, 42]);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 10;

  addHeader('Final Verdict', 14, [79, 70, 229]);
  addText(result.synthesis.verdict, 12, [30, 41, 59], 'bold');
  addText(result.synthesis.recommendation, 11, [71, 85, 105]);

  const radarElement = document.getElementById('decision-radar-chart');
  if (radarElement) {
    try {
      const canvas = await html2canvas(radarElement, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 100;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (cursorY + imgHeight > 250) {
          doc.addPage();
          cursorY = 25;
      }
      const imgX = (pageWidth - imgWidth) / 2;
      doc.addImage(imgData, 'PNG', imgX, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 15;
    } catch (e) {
      console.warn('Could not capture radar chart for PDF', e);
    }
  }

  addHeader('Council Perspectives', 16, [15, 23, 42]);
  cursorY += 5;
  const agents = [result.analyst, result.strategist, result.skeptic, result.mediator];
  agents.forEach((agent) => {
    addHeader(`${agent.role}: ${agent.name}`, 12, [51, 65, 85]);
    addText(agent.analysis, 10, [71, 85, 105]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Key Strategic Points:', margin, cursorY);
    cursorY += 5;
    agent.keyPoints.forEach(point => {
        const splitPoint = doc.splitTextToSize(`• ${point}`, pageWidth - margin * 2.5);
        if (cursorY + (splitPoint.length * 4) > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            cursorY = margin + 5;
        }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(splitPoint, margin + 4, cursorY);
        cursorY += (splitPoint.length * 4) + 1;
    });
    cursorY += 6;
  });

  doc.addPage();
  cursorY = 25;
  addHeader('Resources & Grounding', 18, [15, 23, 42]);
  addText('The following external data points and benchmarks were utilized by the council during deliberation.', 10, [100, 116, 139]);
  cursorY += 5;
  const allSources = agents.flatMap(a => a.sources || []);
  const uniqueSources = Array.from(new Set(allSources));
  if (uniqueSources.length > 0) {
      uniqueSources.forEach((source, index) => {
          const splitSource = doc.splitTextToSize(`${index + 1}. ${source}`, pageWidth - margin * 2);
          if (cursorY + (splitSource.length * 5) > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              cursorY = 25;
          }
          doc.setFontSize(9);
          doc.setTextColor(79, 70, 229);
          doc.text(splitSource, margin, cursorY);
          cursorY += (splitSource.length * 5) + 2;
      });
  } else {
      addText('Internal reasoning only. No external citations utilized for this specific run.', 10, [148, 163, 184], 'italic');
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated by Decidr AI • ${new Date().toLocaleDateString()}`, margin, doc.internal.pageSize.getHeight() - 10);

  const filename = `${input.title.replace(/\s+/g, '_')}_Council_Report.pdf`;
  doc.save(filename);
}
