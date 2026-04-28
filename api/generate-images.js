export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { imageUrl, prompt, label } = req.body
    const FAL_KEY = process.env.FAL_KEY

    if (!imageUrl) {
      return res.status(200).json({ success: false, error: 'No image URL provided' })
    }

    const isMainImage = label === "Main Product Image"

    const enhancedPrompt = isMainImage
      ? `${prompt} CRITICAL: Keep the product label and branding EXACTLY as shown in the input image. Do not change any text on the label. Only improve lighting, background to pure white, and overall quality. All text must be in English only.`
      : `${prompt} CRITICAL: All text must be in clear English only. Text must be perfectly legible. Professional eCommerce infographic design. Output must be exactly 1024x1024 pixels square format.`

    const response = await fetch('https://fal.run/openai/gpt-image-2/edit', {
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
        n: 1,
        output_format: 'png'
      })
    })

    const data = await response.json()
    console.log("gpt-image-2 response:", JSON.stringify(data).substring(0, 300))

    if (data.images && data.images[0]) {
      const img = data.images[0]
      if (img.b64_json) {
        return res.status(200).json({
          success: true,
          imageUrl: `data:image/png;base64,${img.b64_json}`,
          label: label
        })
      }
      if (img.url) {
        const imgResponse = await fetch(img.url)
        const buffer = await imgResponse.arrayBuffer()
        const b64 = Buffer.from(buffer).toString('base64')
        return res.status(200).json({
          success: true,
          imageUrl: `data:image/jpeg;base64,${b64}`,
          label: label
        })
      }
    }

    return res.status(200).json({
      success: false,
      error: 'Failed',
      details: data
    })
  } catch (error) {
    return res.status(200).json({ error: error.message })
  }
}