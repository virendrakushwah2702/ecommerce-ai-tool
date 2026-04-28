export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { url } = req.query
    if (!url) {
      return res.status(400).json({ error: 'No URL provided' })
    }

    const response = await fetch(decodeURIComponent(url))
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.send(Buffer.from(buffer))
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}