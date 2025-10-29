// components/VideoUploader.tsx
import React, { useState, useRef } from 'react';
import { AppStatus } from '../types';

interface VideoUploaderProps {
  onVideoSelected: (file: File) => void;
  status: AppStatus;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoSelected, status }) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFileName(file.name);
      onVideoSelected(file);
    } else {
      setSelectedFileName(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFileName(file.name);
        onVideoSelected(file);
      } else {
        alert('Si us plau, puja un fitxer de vídeo vàlid.');
      }
    }
  };

  const isLoading = status === AppStatus.LOADING;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-105'
            : 'border-slate-600 bg-slate-800/50 hover:border-blue-500 hover:bg-slate-800'
          }
          ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div className={`text-6xl transition-transform ${isDragging ? 'scale-110' : ''}`}>
            {isLoading ? '⏳' : '🎬'}
          </div>

          {/* Text */}
          <div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">
              {isLoading ? 'Processant vídeo...' :
               selectedFileName ? 'Canviar vídeo' :
               'Puja un vídeo per analitzar'}
            </h3>
            <p className="text-sm text-slate-400">
              {isLoading ? 'Això pot trigar uns moments' :
               isDragging ? 'Deixa anar el fitxer aquí' :
               'Arrossega i deixa anar o fes clic per seleccionar'}
            </p>
          </div>

          {/* Selected file name */}
          {selectedFileName && !isLoading && (
            <div className="mt-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <p className="text-sm text-blue-400">
                📹 {selectedFileName}
              </p>
            </div>
          )}

          {/* Supported formats */}
          {!isLoading && (
            <p className="text-xs text-slate-500 mt-4">
              Formats suportats: MP4, AVI, MOV, MKV, WebM
            </p>
          )}
        </div>

        {/* Loading spinner overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl">
            <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;