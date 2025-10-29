// App.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import MetadataTimeline from './components/MetadataTimeline';
import AnalysisResults from './components/AnalysisResults';
import AnalysisStats from './components/AnalysisStats';
import SearchAndExport from './components/SearchAndExport';
import LoadingSpinner from './components/LoadingSpinner';
import ApiKeyModal from './components/ApiKeyModal';
import { extractFrames } from './services/videoProcessing';
import { generateStructuredVideoAnalysis, StructuredVideoAnalysis } from './services/geminiService';
import { VideoAnalysisResult, AppStatus } from './types';
import { FRAME_EXTRACTION_CONFIG, getApiKey } from './constants';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [structuredAnalysis, setStructuredAnalysis] = useState<StructuredVideoAnalysis | null>(null);
  const [appStatus, setAppStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // Video player state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Comprovar si hi ha API key configurada al muntatge
  useEffect(() => {
    const savedKey = getApiKey();
    if (!savedKey) {
      // Mostrar el modal si no hi ha clau API
      setIsApiKeyModalOpen(true);
    }
  }, []);

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

  const handleSeekFromTimeline = (time: number) => {
    setCurrentTime(time);
    // VideoPlayer will handle the actual seek via ref
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header oscuro profesional */}
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-blue-500">🎬</div>
              <h1 className="text-xl font-bold text-slate-100">ANNALYSIS PRO</h1>
            </div>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm font-medium transition-colors"
              title="Configurar clau API"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
              <span>Clau API</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Video Uploader */}
        {!videoFile && (
          <div className="mb-8">
            <VideoUploader onVideoSelected={handleVideoSelected} status={appStatus} />
          </div>
        )}

        {/* Loading State */}
        {appStatus === AppStatus.LOADING && (
          <div className="mt-8">
            <LoadingSpinner />
            <p className="text-center text-slate-400 italic mt-4">
              Extraint frames i analitzant amb Gemini... Això pot trigar un moment.
            </p>
          </div>
        )}

        {/* Video Player & Analysis */}
        {videoFile && appStatus !== AppStatus.LOADING && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Video Player & Timeline */}
            <div className="lg:col-span-7 space-y-4">
              <VideoPlayer
                videoFile={videoFile}
                onTimeUpdate={setCurrentTime}
                onDurationChange={setDuration}
                onSeek={setCurrentTime}
              />

              <MetadataTimeline
                structuredAnalysis={structuredAnalysis}
                duration={duration}
                currentTime={currentTime}
                onSeek={handleSeekFromTimeline}
              />

              {/* Upload New Video Button */}
              <button
                onClick={() => {
                  setVideoFile(null);
                  setAnalysisResult(null);
                  setStructuredAnalysis(null);
                  setAppStatus(AppStatus.IDLE);
                }}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm font-medium transition-colors"
              >
                ↑ Pujar nou vídeo
              </button>
            </div>

            {/* Right Column: Stats, Search & Analysis */}
            <div className="lg:col-span-5 space-y-4">
              {/* Statistics */}
              <AnalysisStats
                structuredAnalysis={structuredAnalysis}
                duration={duration}
              />

              {/* Search & Export */}
              <SearchAndExport
                structuredAnalysis={structuredAnalysis}
                onSeekToResult={handleSeekFromTimeline}
              />

              {/* Detailed Analysis Results */}
              <AnalysisResults
                results={analysisResult}
                structuredAnalysis={structuredAnalysis}
                error={error}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-slate-500 text-sm">
            Impulsat per Google Gemini AI · Annalysis Pro Enterprise
          </p>
        </div>
      </footer>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
};

export default App;
