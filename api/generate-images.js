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

    // Step 1: Fetch the product image as a buffer
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      return res.status(400).json({ success: false, error: 'Could not fetch product image' })
    }
    const imageBuffer = await imageRes.arrayBuffer()
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' })

    // Step 2: Build multipart/form-data (fal.ai edit requires file upload)
    const formData = new FormData()
    formData.append('image', imageBlob, 'product.png')
    formData.append('prompt', prompt)
    formData.append('size', '1024x1024')
    formData.append('quality', 'low')
    formData.append('n', '1')

    // Step 3: Call fal.ai
    const response = await fetch('https://fal.run/fal-ai/gpt-image-1/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`
        // DO NOT set Content-Type — FormData sets it automatically with boundary
      },
      body: formData
    })

    const data = await response.json()
    console.log("fal.ai response:", JSON.stringify(data).substring(0, 500))

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        error: `fal.ai error ${response.status}`,
        details: data
      })
    }

    // Step 4: Extract image — fal.ai returns images[] array with url or b64_json
    const images = data.images || data.image_urls || []
    const firstImage = images[0]

    if (!firstImage) {
      return res.status(200).json({
        success: false,
        error: 'No image in response',
        details: data
      })
    }

    // b64_json path
    if (firstImage.b64_json) {
      return res.status(200).json({
        success: true,
        imageUrl: `data:image/png;base64,${firstImage.b64_json}`,
        label
      })
    }

    // url path — fetch and convert to base64
    const imgUrl = firstImage.url || firstImage
    if (imgUrl && typeof imgUrl === 'string') {
      const imgRes = await fetch(imgUrl)
      const buffer = await imgRes.arrayBuffer()
      const b64 = Buffer.from(buffer).toString('base64')
      return res.status(200).json({
        success: true,
        imageUrl: `data:image/png;base64,${b64}`,
        label
      })
    }

    return res.status(200).json({
      success: false,
      error: 'Could not parse image from response',
      details: data
    })

  } catch (error) {
    console.error('generate-images error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}