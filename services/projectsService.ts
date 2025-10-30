// services/projectsService.ts
import { StructuredVideoAnalysis } from './geminiService';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  videos: VideoAnalysis[];
  tags?: string[];
}

export interface VideoAnalysis {
  id: string;
  videoFileName: string;
  videoDuration: number;
  uploadDate: string;
  analysis: StructuredVideoAnalysis;
  thumbnail?: string; // base64 image
  notes?: string;
}

const STORAGE_KEY = 'annalysis_projects';

/**
 * Get all projects from localStorage
 */
export function getAllProjects(): Project[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading projects:', e);
    return [];
  }
}

/**
 * Get project by ID
 */
export function getProject(projectId: string): Project | null {
  const projects = getAllProjects();
  return projects.find(p => p.id === projectId) || null;
}

/**
 * Create new project
 */
export function createProject(name: string, description?: string): Project {
  const projects = getAllProjects();

  const newProject: Project = {
    id: `project-${Date.now()}`,
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videos: [],
    tags: []
  };

  projects.push(newProject);
  saveProjects(projects);

  return newProject;
}

/**
 * Update project
 */
export function updateProject(projectId: string, updates: Partial<Project>): Project | null {
  const projects = getAllProjects();
  const index = projects.findIndex(p => p.id === projectId);

  if (index === -1) return null;

  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveProjects(projects);
  return projects[index];
}

/**
 * Delete project
 */
export function deleteProject(projectId: string): boolean {
  const projects = getAllProjects();
  const filtered = projects.filter(p => p.id !== projectId);

  if (filtered.length === projects.length) return false;

  saveProjects(filtered);
  return true;
}

/**
 * Add video analysis to project
 */
export function addVideoToProject(
  projectId: string,
  videoFileName: string,
  videoDuration: number,
  analysis: StructuredVideoAnalysis,
  thumbnail?: string,
  notes?: string
): VideoAnalysis | null {
  const projects = getAllProjects();
  const project = projects.find(p => p.id === projectId);

  if (!project) return null;

  const videoAnalysis: VideoAnalysis = {
    id: `video-${Date.now()}`,
    videoFileName,
    videoDuration,
    uploadDate: new Date().toISOString(),
    analysis,
    thumbnail,
    notes
  };

  project.videos.push(videoAnalysis);
  project.updatedAt = new Date().toISOString();

  saveProjects(projects);
  return videoAnalysis;
}

/**
 * Remove video from project
 */
export function removeVideoFromProject(projectId: string, videoId: string): boolean {
  const projects = getAllProjects();
  const project = projects.find(p => p.id === projectId);

  if (!project) return false;

  const initialLength = project.videos.length;
  project.videos = project.videos.filter(v => v.id !== videoId);

  if (project.videos.length === initialLength) return false;

  project.updatedAt = new Date().toISOString();
  saveProjects(projects);
  return true;
}

/**
 * Get video from project
 */
export function getVideoFromProject(projectId: string, videoId: string): VideoAnalysis | null {
  const project = getProject(projectId);
  if (!project) return null;

  return project.videos.find(v => v.id === videoId) || null;
}

/**
 * Search videos across all projects
 */
export function searchVideos(query: string): { project: Project; video: VideoAnalysis }[] {
  const projects = getAllProjects();
  const results: { project: Project; video: VideoAnalysis }[] = [];

  const lowerQuery = query.toLowerCase();

  projects.forEach(project => {
    project.videos.forEach(video => {
      // Search in filename, notes, and summary
      const searchableText = [
        video.videoFileName,
        video.notes || '',
        video.analysis.summary
      ].join(' ').toLowerCase();

      if (searchableText.includes(lowerQuery)) {
        results.push({ project, video });
      }
    });
  });

  return results;
}

/**
 * Get recent videos across all projects
 */
export function getRecentVideos(limit: number = 10): { project: Project; video: VideoAnalysis }[] {
  const projects = getAllProjects();
  const allVideos: { project: Project; video: VideoAnalysis }[] = [];

  projects.forEach(project => {
    project.videos.forEach(video => {
      allVideos.push({ project, video });
    });
  });

  // Sort by upload date (newest first)
  allVideos.sort((a, b) =>
    new Date(b.video.uploadDate).getTime() - new Date(a.video.uploadDate).getTime()
  );

  return allVideos.slice(0, limit);
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
  totalProjects: number;
  totalVideos: number;
  storageUsed: number; // in bytes
  oldestProject?: string;
  newestProject?: string;
} {
  const projects = getAllProjects();
  const totalVideos = projects.reduce((sum, p) => sum + p.videos.length, 0);

  const data = localStorage.getItem(STORAGE_KEY);
  const storageUsed = data ? new Blob([data]).size : 0;

  const dates = projects.map(p => new Date(p.createdAt).getTime());

  return {
    totalProjects: projects.length,
    totalVideos,
    storageUsed,
    oldestProject: dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : undefined,
    newestProject: dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : undefined
  };
}

/**
 * Export all projects as JSON
 */
export function exportAllProjects(): string {
  const projects = getAllProjects();
  return JSON.stringify(projects, null, 2);
}

/**
 * Import projects from JSON
 */
export function importProjects(jsonData: string): boolean {
  try {
    const projects = JSON.parse(jsonData);
    if (!Array.isArray(projects)) return false;

    // Validate structure
    const valid = projects.every(p =>
      p.id && p.name && p.createdAt && Array.isArray(p.videos)
    );

    if (!valid) return false;

    saveProjects(projects);
    return true;
  } catch (e) {
    console.error('Error importing projects:', e);
    return false;
  }
}

/**
 * Clear all projects (with confirmation)
 */
export function clearAllProjects(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Error clearing projects:', e);
    return false;
  }
}

/**
 * Save projects to localStorage
 */
function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving projects:', e);
    // Handle quota exceeded
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      alert('Espai d\'emmagatzematge exhaurit. Si us plau, esborra projectes antics.');
    }
  }
}
