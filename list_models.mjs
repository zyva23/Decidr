import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const response = await ai.models.list();
    console.log("AVAILABLE MODELS:");
    for (const model of response) {
      console.log(model.name);
    }
  } catch (e) {
    console.error("Error listing models:", e);
  }
}

run();
