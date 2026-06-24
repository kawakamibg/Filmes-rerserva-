import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        cadastro: resolve(__dirname, 'cadastro.html'),
        perfil: resolve(__dirname, 'perfil.html'),
      },
    },
  },
})