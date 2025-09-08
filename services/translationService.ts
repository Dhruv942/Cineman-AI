import { GoogleGenAI } from "@google/genai";
import { en } from "../translations/en";
import { SUPPORTED_TRANSLATION_LANGUAGES } from "../constants";
import type { Translations } from "../types";

const API_KEY = 'AIzaSyBJqkrD1MteQ9FV6v3Dtdo39dhLUf4BRB4';

if (!API_KEY) {
  console.error("API_KEY is not set for Translation Service.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

/**
 * Translates the entire UI text object to a target language using the Gemini API.
 * @param targetLanguageCode The ISO 639-1 code for the target language (e.g., 'es', 'fr').
 * @returns A promise that resolves to the translated text object.
 */
export const translateUI = async (targetLanguageCode: string): Promise<Translations> => {
    if (!API_KEY) {
        console.error("Cannot translate UI without an API key.");
        return en; // Fallback to English
    }
    
    const targetLanguage = SUPPORTED_TRANSLATION_LANGUAGES.find(lang => lang.code === targetLanguageCode);
    if (!targetLanguage) {
        console.error(`Unsupported language code: ${targetLanguageCode}`);
        return en;
    }
    
    const prompt = `
        You are an expert translator specializing in user interfaces for web applications.
        Your task is to translate a JSON object of English UI text strings into ${targetLanguage.name}.

        RULES:
        1.  Translate the string VALUES, but DO NOT change the JSON KEYS.
        2.  Maintain the original JSON structure perfectly.
        3.  The app's name is "CineMan AI". This is a brand name and must NOT be translated. If the target language uses a non-Latin script (e.g., Devanagari for Hindi, Cyrillic for Russian, Japanese script), you MUST transliterate "CineMan AI" phonetically into that script. Otherwise, keep it as "CineMan AI".
        4.  Pay close attention to context. These strings are for a movie and TV series recommendation application. The tone should be friendly, enthusiastic, and helpful.
        5.  For strings with placeholders like '{itemType}' or '{year}', keep the placeholders exactly as they are in the translated string. For example, 'Step {current} of {total}' in Spanish should be 'Paso {current} de {total}'.
        6.  Your final response must be ONLY the translated JSON object, with no extra text, explanations, or markdown formatting like \`\`\`json.

        Here is the English JSON object to translate:
        ${JSON.stringify(en, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const responseText = response.text?.trim();
        if (!responseText) {
            throw new Error('No response text received from translation API');
        }
        const translatedObject: Translations = JSON.parse(responseText);

        // Basic validation to ensure the structure wasn't completely broken
        if (typeof translatedObject.appName !== 'string' || typeof translatedObject.landing_cta !== 'string') {
            throw new Error("Translated JSON has an invalid structure.");
        }
        
        return translatedObject;

    } catch (error) {
        console.error(`Failed to translate UI to ${targetLanguage.name}:`, error);
        // In case of an error (API issue, parsing failure), return the original English strings
        // to prevent the app from crashing.
        return en;
    }
};