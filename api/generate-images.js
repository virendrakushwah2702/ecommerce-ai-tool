export const config = {
  maxDuration: 30
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const origin = req.headers.origin || req.headers.referer || ''
  if (!origin.includes('ecom-imagined-ai.vercel.app') && !origin.includes('localhost') && !origin.includes('imaginedai.in')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const { imageUrl, prompt, label } = req.body
    const FAL_KEY = process.env.FAL_KEY

    if (!imageUrl) return res.status(200).json({ success: false, error: 'No image URL' })

    const isMainImage = label === "Main Product Image"
    const enhancedPrompt = isMainImage
      ? `Transform the background of this exact product image to pure white RGB 255 255 255. Keep the product EXACTLY as it is — same shape, same label, same colors, same text, same design. Do not modify the product in any way. Only change the background to white. Professional studio lighting. Square 1024x1024 pixels output only.`
      : `Create a professional eCommerce infographic using this EXACT product as shown in the input image. The product must appear IDENTICAL — same bottle shape, same label design, same colors, same text. Do not reimagine or redesign the product. ${prompt} All text in English only. Square 1024x1024 pixels output only.`

    // Submit to fal.ai queue — returns immediately with request_id + status_url + response_url
    const response = await fetch('https://queue.fal.run/openai/gpt-image-2/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_urls: [imageUrl],
        prompt: enhancedPrompt,
        size: '1024x1024',
        quality: 'low',
        n: 1
      })
    })

    const data = await response.json()
    console.log("Queue submit:", JSON.stringify(data).substring(0, 300))

    if (data.request_id) {
      return res.status(200).json({
        success: true,
        queued: true,
        request_id: data.request_id,
        status_url: data.status_url,
        response_url: data.response_url,
        label
      })
    }

    return res.status(200).json({ success: false, error: 'Queue submit failed', details: data })

  } catch (error) {
    return res.status(200).json({ success: false, error: error.message })
  }
}
