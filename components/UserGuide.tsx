// components/UserGuide.tsx
import React, { useState } from 'react';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('intro');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'intro',
      title: '👋 Benvingut',
      icon: '🎬',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Benvingut a Annalysis Pro</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Annalysis Pro és una plataforma professional d'anàlisi de vídeo impulsada per Intel·ligència Artificial.
            Utilitza Google Gemini 2.0 Flash per detectar objectes, persones, text, accions i molt més en els teus vídeos.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-300 font-medium mb-1">Primer cop?</p>
                <p className="text-xs text-blue-200/80">
                  Necessitaràs una clau API de Google Gemini (gratuïta). Fes clic al botó "Clau API" a la capçalera.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'upload',
      title: '📤 Pujar vídeos',
      icon: '📹',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Com pujar un vídeo</h3>
          <div className="space-y-3">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200 mb-1">Arrossega i deixa anar</p>
                  <p className="text-xs text-slate-400">Arrossega el teu vídeo a la zona de càrrega o fes clic per seleccionar-lo.</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200 mb-1">Anàlisi automàtica</p>
                  <p className="text-xs text-slate-400">L'aplicació extraurà frames i els analitzarà amb Gemini AI (triga 30-60 segons).</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200 mb-1">Explora els resultats</p>
                  <p className="text-xs text-slate-400">Veure objectes, persones, accions, text detectat i molt més.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-xs text-yellow-300">
              <strong>Formats suportats:</strong> MP4, AVI, MOV, MKV, WebM<br/>
              <strong>Mida màxima:</strong> ~500MB (limitat per la RAM del navegador)
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'projects',
      title: '📁 Projectes',
      icon: '📂',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Organitza amb projectes</h3>
          <p className="text-sm text-slate-300">
            Agrupa múltiples anàlisis de vídeo en projectes per mantenir-ho tot organitzat.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-lg">•</span>
              <p className="text-sm text-slate-300"><strong>Crear projecte:</strong> Fes clic a "Projectes" → "+ Nou"</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-lg">•</span>
              <p className="text-sm text-slate-300"><strong>Afegir vídeo:</strong> Selecciona un projecte abans de pujar el vídeo</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-lg">•</span>
              <p className="text-sm text-slate-300"><strong>Cerca global:</strong> Busca vídeos entre tots els projectes</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-lg">•</span>
              <p className="text-sm text-slate-300"><strong>Export/Import:</strong> Guarda els teus projectes en JSON</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: '⚡ Funcionalitats',
      icon: '✨',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Què pots fer?</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-200 mb-1">📊 Gràfics de confiança</p>
              <p className="text-xs text-slate-400">Visualitza les mètriques de detecció amb gràfics interactius.</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-200 mb-1">⚖️ Comparació de vídeos</p>
              <p className="text-xs text-slate-400">Compara 2 vídeos costat a costat amb mètriques detallades.</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-200 mb-1">⏱️ Timeline interactiva</p>
              <p className="text-xs text-slate-400">Passa el ratolí per veure thumbnails. Fes clic per saltar a moments.</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-200 mb-1">🔍 Cerca avançada</p>
              <p className="text-xs text-slate-400">Busca objectes, persones, text o accions dins de l'anàlisi.</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-200 mb-1">📥 Exportació professional</p>
              <p className="text-xs text-slate-400">Descarrega en JSON (màquines), TXT (text) o PDF (impressió).</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-200 mb-1">⚡ Cache intel·ligent</p>
              <p className="text-xs text-slate-400">Els vídeos repetits s'analitzen instantàniament (cache 30 dies).</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'export',
      title: '📥 Exportació',
      icon: '💾',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Exporta les teves anàlisis</h3>
          <p className="text-sm text-slate-300">
            Totes les exportacions inclouen dades estructurades amb timestamps precisos.
          </p>
          <div className="space-y-3">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-300 mb-1">📄 JSON</p>
              <p className="text-xs text-blue-200/80">Format estructurat per integració amb altres aplicacions. Ideal per APIs.</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-sm font-medium text-green-300 mb-1">📝 TXT</p>
              <p className="text-xs text-green-200/80">Informe formatat amb timeline d'esdeveniments. Fàcil de llegir.</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm font-medium text-red-300 mb-1">📕 PDF</p>
              <p className="text-xs text-red-200/80">Document professional per impressió amb capçalera i seccionat.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      title: '💡 Consells',
      icon: '🎯',
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-100">Consells i trucs</h3>
          <div className="space-y-3">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-200 mb-2">✅ Millors resultats</p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Vídeos amb bona il·luminació</li>
                <li>Càmera estable (sense moviment excessiu)</li>
                <li>Objectes i text clars i visibles</li>
                <li>Durada recomanada: 30 segons - 10 minuts</li>
              </ul>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-200 mb-2">⚡ Rendiment</p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Els vídeos curts s'analitzen més ràpid</li>
                <li>La cache estalvia temps (vídeos repetits = instantani)</li>
                <li>Resolucions altes → més detalls però més lent</li>
              </ul>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-200 mb-2">🌍 Idiomes</p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Canvia l'idioma d'anàlisi a Configuració → General</li>
                <li>7 idiomes disponibles: català, español, English...</li>
                <li>L'anàlisi es genera en l'idioma seleccionat</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📖</div>
              <h2 className="text-2xl font-bold text-slate-100">Guia d'usuari</h2>
            </div>
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

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-slate-900/50 border-r border-slate-700 p-4 overflow-y-auto">
            <nav className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span className="text-sm font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {sections.find(s => s.id === activeSection)?.content}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 border-t border-slate-700 p-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            💡 Per més ajuda, visita el nostre <a href="https://github.com/VCNPRO/annalysis_pro" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">GitHub</a>
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
