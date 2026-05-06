export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const origin = req.headers.origin || req.headers.referer || ''
  if (!origin.includes('ecom-imagined-ai.vercel.app') && !origin.includes('localhost') && !origin.includes('imaginedai.in')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const { brand, productName, category, material, platform } = req.body
    const CEREBRAS_KEY = process.env.CEREBRAS_KEY

    // Build body once — reused in retries
    const cerebraBody = JSON.stringify({
      model: 'llama3.1-8b',
      max_tokens: 2500,
      messages: [
        {
          role: 'system',
          content: 'You are an Amazon India listing specialist with 15 years experience. You write keyword rich, Amazon policy compliant listing content that ranks high and converts buyers. Never use prohibited words: best, cheapest, guaranteed, number one, clinically proven, FDA approved. No special characters in titles.'
        },
        {
          role: 'user',
          content: `Write complete Amazon listing content for this product.

Brand: ${brand}
Product: ${productName}
Category: ${category}
Key Ingredients or Materials: ${material}
Platform: ${platform || 'Amazon'}

RESPOND IN THIS EXACT FORMAT:

LISTING_CONTENT:
PRODUCT TITLE:
(Keyword rich title, 150-200 characters. Capitalise First Letter Of Every Word. Include top Indian buyer search keywords for ${category}. Include key ingredients from ${material}. No special characters. No promotional words.)

BULLET POINT 1:
(50-60 words. Capitalised feature name followed by colon. Cover key ingredient benefits from ${material} with Ayurvedic or scientific basis. Include high volume keywords naturally.)

BULLET POINT 2:
(50-60 words. Different feature. Application method and visible results specific to ${productName}.)

BULLET POINT 3:
(50-60 words. Different feature. Safety and natural composition referencing specific ingredients from ${material}.)

BULLET POINT 4:
(50-60 words. Different feature. Target user description — who benefits most from ${productName}.)

BULLET POINT 5:
(50-60 words. Different feature. What makes ${brand} different from mass market alternatives.)

PRODUCT DESCRIPTION:
(Write 4 paragraphs. Paragraph 1: introduce ${productName} and its core promise. Paragraph 2: each ingredient from ${material} and its specific benefit. Paragraph 3: how to use step by step. Paragraph 4: who this is for and what problems it solves. No bullet points inside description. No unverified health claims. Include long tail keywords naturally.)

SEARCH TERMS AND KEYWORDS:
(List 20 search terms Indian buyers use on Amazon for ${category} products. Format each line exactly as: keyword | VOLUME where VOLUME is VERY HIGH, HIGH, or MEDIUM. Assign VERY HIGH to top 6, HIGH to next 8, MEDIUM to remaining 6. One keyword per line. Include Hindi transliterated keywords.)

FLIPKART AND MEESHO SHORT DESCRIPTION:
(80 words maximum. Warm conversational tone. Top 3 benefits of ${productName}. Key ingredients from ${material}. End with gentle call to action.)`
        }
      ]
    })

    const callCerebras = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 50000)
      try {
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CEREBRAS_KEY}` },
          body: cerebraBody
        })
        clearTimeout(timeoutId)
        return await response.json()
      } catch (err) {
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') throw new Error('timeout')
        throw err
      }
    }

    // Try up to 3 times — handles queue_exceeded / high traffic
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 5000 * attempt))

      let data
      try {
        data = await callCerebras()
      } catch (err) {
        if (err.message === 'timeout') {
          return res.status(200).json({ success: false, error: 'Content generation timed out. Please try again.' })
        }
        if (attempt < 2) continue
        return res.status(200).json({ success: false, error: err.message })
      }

      if (data.choices && data.choices[0]) {
        return res.status(200).json({ success: true, content: data.choices[0].message.content })
      }

      const isRateLimit = data.error && (
        data.error.code === 'queue_exceeded' ||
        data.error.type === 'too_many_requests_error'
      )
      if (isRateLimit && attempt < 2) continue

      return res.status(200).json({ success: false, error: isRateLimit ? 'AI service is busy. Please try again in 30 seconds.' : JSON.stringify(data) })
    }

    return res.status(200).json({ success: false, error: 'AI service is busy. Please try again in 30 seconds.' })

  } catch (error) {
    return res.status(200).json({ success: false, error: error.message })
  }
}
