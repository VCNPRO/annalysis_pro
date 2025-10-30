// components/AnalysisResults.tsx
import React, { useState } from 'react';
import { VideoAnalysisResult } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { StructuredVideoAnalysis } from '../services/geminiService'; // Importar la nova interfície

interface AnalysisResultsProps {
  results: VideoAnalysisResult | null;
  structuredAnalysis: StructuredVideoAnalysis | null; // Nou prop per a l'anàlisi estructurada
  error: string | null;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-700 py-2">
      <button
        className="flex justify-between items-center w-full text-left font-semibold text-slate-200 hover:text-blue-400 transition-colors duration-200 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xs">{title}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && <div className="mt-2 pl-2 border-l-2 border-blue-500">{children}</div>}
    </div>
  );
};

const RenderJsonContent: React.FC<{ jsonString: string; title: string }> = ({ jsonString, title }) => {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data) && data.length > 0) {
      return (
        <ul className="list-disc list-inside space-y-2 mt-2">
          {data.map((item, idx) => (
            <li key={idx} className="text-sm">
              <MarkdownRenderer content={JSON.stringify(item, null, 2)} className="bg-gray-100 p-2 rounded-md font-mono text-xs overflow-x-auto" />
            </li>
          ))}
        </ul>
      );
    } else if (typeof data === 'object' && Object.keys(data).length > 0) {
      return (
        <div className="bg-gray-100 p-3 rounded-md mt-2">
          <MarkdownRenderer content={JSON.stringify(data, null, 2)} className="font-mono text-xs overflow-x-auto" />
        </div>
      );
    }
    return <p className="text-sm text-gray-600 italic">No hi ha dades detallades de {title}.</p>;
  } catch {
    return (
      <MarkdownRenderer content={jsonString} className="text-sm mt-2" />
    );
  }
};


const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, structuredAnalysis, error }) => {
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg shadow-md">
        <strong className="font-bold">Error!</strong>
        <p className="block sm:inline ml-2 text-sm">{error}</p>
        <p className="text-xs mt-2 text-red-300">Assegura't que la teva clau API sigui correcta i accessible.</p>
      </div>
    );
  }

  if (!results && !structuredAnalysis) {
    return (
      <div className="text-center text-slate-500 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <p className="text-sm">Analitza un vídeo per veure els resultats</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-800 rounded-lg shadow-xl border border-slate-700 max-h-[calc(100vh-12rem)] overflow-y-auto">
      <h2 className="text-sm font-semibold mb-3 text-slate-100 border-b border-slate-700 pb-2">📊 Resultats de l'Anàlisi</h2>

      {results?.frames.length > 0 && (
        <CollapsibleSection title="Frames clau extrets" defaultOpen={true}>
          <p className="text-sm text-gray-600 mb-3">Aquests són els frames més representatius extrets del vídeo:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {results.frames.map((frame, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <img
                  src={frame}
                  alt={`Frame extret ${index + 1}`}
                  className="w-full h-auto object-cover rounded-t-lg"
                  loading="lazy"
                />
                <p className="text-xs text-center text-gray-500 py-1">Frame {index + 1}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {structuredAnalysis && (
        <div className="mt-6 space-y-4">
          <CollapsibleSection title="Resum General del Vídeo" defaultOpen={true}>
            <MarkdownRenderer content={structuredAnalysis.summary || "No hi ha resum disponible."} />
          </CollapsibleSection>

          <CollapsibleSection title="Anàlisi d'Objectes">
            <RenderJsonContent jsonString={structuredAnalysis.objects} title="Objectes" />
          </CollapsibleSection>

          <CollapsibleSection title="Anàlisi de Persones">
            <RenderJsonContent jsonString={structuredAnalysis.people} title="Persones" />
          </CollapsibleSection>

          <CollapsibleSection title="Anàlisi d'Accions">
            <RenderJsonContent jsonString={structuredAnalysis.actions} title="Accions" />
          </CollapsibleSection>

          <CollapsibleSection title="Contingut de Text (OCR)">
            <RenderJsonContent jsonString={structuredAnalysis.textContent} title="Contingut de Text" />
          </CollapsibleSection>

          <CollapsibleSection title="Context d'Àudio Inferit">
            <RenderJsonContent jsonString={structuredAnalysis.audioContext} title="Context d'Àudio" />
          </CollapsibleSection>

          <CollapsibleSection title="Aspectes Tècnics del Vídeo">
            <RenderJsonContent jsonString={structuredAnalysis.technicalAspects} title="Aspectes Tècnics" />
          </CollapsibleSection>

          <CollapsibleSection title="Metadades Visibles">
            <RenderJsonContent jsonString={structuredAnalysis.metadata} title="Metadades" />
          </CollapsibleSection>
        </div>
      )}

      {!results?.frames.length && !structuredAnalysis && (
        <p className="text-center text-gray-600">No hi ha dades d'anàlisi disponibles per a aquest vídeo.</p>
      )}

       <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500 italic">
        <p>Aquesta aplicació realitza anàlisis al costat del client. Per a capacitats avançades com la detecció d'objectes en temps real amb YOLO o anàlisi d'àudio amb Whisper (tal com es descriu en la Guia Tècnica Completa), seria necessari un sistema de backend dedicat.</p>
      </div>
    </div>
  );
};

export default AnalysisResults;
