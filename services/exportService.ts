// services/exportService.ts
import { StructuredVideoAnalysis } from './geminiService';

export interface StructuredExportData {
  metadata: {
    exportDate: string;
    videoFileName: string;
    videoDuration: number;
    analysisVersion: string;
    platform: string;
  };
  summary: {
    text: string;
    language: string;
    confidence?: number;
  };
  timeline: TimelineEvent[];
  objects: DetectedObject[];
  people: DetectedPerson[];
  textContent: DetectedText[];
  actions: DetectedAction[];
  technical: TechnicalAnalysis;
  audioContext: AudioAnalysis;
  statistics: AnalysisStatistics;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'object' | 'person' | 'text' | 'action' | 'scene_change';
  description: string;
  confidence?: number;
  data?: any;
}

export interface DetectedObject {
  id: string;
  name: string;
  category?: string;
  firstSeen: number;
  lastSeen?: number;
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  confidence: number;
  description?: string;
  timestamps: number[];
}

export interface DetectedPerson {
  id: string;
  identifier: string; // "Person 1", "Person 2", etc.
  physicalDescription?: string[];
  actions: string[];
  interactions?: string;
  appearances: number[];
  confidence: number;
}

export interface DetectedText {
  id: string;
  content: string;
  type: 'overlay' | 'object' | 'screen' | 'handwritten';
  location: 'top' | 'bottom' | 'left' | 'right' | 'center';
  size: 'large' | 'medium' | 'small';
  language?: string;
  timestamp: number;
  confidence: number;
  context?: string;
}

export interface DetectedAction {
  id: string;
  timestamp: number;
  description: string;
  performer: string; // who/what performs the action
  duration?: number;
  confidence: number;
}

export interface TechnicalAnalysis {
  imageQuality: 'excellent' | 'good' | 'regular' | 'poor';
  lighting: 'natural' | 'artificial' | 'mixed';
  cameraStability: string;
  shotTypes: string[];
  resolution?: string;
  frameRate?: number;
}

export interface AudioAnalysis {
  likelySounds: string[];
  talkingPeopleCount?: string;
  soundEnvironmentType: string;
  musicDetected?: boolean;
  noiseLevel?: 'low' | 'medium' | 'high';
}

export interface AnalysisStatistics {
  totalObjects: number;
  totalPeople: number;
  totalTextElements: number;
  totalActions: number;
  averageConfidence: number;
  processingTime?: number;
}

/**
 * Convert raw StructuredVideoAnalysis to enriched StructuredExportData
 */
