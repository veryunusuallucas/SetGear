import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

/**
 * A versão sai do package.json e entra no app.
 *
 * Mesmo padrão do SetProd, e pelo mesmo motivo: o relatório de bug do SetGear
 * hoje não sabe dizer de qual build veio o problema, que é justamente o que ele
 * deveria responder. Uma fonte só para a versão evita que ela envelheça à mão.
 */
const versao = JSON.parse(readFileSync('./package.json', 'utf8')).version as string

export default defineConfig({
  define: {
    __VERSAO_APP__: JSON.stringify(versao),
  },
  server: {
    port: 3000,
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // O SetGear é usado num set sem sinal — se o pacote principal ficar
        // fora do cache, o app simplesmente não abre onde ele mais importa.
        // O teto do Workbox é 2 MiB por padrão; o leitor de QR já pesa.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        // Nome provisório: vai mudar. A fonte única é APP_NOME em
        // src/config/app.ts — ao renomear, alinhar os dois.
        name: 'SetGear',
        short_name: 'SetGear',
        description: 'Controle de equipamento de cinema: o que sai, o que chega no set e o que volta.',
        lang: 'pt-BR',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
