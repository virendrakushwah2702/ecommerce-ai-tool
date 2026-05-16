import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
)

async function sendText(phone, name, message) {
  try {
    const res = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: process.env.AISENSY_API_KEY,
        campaignName: "free_form_text",
        destination: phone,
        userName: name,
        source: "api",
        media: {},
        templateParams: [],
        tags: ["delivery"],
        attributes: { body: message }
      })
    })
    const data = await res.json()
    console.log("Text sent:", data)
  } catch(e) {
    console.log("Text send error:", e)
  }
}

async function sendImage(phone, name, imageUrl, caption) {
  try {
    const res = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: process.env.AISENSY_API_KEY,
        campaignName: "free_form_image",
        destination: phone,
        userName: name,
        source: "api",
        media: { url: imageUrl, filename: "listing.jpg", caption: caption },
        templateParams: [],
        tags: ["delivery"],
        attributes: {}
      })
    })
    const data = await res.json()
    console.log("Image sent:", data)
  } catch(e) {
    console.log("Image send error:", e)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(200).end()

  // Respond 200 immediately — AiSensy requires quick acknowledgement
  res.status(200).json({ success: true })

  try {
    // AiSensy Flow Builder sends the phone number in the webhook payload
    // Common field names AiSensy uses:
    const rawPhone =
      req.body?.phone ||
      req.body?.data?.phone ||
      req.body?.waId ||
      req.body?.mobile ||
      req.body?.contact?.phone ||
      req.body?.contact?.wa_id

    if (!rawPhone) {
      console.log("No phone in webhook payload:", JSON.stringify(req.body))
      return
    }

    // Normalise — strip non-digits, ensure starts with 91
    const digits = String(rawPhone).replace(/\D/g, "")
    const phone = digits.startsWith("91") ? digits : `91${digits}`

    const name =
      req.body?.data?.name ||
      req.body?.name ||
      req.body?.contact?.name ||
      "Seller"

    console.log("Webhook received — looking up delivery for phone:", phone)

    // Look up pending delivery by phone number (exact match first)
    let delivery = null
    let lookupError = null

    const exactMatch = await supabase
      .from("pending_deliveries")
      .select("*")
      .eq("whatsapp_number", phone)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!exactMatch.error && exactMatch.data) {
      delivery = exactMatch.data
    } else {
      // Fallback: most recent pending delivery in last 30 minutes (for users who didn't enter phone)
      const recent = await supabase
        .from("pending_deliveries")
        .select("*")
        .eq("status", "pending")
        .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!recent.error && recent.data) {
        delivery = recent.data
      } else {
        lookupError = recent.error
      }
    }

    if (!delivery) {
      console.log("No pending delivery found for phone:", phone, lookupError)
      await sendText(
        phone,
        name,
        "Hi! 👋 Welcome to Imagined AI!\n\nPlease generate your listing at imaginedai.in first, then come back and send this message to receive your results!"
      )
      return
    }

    // Mark as processing to prevent duplicate sends
    await supabase
      .from("pending_deliveries")
      .update({ status: "processing", whatsapp_number: phone })
      .eq("id", delivery.id)

    // MESSAGE 1 — Welcome
    await sendText(
      phone,
      name,
      "Hi! 👋 Welcome to Imagined AI!\n\nYour complete listing results are being sent to you right now!\n\n— Team Imagined AI 🚀"
    )
    await sleep(2000)

    // MESSAGE 2 — Complete results with keywords
    const resultText = delivery.result || ""
    let keywordsText = ""
    if (delivery.keywords && delivery.keywords.length > 0) {
      keywordsText = delivery.keywords.map(kw => {
        const icon = kw.volume === "VERY HIGH" ? "🔥" : kw.volume === "HIGH" ? "📈" : "📊"
        return `${icon} ${kw.keyword} — ${kw.volume}`
      }).join("\n")
    }

    const completeMessage =
      `🎉 Your Complete Listing Results\n\n` +
      `Product: ${delivery.product_name}\n` +
      `Brand: ${delivery.brand}\n` +
      `Category: ${delivery.category}\n\n` +
      `${resultText}\n\n` +
      `🔑 KEYWORDS WITH SEARCH VOLUME:\n` +
      `${keywordsText}\n\n` +
      `💾 Your results are also saved in your generation history at imaginedai.in`

    await sendText(phone, name, completeMessage)
    await sleep(2000)

    // MESSAGE 3A — Demo images intro
    await sendText(phone, name, `🖼️ Sample transformations from ${delivery.category} sellers using Imagined AI:`)
    await sleep(1000)

    const demoImages = delivery.demo_image_urls || []
    for (let i = 0; i < Math.min(demoImages.length, 5); i++) {
      await sendImage(phone, name, demoImages[i].url, `Sample ${delivery.category} transformation`)
      await sleep(2000)
    }

    // MESSAGE 3B — User images
    if (!delivery.is_paid) {
      await sendText(
        phone,
        name,
        `🔒 Your ${delivery.product_name} images have been generated and are available in your account.\n\nLogin at imaginedai.in to access them.\n\n💾 All results including images are saved in your generation history.`
      )
      await sleep(1000)
      for (let i = 0; i < Math.min(demoImages.length, 4); i++) {
        await sendImage(phone, name, demoImages[i].url, "Available in your imaginedai.in account")
        await sleep(2000)
      }
    } else {
      const imageLabels = ["Main Product Image", "Whats Inside", "How To Use", "Key Benefits"]
      const userImages = delivery.image_urls || []
      await sendText(phone, name, `🖼️ Your 4 Professional AI Images for ${delivery.product_name}:`)
      await sleep(1000)
      for (let i = 0; i < userImages.length; i++) {
        const isLast = i === userImages.length - 1
        const caption = isLast
          ? `${imageLabels[i] || "Image"} — ${delivery.product_name}\n\n💾 Your results are also saved at imaginedai.in`
          : `${imageLabels[i] || "Image"} — ${delivery.product_name}`
        await sendImage(phone, name, userImages[i].url, caption)
        await sleep(2000)
      }
    }

    // Mark delivered
    await supabase
      .from("pending_deliveries")
      .update({ status: "delivered" })
      .eq("id", delivery.id)

    // Save lead
    await supabase.from("whatsapp_leads").insert({
      whatsapp_number: phone,
      email: delivery.user_email,
      product_name: delivery.product_name,
      category: delivery.category
    }).catch(() => {})

    console.log("All messages delivered successfully to:", phone)

  } catch(e) {
    console.log("Webhook processing error:", e)
  }
}