export function enrichAnalysisData(
  analysis: StructuredVideoAnalysis,
  videoFileName: string,
  videoDuration: number
): StructuredExportData {
  const timeline: TimelineEvent[] = [];
  const objects: DetectedObject[] = [];
  const people: DetectedPerson[] = [];
  const textContent: DetectedText[] = [];
  const actions: DetectedAction[] = [];

  // Parse and enrich objects
  try {
    const rawObjects = JSON.parse(analysis.objects);
    if (Array.isArray(rawObjects)) {
      rawObjects.forEach((obj: any, idx: number) => {
        const timestamp = (videoDuration / (rawObjects.length + 1)) * (idx + 1);
        const enriched: DetectedObject = {
          id: `obj-${idx + 1}`,
          name: obj.name || `Object ${idx + 1}`,
          category: obj.category,
          firstSeen: timestamp,
          frequency: obj.frequency || 'occasional',
          confidence: obj.confidence || 0.8,
          description: obj.description,
          timestamps: [timestamp]
        };
        objects.push(enriched);

        timeline.push({
          id: `timeline-obj-${idx}`,
          timestamp,
          type: 'object',
          description: enriched.name,
          confidence: enriched.confidence,
          data: enriched
        });
      });
    }
  } catch (e) {
    console.error('Error parsing objects:', e);
  }

  // Parse and enrich people
  try {
    const rawPeople = JSON.parse(analysis.people);
    if (rawPeople.actions && Array.isArray(rawPeople.actions)) {
      rawPeople.actions.forEach((action: string, idx: number) => {
        const timestamp = (videoDuration / (rawPeople.actions.length + 1)) * (idx + 1);
        const person: DetectedPerson = {
          id: `person-${idx + 1}`,
          identifier: `Person ${idx + 1}`,
          physicalDescription: rawPeople.physical_descriptions || [],
          actions: [action],
          interactions: rawPeople.interactions,
          appearances: [timestamp],
          confidence: 0.75
        };
        people.push(person);

        timeline.push({
          id: `timeline-person-${idx}`,
          timestamp,
          type: 'person',
          description: action,
          confidence: 0.75,
          data: person
        });
      });
    }
  } catch (e) {
    console.error('Error parsing people:', e);
  }

  // Parse and enrich text content
  try {
    const rawText = JSON.parse(analysis.textContent);
    if (Array.isArray(rawText)) {
      rawText.forEach((text: any, idx: number) => {
        const timestamp = (videoDuration / (rawText.length + 1)) * (idx + 1);
        const enriched: DetectedText = {
          id: `text-${idx + 1}`,
          content: text.content || '',
          type: text.type || 'overlay',
          location: text.location || 'center',
          size: text.size || 'medium',
          language: text.language,
          timestamp,
          confidence: text.confidence || 0.9,
          context: text.context
        };
        textContent.push(enriched);

        timeline.push({
          id: `timeline-text-${idx}`,
          timestamp,
          type: 'text',
          description: enriched.content,
          confidence: enriched.confidence,
          data: enriched
        });
      });
    }
  } catch (e) {
    console.error('Error parsing text:', e);
  }

  // Parse and enrich actions
  try {
    const rawActions = JSON.parse(analysis.actions);
    if (Array.isArray(rawActions)) {
      rawActions.forEach((action: any, idx: number) => {
        const timestamp = parseTimestamp(action.timestamp_approx, videoDuration, idx, rawActions.length);
        const enriched: DetectedAction = {
          id: `action-${idx + 1}`,
          timestamp,
          description: action.description || '',
          performer: action.performer || 'Unknown',
          confidence: action.confidence || 0.7
        };
        actions.push(enriched);

        timeline.push({
          id: `timeline-action-${idx}`,
          timestamp,
          type: 'action',
          description: enriched.description,
          confidence: enriched.confidence,
          data: enriched
        });
      });
    }
  } catch (e) {
    console.error('Error parsing actions:', e);
  }

  // Sort timeline by timestamp
  timeline.sort((a, b) => a.timestamp - b.timestamp);

  // Parse technical aspects
  let technical: TechnicalAnalysis = {
    imageQuality: 'good',
    lighting: 'natural',
    cameraStability: 'stable',
    shotTypes: []
  };
  try {
    const rawTech = JSON.parse(analysis.technicalAspects);
    technical = {
      imageQuality: rawTech.image_quality || 'good',
      lighting: rawTech.lighting || 'natural',
      cameraStability: rawTech.camera_stability || 'stable',
      shotTypes: rawTech.shot_types || []
    };
  } catch (e) {}

  // Parse audio context
  let audioContext: AudioAnalysis = {
    likelySounds: [],
    soundEnvironmentType: 'unknown'
  };
  try {
    const rawAudio = JSON.parse(analysis.audioContext);
    audioContext = {
      likelySounds: rawAudio.likely_sounds || [],
      talkingPeopleCount: rawAudio.talking_people_count,
      soundEnvironmentType: rawAudio.sound_environment_type || 'unknown'
    };
  } catch (e) {}

  // Calculate statistics
  const allConfidences = [
    ...objects.map(o => o.confidence),
    ...people.map(p => p.confidence),
    ...textContent.map(t => t.confidence),
    ...actions.map(a => a.confidence)
  ].filter(c => c !== undefined);

  const statistics: AnalysisStatistics = {
    totalObjects: objects.length,
    totalPeople: people.length,
    totalTextElements: textContent.length,
    totalActions: actions.length,
    averageConfidence: allConfidences.length > 0
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
      : 0
  };

  return {
    metadata: {
      exportDate: new Date().toISOString(),
      videoFileName,
      videoDuration,
      analysisVersion: '1.0.0',
      platform: 'Annalysis Pro Enterprise'
    },
    summary: {
      text: analysis.summary,
      language: 'ca', // Catalan
      confidence: 0.9
    },
    timeline,
    objects,
    people,
    textContent,
    actions,
    technical,
    audioContext,
    statistics
  };
}

