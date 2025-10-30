// services/thumbnailService.ts

/**
 * Extract thumbnail from video file as base64 string
 * @param videoFile The video file
 * @param timeInSeconds Time position to extract (default: 1 second)
 * @returns Promise with base64 image string or null
 */
export async function extractThumbnail(
  videoFile: File,
  timeInSeconds: number = 1
): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(null);
      return;
    }

    video.preload = 'metadata';
    video.muted = true;

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    video.addEventListener('loadedmetadata', () => {
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to specified time
      video.currentTime = Math.min(timeInSeconds, video.duration);
    });

    video.addEventListener('seeked', () => {
      try {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to base64
        const base64Image = canvas.toDataURL('image/jpeg', 0.7);

        // Cleanup
        URL.revokeObjectURL(videoUrl);
        video.remove();
        canvas.remove();

        resolve(base64Image);
      } catch (error) {
        console.error('Error extracting thumbnail:', error);
        URL.revokeObjectURL(videoUrl);
        resolve(null);
      }
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(videoUrl);
      resolve(null);
    });
  });
}

/**
 * Extract multiple thumbnails from video at different time positions
 * @param videoFile The video file
 * @param count Number of thumbnails to extract
 * @returns Promise with array of base64 image strings
 */
export async function extractMultipleThumbnails(
  videoFile: File,
  count: number = 5
): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve([]);
      return;
    }

    video.preload = 'metadata';
    video.muted = true;

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    const thumbnails: string[] = [];
    let currentIndex = 0;
    let timePositions: number[] = [];

    video.addEventListener('loadedmetadata', () => {
      // Calculate time positions evenly distributed
      const duration = video.duration;
      const interval = duration / (count + 1);

      for (let i = 1; i <= count; i++) {
        timePositions.push(interval * i);
      }

      // Set canvas size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Start extracting first thumbnail
      if (timePositions.length > 0) {
        video.currentTime = timePositions[currentIndex];
      }
    });

    video.addEventListener('seeked', () => {
      try {
        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.6);
        thumbnails.push(base64Image);

        currentIndex++;

        // Extract next thumbnail or finish
        if (currentIndex < timePositions.length) {
          video.currentTime = timePositions[currentIndex];
        } else {
          // Done
          URL.revokeObjectURL(videoUrl);
          video.remove();
          canvas.remove();
          resolve(thumbnails);
        }
      } catch (error) {
        console.error('Error extracting thumbnail:', error);
        URL.revokeObjectURL(videoUrl);
        resolve(thumbnails);
      }
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(videoUrl);
      resolve(thumbnails);
    });
  });
}
