export async function generateAppImage({ prompt, category }) {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      category,
    }),
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || '이미지 생성에 실패했습니다.')
  }

  return payload
}
