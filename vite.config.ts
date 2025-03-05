import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
		  firebaseApp: ['firebase/app'],
          firebaseAuth: ['firebase/auth'],
          firebaseFirestore: ['firebase/firestore'],
		  mui: ['@mui/material'],
		  qr: ['html5-qrcode'],
        },
      },
    },
  },
})
