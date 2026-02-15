import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const enhanceDescription = async (
  currentDescription: string, 
  name: string, 
  setting: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return currentDescription;

  try {
    const prompt = `
      Rewrite and enhance the following character description for a tabletop RPG character.
      The output MUST be in Korean language.
      
      Character Name: ${name}
      Setting: ${setting}
      Current Description: "${currentDescription}"
      
      Make it immersive, evocative, and fitting for the genre. Keep it under 150 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || currentDescription;
  } catch (error) {
    console.error("Error enhancing description:", error);
    return currentDescription;
  }
};