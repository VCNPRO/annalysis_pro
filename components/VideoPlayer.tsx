import React, { useRef, useState, useEffect } from 'react';

interface VideoPlayerProps {
  videoFile: File;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onSeek?: (time: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoFile,
  onTimeUpdate,
  onDurationChange,
  onSeek
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    // Crear URL del vídeo
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);

    return () => {
      // Limpiar URL al desmontar
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
      onDurationChange?.(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onDurationChange]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    onSeek?.(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 5);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(duration, video.currentTime + 5);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const seekToTime = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    onSeek?.(time);
  };

  // Exponer función de seek para uso externo
  useEffect(() => {
    if (videoRef.current) {
      (videoRef.current as any).seekToTime = seekToTime;
    }
  }, []);

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden shadow-xl border border-slate-700">
      {/* Video Display */}
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onClick={togglePlay}
        />

        {/* Play overlay */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all"
          >
            <svg className="w-20 h-20 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-slate-800">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #475569 ${(currentTime / duration) * 100}%, #475569 100%)`
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Playback Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={skipBackward}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Retrocedir 5s"
            >
              <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button
              onClick={skipForward}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Avançar 5s"
            >
              <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
              </svg>
            </button>

            {/* Time Display */}
            <div className="text-sm text-slate-300 font-mono ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
