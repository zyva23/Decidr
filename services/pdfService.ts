
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CouncilResult, DecisionInput } from '../types';

/**
 * PDF SERVICE
 * Generates a high-fidelity strategic briefing PDF.
 */
export async function generateDecisionPDF(input: DecisionInput, result: CouncilResult) {
  // Create a new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 25;

  // Helper for adding headers
  const addHeader = (text: string, size = 18, color = [30, 41, 59]) => {
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, cursorY);
    cursorY += size / 2 + 2;
  };

  // Helper for text wrapping
  const addText = (text: string, size = 10, color = [71, 85, 105], style = 'normal') => {
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', style);
    const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(splitText, margin, cursorY);
    cursorY += splitText.length * (size / 2) + 5;
  };

  // 1. Cover / Title Section
  addHeader('Strategic Decision Briefing', 10, [100, 116, 139]);
  cursorY += 5;
  addHeader(input.title, 24, [15, 23, 42]);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 10;

  // 2. Verdict & Synthesis
  addHeader('Final Verdict', 14, [79, 70, 229]);
  addText(result.synthesis.verdict, 12, [30, 41, 59], 'bold');
  addText(result.synthesis.recommendation, 11, [71, 85, 105]);

  // 3. Capture Radar Visualization
  const radarElement = document.getElementById('decision-radar-chart');
  if (radarElement) {
    try {
      const canvas = await html2canvas(radarElement, {
        scale: 2,
        backgroundColor: '#f8fafc',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center the image
      const imgX = (pageWidth - imgWidth) / 2;
      doc.addImage(imgData, 'PNG', imgX, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 15;
    } catch (e) {
      console.warn('Could not capture radar chart for PDF', e);
    }
  }

  // Check if we need a new page
  if (cursorY > 220) {
    doc.addPage();
    cursorY = 25;
  }

  // 4. Agent Reports
  addHeader('Council Perspectives', 16, [15, 23, 42]);
  cursorY += 5;

  const agents = [result.analyst, result.strategist, result.skeptic, result.mediator];
  
  agents.forEach((agent) => {
    if (cursorY > 240) {
      doc.addPage();
      cursorY = 25;
    }
    
    addHeader(`${agent.role}: ${agent.name}`, 12, [51, 65, 85]);
    addText(agent.analysis, 10, [71, 85, 105]);
    
    // Key Findings for each agent
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Strategic Points:', margin + 5, cursorY);
    cursorY += 5;
    agent.keyPoints.forEach(point => {
        doc.setFont('helvetica', 'normal');
        doc.text(`• ${point}`, margin + 8, cursorY);
        cursorY += 4;
    });
    cursorY += 8;
  });

  // Save the PDF
  const filename = `${input.title.replace(/\s+/g, '_')}_Council_Report.pdf`;
  doc.save(filename);
}