function parseTimestamp(timestamp: any, duration: number, index: number, total: number): number {
  if (typeof timestamp === 'number') return timestamp;
  if (typeof timestamp === 'string') {
    const match = timestamp.match(/(\d+):(\d+)/);
    if (match) {
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
  }
  // Fallback: distribute evenly
  return (duration / (total + 1)) * (index + 1);
}

/**
 * Export as structured JSON
 */
export function exportAsJSON(data: StructuredExportData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analysis_${data.metadata.videoFileName}_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export as structured TXT
 */
export function exportAsTXT(data: StructuredExportData) {
  let text = '';

  // Header
  text += '═══════════════════════════════════════════════════════════\n';
  text += '           ANNALYSIS PRO - INFORME D\'ANÀLISI DE VÍDEO\n';
  text += '═══════════════════════════════════════════════════════════\n\n';

  // Metadata
  text += '📋 METADADES\n';
  text += '─────────────────────────────────────────────────────────\n';
  text += `Fitxer:        ${data.metadata.videoFileName}\n`;
  text += `Durada:        ${formatDuration(data.metadata.videoDuration)}\n`;
  text += `Data export:   ${new Date(data.metadata.exportDate).toLocaleString('ca')}\n`;
  text += `Plataforma:    ${data.metadata.platform}\n`;
  text += `Versió:        ${data.metadata.analysisVersion}\n\n`;

  // Statistics
  text += '📊 ESTADÍSTIQUES\n';
  text += '─────────────────────────────────────────────────────────\n';
  text += `Objectes detectats:       ${data.statistics.totalObjects}\n`;
  text += `Persones detectades:      ${data.statistics.totalPeople}\n`;
  text += `Elements de text:         ${data.statistics.totalTextElements}\n`;
  text += `Accions registrades:      ${data.statistics.totalActions}\n`;
  text += `Confiança mitjana:        ${(data.statistics.averageConfidence * 100).toFixed(1)}%\n\n`;

  // Summary
  text += '📄 RESUM EXECUTIU\n';
  text += '─────────────────────────────────────────────────────────\n';
  text += `${data.summary.text}\n\n`;

  // Timeline
  if (data.timeline.length > 0) {
    text += '⏱️  TIMELINE D\'ESDEVENIMENTS\n';
    text += '─────────────────────────────────────────────────────────\n';
    data.timeline.forEach(event => {
      const icon = getEventIcon(event.type);
      text += `${formatTimestamp(event.timestamp)} ${icon} ${event.description}`;
      if (event.confidence) {
        text += ` (${(event.confidence * 100).toFixed(0)}%)`;
      }
      text += '\n';
    });
    text += '\n';
  }

  // Objects
  if (data.objects.length > 0) {
    text += '🔷 OBJECTES DETECTATS\n';
    text += '─────────────────────────────────────────────────────────\n';
    data.objects.forEach((obj, idx) => {
      text += `${idx + 1}. ${obj.name}\n`;
      text += `   - Freqüència: ${obj.frequency}\n`;
      text += `   - Primera aparició: ${formatTimestamp(obj.firstSeen)}\n`;
      text += `   - Confiança: ${(obj.confidence * 100).toFixed(1)}%\n`;
      if (obj.description) {
        text += `   - Descripció: ${obj.description}\n`;
      }
      text += '\n';
    });
  }

  // People
  if (data.people.length > 0) {
    text += '👤 PERSONES DETECTADES\n';
    text += '─────────────────────────────────────────────────────────\n';
    data.people.forEach((person, idx) => {
      text += `${idx + 1}. ${person.identifier}\n`;
      text += `   - Accions:\n`;
      person.actions.forEach(action => {
        text += `     • ${action}\n`;
      });
      if (person.interactions) {
        text += `   - Interaccions: ${person.interactions}\n`;
      }
      text += '\n';
    });
  }

  // Text Content
  if (data.textContent.length > 0) {
    text += '📝 TEXT EN PANTALLA\n';
    text += '─────────────────────────────────────────────────────────\n';
    data.textContent.forEach((txt, idx) => {
      text += `${idx + 1}. [${formatTimestamp(txt.timestamp)}] "${txt.content}"\n`;
      text += `   - Tipus: ${txt.type} | Ubicació: ${txt.location} | Mida: ${txt.size}\n`;
      if (txt.context) {
        text += `   - Context: ${txt.context}\n`;
      }
      text += '\n';
    });
  }

  // Technical
  text += '🎨 ASPECTES TÈCNICS\n';
  text += '─────────────────────────────────────────────────────────\n';
  text += `Qualitat d'imatge:    ${data.technical.imageQuality}\n`;
  text += `Il·luminació:         ${data.technical.lighting}\n`;
  text += `Estabilitat càmera:   ${data.technical.cameraStability}\n`;
  if (data.technical.shotTypes.length > 0) {
    text += `Tipus de plans:       ${data.technical.shotTypes.join(', ')}\n`;
  }
  text += '\n';

  // Audio
  text += '🔊 CONTEXT D\'ÀUDIO\n';
  text += '─────────────────────────────────────────────────────────\n';
  text += `Ambient sonor:        ${data.audioContext.soundEnvironmentType}\n`;
  if (data.audioContext.likelySounds.length > 0) {
    text += `Sons probables:       ${data.audioContext.likelySounds.join(', ')}\n`;
  }
  if (data.audioContext.talkingPeopleCount) {
    text += `Persones parlant:    ${data.audioContext.talkingPeopleCount}\n`;
  }
  text += '\n';

  // Footer
  text += '═══════════════════════════════════════════════════════════\n';
  text += `              Generat per Annalysis Pro Enterprise\n`;
  text += `                 ${new Date().toLocaleString('ca')}\n`;
  text += '═══════════════════════════════════════════════════════════\n';

  const blob = new Blob([text], { type: 'text/plain; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analysis_${data.metadata.videoFileName}_${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export as PDF (using HTML to PDF conversion)
 */
export function exportAsPDF(data: StructuredExportData) {
  // Create HTML content
  const html = generatePDFHTML(data);

  // Open in new window for print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Trigger print dialog after content loads
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

function generatePDFHTML(data: StructuredExportData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Anàlisi de Vídeo - ${data.metadata.videoFileName}</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      margin: 0;
      font-size: 24px;
    }
    .header .subtitle {
      color: #64748b;
      font-size: 14px;
      margin-top: 5px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      background: #eff6ff;
      color: #1e40af;
      padding: 10px 15px;
      border-left: 4px solid #3b82f6;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .metadata-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }
    .metadata-item {
      padding: 8px;
      background: #f8fafc;
      border-radius: 4px;
    }
    .metadata-label {
      font-weight: bold;
      color: #475569;
      font-size: 12px;
    }
    .metadata-value {
      color: #1e293b;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 5px;
    }
    .timeline-item {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      padding: 8px;
      background: #f8fafc;
      border-left: 3px solid #3b82f6;
    }
    .timestamp {
      font-family: monospace;
      color: #3b82f6;
      font-weight: bold;
      min-width: 60px;
    }
    .list-item {
      margin-bottom: 15px;
      padding: 10px;
      background: #f8fafc;
      border-radius: 4px;
    }
    .list-item-title {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .list-item-detail {
      font-size: 13px;
      color: #475569;
      margin-left: 10px;
    }
    .summary-box {
      background: #eff6ff;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #bfdbfe;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎬 ANNALYSIS PRO - INFORME D'ANÀLISI DE VÍDEO</h1>
    <div class="subtitle">Anàlisi Professional amb Intel·ligència Artificial</div>
  </div>

  <div class="section">
    <div class="section-title">📋 Metadades</div>
    <div class="metadata-grid">
      <div class="metadata-item">
        <div class="metadata-label">Fitxer de Vídeo</div>
        <div class="metadata-value">${data.metadata.videoFileName}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Durada</div>
        <div class="metadata-value">${formatDuration(data.metadata.videoDuration)}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Data d'Exportació</div>
        <div class="metadata-value">${new Date(data.metadata.exportDate).toLocaleString('ca')}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Plataforma</div>
        <div class="metadata-value">${data.metadata.platform}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📊 Estadístiques</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${data.statistics.totalObjects}</div>
        <div class="stat-label">Objectes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.statistics.totalPeople}</div>
        <div class="stat-label">Persones</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.statistics.totalTextElements}</div>
        <div class="stat-label">Elements de Text</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.statistics.totalActions}</div>
        <div class="stat-label">Accions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${(data.statistics.averageConfidence * 100).toFixed(0)}%</div>
        <div class="stat-label">Confiança Mitjana</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📄 Resum Executiu</div>
    <div class="summary-box">
      ${data.summary.text}
    </div>
  </div>

  ${data.timeline.length > 0 ? `
  <div class="section">
    <div class="section-title">⏱️ Timeline d'Esdeveniments</div>
    ${data.timeline.slice(0, 20).map(event => `
      <div class="timeline-item">
        <span class="timestamp">${formatTimestamp(event.timestamp)}</span>
        <span>${getEventIcon(event.type)} ${event.description}</span>
      </div>
    `).join('')}
    ${data.timeline.length > 20 ? `<p><em>... i ${data.timeline.length - 20} esdeveniments més</em></p>` : ''}
  </div>
  ` : ''}

  ${data.objects.length > 0 ? `
  <div class="section">
    <div class="section-title">🔷 Objectes Detectats</div>
    ${data.objects.map((obj, idx) => `
      <div class="list-item">
        <div class="list-item-title">${idx + 1}. ${obj.name}</div>
        <div class="list-item-detail">Freqüència: ${obj.frequency} | Confiança: ${(obj.confidence * 100).toFixed(1)}%</div>
        ${obj.description ? `<div class="list-item-detail">${obj.description}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${data.people.length > 0 ? `
  <div class="section">
    <div class="section-title">👤 Persones Detectades</div>
    ${data.people.map((person, idx) => `
      <div class="list-item">
        <div class="list-item-title">${idx + 1}. ${person.identifier}</div>
        <div class="list-item-detail">Accions: ${person.actions.join(', ')}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">🎨 Aspectes Tècnics</div>
    <div class="metadata-grid">
      <div class="metadata-item">
        <div class="metadata-label">Qualitat d'Imatge</div>
        <div class="metadata-value">${data.technical.imageQuality}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Il·luminació</div>
        <div class="metadata-value">${data.technical.lighting}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">Estabilitat</div>
        <div class="metadata-value">${data.technical.cameraStability}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>Annalysis Pro Enterprise</strong> | Anàlisi Professional de Vídeo amb IA</p>
    <p>© ${new Date().getFullYear()} | Generat el ${new Date().toLocaleString('ca')}</p>
  </div>
</body>
</html>
  `;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getEventIcon(type: string): string {
  switch (type) {
    case 'object': return '🔷';
    case 'person': return '👤';
    case 'text': return '📝';
    case 'action': return '⚡';
    case 'scene_change': return '🎬';
    default: return '•';
  }
}
