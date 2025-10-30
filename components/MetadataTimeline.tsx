import React, { useState, useRef, useEffect } from 'react';
import { StructuredVideoAnalysis } from '../services/geminiService';

interface TimelineEvent {
  type: 'object' | 'person' | 'text' | 'action';
  timestamp: number;
  label: string;
  confidence?: number;
}

interface MetadataTimelineProps {
  structuredAnalysis: StructuredVideoAnalysis | null;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  videoFile?: File | null;
}

const MetadataTimeline: React.FC<MetadataTimelineProps> = ({
  structuredAnalysis,
  duration,
  currentTime,
  onSeek,
  videoFile
}) => {
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; timestamp: number } | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize hidden video element for thumbnail extraction
  useEffect(() => {
    if (!videoFile) return;

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = URL.createObjectURL(videoFile);
    videoRef.current = video;

    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    return () => {
      if (video.src) URL.revokeObjectURL(video.src);
      video.remove();
      canvas.remove();
    };
  }, [videoFile]);

  // Extract thumbnail when hovering
  useEffect(() => {
    if (!hoverPosition || !videoRef.current || !canvasRef.current || !duration) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const extractFrame = () => {
      video.currentTime = hoverPosition.timestamp;
    };

    const onSeeked = () => {
      try {
        canvas.width = 160;
        canvas.height = 90;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.6);
        setThumbnailPreview(thumbnail);
      } catch (error) {
        console.error('Error extracting thumbnail:', error);
      }
    };

    video.addEventListener('seeked', onSeeked);
    extractFrame();

    return () => {
      video.removeEventListener('seeked', onSeeked);
    };
  }, [hoverPosition, duration]);

  const handleTimelineHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const timestamp = percentage * duration;

    setHoverPosition({ x, timestamp: Math.max(0, Math.min(timestamp, duration)) });
  };

  const handleTimelineLeave = () => {
    setHoverPosition(null);
    setThumbnailPreview(null);
  };

  // Parsear eventos del análisis estructurado
  const parseEvents = (): TimelineEvent[] => {
    if (!structuredAnalysis) return [];

    const events: TimelineEvent[] = [];

    // Parsear acciones (tienen timestamp_approx)
    try {
      const actions = JSON.parse(structuredAnalysis.actions);
      if (Array.isArray(actions)) {
        actions.forEach((action: any) => {
          const timestamp = parseTimestamp(action.timestamp_approx);
          if (timestamp !== null) {
            events.push({
              type: 'action',
              timestamp,
              label: action.description || 'Acció',
              confidence: action.confidence
            });
          }
        });
      }
    } catch (e) {}

    // Parsear texto (podemos estimar timestamps basados en distribución)
    try {
      const textContent = JSON.parse(structuredAnalysis.textContent);
      if (Array.isArray(textContent)) {
        textContent.forEach((text: any, index: number) => {
          // Distribuir texto uniformemente si no hay timestamp
          const timestamp = (duration / (textContent.length + 1)) * (index + 1);
          events.push({
            type: 'text',
            timestamp,
            label: text.content || 'Text',
            confidence: text.confidence
          });
        });
      }
    } catch (e) {}

    // Parsear objetos (distribuir uniformemente)
    try {
      const objects = JSON.parse(structuredAnalysis.objects);
      if (Array.isArray(objects)) {
        objects.forEach((obj: any, index: number) => {
          const timestamp = (duration / (objects.length + 1)) * (index + 1);
          events.push({
            type: 'object',
            timestamp,
            label: obj.name || 'Objecte',
            confidence: obj.confidence
          });
        });
      }
    } catch (e) {}

    // Parsear personas (distribuir uniformemente)
    try {
      const people = JSON.parse(structuredAnalysis.people);
      if (Array.isArray(people.actions)) {
        people.actions.forEach((action: string, index: number) => {
          const timestamp = (duration / (people.actions.length + 1)) * (index + 1);
          events.push({
            type: 'person',
            timestamp,
            label: action,
            confidence: people.confidence
          });
        });
      }
    } catch (e) {}

    return events.sort((a, b) => a.timestamp - b.timestamp);
  };

  // Parsear timestamp en formato "MM:SS" o "M:SS" o número
  const parseTimestamp = (timestamp: any): number | null => {
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp !== 'string') return null;

    const match = timestamp.match(/(\d+):(\d+)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      return minutes * 60 + seconds;
    }

    return null;
  };

  const events = parseEvents();

  const getEventColor = (type: TimelineEvent['type']): string => {
    switch (type) {
      case 'object': return 'bg-blue-500';
      case 'person': return 'bg-green-500';
      case 'text': return 'bg-yellow-500';
      case 'action': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventLabel = (type: TimelineEvent['type']): string => {
    switch (type) {
      case 'object': return '🔷 Objectes';
      case 'person': return '👤 Persones';
      case 'text': return '📝 Text';
      case 'action': return '⚡ Accions';
      default: return '';
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const eventTypes: TimelineEvent['type'][] = ['object', 'person', 'text', 'action'];

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mt-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">Timeline de Metadades</h3>

      {duration === 0 ? (
        <p className="text-sm text-slate-500 italic">Esperant vídeo...</p>
      ) : (
        <div className="space-y-3">
          {eventTypes.map((type) => {
            const typeEvents = events.filter(e => e.type === type);
            if (typeEvents.length === 0) return null;

            return (
              <div key={type} className="flex items-center gap-2">
                <div className="text-xs text-slate-400 w-24 flex-shrink-0">
                  {getEventLabel(type)}
                </div>

                <div
                  ref={type === 'object' ? timelineRef : null}
                  className="flex-1 relative h-8 bg-slate-900 rounded overflow-hidden cursor-pointer"
                  onMouseMove={type === 'object' ? handleTimelineHover : undefined}
                  onMouseLeave={type === 'object' ? handleTimelineLeave : undefined}
                  onClick={(e) => {
                    if (!timelineRef.current) return;
                    const rect = timelineRef.current.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    const timestamp = percentage * duration;
                    onSeek(timestamp);
                  }}
                >
                  {/* Current time indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />

                  {/* Event markers */}
                  {typeEvents.map((event, idx) => {
                    const position = (event.timestamp / duration) * 100;
                    return (
                      <div
                        key={`${type}-${idx}`}
                        className={`absolute top-0 bottom-0 w-1 ${getEventColor(type)} cursor-pointer hover:w-2 transition-all`}
                        style={{ left: `${position}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeek(event.timestamp);
                        }}
                        onMouseEnter={() => setHoveredEvent(event)}
                        onMouseLeave={() => setHoveredEvent(null)}
                        title={`${event.label} - ${formatTime(event.timestamp)}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {events.length === 0 && (
            <p className="text-sm text-slate-500 italic text-center py-4">
              No hi ha esdeveniments detectats al timeline
            </p>
          )}

          {/* Hover tooltip */}
          {hoveredEvent && (
            <div className="mt-2 p-2 bg-slate-700 rounded text-xs text-slate-200">
              <div className="font-semibold">{getEventLabel(hoveredEvent.type)}</div>
              <div>{hoveredEvent.label}</div>
              <div className="text-slate-400">{formatTime(hoveredEvent.timestamp)}</div>
              {hoveredEvent.confidence && (
                <div className="text-slate-400">Confiança: {(hoveredEvent.confidence * 100).toFixed(0)}%</div>
              )}
            </div>
          )}

          {/* Thumbnail preview on hover */}
          {hoverPosition && thumbnailPreview && timelineRef.current && (
            <div
              className="fixed z-50 pointer-events-none"
              style={{
                left: `${timelineRef.current.getBoundingClientRect().left + hoverPosition.x}px`,
                top: `${timelineRef.current.getBoundingClientRect().top - 110}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="bg-slate-900 border-2 border-blue-500 rounded-lg shadow-xl overflow-hidden">
                <img
                  src={thumbnailPreview}
                  alt="Preview"
                  className="w-40 h-auto"
                />
                <div className="px-2 py-1 bg-slate-800 text-xs text-slate-300 text-center font-mono">
                  {formatTime(hoverPosition.timestamp)}
                </div>
              </div>
              {/* Arrow */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid #3b82f6',
                  bottom: '-6px'
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetadataTimeline;
