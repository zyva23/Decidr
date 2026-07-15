import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import * as process from 'node:process'
import path from 'path'
import { GoogleGenAI } from '@google/genai'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      {
        name: 'api-generate-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/api/generate' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const { model, contents, config } = JSON.parse(body);
                  const apiKey = process.env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
                  if (!apiKey) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Local VITE_GEMINI_API_KEY is missing in process.env.' }));
                    return;
                  }
                  const ai = new GoogleGenAI({ apiKey });
                  const response = await ai.models.generateContent({
                    model,
                    contents,
                    config
                  });
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    text: response.text,
                    candidates: response.candidates
                  }));
                } catch (error: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: error.message || 'Unknown dev server error' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        // Resolve the specific pako deep import issue for @react-pdf
        'pako/lib/zlib/zstream.js': 'pako/lib/zlib/zstream.js',
        'pako': 'pako',
        'buffer': 'buffer',
      }
    },
    optimizeDeps: {
      include: ['pako', '@react-pdf/renderer', 'buffer']
    },
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || env.VITE_GEMINI_API_KEY),
      // Hardcoded Firebase Config
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify("AIzaSyCDUDI4QiJL2HWH0r48Q_uvip60I-wA0oE"),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify("decision-council23.firebaseapp.com"),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify("decision-council23"),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify("decision-council23.firebasestorage.app"),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify("324575797486"),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify("1:324575797486:web:352c8de7a04c67f73a93ff"),
      'global': 'window', // Polyfill for global
    }
  }
})
