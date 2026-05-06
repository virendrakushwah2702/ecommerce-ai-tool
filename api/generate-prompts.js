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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 40000)

    let response
    try {
      response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CEREBRAS_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3.1-8b',
          max_tokens: 1500,
          messages: [
            {
              role: 'system',
              content: 'You are a world class eCommerce product photographer with 15 years experience. You create UNIQUE detailed AI image generation prompts specific to each individual product. No two products ever get the same prompts. CRITICAL: All text in images must be in English only. All text must be perfectly legible. Image size must be 1080x1080 pixels.'
            },
            {
              role: 'user',
              content: `Generate 4 UNIQUE AI image generation prompts for this specific product. Think deeply about its color, texture, ingredients, target user, benefits and category aesthetic before writing.

Brand: ${brand}
Product: ${productName}
Category: ${category}
Key Ingredients or Materials: ${material}
Platform: ${platform || 'Amazon'}

RESPOND IN THIS EXACT FORMAT — do not add anything else:

IMAGE_PROMPT_1:
[Write a highly specific main product image prompt for THIS exact product — ${productName} by ${brand}. ${platform === 'Meesho' || platform === 'Own Website' ? 'Soft premium colored background matching the product and category aesthetic — choose the most appropriate color.' : 'Pure white background RGB 255 255 255 mandatory — Amazon and Flipkart policy compliant.'} Product bottle or package centered and prominent occupying 85 percent of frame. Professional studio lighting from top left. Subtle realistic shadow beneath product. Photorealistic ultra HD quality. 1080x1080 pixels. No text overlays. No props. No people. Clean professional finish.]

IMAGE_PROMPT_2:
[Write a highly specific ingredients infographic prompt for THIS exact product. Mention the EXACT ingredients: ${material}. Choose background color specifically matching ${category} aesthetic — sage green for hair care, soft peach for skin care, warm cream for food products, earth tones for Ayurvedic products, light lavender for cosmetics. Bold title "WHAT'S INSIDE" in large dark elegant serif font at top. ${productName} bottle or package centered prominently. Six elegant circular ingredient badges arranged symmetrically around the product — each circle contains botanical illustration of the specific ingredient and ingredient name in clean typography below. Small one line benefit text below each ingredient name. Brand name ${brand} in elegant font at bottom center. Clean minimal premium design. 1080x1080 pixels. IMPORTANT: Render all text with perfect spelling exactly as written. Do not change any ingredient names or brand name.]

IMAGE_PROMPT_3:
[Write a highly specific how to use infographic for THIS exact product — ${productName} by ${brand}. Use matching soft background color theme from image 2. Bold title "HOW TO USE" in large dark elegant serif font at top. Three numbered steps shown as elegant white rounded rectangle cards — each card has a small relevant icon and step number in a circle. Steps must be specific to how THIS exact product is used based on its category ${category} and ingredients ${material}. ${productName} bottle or package shown at bottom right corner small. Brand name ${brand} at bottom center. Clean minimal layout with good spacing. 1080x1080 pixels. IMPORTANT: Render all text with perfect spelling exactly as written. Do not change any text.]

IMAGE_PROMPT_4:
[Write a highly specific key benefits infographic for THIS exact product — ${productName} by ${brand}. Deep rich premium gradient background in colors complementary to ${category} — dark forest green for hair care, deep navy for skin care, rich burgundy for cosmetics, deep earth brown for Ayurvedic. Bold title "KEY BENEFITS" in large white elegant serif font at top. ${productName} bottle or package large and prominent on right side. Four key benefit cards on left side — each card is a white or light colored rounded rectangle with relevant icon and exactly this structure: Bold benefit headline in dark color, one line explanation below in smaller text. Benefits must be specific to ${productName} and its ingredients ${material}. Brand name ${brand} in gold or white elegant font at bottom. Premium brand aesthetic. Ultra sharp finish. 1080x1080 pixels. IMPORTANT: Render all text with perfect spelling exactly as written.]`
            }
          ]
        })
      })
    } catch (fetchErr) {
      clearTimeout(timeoutId)
      return res.status(200).json({
        success: false,
        error: fetchErr.name === 'AbortError' ? 'Prompt generation timed out. Please retry.' : fetchErr.message
      })
    }
    clearTimeout(timeoutId)

    const data = await response.json()
    console.log("Cerebras prompts status:", data.choices ? "success" : "error")

    if (data.choices && data.choices[0]) {
      return res.status(200).json({ success: true, content: data.choices[0].message.content })
    } else {
      return res.status(200).json({ success: false, error: JSON.stringify(data) })
    }
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message })
  }
}
