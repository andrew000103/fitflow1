import { generateImageFromPrompt } from '../../server/openaiImageHandler.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  try {
    const { prompt, category } = req.body || {}
    const image = await generateImageFromPrompt({ prompt, category })
    res.status(200).json(image)
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Image generation failed.',
    })
  }
}
