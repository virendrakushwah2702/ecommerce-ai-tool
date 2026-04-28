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

    if (!imageUrl || !prompt) {
      return res.status(400).json({ success: false, error: 'imageUrl and prompt are required' })
    }

    console.log("Calling fal.ai for:", label)
    console.log("Image URL:", imageUrl.substring(0, 80))

    // fal.ai gpt-image-1 edit endpoint — sends JSON with image_url
    const response = await fetch('https://fal.run/fal-ai/gpt-image-1/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: prompt,
        strength: 0.85,
        image_size: 'square_hd',
        num_images: 1,
        output_format: 'jpeg'
      })
    })

    const data = await response.json()
    console.log("fal.ai raw response:", JSON.stringify(data).substring(0, 400))

    if (!response.ok) {
      console.error("fal.ai HTTP error:", response.status, data)
      return res.status(200).json({
        success: false,
        error: `fal.ai error ${response.status}`,
        details: data
      })
    }

    // fal.ai returns: { images: [{ url: "...", content_type: "image/jpeg" }] }
    const images = data.images || []
    const firstImage = images[0]

    if (!firstImage) {
      console.error("No images in fal.ai response:", data)
      return res.status(200).json({
        success: false,
        error: 'No image returned from fal.ai',
        details: data
      })
    }

    // Get image URL from response
    const resultUrl = firstImage.url || firstImage

    if (!resultUrl) {
      return res.status(200).json({
        success: false,
        error: 'Could not extract image URL',
        details: data
      })
    }

    // Fetch image and convert to base64 for frontend display
    const imgRes = await fetch(resultUrl)
    if (!imgRes.ok) {
      return res.status(200).json({
        success: false,
        error: 'Could not fetch generated image'
      })
    }

    const buffer = await imgRes.arrayBuffer()
    const b64 = Buffer.from(buffer).toString('base64')
    const mimeType = firstImage.content_type || 'image/jpeg'

    return res.status(200).json({
      success: true,
      imageUrl: `data:${mimeType};base64,${b64}`,
      label
    })

  } catch (error) {
    console.error('generate-images error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}