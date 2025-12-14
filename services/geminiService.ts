import { GoogleGenAI } from "@google/genai";
import { GenerateContentResponse } from "@google/genai";

/**
 * Generates a detailed travel itinerary using the Google Gemini API.
 * Uses the `googleSearch` tool for real-time information.
 *
 * @param destination The travel destination (e.g., "Kyoto, Japan").
 * @param duration The duration of the trip in days (e.g., 5).
 * @param interests User's interests for the trip (e.g., "Kuliner dan Sejarah").
 * @returns A promise that resolves to the raw Markdown string of the itinerary.
 */
export async function generateItinerary(
  destination: string,
  duration: number,
  interests: string,
): Promise<string> {
  // Create a new GoogleGenAI instance right before making an API call
  // to ensure it always uses the most up-to-date API key from the dialog.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-2.5-flash'; // Suitable for basic text tasks with search grounding

  const prompt = `You are a professional, helpful, and creative Travel Planner AI. Your goal is to create detailed, day-by-day travel itineraries based on the user's input. Always use real-time, current information when suggesting activities, attractions, estimated costs, and opening hours. If you find a relevant website during your search, you must include its URL and title for checking prices or further information.

Please generate a ${duration}-day travel itinerary for "${destination}", with a focus on "${interests}".

Respond strictly using structured Markdown. For each day, list activities with the following format:
**Hari {Day Number}**
- **{Place/Activity Name}**: {Opening/Closing Hours} | Estimasi Biaya: {Estimated Cost in local currency} | [Cek Harga]({URL_placeholder_or_real_URL})

Include at least 3-4 activities per day. Prioritize accuracy for opening hours and costs by using the search tool.
If a specific URL for checking prices isn't readily available for an activity, use "#" as the placeholder URL for the "Cek Harga" link.

Example for output structure:
**Hari 1**
- **Kinkaku-ji (Kuil Paviliun Emas)**: 09:00 - 17:00 | Estimasi Biaya: JPY 400 | [Cek Harga](https://www.kinkaku.jp/en/info/)
- **Arashiyama Bamboo Grove**: Buka 24 jam | Estimasi Biaya: Gratis | [Cek Harga](#)
- **Togetsukyo Bridge**: Buka 24 jam | Estimasi Biaya: Gratis | [Cek Harga](#)
- **Tenryu-ji Temple**: 08:30 - 17:00 | Estimasi Biaya: JPY 500-800 | [Cek Harga](https://www.tenryuji.com/en/guidance/)

Start the itinerary directly, do not add any introductory sentences before "**Hari 1**".
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }], // Enable Google Search for real-time data
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No text content received from Gemini API.");
    }

    // Extract grounding URLs and append them if necessary (though the prompt asks the AI to embed them directly)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let combinedOutput = textOutput;
    if (groundingChunks && groundingChunks.length > 0) {
      // The prompt asks the AI to embed URLs directly.
      // This section is a fallback or for displaying additional sources if the AI doesn't embed all.
      // For this app, we primarily rely on the AI embedding links in the markdown.
      // console.log("Grounding URLs:", groundingChunks);
    }

    return combinedOutput;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(`Failed to get response from AI: ${error.message || error}`);
  }
}