import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    // O store não usa, mas config/app.ts sim — e ele entra na árvore de imports.
    __VERSAO_APP__: JSON.stringify('teste'),
  },
  test: {
    environment: 'node',
    // fake-indexeddb dá um IndexedDB de verdade em memória, então o Dexie roda
    // sem navegador. Testar contra um mock do Dexie não valeria de nada: é
    // exatamente o comportamento dele (chave composta, transação) que está sob
    // teste.
    setupFiles: ['./src/testes/preparo.ts'],
    include: ['src/**/*.teste.ts'],
  },
})
