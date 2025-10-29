import React, { useState, useMemo } from 'react';
import { StructuredVideoAnalysis } from '../services/geminiService';

interface SearchAndExportProps {
  structuredAnalysis: StructuredVideoAnalysis | null;
  onSeekToResult: (timestamp: number) => void;
}

interface SearchResult {
  type: 'object' | 'person' | 'text' | 'action' | 'summary';
  content: string;
  timestamp?: number;
  confidence?: number;
}

const SearchAndExport: React.FC<SearchAndExportProps> = ({ structuredAnalysis, onSeekToResult }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>(['object', 'person', 'text', 'action']);

  // Indexar todo el contenido para búsqueda
  const searchableContent = useMemo(() => {
    if (!structuredAnalysis) return [];

    const results: SearchResult[] = [];

    // Summary
    results.push({
      type: 'summary',
      content: structuredAnalysis.summary,
    });

    // Objects
    try {
      const objects = JSON.parse(structuredAnalysis.objects);
      if (Array.isArray(objects)) {
        objects.forEach((obj: any) => {
          results.push({
            type: 'object',
            content: `${obj.name || 'Objecte'}: ${obj.description || ''}`,
            confidence: obj.confidence,
          });
        });
      }
    } catch (e) {}

    // People
    try {
      const people = JSON.parse(structuredAnalysis.people);
      if (people.actions && Array.isArray(people.actions)) {
        people.actions.forEach((action: string) => {
          results.push({
            type: 'person',
            content: action,
          });
        });
      }
    } catch (e) {}

    // Text content
    try {
      const textContent = JSON.parse(structuredAnalysis.textContent);
      if (Array.isArray(textContent)) {
        textContent.forEach((text: any) => {
          results.push({
            type: 'text',
            content: text.content || '',
            confidence: text.confidence,
          });
        });
      }
    } catch (e) {}

    // Actions
    try {
      const actions = JSON.parse(structuredAnalysis.actions);
      if (Array.isArray(actions)) {
        actions.forEach((action: any) => {
          results.push({
            type: 'action',
            content: action.description || '',
            timestamp: parseTimestamp(action.timestamp_approx),
            confidence: action.confidence,
          });
        });
      }
    } catch (e) {}

    return results;
  }, [structuredAnalysis]);

  const parseTimestamp = (timestamp: any): number | undefined => {
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp !== 'string') return undefined;

    const match = timestamp.match(/(\d+):(\d+)/);
    if (match) {
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    return undefined;
  };

  // Filtrar resultados
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return searchableContent.filter(result => {
      const matchesQuery = result.content.toLowerCase().includes(query);
      const matchesFilter = activeFilters.includes(result.type);
      return matchesQuery && matchesFilter;
    });
  }, [searchQuery, searchableContent, activeFilters]);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const exportAsJSON = () => {
    if (!structuredAnalysis) return;

    const dataStr = JSON.stringify(structuredAnalysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsText = () => {
    if (!structuredAnalysis) return;

    let text = '=== ANÀLISI DE VÍDEO ===\n\n';
    text += `RESUM:\n${structuredAnalysis.summary}\n\n`;

    try {
      const objects = JSON.parse(structuredAnalysis.objects);
      if (Array.isArray(objects) && objects.length > 0) {
        text += 'OBJECTES DETECTATS:\n';
        objects.forEach((obj: any) => {
          text += `- ${obj.name || 'Objecte'}: ${obj.description || ''}\n`;
        });
        text += '\n';
      }
    } catch (e) {}

    try {
      const actions = JSON.parse(structuredAnalysis.actions);
      if (Array.isArray(actions) && actions.length > 0) {
        text += 'ACCIONS:\n';
        actions.forEach((action: any) => {
          text += `- [${action.timestamp_approx || ''}] ${action.description || ''}\n`;
        });
        text += '\n';
      }
    } catch (e) {}

    try {
      const textContent = JSON.parse(structuredAnalysis.textContent);
      if (Array.isArray(textContent) && textContent.length > 0) {
        text += 'TEXT EN PANTALLA:\n';
        textContent.forEach((t: any) => {
          text += `- ${t.content || ''}\n`;
        });
      }
    } catch (e) {}

    const dataBlob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'object': return '🔷';
      case 'person': return '👤';
      case 'text': return '📝';
      case 'action': return '⚡';
      case 'summary': return '📄';
      default: return '•';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'object': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'person': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'text': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'action': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">🔍 Cerca i Exporta</h3>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca en l'anàlisi..."
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg className="absolute right-3 top-2.5 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'object', label: '🔷 Objectes' },
          { key: 'person', label: '👤 Persones' },
          { key: 'text', label: '📝 Text' },
          { key: 'action', label: '⚡ Accions' },
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => toggleFilter(filter.key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeFilters.includes(filter.key)
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <p className="text-xs text-slate-400">
            {filteredResults.length} coincidències trobades
          </p>
          {filteredResults.map((result, idx) => (
            <div
              key={idx}
              className={`p-3 bg-slate-900/50 rounded-lg border cursor-pointer hover:bg-slate-900 transition-colors ${
                result.timestamp !== undefined ? 'cursor-pointer' : ''
              }`}
              onClick={() => result.timestamp !== undefined && onSeekToResult(result.timestamp)}
            >
              <div className="flex items-start gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getTypeBadgeColor(result.type)}`}>
                  {getTypeIcon(result.type)} {result.type}
                </span>
                {result.timestamp !== undefined && (
                  <span className="text-xs text-blue-400 font-mono">
                    {Math.floor(result.timestamp / 60)}:{(result.timestamp % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-1">{result.content}</p>
              {result.confidence && (
                <p className="text-xs text-slate-500 mt-1">
                  Confiança: {(result.confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
          ))}
          {filteredResults.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              No s'han trobat coincidències
            </p>
          )}
        </div>
      )}

      {/* Export Buttons */}
      <div className="pt-4 border-t border-slate-700 space-y-2">
        <p className="text-xs text-slate-400 mb-2">Exportar resultats:</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={exportAsJSON}
            disabled={!structuredAnalysis}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            JSON
          </button>
          <button
            onClick={exportAsText}
            disabled={!structuredAnalysis}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            TXT
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchAndExport;
