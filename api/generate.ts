import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use the API key from the secure server environment
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API Key is missing on the server.' });
  }

  const { model, contents, config } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    return res.status(200).json({ 
      text: response.text, 
      candidates: response.candidates 
    });
  } catch (error: any) {
    console.error('Gemini Backend Error:', error);
    return res.status(500).json({ error: error.message || 'Unknown server error' });
  }
}
