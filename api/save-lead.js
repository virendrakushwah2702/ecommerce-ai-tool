import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { whatsapp_number, email, product_name, category } = req.body

    if (!whatsapp_number || whatsapp_number.length < 10) {
      return res.status(200).json({ success: false, error: 'Valid WhatsApp number required' })
    }

    const { error } = await supabase
      .from('whatsapp_leads')
      .insert({
        whatsapp_number,
        email: email || '',
        product_name: product_name || '',
        category: category || ''
      })

    if (error) {
      console.error("Supabase error:", error)
      return res.status(200).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true })

  } catch (error) {
    return res.status(200).json({ error: error.message })
  }
}