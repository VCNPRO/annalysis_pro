// services/videoProcessing.ts
import { FrameExtractionConfig } from '../types';

/**
 * Extreu frames d'un fitxer de vídeo com a imatges PNG codificades en base64.
 * @param videoFile El fitxer de vídeo a processar.
 * @param config Configuració per a l'extracció de frames.
 * @returns Una promesa que es resol a un array de cadenes d'imatges codificades en base64.
 */
export const extractFrames = (
  videoFile: File,
  config: FrameExtractionConfig,
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.autoplay = true; // Autoplay per carregar dades de vídeo
    video.src = URL.createObjectURL(videoFile);

    const frames: string[] = [];
    let timestampsToCapture: number[] = [];
    let currentCaptureIndex = 0;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src); // Alliberar URL de l'objecte un cop les metadades s'han carregat
      const duration = video.duration;

      if (duration === 0 || !isFinite(duration)) {
        reject(new Error("No s'han pogut carregar les metadades del vídeo o la durada és zero."));
        return;
      }

      // Calcular marques de temps espaiades uniformement
      if (config.numFrames > 0) {
        const step = duration / (config.numFrames + 1); // +1 per evitar el darrer segon si és molt curt
        for (let i = 1; i <= config.numFrames; i++) {
          timestampsToCapture.push(Math.min(i * step, duration - 0.1)); // Assegurar-se que no superi la durada i evitar el final exacte
        }
      } else {
        reject(new Error("El nombre de frames a extreure ha de ser major que 0."));
        return;
      }

      const captureNextFrame = () => {
        if (currentCaptureIndex >= timestampsToCapture.length) {
          video.pause();
          resolve(frames);
          return;
        }

        const timestamp = timestampsToCapture[currentCaptureIndex];
        video.currentTime = timestamp;
      };

      video.onseeked = () => {
        // Un cop el vídeo s'ha cercat a la marca de temps, capturem el frame
        const canvas = document.createElement('canvas');
        let width = video.videoWidth;
        let height = video.videoHeight;

        // Redimensionar si és necessari, mantenint la relació d'aspecte
        if (width > config.maxSize || height > config.maxSize) {
          const aspectRatio = width / height;
          if (width > height) {
            width = config.maxSize;
            height = Math.round(width / aspectRatio);
          } else {
            height = config.maxSize;
            width = Math.round(height * aspectRatio);
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("No s'ha pogut obtenir el context 2D del canvas."));
          return;
        }
        ctx.drawImage(video, 0, 0, width, height);
        frames.push(canvas.toDataURL('image/png'));

        currentCaptureIndex++;
        captureNextFrame(); // Capturar el següent frame
      };

      video.onerror = (e) => {
        console.error('Error de vídeo:', e);
        reject(new Error('Ha fallat la càrrega del vídeo o l\'extracció de frames.'));
      };

      // Començar la seqüència de captura
      captureNextFrame();
    };

    video.onended = () => {
        // En cas que el vídeo acabi abans de capturar tots els frames previstos
        resolve(frames);
    };

    video.onerror = (e) => {
      console.error('Error de càrrega del vídeo:', e);
      reject(new Error('Ha fallat la càrrega del vídeo o l\'extracció de frames.'));
    };
  });
};
