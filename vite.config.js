import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { generateImageFromPrompt, parseJsonBody, sendJson } from './server/openaiImageHandler.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fitflow-openai-image-route',
      configureServer(server) {
        server.middlewares.use('/api/images/generate', async (req, res) => {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: 'Method not allowed.' })
            return
          }

          try {
            const body = await parseJsonBody(req)
            const image = await generateImageFromPrompt(body)
            sendJson(res, 200, image)
          } catch (error) {
            sendJson(res, 500, {
              error: error instanceof Error ? error.message : 'Image generation failed.',
            })
          }
        })
      },
    },
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
