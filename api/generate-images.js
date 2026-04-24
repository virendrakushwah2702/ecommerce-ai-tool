export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-File-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const FAL_KEY = process.env.FAL_KEY
    const chunks = []
    
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    
    const buffer = Buffer.concat(chunks)
    const contentType = req.headers['x-file-type'] || 'image/jpeg'
    
    const formData = new FormData()
    const blob = new Blob([buffer], { type: contentType })
    formData.append('file', blob, 'product.jpg')

    const uploadResponse = await fetch('https://rest.fal.ai/storage/upload/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content_type: contentType,
        file_name: 'product.jpg'
      })
    })

    const uploadData = await uploadResponse.json()

    if (uploadData.upload_url) {
      const fileUpload = await fetch(uploadData.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: buffer
      })

      if (fileUpload.ok) {
        return res.status(200).json({ 
          success: true, 
          url: uploadData.file_url 
        })
      }
    }

    return res.status(200).json({ 
      success: false, 
      error: 'Upload failed',
      details: uploadData
    })

  } catch (error) {
    return res.status(200).json({ error: error.message })
  }
}