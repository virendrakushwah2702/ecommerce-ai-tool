const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).end()
  }

  try {
    const { payment_id, payment_request_id, status } = req.body

    console.log("Webhook received:", payment_id, status)

    if (status === 'Credit') {
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_request_id', payment_request_id)
        .single()

      if (payment) {
        const { data: user } = await supabase
          .from('users')
          .select('credits')
          .eq('email', payment.email)
          .single()

        if (user) {
          await supabase
            .from('users')
            .update({ 
              credits: user.credits + payment.credits,
              plan: payment.plan
            })
            .eq('email', payment.email)
        }

        await supabase
          .from('payments')
          .update({ status: 'completed', payment_id })
          .eq('payment_request_id', payment_request_id)

        console.log("Credits added successfully!")
      }
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return res.status(200).json({ error: error.message })
  }
}