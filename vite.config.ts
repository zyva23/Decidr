import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import * as process from 'node:process'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
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
