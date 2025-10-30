// services/videoProcessing.ts
import { FrameExtractionConfig } from '../types';

/**
 * Determine optimal quality based on video resolution and duration
 */
function getAdaptiveQuality(width: number, height: number, duration: number): number {
  const pixels = width * height;
  const is4K = pixels >= 3840 * 2160;
  const isHD = pixels >= 1920 * 1080;
  const isLongVideo = duration > 300; // 5 minutes

  // Higher compression for larger/longer videos to reduce API payload
  if (is4K) return 0.6;
  if (isHD && isLongVideo) return 0.7;
  if (isHD) return 0.75;
  return 0.8;
}

/**
 * Determine optimal frame count based on video duration
 */
function getAdaptiveFrameCount(duration: number): number {
  if (duration <= 30) return 5;      // Very short: 5 frames
  if (duration <= 60) return 8;      // Short: 8 frames
  if (duration <= 180) return 10;    // Medium: 10 frames
  if (duration <= 600) return 12;    // Long: 12 frames
  return 15;                         // Very long: 15 frames
}

/**
 * Extreu frames d'un fitxer de vídeo amb qualitat adaptativa.
 * @param videoFile El fitxer de vídeo a processar.
 * @param config Configuració per a l'extracció de frames.
 * @param onProgress Callback opcional per reportar progrés (0-100)
 * @returns Una promesa que es resol a un array de cadenes d'imatges codificades en base64.
 */
export const extractFrames = (
  videoFile: File,
  config: FrameExtractionConfig,
  onProgress?: (progress: number) => void
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
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (duration === 0 || !isFinite(duration)) {
        URL.revokeObjectURL(video.src);
        reject(new Error("No s'han pogut carregar les metadades del vídeo o la durada és zero."));
        return;
      }

      // Adaptive frame count based on duration
      const adaptiveFrameCount = config.numFrames || getAdaptiveFrameCount(duration);

      console.log(`📹 Vídeo: ${width}x${height}, ${duration.toFixed(1)}s → ${adaptiveFrameCount} frames`);

      // Calcular marques de temps espaiades uniformement
      if (adaptiveFrameCount > 0) {
        const step = duration / (adaptiveFrameCount + 1);
        for (let i = 1; i <= adaptiveFrameCount; i++) {
          timestampsToCapture.push(Math.min(i * step, duration - 0.1));
        }
      } else {
        URL.revokeObjectURL(video.src);
        reject(new Error("El nombre de frames a extreure ha de ser major que 0."));
        return;
      }

      const captureNextFrame = () => {
        if (currentCaptureIndex >= timestampsToCapture.length) {
          video.pause();
          URL.revokeObjectURL(video.src); // Clean up
          console.log(`✅ Extrets ${frames.length} frames`);
          resolve(frames);
          return;
        }

        const timestamp = timestampsToCapture[currentCaptureIndex];
        video.currentTime = timestamp;
      };

      video.onseeked = () => {
        try {
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

          // Draw frame to canvas
          ctx.drawImage(video, 0, 0, width, height);

          // Adaptive quality based on resolution and duration
          const quality = getAdaptiveQuality(video.videoWidth, video.videoHeight, video.duration);

          // Use JPEG for better compression (PNG is too large for API)
          const frameData = canvas.toDataURL('image/jpeg', quality);
          frames.push(frameData);

          // Report progress
          const progress = Math.round(((currentCaptureIndex + 1) / timestampsToCapture.length) * 100);
          if (onProgress) onProgress(progress);

          currentCaptureIndex++;
          captureNextFrame(); // Capturar el següent frame
        } catch (error) {
          console.error('Error capturing frame:', error);
          // Continue with next frame even if one fails
          currentCaptureIndex++;
          captureNextFrame();
        }
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
