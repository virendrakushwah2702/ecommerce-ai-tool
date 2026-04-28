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

    if (!FAL_KEY) {
      return res.status(500).json({ success: false, error: 'FAL_KEY not configured' })
    }

    console.log("Calling fal.ai for:", label)

    const response = await fetch('https://fal.run/fal-ai/gpt-image-1.5/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_urls: [imageUrl]
      })
    })

    const data = await response.json()
    console.log("fal.ai response:", JSON.stringify(data).substring(0, 400))

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        error: `fal.ai error ${response.status}`,
        details: data
      })
    }

    const firstImage = (data.images || [])[0]

    if (!firstImage || !firstImage.url) {
      return res.status(200).json({
        success: false,
        error: 'No image returned',
        details: data
      })
    }

    const imgRes = await fetch(firstImage.url)
    const buffer = await imgRes.arrayBuffer()
    const b64 = Buffer.from(buffer).toString('base64')

    return res.status(200).json({
      success: true,
      imageUrl: `data:image/jpeg;base64,${b64}`,
      label
    })

  } catch (error) {
    console.error('generate-images error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}