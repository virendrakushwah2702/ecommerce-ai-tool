import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { key, userId, email } = req.body
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    console.log("Redeeming key:", key, "for user:", userId)

    if (!key || !userId) {
      return res.status(200).json({ success: false, error: 'Key and user required' })
    }

    const { data: discountKey, error: keyError } = await supabase
      .from('discount_keys')
      .select('*')
      .eq('key', key.toUpperCase().trim())
      .single()

    console.log("Discount key found:", discountKey, "Error:", keyError)

    if (!discountKey || keyError) {
      return res.status(200).json({ success: false, error: 'Invalid discount key' })
    }

    if (discountKey.used) {
      return res.status(200).json({ success: false, error: 'This key has already been used' })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()

    console.log("User data:", userData, "Error:", userError)

    if (!userData) {
      return res.status(200).json({ success: false, error: 'User not found' })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: userData.credits + discountKey.credits })
      .eq('id', userId)

    console.log("Update error:", updateError)

    await supabase
      .from('discount_keys')
      .update({ used: true, used_by: email })
      .eq('key', key.toUpperCase().trim())

    return res.status(200).json({
      success: true,
      credits_added: discountKey.credits,
      message: `${discountKey.credits} credits added to your account!`
    })

  } catch (error) {
    console.error("Redeem error:", error)
    return res.status(200).json({ success: false, error: error.message })
  }
}