import React, { useMemo } from 'react';
import { StructuredVideoAnalysis } from '../services/geminiService';

interface AnalysisStatsProps {
  structuredAnalysis: StructuredVideoAnalysis | null;
  duration: number;
}

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

const AnalysisStats: React.FC<AnalysisStatsProps> = ({ structuredAnalysis, duration }) => {
  const stats = useMemo(() => {
    if (!structuredAnalysis) return [];

    const items: StatItem[] = [];

    // Duration
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    items.push({
      label: 'Durada',
      value: `${mins}:${secs.toString().padStart(2, '0')}`,
      icon: '⏱️',
      color: 'text-blue-400'
    });

    // Objects count
    try {
      const objects = JSON.parse(structuredAnalysis.objects);
      if (Array.isArray(objects)) {
        items.push({
          label: 'Objectes',
          value: objects.length,
          icon: '🔷',
          color: 'text-blue-400'
        });
      }
    } catch (e) {}

    // People count
    try {
      const people = JSON.parse(structuredAnalysis.people);
      if (people.count) {
        items.push({
          label: 'Persones',
          value: people.count,
          icon: '👤',
          color: 'text-green-400'
        });
      } else if (people.actions && Array.isArray(people.actions)) {
        items.push({
          label: 'Accions de persones',
          value: people.actions.length,
          icon: '👤',
          color: 'text-green-400'
        });
      }
    } catch (e) {}

    // Text elements
    try {
      const textContent = JSON.parse(structuredAnalysis.textContent);
      if (Array.isArray(textContent)) {
        items.push({
          label: 'Elements de text',
          value: textContent.length,
          icon: '📝',
          color: 'text-yellow-400'
        });
      }
    } catch (e) {}

    // Actions count
    try {
      const actions = JSON.parse(structuredAnalysis.actions);
      if (Array.isArray(actions)) {
        items.push({
          label: 'Accions',
          value: actions.length,
          icon: '⚡',
          color: 'text-red-400'
        });
      }
    } catch (e) {}

    // Image quality
    try {
      const technical = JSON.parse(structuredAnalysis.technicalAspects);
      if (technical.image_quality) {
        items.push({
          label: 'Qualitat',
          value: technical.image_quality,
          icon: '🎨',
          color: 'text-purple-400'
        });
      }
    } catch (e) {}

    // Lighting
    try {
      const technical = JSON.parse(structuredAnalysis.technicalAspects);
      if (technical.lighting) {
        items.push({
          label: 'Il·luminació',
          value: technical.lighting,
          icon: '💡',
          color: 'text-yellow-400'
        });
      }
    } catch (e) {}

    return items;
  }, [structuredAnalysis, duration]);

  if (!structuredAnalysis) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <p className="text-sm text-slate-500 text-center">Sense dades estadístiques</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-md p-2 border border-slate-700">
      <h3 className="text-xs font-semibold text-slate-100 mb-2">📊 Estadístiques</h3>

      <div className="grid grid-cols-2 gap-1.5">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-slate-900/50 rounded p-1.5 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-sm">{stat.icon}</span>
              <span className="text-xs text-slate-400">{stat.label}</span>
            </div>
            <p className={`text-xs font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Summary preview */}
      {structuredAnalysis.summary && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <h4 className="text-xs font-semibold text-slate-400 mb-1">RESUM</h4>
          <p className="text-xs text-slate-300 line-clamp-2 leading-snug">
            {structuredAnalysis.summary}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalysisStats;
