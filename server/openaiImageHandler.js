import OpenAI from 'openai'

const DEFAULT_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'

function buildPrompt(prompt, category) {
  const categoryHint = category
    ? `Create a clean, polished ${category} visual for a fitness app.`
    : 'Create a clean, polished fitness app visual.'

  return `${categoryHint} ${prompt}`.trim()
}

export async function generateImageFromPrompt({ prompt, category }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing.')
  }

  if (!prompt || !prompt.trim()) {
    throw new Error('Prompt is required.')
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const result = await client.images.generate({
    model: DEFAULT_MODEL,
    prompt: buildPrompt(prompt, category),
    size: '1024x1024',
  })

  const image = result.data?.[0]
  const base64 = image?.b64_json
  const url = image?.url

  if (!base64 && !url) {
    throw new Error('Image generation did not return an image.')
  }

  return {
    imageUrl: url || `data:image/png;base64,${base64}`,
    revisedPrompt: image?.revised_prompt || null,
    model: DEFAULT_MODEL,
  }
}

export async function parseJsonBody(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

export function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(payload))
}
