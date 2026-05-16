import Razorpay from "razorpay"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const { action } = req.body

  if (action === "create-order") {
    try {
      const { planKey, amount, email } = req.body
      const order = await razorpay.orders.create({
        amount: amount,
        currency: "INR",
        receipt: `receipt_${planKey}_${Date.now()}`,
        notes: { email: email || "", planKey }
      })
      return res.status(200).json(order)
    } catch(e) {
      console.log("Razorpay order error:", e)
      return res.status(500).json({ error: e.message })
    }
  }

  if (action === "verify") {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, planKey, credits } = req.body

      const body = razorpay_order_id + "|" + razorpay_payment_id
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex")

      if (expectedSignature !== razorpay_signature) {
        console.log("Signature mismatch")
        return res.status(400).json({ success: false, error: "Invalid payment signature" })
      }

      const { data: userData } = await supabase
        .from("users")
        .select("credits")
        .eq("email", email)
        .single()

      if (userData) {
        const planMap = { pro: "pro", agency: "agency" }
        await supabase
          .from("users")
          .update({
            credits: (userData.credits || 0) + credits,
            plan: planMap[planKey] || planKey,
            is_paid: true
          })
          .eq("email", email)
      }

      await supabase.from("payments").insert({
        email: email,
        payment_id: razorpay_payment_id,
        payment_request_id: razorpay_order_id,
        plan: planKey,
        credits: credits,
        status: "completed"
      })

      console.log("Razorpay payment verified and credits added:", email, credits)
      return res.status(200).json({ success: true })

    } catch(e) {
      console.log("Verify Razorpay error:", e)
      return res.status(500).json({ success: false, error: e.message })
    }
  }

  return res.status(400).json({ error: "Unknown action" })
}
