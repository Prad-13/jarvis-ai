'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileUploadProps {
  onClose: () => void;
  onFileAdded: (file: { name: string; size: string }) => void;
  attachedFiles: { name: string; size: string }[];
  onRemoveFile: (idx: number) => void;
}

export function FileUpload({ onClose, onFileAdded, attachedFiles, onRemoveFile }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onFileAdded({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFileAdded({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Document Upload Node</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Drag Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border border-dashed rounded-lg p-6 text-center transition flex flex-col items-center justify-center cursor-pointer relative",
          isDragActive 
            ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
            : "border-white/10 bg-black/40 hover:border-cyan-500/30"
        )}
      >
        <input
          type="file"
          id="file-input-id"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg"
        />
        <UploadCloud className={cn("h-8 w-8 text-slate-500 mb-2 transition", isDragActive && "text-cyan-400")} />
        <p className="text-xs text-slate-300">Drag & drop files here or click to browse</p>
        <p className="text-[10px] text-slate-500 mt-1">Supports PDF, XLSX, CSV, Docs (Max 10MB)</p>
      </div>

      {/* Attached Files List */}
      {attachedFiles.length > 0 && (
        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
          {attachedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-3 py-1.5 rounded bg-slate-900 border border-white/5 text-[11px] text-slate-300 font-mono"
            >
              <div className="flex items-center gap-2 truncate flex-1 pr-4">
                <FileText className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-[9px] text-slate-500">({file.size})</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(idx)}
                className="text-slate-500 hover:text-red-400 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
