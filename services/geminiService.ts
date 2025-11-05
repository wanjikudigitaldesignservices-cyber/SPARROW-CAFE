
import { GoogleGenAI, Chat, Modality, GenerateContentResponse, GroundingChunk } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// --- Text Generation Models ---

export const getBusinessInsights = async (prompt: string): Promise<{text: string; sources: GroundingChunk[]}> => {
    if (!API_KEY) throw new Error("API key is not configured.");
    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: prompt,
          config: {
            tools: [{googleSearch: {}}],
            thinkingConfig: { thinkingBudget: 32768 }
          },
        });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text, sources: sources as GroundingChunk[] };
    } catch (error) {
        console.error("Error calling Gemini API for insights:", error);
        throw new Error("Failed to get response from AI model.");
    }
};

async function runFlash(prompt: string): Promise<string> {
    if (!API_KEY) throw new Error("API key is not configured.");
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get response from AI model.");
    }
}

export const generateMenuDescription = (prompt: string): Promise<string> => runFlash(prompt);
export const suggestPairing = (prompt: string): Promise<string> => runFlash(prompt);

// --- Chat Model ---

export const startChat = (): Chat => {
    if (!API_KEY) throw new Error("API key is not configured.");
    return ai.chats.create({
      model: 'gemini-2.5-flash-lite',
    });
};

// --- Image Models ---

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    if (!API_KEY) throw new Error("API key is not configured.");
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: aspectRatio as any,
            },
        });
        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image.");
    }
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    if (!API_KEY) throw new Error("API key is not configured.");
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: imageBase64, mimeType } },
              { text: prompt },
            ],
          },
          config: {
              responseModalities: [Modality.IMAGE],
          },
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
            return part.inlineData.data;
        }
        throw new Error("No image was generated.");
    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit image.");
    }
}

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    if (!API_KEY) throw new Error("API key is not configured.");
    try {
        const imagePart = { inlineData: { mimeType, data: imageBase64 } };
        const textPart = { text: prompt };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze image.");
    }
};

// --- Video Model ---

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', image?: {base64: string, mimeType: string}) => {
    // Per Veo guidelines, create a new instance before each call.
    const veaAi = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    let operation = await veaAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      ...(image && { image: { imageBytes: image.base64, mimeType: image.mimeType } }),
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await veaAi.operations.getVideosOperation({operation: operation});
    }
    
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed, no download link found.");
    }
    
    // The component will fetch this link
    return `${downloadLink}&key=${process.env.API_KEY}`;
};


// --- Audio Model ---

export const textToSpeech = async (text: string): Promise<string> => {
    if (!API_KEY) throw new Error("API key is not configured.");
    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
          },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data received.");
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech.");
    }
}
