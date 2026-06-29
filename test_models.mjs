import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function testModel(modelName) {
  try {
    console.log(`Testing ${modelName}...`);
    await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: 'hello' }] }]
    });
    console.log(`✅ ${modelName} works!`);
  } catch (e) {
    console.error(`❌ ${modelName} failed:`, e.message);
  }
}

async function run() {
  await testModel('gemini-1.5-pro');
  await testModel('gemini-1.5-flash-8b');
  await testModel('gemini-1.5-flash-002');
  await testModel('gemini-2.5-flash');
}
run();
