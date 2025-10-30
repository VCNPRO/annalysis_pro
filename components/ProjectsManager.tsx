// components/ProjectsManager.tsx
import React, { useState, useEffect } from 'react';
import {
  getAllProjects,
  createProject,
  deleteProject,
  updateProject,
  getStorageStats,
  Project
} from '../services/projectsService';

interface ProjectsManagerProps {
  currentProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onLoadVideo: (project: Project, videoId: string) => void;
}

const ProjectsManager: React.FC<ProjectsManagerProps> = ({
  currentProjectId,
  onSelectProject,
  onLoadVideo
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState<ReturnType<typeof getStorageStats> | null>(null);

  useEffect(() => {
    loadProjects();
    loadStats();
  }, []);

  const loadProjects = () => {
    const allProjects = getAllProjects();
    setProjects(allProjects);
  };

  const loadStats = () => {
    const stats = getStorageStats();
    setStorageStats(stats);
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      alert('El nom del projecte és obligatori');
      return;
    }

    const newProject = createProject(newProjectName.trim(), newProjectDesc.trim() || undefined);
    setProjects([...projects, newProject]);
    setNewProjectName('');
    setNewProjectDesc('');
    setIsCreateModalOpen(false);
    onSelectProject(newProject.id);
    loadStats();
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (confirm(`Segur que vols esborrar el projecte "${projectName}"?`)) {
      deleteProject(projectId);
      loadProjects();
      loadStats();
      if (currentProjectId === projectId) {
        onSelectProject(null);
      }
    }
  };

  const toggleExpanded = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('ca-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-100">📁 Els meus projectes</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Nou
          </button>
        </div>

        {/* Storage Stats */}
        {storageStats && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-900/50 rounded p-2">
              <div className="text-slate-500">Projectes</div>
              <div className="text-slate-200 font-semibold">{storageStats.totalProjects}</div>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <div className="text-slate-500">Vídeos</div>
              <div className="text-slate-200 font-semibold">{storageStats.totalVideos}</div>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <div className="text-slate-500">Espai</div>
              <div className="text-slate-200 font-semibold">{formatBytes(storageStats.storageUsed)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-slate-400 text-sm">Cap projecte encara</p>
            <p className="text-slate-500 text-xs mt-1">Crea el teu primer projecte per organitzar vídeos</p>
          </div>
        ) : (
          projects.map(project => (
            <div
              key={project.id}
              className={`rounded-lg border transition-all ${
                currentProjectId === project.id
                  ? 'bg-blue-900/20 border-blue-500/50'
                  : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              {/* Project Header */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectProject(project.id)}
                  >
                    <h3 className="text-sm font-semibold text-slate-100 mb-1">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-slate-400 mb-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>📹 {project.videos.length} vídeos</span>
                      <span>📅 {formatDate(project.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleExpanded(project.id)}
                      className="p-1 hover:bg-slate-700 rounded transition-colors"
                      title="Mostrar vídeos"
                    >
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          expandedProjectId === project.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="p-1 hover:bg-red-600/20 rounded transition-colors"
                      title="Esborrar projecte"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Videos List (Expandable) */}
              {expandedProjectId === project.id && project.videos.length > 0 && (
                <div className="border-t border-slate-700 p-2 space-y-1">
                  {project.videos.map(video => (
                    <div
                      key={video.id}
                      onClick={() => onLoadVideo(project, video.id)}
                      className="flex items-center gap-2 p-2 bg-slate-900/50 hover:bg-slate-900 rounded cursor-pointer transition-colors"
                    >
                      {/* Thumbnail */}
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.videoFileName}
                          className="w-16 h-9 object-cover rounded border border-slate-700"
                        />
                      ) : (
                        <div className="w-16 h-9 bg-slate-800 rounded border border-slate-700 flex items-center justify-center">
                          <span className="text-xs text-slate-500">🎬</span>
                        </div>
                      )}

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">
                          {video.videoFileName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>⏱️ {formatDuration(video.videoDuration)}</span>
                          <span>📅 {formatDate(video.uploadDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Crear nou projecte</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom del projecte *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ex: Anàlisi de seguretat"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripció (opcional)
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Afegeix detalls sobre aquest projecte..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewProjectName('');
                  setNewProjectDesc('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancel·lar
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsManager;
