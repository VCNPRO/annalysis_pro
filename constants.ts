// constants.ts

export const GEMINI_MODEL_NAME = 'gemini-2.5-pro'; // S'ha actualitzat a un model més potent

// Get API_KEY from localStorage instead of environment variable
export const getApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key');
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
  maxSize: 600, // Ample/alt màxim per als frames extrets
};
