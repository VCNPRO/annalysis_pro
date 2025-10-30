// components/ConfidenceCharts.tsx
import React, { useMemo } from 'react';
import { StructuredVideoAnalysis } from '../services/geminiService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface ConfidenceChartsProps {
  structuredAnalysis: StructuredVideoAnalysis | null;
}

const ConfidenceCharts: React.FC<ConfidenceChartsProps> = ({ structuredAnalysis }) => {
  // Parse and aggregate confidence data
  const chartsData = useMemo(() => {
    if (!structuredAnalysis) return null;

    // Objects confidence
    let objectsData: { name: string; confidence: number }[] = [];
    try {
      const objects = JSON.parse(structuredAnalysis.objects);
      if (Array.isArray(objects)) {
        objectsData = objects
          .filter((obj: any) => obj.confidence !== undefined)
          .map((obj: any) => ({
            name: obj.name || 'Objecte',
            confidence: (obj.confidence * 100).toFixed(0)
          }))
          .slice(0, 10); // Top 10
      }
    } catch (e) {}

    // Text content confidence
    let textConfidenceData: { name: string; confidence: number }[] = [];
    try {
      const textContent = JSON.parse(structuredAnalysis.textContent);
      if (Array.isArray(textContent)) {
        textConfidenceData = textContent
          .filter((text: any) => text.confidence !== undefined)
          .map((text: any, idx: number) => ({
            name: `Text ${idx + 1}`,
            confidence: (text.confidence * 100).toFixed(0)
          }))
          .slice(0, 8);
      }
    } catch (e) {}

    // Actions confidence
    let actionsData: { name: string; confidence: number }[] = [];
    try {
      const actions = JSON.parse(structuredAnalysis.actions);
      if (Array.isArray(actions)) {
        actionsData = actions
          .filter((action: any) => action.confidence !== undefined)
          .map((action: any, idx: number) => ({
            name: action.description?.substring(0, 20) || `Acció ${idx + 1}`,
            confidence: (action.confidence * 100).toFixed(0)
          }))
          .slice(0, 8);
      }
    } catch (e) {}

    // Average confidence by category
    const averages = {
      objects: objectsData.length > 0
        ? objectsData.reduce((sum, item) => sum + Number(item.confidence), 0) / objectsData.length
        : 0,
      text: textConfidenceData.length > 0
        ? textConfidenceData.reduce((sum, item) => sum + Number(item.confidence), 0) / textConfidenceData.length
        : 0,
      actions: actionsData.length > 0
        ? actionsData.reduce((sum, item) => sum + Number(item.confidence), 0) / actionsData.length
        : 0
    };

    const categoryData = [
      { name: 'Objectes', value: Number(averages.objects.toFixed(0)) },
      { name: 'Text', value: Number(averages.text.toFixed(0)) },
      { name: 'Accions', value: Number(averages.actions.toFixed(0)) }
    ].filter(item => item.value > 0);

    // Confidence distribution (histogram)
    const allConfidences = [
      ...objectsData.map(d => Number(d.confidence)),
      ...textConfidenceData.map(d => Number(d.confidence)),
      ...actionsData.map(d => Number(d.confidence))
    ];

    const distributionData = [
      { range: '0-20%', count: allConfidences.filter(c => c <= 20).length },
      { range: '21-40%', count: allConfidences.filter(c => c > 20 && c <= 40).length },
      { range: '41-60%', count: allConfidences.filter(c => c > 40 && c <= 60).length },
      { range: '61-80%', count: allConfidences.filter(c => c > 60 && c <= 80).length },
      { range: '81-100%', count: allConfidences.filter(c => c > 80).length }
    ];

    return {
      objectsData,
      textConfidenceData,
      actionsData,
      categoryData,
      distributionData,
      hasData: objectsData.length > 0 || textConfidenceData.length > 0 || actionsData.length > 0
    };
  }, [structuredAnalysis]);

  if (!chartsData || !chartsData.hasData) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">📊 Gràfics de Confiança</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-slate-400 text-sm">No hi ha dades de confiança disponibles</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-6">
      <h3 className="text-lg font-semibold text-slate-100">📊 Gràfics de Confiança</h3>

      {/* Category Averages - Pie Chart */}
      {chartsData.categoryData.length > 0 && (
        <div className="bg-slate-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Confiança Mitjana per Categoria</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartsData.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {chartsData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value: any) => [`${value}%`, 'Confiança']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Objects Confidence - Bar Chart */}
      {chartsData.objectsData.length > 0 && (
        <div className="bg-slate-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">🔷 Confiança d'Objectes Detectats</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartsData.objectsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#94a3b8' }}
                label={{ value: 'Confiança (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value: any) => [`${value}%`, 'Confiança']}
              />
              <Bar dataKey="confidence" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Actions Confidence - Line Chart */}
      {chartsData.actionsData.length > 0 && (
        <div className="bg-slate-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">⚡ Confiança d'Accions Detectades</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartsData.actionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value: any) => [`${value}%`, 'Confiança']}
              />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Confidence Distribution - Histogram */}
      {chartsData.distributionData.some(d => d.count > 0) && (
        <div className="bg-slate-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">📈 Distribució de Confiança</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartsData.distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="range" tick={{ fill: '#94a3b8' }} />
              <YAxis
                tick={{ fill: '#94a3b8' }}
                label={{ value: 'Comptador', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value: any) => [value, 'Deteccions']}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Text Confidence - Bar Chart */}
      {chartsData.textConfidenceData.length > 0 && (
        <div className="bg-slate-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">📝 Confiança de Text Detectat</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartsData.textConfidenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value: any) => [`${value}%`, 'Confiança']}
              />
              <Bar dataKey="confidence" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="text-xs text-slate-500 text-center mt-4">
        💡 Els gràfics mostren les mètriques de confiança de les deteccions de Gemini AI
      </div>
    </div>
  );
};

export default ConfidenceCharts;
