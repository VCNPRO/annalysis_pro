// App.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import '@fontsource/orbitron/700.css'; // Bold weight
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
import SettingsPanel from './components/SettingsPanel';
import UserGuide from './components/UserGuide';
import Dashboard from './components/Dashboard';
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
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showUserGuide, setShowUserGuide] = useState<boolean>(false);
  const [usedCache, setUsedCache] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'upload' | 'analysis'>('dashboard');

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
        setUsedCache(true);
        // No need to extract frames if using cache
      } else {
        setUsedCache(false);
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
    setCurrentView('analysis');
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
    setCurrentView('analysis');

    // Nota: No podem restaurar el File object, només l'anàlisi
    // L'usuari haurà de pujar de nou el vídeo si vol veure'l
    setVideoFile(null);
  };

  const handleDashboardNavigate = (view: 'upload' | 'projects' | 'comparison' | 'settings') => {
    if (view === 'upload') {
      setCurrentView('upload');
    } else if (view === 'projects') {
      setShowProjectsSidebar(true);
    } else if (view === 'comparison') {
      setShowComparison(true);
    } else if (view === 'settings') {
      setShowSettings(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header oscuro profesional */}
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-blue-500">🎬</div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-base font-bold text-slate-100 tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  annalysis pro
                </h1>
                <span className="text-xs text-slate-500 font-normal">
                  trabajando para
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 ${currentView === 'dashboard' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'} border border-slate-600 rounded-lg text-white text-xs font-medium transition-colors`}
                title="Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setShowUserGuide(true)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 transition-colors"
                title="Guia d'usuari"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </button>
              <button
                onClick={() => setShowProjectsSidebar(!showProjectsSidebar)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-xs font-medium transition-colors"
                title="Els meus projectes"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <span className="hidden sm:inline">Projectes</span>
              </button>
              <button
                onClick={() => setShowComparison(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-xs font-medium transition-colors"
                title="Comparar vídeos"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                <span className="hidden sm:inline">Comparar</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-xs font-medium transition-colors"
                title="Configuració"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden lg:inline">Configuració</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-3 sm:px-4 lg:px-6 py-4 relative">
        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <Dashboard onNavigate={handleDashboardNavigate} />
        )}

        {/* Upload & Analysis Views */}
        {currentView !== 'dashboard' && (
          <>
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

        {/* Cache Indicator */}
        {usedCache && appStatus === AppStatus.SUCCESS && (
          <div className="mb-3 bg-green-500/10 border border-green-500/30 rounded-lg p-2">
            <div className="flex items-center gap-2 justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs text-green-400 font-medium">
                Anàlisi carregada des de la cache (instantània)
              </span>
            </div>
          </div>
        )}

        {/* Video Player & Analysis */}
        {videoFile && appStatus !== AppStatus.LOADING && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left Column: Video Player & Timeline */}
            <div className="lg:col-span-8 space-y-2.5">
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

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  ← Dashboard
                </button>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setAnalysisResult(null);
                    setStructuredAnalysis(null);
                    setAppStatus(AppStatus.IDLE);
                    setCurrentView('upload');
                  }}
                  className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm font-medium transition-colors"
                >
                  ↑ Pujar nou vídeo
                </button>
              </div>
            </div>

            {/* Right Column: Stats, Search & Analysis */}
            <div className="lg:col-span-4 space-y-2.5">
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
          </>
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-700 mt-6">
        <div className="px-3 sm:px-4 lg:px-6 py-3">
          <p className="text-center text-slate-500 text-xs">
            Impulsat per Google Gemini AI · Annalysis Pro
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

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <UserGuide
        isOpen={showUserGuide}
        onClose={() => setShowUserGuide(false)}
      />
    </div>
  );
};

export default App;
