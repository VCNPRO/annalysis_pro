// constants.ts

export const GEMINI_MODEL_NAME = 'gemini-2.5-pro'; // S'ha actualitzat a un model més potent
export const API_KEY = process.env.API_KEY || '';

// Configuració per a l'extracció de frames del costat del client
export const FRAME_EXTRACTION_CONFIG = {
  numFrames: 10, // S'han augmentat els frames a extreure per a una millor representació del vídeo
  intervalSeconds: -1, // S'indica que l'interval es calcularà dinàmicament
  maxSize: 600, // Ample/alt màxim per als frames extrets
};
