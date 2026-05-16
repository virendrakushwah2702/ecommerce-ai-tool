export const config = {
  maxDuration: 30
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const origin = req.headers.origin || req.headers.referer || ''
  if (!origin.includes('ecom-imagined-ai.vercel.app') && !origin.includes('localhost') && !origin.includes('imaginedai.in')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const { status_url, response_url } = req.query
    const FAL_KEY = process.env.FAL_KEY

    if (!status_url || !response_url) {
      return res.status(200).json({ done: false, error: 'Missing status_url or response_url' })
    }

    // Check job status using the exact URL fal.ai provided
    const statusRes = await fetch(decodeURIComponent(status_url), {
      headers: { 'Authorization': `Key ${FAL_KEY}` }
    })
    const status = await statusRes.json()
    console.log("fal.ai status:", status.status)

    if (status.status === 'COMPLETED') {
      // Fetch result using the exact URL fal.ai provided
      const resultRes = await fetch(decodeURIComponent(response_url), {
        headers: { 'Authorization': `Key ${FAL_KEY}` }
      })
      const result = await resultRes.json()
      console.log("fal.ai result keys:", Object.keys(result))

      if (result.images && result.images[0]) {
        const img = result.images[0]
        if (img.b64_json) {
          return res.status(200).json({ done: true, success: true, imageUrl: `data:image/png;base64,${img.b64_json}` })
        }
        if (img.url) {
          const imgRes = await fetch(img.url)
          const buffer = await imgRes.arrayBuffer()
          const b64 = Buffer.from(buffer).toString('base64')
          return res.status(200).json({ done: true, success: true, imageUrl: `data:image/jpeg;base64,${b64}` })
        }
      }
      return res.status(200).json({ done: true, success: false, error: 'No image in result', details: JSON.stringify(result).substring(0, 200) })
    }

    if (status.status === 'FAILED') {
      return res.status(200).json({ done: true, success: false, error: 'Job failed', details: JSON.stringify(status).substring(0, 200) })
    }

    // QUEUED or IN_PROGRESS — not ready yet
    return res.status(200).json({ done: false, status: status.status, queue_position: status.queue_position })

  } catch (error) {
    return res.status(200).json({ done: false, error: error.message })
  }
}
