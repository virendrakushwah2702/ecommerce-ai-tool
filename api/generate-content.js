export const config = {
  runtime: 'edge',
  maxDuration: 60
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || req.headers.get('referer') || ''

  if (!origin.includes('ecom-imagined-ai.vercel.app') && !origin.includes('localhost') && !origin.includes('imaginedai.in')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  try {
    const { brand, productName, category, material, platform, is_paid } = await req.json()
    const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY
    const GEMINI_KEY = process.env.GEMINI_KEY

    const systemPrompt = `You are a world class eCommerce product photographer and Amazon India listing specialist. Generate 4 UNIQUE AI image generation prompts AND complete listing content. Use NO markdown, NO headers, NO asterisks, NO hash symbols. Plain text only. Amazon policy compliant. No promotional language. No unverified health claims.`

    const userPrompt = `Generate for this product:
Brand: ${brand}
Product: ${productName}
Category: ${category}
Ingredients/Materials: ${material}
Platform: ${platform}

Use EXACTLY this format with these exact labels:

IMAGE_PROMPT_1: [Main Product - Ultra HD studio photography, pure white background, perfect lighting, product label preserved exactly, square 1024x1024]

IMAGE_PROMPT_2: [What's Inside infographic - ingredients shown around product, all text English, square 1024x1024]

IMAGE_PROMPT_3: [How To Use infographic - numbered steps with product image, all text English, square 1024x1024]

IMAGE_PROMPT_4: [Key Benefits infographic - benefit icons around product, all text English, square 1024x1024]

LISTING_CONTENT:
PRODUCT TITLE:
(Max 200 chars. Primary keyword + brand + benefit + size. Amazon optimized.)

BULLET POINT 1:
(60-80 words. Top benefit + key ingredient from ${material}.)

BULLET POINT 2:
(60-80 words. Second benefit. Different pain point.)

BULLET POINT 3:
(60-80 words. Usage method. How-to element.)

BULLET POINT 4:
(60-80 words. Quality and safety. Build trust.)

BULLET POINT 5:
(60-80 words. Brand story. What makes ${brand} different.)

PRODUCT DESCRIPTION:
(300-400 words. Flowing paragraphs. Product promise, ingredients, how to use, who it is for, brand values. Keywords natural. Amazon compliant.)

SEARCH TERMS AND KEYWORDS:
(30 keywords. Format each line exactly as: keyword | VOLUME. Assign VERY HIGH to top 8, HIGH to next 12, MEDIUM to remaining 10. Include Hindi transliterated keywords. One per line.)

FLIPKART AND MEESHO SHORT DESCRIPTION:
(80 words max. Warm tone. Top 3 benefits. Key ingredients. Call to action.)`

    // --- Gemini call (free users) ---
    const callGemini = async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { maxOutputTokens: 2500 }
          })
        }
      )
      const data = await res.json()
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error(data.error?.message || 'Gemini returned empty response')
      }
      return data.candidates[0].content.parts[0].text
    }

    // --- Claude call (paid users + Gemini fallback) ---
    const callClaude = async () => {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'prompt-caching-2024-07-31'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2500,
          stream: false,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: userPrompt }]
        })
      })
      const data = await res.json()
      if (!data.content || !data.content[0]?.text) {
        throw new Error('Claude returned empty response')
      }
      return data.content[0].text
    }

    let fullText

    if (!is_paid) {
      // Free user: try Gemini first (with one retry), fall back to Claude
      try {
        fullText = await callGemini()
        console.log("API USED: Gemini 2.5 Flash-Lite — Free user — Cost: Rs.0")
      } catch (geminiErr1) {
        console.error('Gemini attempt 1 failed:', geminiErr1.message)
        console.log('Gemini retry attempt...')
        await new Promise(r => setTimeout(r, 2000))
        try {
          fullText = await callGemini()
          console.log("API USED: Gemini 2.5 Flash-Lite — Free user (retry success) — Cost: Rs.0")
        } catch (geminiErr2) {
          console.error('Gemini attempt 2 failed, falling back to Claude:', geminiErr2.message)
          fullText = await callClaude()
          console.log("API USED: Claude Haiku FALLBACK — Gemini failed — Cost: Rs.0.88")
        }
      }
    } else {
      // Paid user: Claude only
      fullText = await callClaude()
      console.log("API USED: Claude Haiku — Paid user — Cost: Rs.0.88")
    }

    return new Response(JSON.stringify({ success: true, content: fullText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
