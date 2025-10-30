// constants.ts

export const GEMINI_MODEL_NAME = 'gemini-2.5-pro'; // S'ha actualitzat a un model més potent

// Get API_KEY - Priority: environment variable (shared) > localStorage (personal)
export const getApiKey = (): string | null => {
  // 1. Check if there's a shared API key from environment variables (Vercel)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'undefined' && envKey.trim() !== '') {
    return envKey;
  }

  // 2. If no shared key, check localStorage for user's personal key
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('gemini_api_key');
    if (localKey && localKey.trim() !== '') {
      return localKey;
    }
  }

  return null;
};

export const setApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_api_key', apiKey);
  }
};

export const API_KEY = getApiKey() || '';

// Configuració per a l'extracció de frames del costat del client
export const FRAME_EXTRACTION_CONFIG = {
  numFrames: 10, // S'han augmentat els frames a extreure per a una millor representació del vídeo
  intervalSeconds: -1, // S'indica que l'interval es calcularà dinàmicament
  maxSize: 1536, // Ample/alt màxim per als frames extrets (increased for better quality)
};

// Analysis language settings
export const ANALYSIS_LANGUAGES = {
  ca: { name: 'Català', prompt: 'en català' },
  es: { name: 'Español', prompt: 'en español' },
  en: { name: 'English', prompt: 'in English' },
  fr: { name: 'Français', prompt: 'en français' },
  de: { name: 'Deutsch', prompt: 'auf Deutsch' },
  it: { name: 'Italiano', prompt: 'in italiano' },
  pt: { name: 'Português', prompt: 'em português' }
};

export function getAnalysisLanguage(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('analysis_language') || 'ca';
  }
  return 'ca';
}

export function setAnalysisLanguage(lang: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('analysis_language', lang);
  }
}
