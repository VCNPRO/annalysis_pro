// components/VideoComparison.tsx
import React, { useState } from 'react';
import { StructuredVideoAnalysis } from '../services/geminiService';
import { getAllProjects, Project, VideoAnalysis } from '../services/projectsService';

interface VideoComparisonProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ComparisonData {
  video1: VideoAnalysis & { projectName: string } | null;
  video2: VideoAnalysis & { projectName: string } | null;
}

const VideoComparison: React.FC<VideoComparisonProps> = ({ isOpen, onClose }) => {
  const [allVideos, setAllVideos] = useState<(VideoAnalysis & { projectName: string })[]>([]);
  const [comparison, setComparison] = useState<ComparisonData>({ video1: null, video2: null });
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      loadAllVideos();
    }
  }, [isOpen]);

  const loadAllVideos = () => {
    const projects = getAllProjects();
    const videos: (VideoAnalysis & { projectName: string })[] = [];

    projects.forEach(project => {
      project.videos.forEach(video => {
        videos.push({ ...video, projectName: project.name });
      });
    });

    setAllVideos(videos);
    setIsLoading(false);
  };

  const selectVideo = (slot: 'video1' | 'video2', video: VideoAnalysis & { projectName: string }) => {
    setComparison(prev => ({
      ...prev,
      [slot]: video
    }));
  };

  const parseJSON = (jsonString: string): any => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  const getObjectsCount = (analysis: StructuredVideoAnalysis): number => {
    const objects = parseJSON(analysis.objects);
    return Array.isArray(objects) ? objects.length : 0;
  };

  const getPeopleCount = (analysis: StructuredVideoAnalysis): number => {
    const people = parseJSON(analysis.people);
    return people?.count || 0;
  };

  const getActionsCount = (analysis: StructuredVideoAnalysis): number => {
    const actions = parseJSON(analysis.actions);
    return Array.isArray(actions) ? actions.length : 0;
  };

  const getTextCount = (analysis: StructuredVideoAnalysis): number => {
    const text = parseJSON(analysis.textContent);
    return Array.isArray(text) ? text.length : 0;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100">⚖️ Comparació de Vídeos</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Carregant vídeos...</p>
            </div>
          ) : allVideos.length < 2 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📹</div>
              <p className="text-slate-300 font-medium mb-2">No hi ha prou vídeos per comparar</p>
              <p className="text-slate-500 text-sm">Necessites almenys 2 vídeos analitzats</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Video Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Video 1 Selection */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Vídeo 1</h3>
                  {comparison.video1 ? (
                    <div className="space-y-3">
                      <div className="relative">
                        {comparison.video1.thumbnail && (
                          <img
                            src={comparison.video1.thumbnail}
                            alt={comparison.video1.videoFileName}
                            className="w-full h-32 object-cover rounded border border-slate-700"
                          />
                        )}
                        <button
                          onClick={() => setComparison(prev => ({ ...prev, video1: null }))}
                          className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 rounded"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{comparison.video1.videoFileName}</p>
                        <p className="text-xs text-slate-500">📁 {comparison.video1.projectName}</p>
                      </div>
                    </div>
                  ) : (
                    <select
                      onChange={(e) => {
                        const video = allVideos.find(v => v.id === e.target.value);
                        if (video) selectVideo('video1', video);
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                    >
                      <option value="">Selecciona un vídeo...</option>
                      {allVideos
                        .filter(v => v.id !== comparison.video2?.id)
                        .map(video => (
                          <option key={video.id} value={video.id}>
                            {video.videoFileName} ({video.projectName})
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {/* Video 2 Selection */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Vídeo 2</h3>
                  {comparison.video2 ? (
                    <div className="space-y-3">
                      <div className="relative">
                        {comparison.video2.thumbnail && (
                          <img
                            src={comparison.video2.thumbnail}
                            alt={comparison.video2.videoFileName}
                            className="w-full h-32 object-cover rounded border border-slate-700"
                          />
                        )}
                        <button
                          onClick={() => setComparison(prev => ({ ...prev, video2: null }))}
                          className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 rounded"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{comparison.video2.videoFileName}</p>
                        <p className="text-xs text-slate-500">📁 {comparison.video2.projectName}</p>
                      </div>
                    </div>
                  ) : (
                    <select
                      onChange={(e) => {
                        const video = allVideos.find(v => v.id === e.target.value);
                        if (video) selectVideo('video2', video);
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                    >
                      <option value="">Selecciona un vídeo...</option>
                      {allVideos
                        .filter(v => v.id !== comparison.video1?.id)
                        .map(video => (
                          <option key={video.id} value={video.id}>
                            {video.videoFileName} ({video.projectName})
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Comparison Results */}
              {comparison.video1 && comparison.video2 && (
                <div className="bg-slate-900/50 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">📊 Comparativa d'Anàlisi</h3>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1">Mètrica</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-blue-400 font-medium">Vídeo 1</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-green-400 font-medium">Vídeo 2</div>
                    </div>
                  </div>

                  {[
                    {
                      label: '⏱️ Durada',
                      val1: formatDuration(comparison.video1.videoDuration),
                      val2: formatDuration(comparison.video2.videoDuration)
                    },
                    {
                      label: '🔷 Objectes detectats',
                      val1: getObjectsCount(comparison.video1.analysis),
                      val2: getObjectsCount(comparison.video2.analysis)
                    },
                    {
                      label: '👤 Persones detectades',
                      val1: getPeopleCount(comparison.video1.analysis),
                      val2: getPeopleCount(comparison.video2.analysis)
                    },
                    {
                      label: '⚡ Accions detectades',
                      val1: getActionsCount(comparison.video1.analysis),
                      val2: getActionsCount(comparison.video2.analysis)
                    },
                    {
                      label: '📝 Textos detectats',
                      val1: getTextCount(comparison.video1.analysis),
                      val2: getTextCount(comparison.video2.analysis)
                    }
                  ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-4 py-2 border-t border-slate-800">
                      <div className="text-sm text-slate-300">{row.label}</div>
                      <div className="text-center text-sm font-medium text-slate-200">{row.val1}</div>
                      <div className="text-center text-sm font-medium text-slate-200">{row.val2}</div>
                    </div>
                  ))}

                  {/* Summaries Side by Side */}
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">📄 Resums</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 rounded p-3">
                        <div className="text-xs text-blue-400 font-medium mb-2">Vídeo 1</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {comparison.video1.analysis.summary}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded p-3">
                        <div className="text-xs text-green-400 font-medium mb-2">Vídeo 2</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {comparison.video2.analysis.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoComparison;
