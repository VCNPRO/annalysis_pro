// types.ts

/**
 * Representa el resultat d'una operació d'anàlisi de vídeo.
 */
export interface VideoAnalysisResult {
  frames: string[]; // Cadenes d'imatges codificades en Base64 dels frames extrets
}

/**
 * Representa l'estat d'una operació asíncrona.
 */
export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

/**
 * Representa la configuració per a l'extracció de frames.
 */
export interface FrameExtractionConfig {
  numFrames: number;
  intervalSeconds: number; // Interval entre frames en segons (s'usa per a lògiques antigues o si es vol fixe)
  maxSize: number; // Mida màxima per al costat més llarg de la imatge en píxels
}
