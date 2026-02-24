import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { extractTextFromPDF } from '../services/pdfService';
import { Attachment } from '../types';
import { UI_CONTENT } from '../src/constants/uiContent';

interface DocumentUploadProps {
  onDocumentsChange: (attachments: Attachment[]) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentsChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress('Initializing...');
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        setProgress('Reading PDF...');
        text = await extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        text = await file.text();
      } else if (file.type.startsWith('image/')) {
        setProgress('Reading Image (OCR)...');
        const result = await Tesseract.recognize(
          file,
          'eng',
          { logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(`OCR: ${Math.round(m.progress * 100)}%`);
            }
          }}
        );
        text = result.data.text;
      } else {
        alert(UI_CONTENT.FORM.MESSAGES.UNSUPPORTED_FILE);
        return;
      }

      const newAttachment: Attachment = {
        name: file.name,
        type: file.type,
        extractedText: text
      };

      const updated = [...attachments, newAttachment];
      setAttachments(updated);
      onDocumentsChange(updated);
    } catch (error) {
      console.error('File processing error:', error);
      alert(UI_CONTENT.FORM.MESSAGES.FILE_ERROR);
    } finally {
      setIsUploading(false);
      setProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
    onDocumentsChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* List of Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg group animate-fade-in">
              <span className="text-[10px] text-slate-300 font-medium truncate max-w-[120px]">{att.name}</span>
              <button 
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.png,.jpg,.jpeg"
        className="hidden"
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`w-full py-2 px-3 border border-dashed rounded-lg flex items-center justify-center gap-2 transition-all text-xs ${
          isUploading 
            ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' 
            : 'bg-slate-900/40 border-slate-800 hover:border-indigo-500/50 text-slate-500 hover:text-indigo-300'
        }`}
      >
        {isUploading ? (
          <>
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            <span>{progress || 'Processing...'}</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>{UI_CONTENT.FORM.BUTTONS.ATTACH}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default DocumentUpload;
