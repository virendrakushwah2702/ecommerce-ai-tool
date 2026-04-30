export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { plan, email, name, phone } = req.body
    const API_KEY = process.env.INSTAMOJO_API_KEY
    const AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN

    console.log("API_KEY exists:", !!API_KEY)
    console.log("AUTH_TOKEN exists:", !!AUTH_TOKEN)

    const plans = {
      starter: { amount: 199, credits: 15, name: 'Starter Plan 15 Credits' },
      growth: { amount: 499, credits: 40, name: 'Growth Plan 40 Credits' },
      pro: { amount: 1099, credits: 100, name: 'Pro Plan 100 Credits' },
      monthly: { amount: 999, credits: 60, name: 'Monthly Plan 60 Credits' },
      quarterly: { amount: 2599, credits: 180, name: 'Quarterly Plan 180 Credits' },
      agency: { amount: 4999, credits: 200, name: 'Agency Plan 200 Credits' }
    }

    const selectedPlan = plans[plan]
    if (!selectedPlan) {
      return res.status(200).json({ success: false, error: 'Invalid plan' })
    }

    const payload = `purpose=${encodeURIComponent(selectedPlan.name)}&amount=${selectedPlan.amount}&buyer_name=${encodeURIComponent(name || 'User')}&email=${encodeURIComponent(email)}&phone=${phone || ''}&redirect_url=${encodeURIComponent('https://ecom-imagined-ai.vercel.app')}&allow_repeated_payments=False`

    console.log("Sending to Instamojo:", payload.substring(0, 100))

    const response = await fetch('https://www.instamojo.com/api/1.1/payment-requests/', {
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY,
        'X-Auth-Token': AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload
    })

    const text = await response.text()
    console.log("Instamojo raw response:", text.substring(0, 500))

    const data = JSON.parse(text)

    if (data.success && data.payment_request && data.payment_request.longurl) {
      return res.status(200).json({
        success: true,
        payment_url: data.payment_request.longurl,
        payment_id: data.payment_request.id,
        plan: plan,
        credits: selectedPlan.credits
      })
    }

    return res.status(200).json({
      success: false,
      error: 'Payment creation failed',
      details: data
    })

  } catch (error) {
    console.error("Payment error:", error)
    return res.status(200).json({ error: error.message })
  }
}