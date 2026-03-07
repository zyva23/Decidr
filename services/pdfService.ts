import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist';
import { CouncilResult, DecisionInput, ActionPlan } from '../types';

// Configure worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false 
    });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    if (!fullText.trim()) throw new Error("No text content found.");
    return fullText;
  } catch (error: any) {
    console.error("PDF Extraction Error:", error);
    throw error;
  }
}

export async function generateDecisionPDF(input: DecisionInput, result: CouncilResult, actionPlan?: ActionPlan) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let cursorY = 25;

  // Tracking for Table of Contents
  const sections: { title: string; page: number }[] = [];

  const checkPageOverflow = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      return true;
    }
    return false;
  };

  const addHeader = (text: string, size = 16, color = [30, 41, 59], isSection = false) => {
    checkPageOverflow(size / 2 + 10);
    if (isSection) sections.push({ title: text, page: doc.internal.pages.length - 1 });
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, cursorY);
    cursorY += (size / 2) + 2;
  };

  const addText = (text: string, size = 10, color = [71, 85, 105], style = 'normal', indent = 0) => {
    if (!text) return;
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', style);
    const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2) - indent);
    const estimatedHeight = splitText.length * (size / 2) + 2;
    checkPageOverflow(estimatedHeight);
    doc.text(splitText, margin + indent, cursorY);
    cursorY += estimatedHeight;
  };

  // --- PAGE 1: TITLE & SYNTHESIS ---
  addHeader('Strategic Decision Briefing', 10, [100, 116, 139]);
  cursorY += 2;
  addHeader(input.title, 22, [15, 23, 42], true);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  addHeader('The Council Verdict', 14, [79, 70, 229], true);
  addText(result.synthesis.verdict, 12, [30, 41, 59], 'bold');
  addText(result.synthesis.recommendation, 11, [71, 85, 105]);
  cursorY += 5;

  // Visual Radar
  const radarElement = document.getElementById('decision-radar-chart');
  if (radarElement) {
    try {
      const canvas = await html2canvas(radarElement, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      checkPageOverflow(imgHeight + 10);
      doc.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 10;
    } catch (e) { console.warn('Radar capture failed', e); }
  }

  // --- COUNCIL PERSPECTIVES ---
  addHeader('Council Perspectives', 16, [15, 23, 42], true);
  const agents = [result.analyst, result.strategist, result.skeptic, result.mediator];
  agents.forEach((agent) => {
    cursorY += 4;
    addHeader(`${agent.role}: ${agent.name}`, 12, [51, 65, 85]);
    addText(agent.analysis, 10, [71, 85, 105]);
    addText('Strategic Pillars:', 9, [30, 41, 59], 'bold');
    agent.keyPoints.forEach(point => addText(`• ${point}`, 9, [71, 85, 105], 'normal', 5));
  });

  // --- EXECUTION ROADMAP ---
  if (actionPlan) {
    doc.addPage();
    cursorY = margin;
    addHeader('Execution Roadmap', 18, [16, 185, 129], true);
    addText(actionPlan.executiveSummary, 10, [71, 85, 105]);
    cursorY += 5;

    actionPlan.phases.forEach((phase, idx) => {
      cursorY += 5;
      addHeader(`Phase ${idx + 1}: ${phase.name}`, 13, [15, 23, 42]);
      addText(`Objective: ${phase.objective}`, 10, [79, 70, 229], 'bold');
      addText(`Duration: ${phase.duration}`, 9, [100, 116, 139], 'italic');
      
      cursorY += 2;
      addText('Critical Tasks:', 9, [30, 41, 59], 'bold');
      phase.tasks.forEach(task => addText(`• ${task.description} (KPI: ${task.kpi})`, 9, [71, 85, 105], 'normal', 5));

      cursorY += 3;
      // V-Stack Pitfalls & Success instead of side-by-side to fix alignment
      addText('Pitfalls to Avoid:', 9, [185, 28, 28], 'bold');
      phase.pitfalls.forEach(p => addText(`× ${p}`, 9, [153, 27, 27], 'normal', 5));

      cursorY += 2;
      addText('Success Criteria:', 9, [30, 64, 175], 'bold');
      phase.successCriteria.forEach(s => addText(`→ ${s}`, 9, [30, 64, 175], 'normal', 5));
      
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
      cursorY += 6;
    });

    if (actionPlan.pivotPoints?.length) {
      addHeader('Strategic Pivot Points', 14, [245, 158, 11], true);
      actionPlan.pivotPoints.forEach(pp => {
        addText(`IF: ${pp.trigger}`, 10, [30, 41, 59], 'bold');
        addText(`THEN: ${pp.reaction}`, 9, [71, 85, 105], 'normal', 5);
        cursorY += 2;
      });
    }
  }

  // --- RESOURCES ---
  doc.addPage();
  cursorY = margin;
  addHeader('Resources & Grounding', 16, [15, 23, 42], true);
  const allSources = Array.from(new Set(agents.flatMap(a => a.sources || [])));
  if (allSources.length) {
    allSources.forEach((s, i) => addText(`${i + 1}. ${s}`, 9, [79, 70, 229]));
  } else {
    addText('No external citations utilized.', 10, [148, 163, 184], 'italic');
  }

  // --- PREPEND TABLE OF CONTENTS ---
  doc.insertPage(1);
  doc.setPage(1);
  cursorY = 25;
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', margin, cursorY);
  cursorY += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  sections.forEach(s => {
    const pStr = `Page ${s.page + 1}`; // +1 because we inserted a page at index 1
    doc.text(s.title, margin, cursorY);
    doc.text(pStr, pageWidth - margin - doc.getTextWidth(pStr), cursorY);
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
    cursorY += 10;
  });

  // --- ADD PAGE NUMBERS & FOOTERS ---
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Decidr Strategic Briefing • ${input.title} • Page ${i} of ${totalPages}`, margin, pageHeight - 10);
  }

  const filename = `${input.title.replace(/\s+/g, '_')}_Strategic_Report.pdf`;
  doc.save(filename);
}
