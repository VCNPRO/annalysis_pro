// App.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import AnalysisResults from './components/AnalysisResults';
import LoadingSpinner from './components/LoadingSpinner';
import { extractFrames } from './services/videoProcessing';
import { generateStructuredVideoAnalysis, StructuredVideoAnalysis } from './services/geminiService';
import { VideoAnalysisResult, AppStatus } from './types';
import { FRAME_EXTRACTION_CONFIG } from './constants';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [structuredAnalysis, setStructuredAnalysis] = useState<StructuredVideoAnalysis | null>(null); // Nou estat
  const [appStatus, setAppStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  // Using useRef to ensure the latest state is captured for `analyzeVideo` without
  // adding `analysisResult`, `appStatus` to its dependency array, preventing re-creation.
  const videoFileRef = useRef(videoFile);
  useEffect(() => {
    videoFileRef.current = videoFile;
  }, [videoFile]);

  const analyzeVideo = useCallback(async (file: File) => {
    setAppStatus(AppStatus.LOADING);
    setError(null);
    setAnalysisResult(null); // Netejar resultats anteriors
    setStructuredAnalysis(null); // Netejar l'anàlisi estructurada anterior

    try {
      // 1. Extreure frames del vídeo
      const extractedFrames = await extractFrames(file, FRAME_EXTRACTION_CONFIG);
      if (extractedFrames.length === 0) {
        throw new Error("No s'han pogut extreure frames del vídeo. Si us plau, prova un altre vídeo.");
      }

      // 2. Cridar l'API de Gemini per a l'anàlisi estructurada
      const geminiStructuredAnalysis = await generateStructuredVideoAnalysis(extractedFrames);

      // 3. Actualitzar l'estat amb els resultats
      setAnalysisResult({
        frames: extractedFrames,
        description: geminiStructuredAnalysis.summary, // Utilitzem el resum com a descripció general
      });
      setStructuredAnalysis(geminiStructuredAnalysis);
      setAppStatus(AppStatus.SUCCESS);

    } catch (err: any) {
      console.error("L'anàlisi de vídeo ha fallat:", err);
      setError(err.message || "S'ha produït un error inesperat durant l'anàlisi de vídeo. Torna a intentar-ho.");
      setAppStatus(AppStatus.ERROR);
    }
  }, []); // Empty dependency array means this function is created once

  const handleVideoSelected = useCallback((file: File) => {
    setVideoFile(file);
    // Activar automàticament l'anàlisi en seleccionar el fitxer
    analyzeVideo(file);
  }, [analyzeVideo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl text-center py-6 mb-8">
        <h1 className="text-4xl font-extrabold text-blue-800 drop-shadow-lg">
          <span role="img" aria-label="càmera" className="mr-2">🎥</span>
          Anàlisi de Vídeo amb Gemini AI
        </h1>
        <p className="text-lg text-blue-700 mt-2 font-light">
          Puja un vídeo per obtenir coneixements detallats i estructurats basats en IA sobre el seu contingut visual.
        </p>
      </header>

      <main className="flex-grow w-full max-w-4xl">
        <VideoUploader onVideoSelected={handleVideoSelected} status={appStatus} />

        {appStatus === AppStatus.LOADING && (
          <div className="mt-8">
            <LoadingSpinner />
            <p className="text-center text-gray-600 italic mt-2">
              Extraint frames i analitzant amb Gemini... Això pot trigar un moment.
            </p>
          </div>
        )}

        <AnalysisResults results={analysisResult} structuredAnalysis={structuredAnalysis} error={error} />
      </main>

      <footer className="w-full max-w-4xl text-center py-6 mt-8 border-t border-blue-300 text-blue-700 text-sm">
        Impulsat per Google Gemini AI i Tailwind CSS
      </footer>
    </div>
  );
};

export default App;
