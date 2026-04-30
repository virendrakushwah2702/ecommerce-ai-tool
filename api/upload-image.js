export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-File-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const origin = req.headers.origin || req.headers.referer || ''
  if (!origin.includes('ecom-imagined-ai.vercel.app') && !origin.includes('localhost') && !origin.includes('imaginedai.in')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const IMGBB_KEY = process.env.IMGBB_KEY
    const chunks = []

    for await (const chunk of req) {
      chunks.push(chunk)
    }

    const buffer = Buffer.concat(chunks)
    const base64 = buffer.toString('base64')

    const formData = new URLSearchParams()
    formData.append('key', IMGBB_KEY)
    formData.append('image', base64)

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()
    console.log("ImgBB response:", JSON.stringify(data).substring(0, 200))

    if (data.success && data.data && data.data.url) {
      return res.status(200).json({
        success: true,
        url: data.data.url
      })
    }

    return res.status(200).json({
      success: false,
      error: 'ImgBB upload failed',
      details: data
    })

  } catch (error) {
    return res.status(200).json({ error: error.message })
  }
}