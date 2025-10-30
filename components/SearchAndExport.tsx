import React, { useState, useMemo } from 'react';
import { StructuredVideoAnalysis } from '../services/geminiService';
import { enrichAnalysisData, exportAsJSON, exportAsTXT, exportAsPDF } from '../services/exportService';

interface SearchAndExportProps {
  structuredAnalysis: StructuredVideoAnalysis | null;
  onSeekToResult: (timestamp: number) => void;
  videoFileName: string;
  videoDuration: number;
}

interface SearchResult {
  type: 'object' | 'person' | 'text' | 'action' | 'summary';
  content: string;
  timestamp?: number;
  confidence?: number;
}

const SearchAndExport: React.FC<SearchAndExportProps> = ({ structuredAnalysis, onSeekToResult, videoFileName, videoDuration }) => {
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

  const handleExportJSON = () => {
    if (!structuredAnalysis) return;
    const enrichedData = enrichAnalysisData(structuredAnalysis, videoFileName, videoDuration);
    exportAsJSON(enrichedData);
  };

  const handleExportTXT = () => {
    if (!structuredAnalysis) return;
    const enrichedData = enrichAnalysisData(structuredAnalysis, videoFileName, videoDuration);
    exportAsTXT(enrichedData);
  };

  const handleExportPDF = () => {
    if (!structuredAnalysis) return;
    const enrichedData = enrichAnalysisData(structuredAnalysis, videoFileName, videoDuration);
    exportAsPDF(enrichedData);
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
    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-3">
      <h3 className="text-sm font-semibold text-slate-100">🔍 Cerca i Exporta</h3>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca en l'anàlisi..."
          className="w-full px-3 py-1.5 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg className="absolute right-2.5 top-2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { key: 'object', label: '🔷 Objectes' },
          { key: 'person', label: '👤 Persones' },
          { key: 'text', label: '📝 Text' },
          { key: 'action', label: '⚡ Accions' },
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => toggleFilter(filter.key)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
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
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          <p className="text-xs text-slate-400">
            {filteredResults.length} coincidències trobades
          </p>
          {filteredResults.map((result, idx) => (
            <div
              key={idx}
              className={`p-2 bg-slate-900/50 rounded-lg border cursor-pointer hover:bg-slate-900 transition-colors ${
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
      <div className="pt-3 border-t border-slate-700 space-y-2">
        <p className="text-xs text-slate-400 mb-1.5">📥 Exportar resultats:</p>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={handleExportJSON}
            disabled={!structuredAnalysis}
            className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            title="Exportar com a JSON estructurat amb metadades completes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            JSON
          </button>
          <button
            onClick={handleExportTXT}
            disabled={!structuredAnalysis}
            className="px-2 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            title="Exportar com a text formatat amb timeline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            TXT
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!structuredAnalysis}
            className="px-2 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            title="Exportar com a PDF professional per impressió"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          ✨ Totes les exportacions inclouen metadades, estadístiques i timestamps
        </p>
      </div>
    </div>
  );
};

export default SearchAndExport;
