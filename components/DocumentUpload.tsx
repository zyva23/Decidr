import React, { useState, useRef } from 'react';
import { extractTextFromPDF } from '../services/pdfService';

interface DocumentUploadProps {
  onTextExtracted: (text: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onTextExtracted }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        onTextExtracted(`[Extracted from ${file.name}]:
${text}`);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        onTextExtracted(`[Content of ${file.name}]:
${text}`);
      } else {
        alert('Unsupported file type. Please upload a PDF or .txt file.');
      }
    } catch (error) {
      console.error('File processing error:', error);
      alert('Failed to process the document.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt"
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`w-full py-3 px-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all ${
          isUploading 
            ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' 
            : 'bg-slate-900/40 border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-300'
        }`}
      >
        {isUploading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            <span>Processing Document...</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Upload Document (CV, Case Study, Brief)</span>
          </>
        )}
      </button>
      <p className="text-[10px] text-slate-500 mt-2 text-center">Supports PDF and Text files</p>
    </div>
  );
};

export default DocumentUpload;
