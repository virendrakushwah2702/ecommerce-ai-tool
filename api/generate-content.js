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

    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEREBRAS_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content: `You are both a world class eCommerce product photographer and Amazon India listing specialist with 15 years experience. You create UNIQUE detailed AI image generation prompts specific to each individual product. No two products ever get the same prompts. You write exhaustive keyword rich Amazon policy compliant listing content that ranks high and converts buyers. You never use prohibited words like best, cheapest, guaranteed, number one, clinically proven, FDA approved. You never use special characters like ! @ # $ % in titles.`
          },
          {
            role: 'user',
            content: `You are both a world class eCommerce product photographer and Amazon India listing specialist. Generate 4 UNIQUE AI image generation prompts AND complete Amazon listing content for this specific product. CRITICAL: All text in images must be in English only. All text must be perfectly legible. Image size must be 1080x1080 pixels.

Brand: ${brand}
Product: ${productName}
Category: ${category}
Key Ingredients or Materials: ${material}
Platform: ${platform || 'Amazon'}

Think deeply about this SPECIFIC product — its color, texture, ingredients, target user, benefits and category aesthetic before writing prompts. Every prompt must be unique and specific to THIS product only.

RESPOND IN THIS EXACT FORMAT — do not change the format:

IMAGE_PROMPT_1:
[Write a highly specific main product image prompt for THIS exact product — ${productName} by ${brand}. ${platform === 'Meesho' || platform === 'Own Website' ? 'Soft premium colored background matching the product and category aesthetic — choose the most appropriate color.' : 'Pure white background RGB 255 255 255 mandatory — Amazon and Flipkart policy compliant.'} Product bottle or package centered and prominent occupying 85 percent of frame. Professional studio lighting from top left. Subtle realistic shadow beneath product. Photorealistic ultra HD quality. 1080x1080 pixels. No text overlays. No props. No people. Clean professional finish.]

IMAGE_PROMPT_2:
[Write a highly specific ingredients infographic prompt for THIS exact product. Mention the EXACT ingredients: ${material}. Choose background color specifically matching ${category} aesthetic — sage green for hair care, soft peach for skin care, warm cream for food products, earth tones for Ayurvedic products, light lavender for cosmetics. Bold title "WHAT'S INSIDE" in large dark elegant serif font at top. ${productName} bottle or package centered prominently. Six elegant circular ingredient badges arranged symmetrically around the product — each circle contains botanical illustration of the specific ingredient and ingredient name in clean typography below. Small one line benefit text below each ingredient name. Brand name ${brand} in elegant font at bottom center. Clean minimal premium design. 1080x1080 pixels. IMPORTANT: Render all text with perfect spelling exactly as written. Do not change any ingredient names or brand name.]

IMAGE_PROMPT_3:
[Write a highly specific how to use infographic for THIS exact product — ${productName} by ${brand}. Use matching soft background color theme from image 2. Bold title "HOW TO USE" in large dark elegant serif font at top. Three numbered steps shown as elegant white rounded rectangle cards — each card has a small relevant icon and step number in a circle. Steps must be specific to how THIS exact product is used based on its category ${category} and ingredients ${material}. ${productName} bottle or package shown at bottom right corner small. Brand name ${brand} at bottom center. Clean minimal layout with good spacing. 1080x1080 pixels. IMPORTANT: Render all text with perfect spelling exactly as written. Do not change any text.]

IMAGE_PROMPT_4:
[Write a highly specific key benefits infographic for THIS exact product — ${productName} by ${brand}. Deep rich premium gradient background in colors complementary to ${category} — dark forest green for hair care, deep navy for skin care, rich burgundy for cosmetics, deep earth brown for Ayurvedic. Bold title "KEY BENEFITS" in large white elegant serif font at top. ${productName} bottle or package large and prominent on right side. Four key benefit cards on left side — each card is a white or light colored rounded rectangle with relevant icon and exactly this structure: Bold benefit headline in dark color, one line explanation below in smaller text. Benefits must be specific to ${productName} and its ingredients ${material}. Brand name ${brand} in gold or white elegant font at bottom. Premium brand aesthetic. Ultra sharp finish. 1080x1080 pixels. IMPORTANT: Render all text with perfect spelling exactly as written.]

LISTING_CONTENT:
PRODUCT TITLE:
(Write a keyword rich compelling title for ${productName} by ${brand}. Must be between 150 and 200 characters. Capitalise First Letter Of Every Word. Include top trending search keywords Indian buyers use on Amazon for ${category}. Include key ingredients from ${material}. Include pack size or quantity if known. No special characters. No promotional words like Best or Guaranteed or Number One.)

BULLET POINT 1:
(50-60 words. Start with capitalised feature name followed by colon. Include specific ingredient details from ${material} and their proven Ayurvedic or scientific benefits. Include relevant high volume keywords naturally. Be specific to ${productName}.)

BULLET POINT 2:
(50-60 words. Different feature from bullet 1. Focus on application method and results. Specific to ${productName} and ${category}.)

BULLET POINT 3:
(50-60 words. Different feature. Focus on what makes this product safe and natural. Reference specific ingredients from ${material}.)

BULLET POINT 4:
(50-60 words. Different feature. Focus on who this product is for — specific target user description for ${productName}.)

BULLET POINT 5:
(50-60 words. Different feature. Focus on what makes ${brand} different from mass market chemical alternatives. Brand story and values.)

PRODUCT DESCRIPTION:
(Minimum 500 words. Write in flowing paragraphs — no bullet points inside description. Cover these sections naturally: Opening paragraph introducing ${productName} and its core promise. Second paragraph covering each ingredient from ${material} and its specific traditional or scientific benefit. Third paragraph on how to use ${productName} step by step. Fourth paragraph on who this product is for and what problems it solves. Fifth paragraph on what makes ${brand} philosophy different. Closing paragraph with what is in the box and any usage tips. Include long tail keywords naturally throughout. Amazon policy compliant. No promotional language. No unverified health claims.)

SEARCH TERMS AND KEYWORDS:
(List 30 search terms Indian buyers use on Amazon and Flipkart for ${category} products like ${productName}. Format EACH line exactly as: keyword | VOLUME where VOLUME is one of VERY HIGH, HIGH, or MEDIUM. Example line: bhringraj hair oil | VERY HIGH. You MUST assign VERY HIGH to top 8 most searched keywords, HIGH to next 12, MEDIUM to remaining 10. Mix short tail and long tail keywords. Include Hindi transliterated keywords. One keyword per line only.)

FLIPKART AND MEESHO SHORT DESCRIPTION:
(100 words maximum. Warm conversational tone appropriate for Indian buyers. Highlight top 3 specific benefits of ${productName}. Mention key ingredients from ${material}. Primary category keyword included naturally. End with a gentle call to action.)`
          }
        ]
      })
    })

    const data = await response.json()
    console.log("Cerebras response status:", data.choices ? "success" : "error")

    if (data.choices && data.choices[0]) {
      return res.status(200).json({
        success: true,
        content: data.choices[0].message.content
      })
    } else {
      return res.status(200).json({
        success: false,
        error: JSON.stringify(data)
      })
    }
  } catch (error) {
    return res.status(200).json({ 
      success: false, 
      error: error.message 
    })
  }
}