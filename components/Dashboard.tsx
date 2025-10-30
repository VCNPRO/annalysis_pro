// components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllProjects, getStorageStats } from '../services/projectsService';
import { getCacheStats } from '../services/cacheService';

interface DashboardProps {
  onNavigate: (view: 'upload' | 'projects' | 'comparison' | 'settings') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalVideos: 0,
    storageUsed: 0,
    cachedAnalyses: 0,
    analysisThisMonth: 0,
    analysisThisWeek: 0,
  });

  useEffect(() => {
    const storageStats = getStorageStats();
    const cacheStats = getCacheStats();
    const projects = getAllProjects();

    // Calculate analyses this month/week (mock data for now)
    const analysisThisMonth = projects.reduce((sum, p) => sum + p.videos.length, 0);
    const analysisThisWeek = Math.floor(analysisThisMonth * 0.3); // Mock: 30% this week

    setStats({
      totalProjects: storageStats.totalProjects,
      totalVideos: storageStats.totalVideos,
      storageUsed: storageStats.storageUsed,
      cachedAnalyses: cacheStats.totalEntries,
      analysisThisMonth,
      analysisThisWeek,
    });
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Mock data for charts
  const weeklyData = [
    { day: 'Dilluns', videos: 12 },
    { day: 'Dimarts', videos: 19 },
    { day: 'Dimecres', videos: 15 },
    { day: 'Dijous', videos: 25 },
    { day: 'Divendres', videos: 22 },
    { day: 'Dissabte', videos: 8 },
    { day: 'Diumenge', videos: 5 },
  ];

  const categoryData = [
    { name: 'Notícies', value: 35, color: '#3b82f6' },
    { name: 'Esports', value: 25, color: '#10b981' },
    { name: 'Entreteniment', value: 20, color: '#f59e0b' },
    { name: 'Documentals', value: 15, color: '#8b5cf6' },
    { name: 'Altres', value: 5, color: '#6b7280' },
  ];

  const recentActivity = [
    { id: 1, action: 'Vídeo analitzat', project: 'Notícies TN6', time: '5 min', icon: '✅' },
    { id: 2, action: 'Projecte creat', project: 'Esports Finals', time: '1 h', icon: '📁' },
    { id: 3, action: 'Exportació PDF', project: 'Documentals Nature', time: '2 h', icon: '📥' },
    { id: 4, action: 'Vídeo analitzat', project: 'Entrevistes VIP', time: '3 h', icon: '✅' },
    { id: 5, action: 'Comparació realitzada', project: 'Anàlisi A/B', time: '4 h', icon: '⚖️' },
  ];

  const [activeTab, setActiveTab] = React.useState<'overview' | 'stats' | 'activity'>('overview');

  return (
    <div className="space-y-3">
      {/* Tabs Navigation */}
      <div className="border-b border-slate-700">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            📊 Vista General
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'stats'
                ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            📈 Estadístiques
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'activity'
                ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            🕐 Activitat
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-blue-500 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs font-medium">Projectes</span>
            <span className="text-xl">📁</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalProjects}</div>
          <div className="text-xs text-slate-500">Total de projectes</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-green-500 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs font-medium">Vídeos</span>
            <span className="text-xl">🎬</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalVideos}</div>
          <div className="text-xs text-green-400">+{stats.analysisThisWeek} aquesta setmana</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-purple-500 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs font-medium">Cache</span>
            <span className="text-xl">💾</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.cachedAnalyses}</div>
          <div className="text-xs text-slate-500">Anàlisis en cache</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-orange-500 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs font-medium">Emmagatzematge</span>
            <span className="text-xl">📊</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{formatBytes(stats.storageUsed)}</div>
          <div className="text-xs text-slate-500">Espai utilitzat</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white mb-3">⚡ Accions ràpides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => onNavigate('upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 transition-colors flex flex-col items-center gap-1.5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-medium">Pujar vídeo</span>
          </button>

          <button
            onClick={() => onNavigate('projects')}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 transition-colors flex flex-col items-center gap-1.5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium">Nou projecte</span>
          </button>

          <button
            onClick={() => onNavigate('comparison')}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-3 transition-colors flex flex-col items-center gap-1.5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <span className="text-xs font-medium">Comparar</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-3 transition-colors flex flex-col items-center gap-1.5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium">Exportar dades</span>
          </button>
        </div>
      </div>

          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-white">API Status</span>
              </div>
              <div className="text-xs text-slate-400">Operacional · 99.9% uptime</div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-white">Model IA</span>
              </div>
              <div className="text-xs text-slate-400">Gemini 2.0 Flash · Actiu</div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs font-medium text-white">Cache</span>
              </div>
              <div className="text-xs text-slate-400">Optimitzada · 30 dies</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Analysis Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h2 className="text-lg font-bold text-white mb-3">📈 Anàlisis aquesta setmana</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="videos" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h2 className="text-lg font-bold text-white mb-3">🎯 Distribució per categoria</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h2 className="text-lg font-bold text-white mb-3">🕐 Activitat recent</h2>
            <div className="space-y-2">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{activity.icon}</span>
                <div>
                  <div className="text-xs font-medium text-white">{activity.action}</div>
                  <div className="text-xs text-slate-400">{activity.project}</div>
                </div>
              </div>
              <span className="text-xs text-slate-500">{activity.time}</span>
            </div>
          ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
