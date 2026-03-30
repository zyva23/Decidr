import { pdf } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist';
import React from 'react';
import { CouncilResult, DecisionInput, ActionPlan } from '../types';
import { DecisionPDF } from '../components/StrategicReportPDF';

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
  let radarImage: string | undefined;

  // Capture radar chart as image
  const radarElement = document.getElementById('decision-radar-chart');
  if (radarElement) {
    try {
      const canvas = await html2canvas(radarElement, { 
        scale: 2, 
        backgroundColor: '#ffffff', 
        useCORS: true,
        logging: false
      });
      radarImage = canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Radar capture failed', e);
    }
  }

  try {
    // Generate PDF blob using @react-pdf/renderer
    const blob = await pdf(
      React.createElement(DecisionPDF, {
        input,
        result,
        actionPlan,
        radarImage
      })
    ).toBlob();

    // Create download link and trigger it
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${input.title.replace(/\s+/g, '_')}_Strategic_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
}
