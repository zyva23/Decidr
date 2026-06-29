import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function run() {
  try {
    const response = await ai.models.list();
    for (const model of response) {
      console.log(model.name);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
