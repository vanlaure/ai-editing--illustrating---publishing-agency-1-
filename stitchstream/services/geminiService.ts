
import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL } from "../constants";
import { AIAnalysis } from "../types";

const initGenAI = () => {
  const apiKey =
    (typeof window !== 'undefined' && (window as any).__mvgConfig?.geminiApiKey) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.GEMINI_API_KEY) ||
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key missing. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your env.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeMontage = async (thumbnails: string[], contextText?: string): Promise<AIAnalysis> => {
  try {
    const ai = initGenAI();
    
    // Send up to 20 frames to get a good sense of the sequence without hitting limits too hard
    const selectedThumbnails = thumbnails.slice(0, 20);

    const parts = selectedThumbnails.map(thumb => {
      // Remove data URL prefix if present for the API call
      const cleanBase64 = thumb.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      return {
        inlineData: {
          data: cleanBase64,
          mimeType: 'image/jpeg'
        }
      };
    });

    const prompt = `
      Act as a world-class Film Director and Editor. 
      Analyze these ${selectedThumbnails.length} sequential video frames (representing separate clips).
      
      1. STORYTELLING & ORDER:
         - Determine the optimal order of these clips to tell a coherent story (e.g. Establishing shot -> Action -> Climax -> Resolution).
         - Return 'suggestedClipOrder' as an array of INDICES (0-based) representing the new sequence.
      
      2. VISUAL STYLE:
         - Analyze lighting/mood. Choose the SINGLE BEST color grading style: ['cinematic', 'vintage', 'vibrant', 'bw', 'warm', 'cool', 'natural'].
         - Should we apply 'Film Grain' for texture? (applyGrain)
         - Should we apply a 'Vignette' to focus the eye? (applyVignette)
         - Should we use 'Cinema Bars' (2.35:1 aspect ratio) for a Hollywood look? (applyLetterbox)

      3. PACING & TRANSITIONS: 
         - Analyze the sequence. 
         - For EACH gap between clips (Clip 1->2, Clip 2->3, etc.), decide the transition.
         - Use 'cut' for continuity.
         - Use 'dissolve' or 'fade_black' for scene changes.
         - Output 'clipTransitions' (length must be exactly ${Math.max(0, selectedThumbnails.length - 1)}).

      4. TITLE & CREDITS:
         - Generate a creative Title and Text Design.
         - Generate Closing Credits.
      
      ADDITIONAL CONTEXT (text only, do not hallucinate visuals): ${contextText ? contextText.slice(0, 4000) : 'Not provided.'}
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          ...parts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            keywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            directorNotes: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.STRING },
                colorGrade: { type: Type.STRING, enum: ['cinematic', 'vintage', 'vibrant', 'bw', 'warm', 'cool', 'natural'] },
                colorReasoning: { type: Type.STRING },
                pacing: { type: Type.STRING },
                transition: { type: Type.STRING, enum: ['cut', 'dissolve', 'fade_black'] },
                clipTransitions: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING, enum: ['cut', 'dissolve', 'fade_black'] },
                  description: "List of transitions for each gap. Length must be clips.length - 1." 
                },
                transitionReasoning: { type: Type.STRING },
                suggestedClipOrder: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "An array of indices (0 to length-1) representing the optimal storytelling order."
                },
                cinematicEffects: {
                    type: Type.OBJECT,
                    properties: {
                        applyGrain: { type: Type.BOOLEAN },
                        applyVignette: { type: Type.BOOLEAN },
                        applyLetterbox: { type: Type.BOOLEAN },
                    },
                    required: ["applyGrain", "applyVignette", "applyLetterbox"]
                },
                titleDesign: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    style: { type: Type.STRING, enum: ['modern', 'classic', 'handwritten', 'bold', 'scifi'] },
                    position: { type: Type.STRING, enum: ['center', 'bottom_left', 'bottom_center'] },
                    color: { type: Type.STRING }
                  },
                  required: ["text", "style", "position", "color"]
                },
                closingCredits: {
                  type: Type.OBJECT,
                  properties: {
                    enabled: { type: Type.BOOLEAN },
                    lines: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                           role: { type: Type.STRING },
                           name: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              },
              required: ["mood", "colorGrade", "colorReasoning", "pacing", "transition", "clipTransitions", "transitionReasoning", "suggestedClipOrder", "cinematicEffects", "titleDesign", "closingCredits"]
            }
          },
          required: ["title", "summary", "keywords", "directorNotes"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text) as AIAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback
    const fallbackTransitions = thumbnails.slice(0, Math.max(0, thumbnails.length - 1)).map(() => 'cut' as const);
    const fallbackOrder = thumbnails.map((_, i) => i);
    
    return {
      title: "My Video Montage",
      summary: "A collection of video clips stitched together.",
      keywords: ["video", "montage"],
      directorNotes: {
        mood: "Neutral",
        colorGrade: "natural",
        colorReasoning: "AI analysis unavailable.",
        pacing: "Standard cuts",
        transition: "cut",
        clipTransitions: fallbackTransitions,
        transitionReasoning: "Default fallback.",
        suggestedClipOrder: fallbackOrder,
        cinematicEffects: { applyGrain: false, applyVignette: false, applyLetterbox: false },
        titleDesign: {
          text: "My Video Montage",
          style: "modern",
          position: "bottom_left",
          color: "#ffffff"
        },
        closingCredits: {
          enabled: true,
          lines: [
            { role: "Edited By", name: "StitchStream" },
            { role: "Director", name: "You" }
          ]
        }
      }
    };
  }
};
