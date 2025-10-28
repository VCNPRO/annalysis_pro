// components/VideoUploader.tsx
import React, { useState, useRef, useEffect } from 'react';
import { AppStatus } from '../types';

interface VideoUploaderProps {
  onVideoSelected: (file: File) => void;
  status: AppStatus;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoSelected, status }) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
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

  const isLoading = status === AppStatus.LOADING;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-center text-blue-700">Puja un Vídeo per Analitzar</h2>
      <div className="flex flex-col items-center space-y-4">
        <input
          type="file"
          accept="video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        <button
          onClick={handleClick}
          className="relative px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed w-full md:w-auto"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processant...
            </span>
          ) : (
            <>
              {selectedFileName ? 'Canviar Vídeo' : 'Seleccionar Fitxer de Vídeo'}
            </>
          )}
        </button>
        {selectedFileName && (
          <p className="text-sm text-gray-600 italic">
            Seleccionat: <span className="font-medium text-blue-800">{selectedFileName}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;