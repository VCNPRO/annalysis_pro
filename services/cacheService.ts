// services/cacheService.ts
import { StructuredVideoAnalysis } from './geminiService';

interface CachedAnalysis {
  videoHash: string;
  videoFileName: string;
  videoSize: number;
  videoDuration: number;
  analysis: StructuredVideoAnalysis;
  cachedAt: string;
  expiresAt: string;
}

const CACHE_KEY = 'annalysis_cache';
const CACHE_DURATION_DAYS = 30; // Cache lasts 30 days

/**
 * Generate a simple hash for a video file based on name, size, and modified date
 */
export async function generateVideoHash(file: File): Promise<string> {
  const data = `${file.name}-${file.size}-${file.lastModified}`;

  // Use browser's SubtleCrypto if available
  if (window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (e) {
      // Fallback to simple hash
      console.warn('SubtleCrypto not available, using fallback hash');
    }
  }

  // Fallback: simple string hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get all cached analyses from localStorage
 */
function getAllCached(): CachedAnalysis[] {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading cache:', e);
    return [];
  }
}

/**
 * Save cached analyses to localStorage
 */
function saveCached(cached: CachedAnalysis[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (e) {
    console.error('Error saving cache:', e);
    // If quota exceeded, clear oldest entries
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.log('Cache quota exceeded, clearing old entries...');
      clearOldCache(7); // Keep only last 7 days
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      } catch (e2) {
        console.error('Failed to save cache even after clearing:', e2);
      }
    }
  }
}

/**
 * Get cached analysis for a video file
 * Returns null if not found or expired
 */
export async function getCachedAnalysis(file: File): Promise<StructuredVideoAnalysis | null> {
  const hash = await generateVideoHash(file);
  const cached = getAllCached();

  const entry = cached.find(c => c.videoHash === hash);

  if (!entry) {
    return null;
  }

  // Check if expired
  const now = new Date();
  const expiresAt = new Date(entry.expiresAt);

  if (now > expiresAt) {
    console.log('Cache expired for:', file.name);
    // Remove expired entry
    const filtered = cached.filter(c => c.videoHash !== hash);
    saveCached(filtered);
    return null;
  }

  console.log('Cache hit for:', file.name);
  return entry.analysis;
}

/**
 * Cache an analysis for a video file
 */
export async function cacheAnalysis(
  file: File,
  analysis: StructuredVideoAnalysis,
  videoDuration: number
): Promise<void> {
  const hash = await generateVideoHash(file);
  const cached = getAllCached();

  // Remove existing entry if any
  const filtered = cached.filter(c => c.videoHash !== hash);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const newEntry: CachedAnalysis = {
    videoHash: hash,
    videoFileName: file.name,
    videoSize: file.size,
    videoDuration,
    analysis,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  filtered.push(newEntry);
  saveCached(filtered);

  console.log('Cached analysis for:', file.name);
}

/**
 * Clear all cached analyses
 */
export function clearAllCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('Cache cleared');
  } catch (e) {
    console.error('Error clearing cache:', e);
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): number {
  const cached = getAllCached();
  const now = new Date();

  const valid = cached.filter(entry => {
    const expiresAt = new Date(entry.expiresAt);
    return now <= expiresAt;
  });

  const removedCount = cached.length - valid.length;

  if (removedCount > 0) {
    saveCached(valid);
    console.log(`Removed ${removedCount} expired cache entries`);
  }

  return removedCount;
}

/**
 * Clear cache entries older than specified days
 */
export function clearOldCache(daysToKeep: number): number {
  const cached = getAllCached();
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - daysToKeep * 24 * 60 * 60 * 1000);

  const recent = cached.filter(entry => {
    const cachedAt = new Date(entry.cachedAt);
    return cachedAt >= cutoffDate;
  });

  const removedCount = cached.length - recent.length;

  if (removedCount > 0) {
    saveCached(recent);
    console.log(`Removed ${removedCount} old cache entries`);
  }

  return removedCount;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalEntries: number;
  totalSize: number;
  oldestEntry?: string;
  newestEntry?: string;
  expiringCount: number;
} {
  const cached = getAllCached();

  const totalSize = (() => {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? new Blob([data]).size : 0;
    } catch {
      return 0;
    }
  })();

  const dates = cached.map(c => new Date(c.cachedAt).getTime());
  const now = new Date();
  const soonDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  const expiringCount = cached.filter(entry => {
    const expiresAt = new Date(entry.expiresAt);
    return expiresAt <= soonDate && expiresAt > now;
  }).length;

  return {
    totalEntries: cached.length,
    totalSize,
    oldestEntry: dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : undefined,
    newestEntry: dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : undefined,
    expiringCount
  };
}

/**
 * Get list of all cached videos
 */
export function getCachedVideos(): Array<{
  videoFileName: string;
  videoSize: number;
  videoDuration: number;
  cachedAt: string;
  expiresAt: string;
}> {
  const cached = getAllCached();
  return cached.map(entry => ({
    videoFileName: entry.videoFileName,
    videoSize: entry.videoSize,
    videoDuration: entry.videoDuration,
    cachedAt: entry.cachedAt,
    expiresAt: entry.expiresAt
  }));
}

/**
 * Remove specific cached video by filename and size
 */
export async function removeCachedVideo(fileName: string, fileSize: number): Promise<boolean> {
  const cached = getAllCached();
  const filtered = cached.filter(c => !(c.videoFileName === fileName && c.videoSize === fileSize));

  if (filtered.length < cached.length) {
    saveCached(filtered);
    console.log('Removed cached entry for:', fileName);
    return true;
  }

  return false;
}

// Auto-clear expired cache on module load
clearExpiredCache();
