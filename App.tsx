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
import ProjectsManager from './components/ProjectsManager';
import ConfidenceCharts from './components/ConfidenceCharts';
import VideoComparison from './components/VideoComparison';
import { extractFrames } from './services/videoProcessing';
import { generateStructuredVideoAnalysis, StructuredVideoAnalysis } from './services/geminiService';
import { VideoAnalysisResult, AppStatus } from './types';
import { FRAME_EXTRACTION_CONFIG, getApiKey } from './constants';
import { addVideoToProject, getProject, getVideoFromProject, Project } from './services/projectsService';
import { extractThumbnail } from './services/thumbnailService';
import { getCachedAnalysis, cacheAnalysis } from './services/cacheService';

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

  // Projects state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [showProjectsSidebar, setShowProjectsSidebar] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);

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
      // 1. Check cache first
      const cachedAnalysis = await getCachedAnalysis(file);

      let geminiStructuredAnalysis: StructuredVideoAnalysis;
      let extractedFrames: string[] = [];

      if (cachedAnalysis) {
        console.log('✓ Utilitzant anàlisi des de la cache');
        geminiStructuredAnalysis = cachedAnalysis;
        // No need to extract frames if using cache
      } else {
        console.log('→ Analitzant vídeo amb Gemini...');
        // 2. Extreure frames del vídeo
        extractedFrames = await extractFrames(file, FRAME_EXTRACTION_CONFIG);
        if (extractedFrames.length === 0) {
          throw new Error("No s'han pogut extreure frames del vídeo. Si us plau, prova un altre vídeo.");
        }

        // 3. Cridar l'API de Gemini per a l'anàlisi estructurada
        geminiStructuredAnalysis = await generateStructuredVideoAnalysis(extractedFrames);

        // 4. Cache the analysis
        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(file);
        videoElement.addEventListener('loadedmetadata', async () => {
          const videoDuration = videoElement.duration;
          URL.revokeObjectURL(videoElement.src);
          await cacheAnalysis(file, geminiStructuredAnalysis, videoDuration);
        });
      }

      // 5. Extreure thumbnail
      const thumbnail = await extractThumbnail(file, 1);

      // 6. Actualitzar l'estat amb els resultats
      setAnalysisResult({
        frames: extractedFrames,
        description: geminiStructuredAnalysis.summary, // Utilitzem el resum com a descripció general
      });
      setStructuredAnalysis(geminiStructuredAnalysis);
      setAppStatus(AppStatus.SUCCESS);

      // 7. Guardar al projecte actual si n'hi ha un de seleccionat
      if (currentProjectId) {
        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(file);
        videoElement.addEventListener('loadedmetadata', () => {
          const videoDuration = videoElement.duration;
          URL.revokeObjectURL(videoElement.src);

          const savedVideo = addVideoToProject(
            currentProjectId,
            file.name,
            videoDuration,
            geminiStructuredAnalysis,
            thumbnail || undefined
          );

          if (savedVideo) {
            setCurrentVideoId(savedVideo.id);
          }
        });
      }

    } catch (err: any) {
      console.error("L'anàlisi de vídeo ha fallat:", err);
      setError(err.message || "S'ha produït un error inesperat durant l'anàlisi de vídeo. Torna a intentar-ho.");
      setAppStatus(AppStatus.ERROR);
    }
  }, [currentProjectId]); // Add currentProjectId to dependencies

  const handleVideoSelected = useCallback((file: File) => {
    setVideoFile(file);
    // Activar automàticament l'anàlisi en seleccionar el fitxer
    analyzeVideo(file);
  }, [analyzeVideo]);

  const handleSeekFromTimeline = (time: number) => {
    setCurrentTime(time);
    // VideoPlayer will handle the actual seek via ref
  };

  const handleLoadVideoFromProject = async (project: Project, videoId: string) => {
    const video = getVideoFromProject(project.id, videoId);
    if (!video) return;

    // Carregar anàlisi existent
    setStructuredAnalysis(video.analysis);
    setAnalysisResult({
      frames: [],
      description: video.analysis.summary
    });
    setCurrentProjectId(project.id);
    setCurrentVideoId(videoId);
    setAppStatus(AppStatus.SUCCESS);
    setShowProjectsSidebar(false);

    // Nota: No podem restaurar el File object, només l'anàlisi
    // L'usuari haurà de pujar de nou el vídeo si vol veure'l
    setVideoFile(null);
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProjectsSidebar(!showProjectsSidebar)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm font-medium transition-colors"
                title="Els meus projectes"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <span>Projectes</span>
              </button>
              <button
                onClick={() => setShowComparison(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm font-medium transition-colors"
                title="Comparar vídeos"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                <span>Comparar</span>
              </button>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Projects Sidebar */}
        {showProjectsSidebar && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowProjectsSidebar(false)} />
        )}
        <div
          className={`fixed lg:absolute top-0 right-0 h-screen lg:h-auto w-80 lg:w-72 bg-slate-900 border-l lg:border lg:rounded-lg border-slate-700 z-50 lg:z-auto transition-transform lg:transition-none ${
            showProjectsSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          } ${!videoFile && appStatus === AppStatus.IDLE ? 'lg:block' : 'lg:hidden'}`}
        >
          <ProjectsManager
            currentProjectId={currentProjectId}
            onSelectProject={setCurrentProjectId}
            onLoadVideo={handleLoadVideoFromProject}
          />
        </div>

        {/* Video Uploader */}
        {!videoFile && appStatus !== AppStatus.SUCCESS && (
          <div className="mb-8">
            <VideoUploader onVideoSelected={handleVideoSelected} status={appStatus} />
            {currentProjectId && (
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-400">
                  📁 El vídeo s'afegirà al projecte seleccionat
                </p>
              </div>
            )}
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
                videoFile={videoFile}
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

              {/* Confidence Charts */}
              <ConfidenceCharts structuredAnalysis={structuredAnalysis} />

              {/* Search & Export */}
              <SearchAndExport
                structuredAnalysis={structuredAnalysis}
                onSeekToResult={handleSeekFromTimeline}
                videoFileName={videoFile?.name || 'video'}
                videoDuration={duration}
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

      <VideoComparison
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
      />
    </div>
  );
};

export default App;
