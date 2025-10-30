// components/SettingsPanel.tsx
import React, { useState, useEffect } from 'react';
import { getCacheStats, clearAllCache, clearExpiredCache, getCachedVideos, removeCachedVideo } from '../services/cacheService';
import { getStorageStats } from '../services/projectsService';
import { ANALYSIS_LANGUAGES, getAnalysisLanguage, setAnalysisLanguage, getApiKey, setApiKey } from '../constants';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'cache' | 'storage' | 'api'>('general');
  const [cacheStats, setCacheStats] = useState(getCacheStats());
  const [storageStats, setStorageStats] = useState(getStorageStats());
  const [cachedVideos, setCachedVideos] = useState(getCachedVideos());
  const [currentLang, setCurrentLang] = useState(getAnalysisLanguage());
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      refreshStats();
    }
  }, [isOpen]);

  const refreshStats = () => {
    setCacheStats(getCacheStats());
    setStorageStats(getStorageStats());
    setCachedVideos(getCachedVideos());
  };

  const handleClearCache = () => {
    if (confirm('Segur que vols esborrar tota la cache? Això farà que els vídeos es tornin a analitzar.')) {
      clearAllCache();
      refreshStats();
    }
  };

  const handleClearExpired = () => {
    const removed = clearExpiredCache();
    alert(`S'han esborrat ${removed} entrades caducades`);
    refreshStats();
  };

  const handleRemoveCachedVideo = async (fileName: string, fileSize: number) => {
    if (confirm(`Esborrar "${fileName}" de la cache?`)) {
      await removeCachedVideo(fileName, fileSize);
      refreshStats();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('ca-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100">⚙️ Configuració</h2>
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

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <div className="flex">
            {[
              { key: 'general', label: '⚙️ General', icon: '' },
              { key: 'cache', label: '💾 Cache', icon: '' },
              { key: 'storage', label: '📊 Emmagatzematge', icon: '' },
              { key: 'api', label: '🔑 API Key', icon: '' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900/50'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Informació de l'aplicació</h3>
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Versió:</span>
                    <span className="text-slate-200 font-mono">1.0.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Model d'IA:</span>
                    <span className="text-slate-200">Gemini 2.0 Flash</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Framework:</span>
                    <span className="text-slate-200">React 19.2.0</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Idioma d'anàlisi</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Selecciona l'idioma en què vols que Gemini generi les anàlisis:
                </p>
                <select
                  value={currentLang}
                  onChange={(e) => {
                    setCurrentLang(e.target.value);
                    setAnalysisLanguage(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                >
                  {Object.entries(ANALYSIS_LANGUAGES).map(([code, { name }]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  💡 Els nous anàlisis s'generaran en l'idioma seleccionat
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Sobre</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Annalysis Pro és una plataforma d'anàlisi de vídeo impulsada per Intel·ligència Artificial.
                  Utilitza Google Gemini per detectar objectes, persones, text i accions en els teus vídeos.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Enllaços</h3>
                <div className="space-y-2">
                  <a
                    href="https://github.com/VCNPRO/annalysis_pro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Codi font a GitHub
                  </a>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Obtenir clau API de Gemini
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Cache Tab */}
          {activeTab === 'cache' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Estadístiques de Cache</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">Vídeos en cache</div>
                    <div className="text-2xl font-bold text-slate-100">{cacheStats.totalEntries}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">Mida total</div>
                    <div className="text-2xl font-bold text-slate-100">{formatBytes(cacheStats.totalSize)}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">Caduquen aviat</div>
                    <div className="text-2xl font-bold text-yellow-400">{cacheStats.expiringCount}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">Durada</div>
                    <div className="text-2xl font-bold text-slate-100">30d</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Accions</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearExpired}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Netejar caducades
                  </button>
                  <button
                    onClick={handleClearCache}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Esborrar tota la cache
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Vídeos en cache</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cachedVideos.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No hi ha vídeos en cache</p>
                  ) : (
                    cachedVideos.map((video, idx) => (
                      <div key={idx} className="bg-slate-900/50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{video.videoFileName}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>⏱️ {formatDuration(video.videoDuration)}</span>
                            <span>💾 {formatBytes(video.videoSize)}</span>
                            <span>📅 {formatDate(video.cachedAt)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCachedVideo(video.videoFileName, video.videoSize)}
                          className="ml-2 p-1 hover:bg-red-600/20 rounded transition-colors"
                          title="Esborrar de la cache"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Storage Tab */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Ús d'emmagatzematge</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">Projectes</div>
                    <div className="text-2xl font-bold text-slate-100">{storageStats.totalProjects}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">Vídeos totals</div>
                    <div className="text-2xl font-bold text-slate-100">{storageStats.totalVideos}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">Espai usat</div>
                    <div className="text-2xl font-bold text-slate-100">{formatBytes(storageStats.storageUsed)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-blue-300 font-medium mb-1">Sobre LocalStorage</p>
                    <p className="text-xs text-blue-200/70">
                      Les dades es guarden al navegador (LocalStorage). El límit típic és de ~10MB.
                      Si s'omple, neteja projectes antics o cache per alliberar espai.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Configuració de Clau API</h3>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-blue-300 font-medium mb-1">Sobre les claus API</p>
                      <p className="text-xs text-blue-200/70 mb-2">
                        Hi ha dues maneres d'usar Annalysis Pro:
                      </p>
                      <ul className="text-xs text-blue-200/70 space-y-1 ml-4 list-disc">
                        <li><strong>Clau compartida</strong>: Si l'administrador ha configurat una clau a Vercel, l'aplicació la usa automàticament</li>
                        <li><strong>Clau personal</strong>: Pots introduir la teva pròpia clau aquí per usar el teu compte de Google</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Current API Key Status */}
                <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-slate-400 mb-2">Estat actual:</div>
                  {(() => {
                    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
                    const hasEnvKey = envKey && envKey !== 'undefined' && envKey.trim() !== '';
                    const localKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
                    const hasLocalKey = localKey && localKey.trim() !== '';

                    if (hasEnvKey) {
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm text-green-400 font-medium">Usant clau compartida de Vercel</span>
                        </div>
                      );
                    } else if (hasLocalKey) {
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm text-blue-400 font-medium">Usant clau personal</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-sm text-red-400 font-medium">No s'ha configurat cap clau API</span>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* API Key Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Clau personal de Google Gemini
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        if (apiKeyInput.trim()) {
                          setApiKey(apiKeyInput.trim());
                          setApiKeyInput('');
                          alert('✅ Clau API desada correctament');
                        }
                      }}
                      disabled={!apiKeyInput.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Desar
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    💡 La teva clau personal es prioritzarà sobre la clau compartida (si n'hi ha una)
                  </p>
                </div>

                {/* Clear Personal Key Button */}
                {(() => {
                  const localKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
                  const hasLocalKey = localKey && localKey.trim() !== '';

                  if (hasLocalKey) {
                    return (
                      <button
                        onClick={() => {
                          if (confirm('Segur que vols esborrar la teva clau personal?')) {
                            localStorage.removeItem('gemini_api_key');
                            alert('✅ Clau personal esborrada');
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Esborrar clau personal
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Com obtenir una clau API</h3>
                <ol className="text-sm text-slate-400 space-y-2 list-decimal ml-4">
                  <li>Ves a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Google AI Studio</a></li>
                  <li>Inicia sessió amb el teu compte de Google</li>
                  <li>Fes clic a "Get API Key" o "Create API Key"</li>
                  <li>Copia la clau i enganxa-la aquí dalt</li>
                </ol>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-300 font-medium mb-1">Advertència sobre costos</p>
                    <p className="text-xs text-yellow-200/70">
                      Els costos d'ús de l'API s'acumularan al compte de Google associat a la clau.
                      Google Gemini té un tier gratuït de 1.500 sol·licituds/dia.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900 border-t border-slate-700 p-4">
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

export default SettingsPanel;
