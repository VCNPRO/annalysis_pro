// services/geminiService.ts
import { GoogleGenAI, Type } from '@google/genai';
import { API_KEY, GEMINI_MODEL_NAME } from '../constants';
import { GenerateContentParameters, Part } from '@google/genai';

/**
 * Defineix la interfície per a l'anàlisi de vídeo estructurada.
 */
export interface StructuredVideoAnalysis {
  summary: string;
  objects: string; // JSON string for detailed object analysis
  people: string; // JSON string for detailed people analysis
  actions: string; // JSON string for detailed action analysis
  textContent: string; // JSON string for detailed text content analysis
  audioContext: string; // JSON string for detailed audio context analysis
  technicalAspects: string; // JSON string for detailed technical aspects analysis
  metadata: string; // JSON string for detailed metadata analysis
}

/**
 * Inicialitza i retorna una nova instància de GoogleGenAI.
 * @returns {GoogleGenAI} El client de GoogleGenAI.
 * @throws {Error} Si la API_KEY no està configurada.
 */
const getGeminiClient = (): GoogleGenAI => {
  if (!API_KEY) {
    throw new Error('La API_KEY no està configurada. Si us plau, estableix la variable d\'entorn API_KEY.');
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

/**
 * Genera contingut utilitzant l'API de Gemini, sol·licitant una anàlisi de vídeo estructurada.
 * @param imageParts Array de parts d'imatge codificades en base64 dels frames.
 * @returns Una promesa que es resol a l'objecte StructuredVideoAnalysis parsejat.
 * @throws {Error} Si la crida a l'API falla, falta la API_KEY, o la resposta no és un JSON vàlid.
 */
export const generateStructuredVideoAnalysis = async (
  imageParts: string[] = [],
): Promise<StructuredVideoAnalysis> => {
  try {
    const ai = getGeminiClient();

    const parts: Part[] = [];

    imageParts.forEach((base64Image) => {
      const mimeTypeMatch = base64Image.match(/^data:(.*?);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Image.split(',')[1],
        },
      });
    });

    const detailedPrompt = `Ets un analista de vídeo expert. Analitza aquests frames de vídeo i proporciona una descripció completa i estructurada en format JSON.

La resposta ha de ser un objecte JSON amb les següents propietats. Per a les propietats que requereixen dades estructurades (objects, people, actions, etc.), proporciona una cadena JSON vàlida com a valor d'aquesta propietat:

{
  "summary": "Proporciona un resum concís del vídeo (tema principal, duració aproximada, persones/objectes principals, configuració/ubicació).",
  "objects": "Una cadena JSON que conté un array d'objectes significatius. Per a cada objecte, inclou 'name' (nom), 'frequency' (freqüència: raro/ocasional/frequent/constant), i 'description' (descripció breu).",
  "people": "Una cadena JSON que conté un array amb l'anàlisi de les persones. Per a cada persona, inclou 'count' (nombre aproximat), 'physical_descriptions' (descripcions físiques no identificatives), 'actions' (array de les accions que realitzen), i 'interactions' (descripció de les interaccions entre ells).",
  "actions": "Una cadena JSON que conté un array de les accions principals en ordre cronològic. Per a cada acció, inclou 'timestamp_approx' (marca de temps aproximada), 'description' (descripció de l'acció), i 'performer' (qui/què realitza l'acció).",
  "textContent": "Una cadena JSON que conté un array de tot el text visible al vídeo. Per a cada text, inclou 'type' (tipus: superposat, objecte, pantalla, manuscrit), 'content' (contingut exacte), 'location' (ubicació: dalt/baix/esquerra/dreta/centre), 'size' (mida: gran/mitjà/petit), 'language' (idioma) i 'context' (context).",
  "audioContext": "Una cadena JSON que conté un objecte inferit sobre el context d'àudio. Inclou 'likely_sounds' (array de sons probables), 'talking_people_count' (quantes persones parlen: 'pocas', 'varias'), i 'sound_environment_type' (tipus d'ambient sonor).",
  "technicalAspects": "Una cadena JSON que conté un objecte amb l'anàlisi d'aspectes tècnics. Inclou 'image_quality' (qualitat de la imatge: excel·lent/bona/regular/mala), 'lighting' (il·luminació: natural/artificial/mixta), 'camera_stability' (estabilitat de la càmera), i 'shot_types' (array de tipus de preses: fixa/moviment/zoom).",
  "metadata": "Una cadena JSON que conté un objecte amb la metadada visible. Inclou 'visible_timestamps' (array de marques de temps visibles), 'location_info' (informació d'ubicació), 'environmental_conditions' (condicions ambientals: dia/nit, clima), i 'approx_era' (època aproximada)."
}
`;

    parts.push({ text: detailedPrompt });

    const generateContentParams: GenerateContentParameters = {
      model: GEMINI_MODEL_NAME,
      contents: { parts: parts },
      config: {
        systemInstruction: "Ets un analista de vídeo expert. Proporciona una anàlisi detallada i estructurada en format JSON.",
        temperature: 0.4,
        topK: 32,
        topP: 0.9,
        responseMimeType: "application/json",
        // Definir un esquema de resposta per al JSON de nivell superior
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            objects: { type: Type.STRING },
            people: { type: Type.STRING },
            actions: { type: Type.STRING },
            textContent: { type: Type.STRING },
            audioContext: { type: Type.STRING },
            technicalAspects: { type: Type.STRING },
            metadata: { type: Type.STRING },
          },
          required: [
            "summary",
            "objects",
            "people",
            "actions",
            "textContent",
            "audioContext",
            "technicalAspects",
            "metadata",
          ],
        },
      },
    };

    const response = await ai.models.generateContent(generateContentParams);
    const textOutput = response.text;

    try {
      // Intentar parsejar la resposta com a JSON
      const parsedResponse: StructuredVideoAnalysis = JSON.parse(textOutput);
      return parsedResponse;
    } catch (parseError) {
      console.error('Error en parsejar la resposta JSON de Gemini:', parseError);
      // Retornar la resposta original com a un resum general si no es pot parsejar
      return {
        summary: textOutput, // Mostrar el text complet com a resum si el JSON falla
        objects: '[]',
        people: '[]',
        actions: '[]',
        textContent: '[]',
        audioContext: '{}',
        technicalAspects: '{}',
        metadata: '{}',
      };
    }

  } catch (error) {
    console.error('Error en generar contingut amb Gemini:', error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
      throw new Error("La clau API de Gemini és invàlida o no s'ha proporcionat. Assegura't que process.env.API_KEY estigui configurada correctament.");
    }
    throw new Error(`No s'ha pogut generar contingut: ${error instanceof Error ? error.message : String(error)}`);
  }
};
