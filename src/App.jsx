import { useState, useEffect } from "react"
import { supabase } from "./supabase.js"

const CATEGORIES = [
  "Hair Care", "Skin Care", "Personal Care",
  "Food and Nutrition", "Home and Kitchen",
  "Home and Storage", "Clothing and Fashion",
  "Cosmetics", "Ayurvedic and Natural"
]

const PLATFORMS = ["Amazon", "Flipkart", "Meesho", "Own Website", "All Platforms"]

const LOADING_MESSAGES = [
  "Analysing your product...",
  "Crafting AI image prompts...",
  "Generating professional images...",
  "Writing listing content...",
  "Optimising for search keywords...",
  "Almost ready..."
]

function App() {
  const [screen, setScreen] = useState("home")
  const [brand, setBrand] = useState("")
  const [productName, setProductName] = useState("")
  const [category, setCategory] = useState("Hair Care")
  const [platform, setPlatform] = useState("Amazon")
  const [material, setMaterial] = useState("")
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null)
  const [disclaimer, setDisclaimer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState("")
  const [result, setResult] = useState("")
  const [lastGeneration, setLastGeneration] = useState(null)
  const [generatedImages, setGeneratedImages] = useState([])
  const [error, setError] = useState("")
  const [user, setUser] = useState(null)
  const [credits, setCredits] = useState(0)
  const [authScreen, setAuthScreen] = useState("login")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [loadingStep, setLoadingStep] = useState(0)
  const [prevScreen, setPrevScreen] = useState("home")
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [keywords, setKeywords] = useState([])

  const DEMO_SETS = {
    "Hair Care": [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop"
    ],
    "Skin Care": [
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556228994-5e8885f9a4b5?w=400&h=400&fit=crop"
    ],
    "Food and Nutrition": [
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1559181567-c3190ca9be46?w=400&h=400&fit=crop"
    ],
    "Ayurvedic and Natural": [
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1611073615830-9b592f193cac?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1542736667-069246bdbc6d?w=400&h=400&fit=crop"
    ],
    "Cosmetics": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400&h=400&fit=crop"
    ],
    "Personal Care": [
      "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556228841-a3c527ebefe5?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop"
    ],
    "Home and Kitchen": [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=400&fit=crop"
    ],
    "Clothing and Fashion": [
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=400&h=400&fit=crop"
    ],
    "Home and Storage": [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=400&fit=crop"
    ]
  }
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [whatsappCaptured, setWhatsappCaptured] = useState(false)
  const [whatsappError, setWhatsappError] = useState("")
  const [discountKey, setDiscountKey] = useState("")
  const [discountMsg, setDiscountMsg] = useState("")
  const [discountLoading, setDiscountLoading] = useState(false)

  const loadHistory = async (userId) => {
    setHistoryLoading(true)
    const { data } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data && data.length > 0) {
      setHistory(data.map(item => ({
        brand: item.brand,
        productName: item.product_name,
        category: item.category,
        content: item.content,
        images: item.image_urls || [],
        date: new Date(item.created_at).toLocaleDateString('en-IN')
      })))
      const last = data[0]
      setResult(last.content || '')
      setGeneratedImages((last.image_urls || []).map(img => ({ ...img, imageUrl: img.url, success: true })))
      setLastGeneration(last)
    }
    setHistoryLoading(false)
  }
useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) { loadCredits(session.user.id); loadHistory(session.user.id) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) { loadCredits(session.user.id); loadHistory(session.user.id) }
    })
    return () => subscription.unsubscribe()
  }, [])

   
  const loadCredits = async (userId) => {
    const { data } = await supabase.from('users').select('credits, plan').eq('id', userId).single()
    if (data) {
      setCredits(data.credits)
      setUser(prev => ({ ...prev, plan: data.plan }))
    }
  }

  const handleSignUp = async () => {
    setAuthLoading(true)
    setAuthError("")
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
    if (error) {
      setAuthError(error.message)
    } else {
      setAuthError("✅ Account created! Please check your email to verify your account. Then come back and login below.")
      setAuthScreen("login")
    }
    setAuthLoading(false)
  }

  const handleLogin = async () => {
    setAuthLoading(true)
    setAuthError("")
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    if (error) {
      setAuthError(error.message)
    } else {
      if (!whatsappCaptured && !whatsappNumber) {
        setScreen("whatsapp")
      } else {
        setScreen("home")
      }
    }
    setAuthLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCredits(0)
    setScreen("home")
  }

  const deductCredits = async (userId, amount) => {
    const { data } = await supabase.from('users').select('credits').eq('id', userId).single()
    if (!data || data.credits < amount) throw new Error('Insufficient credits')
    await supabase.from('users').update({ credits: data.credits - amount }).eq('id', userId)
    setCredits(data.credits - amount)
  }

  const handleRedeemKey = async () => {
    if (!discountKey) return
    setDiscountLoading(true)
    setDiscountMsg("")
    try {
      const res = await fetch('/api/redeem-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: discountKey,
          userId: user.id,
          email: user.email
        })
      })
      const data = await res.json()
      if (data.success) {
        setDiscountMsg(`✅ ${data.message}`)
        await loadCredits(user.id)
        setDiscountKey("")
      } else {
        setDiscountMsg(`❌ ${data.error}`)
      }
    } catch (err) {
      setDiscountMsg("❌ Something went wrong")
    }
    setDiscountLoading(false)
  }

  const handleWhatsAppCapture = async () => {
    if (!whatsappNumber || whatsappNumber.length < 10) {
      setWhatsappError("Please enter a valid 10 digit WhatsApp number")
      return
    }
    setWhatsappError("")
    try {
      await fetch('/api/save-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_number: whatsappNumber,
          email: user?.email || '',
          product_name: productName,
          category: category
        })
      })
      setWhatsappCaptured(true)
    } catch (err) {
      console.error("WhatsApp capture error:", err)
      setWhatsappCaptured(true)
    }
  }

  const handlePayment = async (planKey, planName, amount) => {
    if (!user) {
      setScreen("whatsapp")
      return
    }
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planKey,
          email: user.email,
          name: user.email.split('@')[0],
          phone: ''
        })
      })
      const data = await res.json()
      console.log("Payment response:", data)
      if (data.success && data.payment_url) {
        await supabase.from('payments').insert({
          user_id: user.id,
          email: user.email,
          plan: planKey,
          credits: data.credits,
          amount: amount,
          payment_request_id: data.payment_id,
          status: 'pending'
        })
        window.open(data.payment_url, '_blank')
      } else {
        alert('Payment initialization failed. Please try again.')
      }
    } catch (err) {
      console.error("Payment error:", err)
      alert('Something went wrong. Please try again.')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadedImage(file)
    setUploadedImageUrl(URL.createObjectURL(file))
  }

  const makeSquareImage = async (file) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const size = Math.max(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, size, size)
        const x = (size - img.width) / 2
        const y = (size - img.height) / 2
        ctx.drawImage(img, x, y, img.width, img.height)
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const uploadToImgBB = async (file) => {
    const squareFile = await makeSquareImage(file)
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      body: squareFile,
      headers: { 'X-File-Type': 'image/jpeg' }
    })
    const data = await res.json()
    console.log("Upload result:", data)
    if (!data.success) throw new Error(data.error || 'Upload failed')
    return data.url
  }

  const extractPrompts = (text) => {
    const prompts = []
    const labels = ["Main Product Image", "What's Inside", "How To Use", "Key Benefits"]
    for (let i = 1; i <= 4; i++) {
      const marker = `IMAGE_PROMPT_${i}:`
      const startIndex = text.indexOf(marker)
      if (startIndex !== -1) {
        const afterMarker = text.substring(startIndex + marker.length).trim()
        const nextMarker = `IMAGE_PROMPT_${i + 1}:`
        const endIndex = afterMarker.indexOf(nextMarker)
        const promptText = endIndex !== -1
          ? afterMarker.substring(0, endIndex).trim()
          : afterMarker.substring(0, 800).trim()
        const cleanPrompt = promptText.replace(/^\[/, "").replace(/\]$/, "").trim()
        prompts.push({ prompt: cleanPrompt, label: labels[i - 1] })
      }
    }
    return prompts
  }

  const extractContent = (text) => {
    const contentStart = text.indexOf("LISTING_CONTENT:")
    if (contentStart !== -1) {
      return text.substring(contentStart + 16).trim()
        .replace(/\*\*/g, "").replace(/\*/g, "")
    }
    return text.replace(/\*\*/g, "").replace(/\*/g, "")
  }

  const extractKeywords = (text) => {
    const keywordsStart = text.indexOf("SEARCH TERMS AND KEYWORDS:")
    const flipkartStart = text.indexOf("FLIPKART AND MEESHO")
    if (keywordsStart === -1) return []
    const keywordsSection = text.substring(
      keywordsStart + 26,
      flipkartStart !== -1 ? flipkartStart : keywordsStart + 1000
    ).trim()
    return keywordsSection.split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 15)
      .map(line => {
        const parts = line.split('|')
        const keyword = parts[0].trim().replace(/\*\*/g, '').replace(/\*/g, '').replace(/^\d+\.\s*/, '')
        const volume = parts[1] ? parts[1].trim() : 'MEDIUM'
        return { keyword, volume }
      })
  }

  const generateImages = async (prompts, imageUrl) => {
    const promises = prompts.map(async ({ prompt, label }) => {
      try {
        console.log("Generating image for:", label)
        const res = await fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, prompt, label })
        })
        const data = await res.json()
        console.log("Image gen result:", label, data.success)
        return { ...data, label }
      } catch (err) {
        console.error("Image gen error:", err)
        return { success: false, error: err.message, label }
      }
    })
    return Promise.all(promises)
  }

  const handleGenerate = async () => {
    if (!brand || !productName || !material || !uploadedImage || !disclaimer) {
      setError("Please fill all fields, upload an image, and accept the disclaimer.")
      return
    }
    setError("")

    if (!user) {
      setScreen("whatsapp")
      return
    }

    if (credits < 1) {
      setError("Insufficient credits! Please purchase more credits to continue.")
      return
    }

    

    setLoading(true)
    setGeneratedImages([])
    setResult("")
    setScreen("result")

    try {
      setLoadingMsg("Uploading your product image...")
      const imgbbUrl = await uploadToImgBB(uploadedImage)
      console.log("ImgBB URL:", imgbbUrl)

      setLoadingMsg("Writing listing content with AI...")
      const contentRes = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, productName, category, material, platform })
      })
      const contentData = await contentRes.json()
      if (!contentData.success) throw new Error(contentData.error || "Content generation failed")

      const content = contentData.content
      setResult(extractContent(content))
      setKeywords(extractKeywords(content))

      let images = []
      if (credits >= 10) {
        setLoadingMsg("Generating professional images...")
        const prompts = extractPrompts(content)
        console.log("Prompts extracted:", prompts.length)
        if (prompts.length > 0) {
          images = await generateImages(prompts, imgbbUrl)
          setGeneratedImages(images)
        }
      } else {
        setLoadingMsg("Preparing your preview...")
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const successfulImages = images.filter(img => img && img.success)
      if (successfulImages.length > 0) {
        await deductCredits(user.id, 3)
        const { error: genError } = await supabase.from('generations').insert({
          user_id: user.id,
          brand,
          product_name: productName,
          category,
          content: extractContent(contentData.content).substring(0, 5000),
          image_urls: successfulImages.map(img => ({ url: img.imageUrl, label: img.label }))
        })
        console.log("Generation save error:", genError)
        await loadHistory(user.id)
      } else if (credits < 10) {
        await deductCredits(user.id, 1)
        const { error: genError2 } = await supabase.from('generations').insert({
          user_id: user.id,
          brand,
          product_name: productName,
          category,
          content: extractContent(contentData.content).substring(0, 5000),
          image_urls: []
        })
        console.log("Generation save error free:", genError2)
        await loadHistory(user.id)
      }
      setLoading(false)
    } catch (err) {
      console.error("Generation error:", err)
      setError(err.message)
      setLoading(false)
    }
  }

  const inp = {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    border: "1.5px solid #e0d7ff",
    borderRadius: "8px",
    boxSizing: "border-box",
    marginBottom: "16px",
    fontFamily: "Arial",
    background: "white"
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f4ff", fontFamily: "Arial" }}>

      {screen === "history" && (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#4a00e0", fontSize: "16px", cursor: "pointer", marginBottom: "20px" }}>← Back</button>
          <h2 style={{ color: "#4a00e0", marginBottom: "24px" }}>📋 Generation History</h2>
          {historyLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ width: "40px", height: "40px", border: "4px solid #f0ebff", borderTop: "4px solid #4a00e0", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
              <p style={{ color: "#666" }}>Loading your history...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ background: "white", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
              <p style={{ color: "#666" }}>No generations yet. Generate your first listing!</p>
              <button onClick={() => setScreen("form")} style={{ background: "#4a00e0", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", marginTop: "16px" }}>
                Generate Now →
              </button>
            </div>
          ) : (
            history.map((item, i) => (
              <div key={i} style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ color: "#4a00e0", margin: "0 0 4px" }}>{item.productName || item.product_name}</h3>
                    <p style={{ color: "#666", fontSize: "13px", margin: "0" }}>{item.brand} • {item.category} • {item.date}</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                  {(item.images || []).map((img, j) => (
                    <div key={j}>
                      <p style={{ fontSize: "11px", color: "#666", margin: "0 0 4px" }}>{img.label}</p>
                      <img src={img.url || img.imageUrl} alt={img.label} style={{ width: "100%", borderRadius: "8px" }} />
                    </div>
                  ))}
                </div>
                {item.content && (
                  <div style={{ background: "#f8f4ff", borderRadius: "12px", padding: "16px", marginBottom: "12px", maxHeight: "200px", overflowY: "auto" }}>
                    <p style={{ fontSize: "13px", color: "#333", lineHeight: "1.8", whiteSpace: "pre-wrap", margin: "0" }}>
                      {item.content.substring(0, 500)}...
                    </p>
                  </div>
                )}
                <button onClick={() => { navigator.clipboard.writeText(item.content); alert("Content copied!") }}
                  style={{ background: "#4a00e0", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                  📋 Copy Full Content
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {screen === "privacy" && (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#4a00e0", fontSize: "16px", cursor: "pointer", marginBottom: "20px" }}>← Back</button>
          <h2 style={{ color: "#4a00e0", marginBottom: "24px" }}>Privacy Policy</h2>
          <div style={{ background: "white", borderRadius: "16px", padding: "32px", lineHeight: "1.9", color: "#333", fontSize: "15px" }}>
            <p><strong>Last updated: April 2026</strong></p>
            <p>EcomImagined AI ("we", "us", "our") operates imaginedai.in. This page informs you of our policies regarding the collection, use, and disclosure of personal data.</p>
            <h3 style={{ color: "#4a00e0" }}>Information We Collect</h3>
            <p>We collect email address, WhatsApp number, product information you provide, and usage data. We use this to provide and improve our service.</p>
            <h3 style={{ color: "#4a00e0" }}>How We Use Your Data</h3>
            <p>Your data is used to provide AI generated content and images, process payments, send service updates via WhatsApp, and improve our platform.</p>
            <h3 style={{ color: "#4a00e0" }}>Data Security</h3>
            <p>We use industry standard encryption and secure cloud storage. Your product images are processed and not stored permanently on our servers.</p>
            <h3 style={{ color: "#4a00e0" }}>Third Party Services</h3>
            <p>We use Supabase for authentication, fal.ai for image generation, Cerebras for content generation, ImgBB for temporary image hosting, and Instamojo for payments.</p>
            <h3 style={{ color: "#4a00e0" }}>Contact Us</h3>
            <p>For privacy concerns email us at support@imaginedai.in</p>
          </div>
        </div>
      )}

      {screen === "terms" && (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#4a00e0", fontSize: "16px", cursor: "pointer", marginBottom: "20px" }}>← Back</button>
          <h2 style={{ color: "#4a00e0", marginBottom: "24px" }}>Terms and Conditions</h2>
          <div style={{ background: "white", borderRadius: "16px", padding: "32px", lineHeight: "1.9", color: "#333", fontSize: "15px" }}>
            <p><strong>Last updated: April 2026</strong></p>
            <p>By using EcomImagined AI at imaginedai.in you agree to these terms.</p>
            <h3 style={{ color: "#4a00e0" }}>Service Description</h3>
            <p>EcomImagined AI provides AI generated product images and Amazon listing content for eCommerce sellers. Results are AI generated and should be reviewed before use.</p>
            <h3 style={{ color: "#4a00e0" }}>Credits and Payments</h3>
            <p>Credits are non-refundable once used. Unused credits do not expire. Each generation costs 3 credits. Payments are processed securely via Instamojo.</p>
            <h3 style={{ color: "#4a00e0" }}>User Responsibilities</h3>
            <p>You confirm that product images you upload belong to you. You are responsible for reviewing AI generated content before publishing on any marketplace. We are not responsible for listing rejections.</p>
            <h3 style={{ color: "#4a00e0" }}>Intellectual Property</h3>
            <p>AI generated images and content belong to you after generation. You grant us license to process your images for generation purposes only.</p>
            <h3 style={{ color: "#4a00e0" }}>Contact Us</h3>
            <p>For queries email us at support@imaginedai.in</p>
          </div>
        </div>
      )}

      {screen === "refund" && (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#4a00e0", fontSize: "16px", cursor: "pointer", marginBottom: "20px" }}>← Back</button>
          <h2 style={{ color: "#4a00e0", marginBottom: "24px" }}>Refund Policy</h2>
          <div style={{ background: "white", borderRadius: "16px", padding: "32px", lineHeight: "1.9", color: "#333", fontSize: "15px" }}>
            <p><strong>Last updated: April 2026</strong></p>
            <h3 style={{ color: "#4a00e0" }}>Credit Refunds</h3>
            <p>Unused credits are eligible for refund within 7 days of purchase. Credits that have been used for generation are non-refundable.</p>
            <h3 style={{ color: "#4a00e0" }}>Technical Issues</h3>
            <p>If images fail to generate due to technical issues on our end, credits will be refunded immediately to your account.</p>
            <h3 style={{ color: "#4a00e0" }}>How To Request Refund</h3>
            <p>Email support@imaginedai.in with your registered email and reason for refund. We process all refund requests within 48 hours.</p>
            <h3 style={{ color: "#4a00e0" }}>Payment Refunds</h3>
            <p>Approved refunds are processed back to original payment method within 5-7 business days via Instamojo.</p>
          </div>
        </div>
      )}

      {screen === "pricing" && (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
          <button onClick={() => setScreen(prevScreen || "home")} style={{ background: "none", border: "none", color: "#4a00e0", fontSize: "16px", cursor: "pointer", marginBottom: "20px" }}>← Back</button>
          <h2 style={{ color: "#4a00e0", textAlign: "center", marginBottom: "8px" }}>Choose Your Plan</h2>
          <p style={{ color: "#666", textAlign: "center", marginBottom: "32px" }}>Credits never expire. Pay only for what you use.</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            {[
              { name: "Starter", key: "starter", credits: 15, price: "₹199", generations: "5 generations", popular: false },
              { name: "Growth", key: "growth", credits: 40, price: "₹499", generations: "13 generations", popular: true },
              { name: "Pro", key: "pro", credits: 100, price: "₹1,099", generations: "33 generations", popular: false },
              { name: "Agency", key: "agency", credits: 200, price: "₹4,999", generations: "66 generations", popular: false }
            ].map((plan, i) => (
              <div key={i} style={{ background: plan.popular ? "#4a00e0" : "white", borderRadius: "16px", padding: "24px", border: plan.popular ? "none" : "2px solid #e0d7ff", textAlign: "center", position: "relative" }}>
                {plan.popular && <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#ffd700", borderRadius: "20px", padding: "4px 16px", fontSize: "12px", fontWeight: "bold", color: "#333" }}>MOST POPULAR</div>}
                <h3 style={{ color: plan.popular ? "white" : "#333", marginBottom: "8px" }}>{plan.name}</h3>
                <p style={{ color: plan.popular ? "#e0d7ff" : "#666", fontSize: "13px", marginBottom: "12px" }}>{plan.credits} credits • {plan.generations}</p>
                <p style={{ color: plan.popular ? "white" : "#4a00e0", fontSize: "28px", fontWeight: "bold", margin: "0 0 16px" }}>{plan.price}</p>
                <button onClick={() => handlePayment(plan.key, plan.name, parseInt(plan.price.replace('₹','').replace(',','')))}
                  style={{ background: plan.popular ? "white" : "#4a00e0", color: plan.popular ? "#4a00e0" : "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", width: "100%", fontSize: "15px", fontWeight: "bold" }}>
                  Buy Now
                </button>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: "16px", padding: "24px", textAlign: "center", border: "2px solid #e0d7ff" }}>
            <h3 style={{ color: "#333", marginBottom: "8px" }}>Monthly Subscription</h3>
            <p style={{ color: "#666", fontSize: "13px", marginBottom: "12px" }}>150 credits/month • 50 generations/month</p>
            <p style={{ color: "#4a00e0", fontSize: "28px", fontWeight: "bold", margin: "0 0 16px" }}>₹999/month</p>
            <button onClick={() => handlePayment('monthly', 'Monthly Plan', 999)}
            style={{ background: "#4a00e0", color: "white", border: "none", padding: "12px 40px", borderRadius: "8px", cursor: "pointer", fontSize: "15px", fontWeight: "bold" }}>
              Subscribe Now
            </button>
          </div>
        </div>
      )}

      {screen === "auth" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "40px", maxWidth: "440px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛍️</div>
            <h2 style={{ color: "#4a00e0", marginBottom: "24px" }}>
              {authScreen === "login" ? "Welcome Back!" : "Create Account"}
            </h2>
            <input style={{ width: "100%", padding: "12px", fontSize: "15px", border: "1.5px solid #e0d7ff", borderRadius: "8px", boxSizing: "border-box", marginBottom: "12px", fontFamily: "Arial" }}
              type="email" placeholder="Email address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            <input style={{ width: "100%", padding: "12px", fontSize: "15px", border: "1.5px solid #e0d7ff", borderRadius: "8px", boxSizing: "border-box", marginBottom: "16px", fontFamily: "Arial" }}
              type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
            {authError && <p style={{ color: authError.includes("✅") ? "green" : "red", fontSize: "13px", marginBottom: "12px" }}>{authError}</p>}
            {authError && authError.includes("✅") && (
              <div style={{ background: "#fff9e6", borderRadius: "10px", padding: "12px", marginBottom: "12px", border: "1px solid #ffd700" }}>
                <p style={{ color: "#886000", fontSize: "13px", margin: "0", lineHeight: "1.7" }}>
                  📌 <strong>Can't find the email?</strong> Please check your <strong>Spam or Junk folder</strong> and mark it as "Not Spam" to ensure future emails reach your inbox!
                </p>
              </div>
            )}
            <button onClick={authScreen === "login" ? handleLogin : handleSignUp}
              disabled={authLoading}
              style={{ width: "100%", background: "#4a00e0", color: "white", border: "none", padding: "14px", fontSize: "16px", borderRadius: "10px", cursor: "pointer", marginBottom: "12px" }}>
              {authLoading ? "Please wait..." : authScreen === "login" ? "Login" : "Create Account"}
            </button>
            <p style={{ color: "#666", fontSize: "14px", cursor: "pointer" }}
              onClick={() => setAuthScreen(authScreen === "login" ? "signup" : "login")}>
              {authScreen === "login" ? "New user? Create account →" : "Already have account? Login →"}
            </p>
            <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#999", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>← Back to Home</button>
          </div>
        </div>
      )}

      {screen === "home" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "48px 40px", maxWidth: "540px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛍️</div>
            <h1 style={{ fontSize: "32px", color: "#4a00e0", marginBottom: "12px" }}>EcomImagined AI</h1>
            <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6", marginBottom: "24px" }}>
              Upload your product photo — get 4 professional images and complete marketplace listing content in minutes
            </p>
            <div style={{ background: "#f0ebff", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: "#4a00e0", fontWeight: "bold", margin: "0", fontSize: "14px" }}>🎁 Free Account — 3 Credits Included</p>
              <p style={{ color: "#666", fontSize: "13px", margin: "8px 0 0" }}>Generate listing content 3 times — completely free</p>
            </div>
            <div style={{ background: "#f0f7ff", borderRadius: "12px", padding: "12px 16px", marginBottom: "28px" }}>
              <p style={{ color: "#0066cc", fontSize: "13px", margin: "0" }}>
                ✅ AI Enhances Your Photo — ✅ 4 Professional Images — ✅ Marketplace Ready Content
              </p>
            </div>
            {user ? (
              <div>
                <div style={{ background: "#f0f7ff", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
                  <p style={{ color: "#0066cc", fontSize: "14px", margin: "0" }}>👤 {user.email}</p>
                  <p style={{ color: "#4a00e0", fontSize: "14px", margin: "4px 0 0", fontWeight: "bold" }}>💎 {credits} credits remaining</p>
                </div>
                <button onClick={() => setScreen("form")} style={{ background: "#4a00e0", color: "white", border: "none", padding: "16px", fontSize: "17px", borderRadius: "10px", cursor: "pointer", width: "100%", marginBottom: "12px" }}>
                  ✨ Generate Product Listing →
                </button>
                <button onClick={() => { setPrevScreen("home"); setScreen("pricing") }} style={{ background: "white", color: "#4a00e0", border: "2px solid #4a00e0", padding: "10px", fontSize: "14px", borderRadius: "8px", cursor: "pointer", width: "100%", marginBottom: "8px" }}>
                  💎 Buy More Credits
                </button>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    style={{ flex: 1, padding: "10px", fontSize: "13px", border: "1.5px solid #e0d7ff", borderRadius: "8px", fontFamily: "Arial" }}
                    placeholder="Enter discount key"
                    value={discountKey}
                    onChange={e => setDiscountKey(e.target.value)}
                  />
                  <button
                    onClick={handleRedeemKey}
                    disabled={discountLoading}
                    style={{ background: "#4a00e0", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                    {discountLoading ? "..." : "Apply"}
                  </button>
                </div>
                {discountMsg && <p style={{ fontSize: "13px", color: discountMsg.includes("✅") ? "green" : "red", margin: "0 0 8px" }}>{discountMsg}</p>}
                <button onClick={() => setScreen("history")} style={{ background: "white", color: "#4a00e0", border: "1px solid #e0d7ff", padding: "10px", fontSize: "14px", borderRadius: "8px", cursor: "pointer", width: "100%", marginBottom: "8px" }}>
                  📋 Generation History
                </button>
                <button onClick={handleLogout} style={{ background: "white", color: "#666", border: "1px solid #ddd", padding: "10px", fontSize: "14px", borderRadius: "8px", cursor: "pointer", width: "100%" }}>
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => setScreen("auth")} style={{ background: "#4a00e0", color: "white", border: "none", padding: "16px", fontSize: "17px", borderRadius: "10px", cursor: "pointer", width: "100%", marginBottom: "16px" }}>
                Get Started — It is Free →
              </button>
            )}
            <div style={{ borderTop: "1px solid #eee", paddingTop: "16px", display: "flex", justifyContent: "center", gap: "16px" }}>
              <span onClick={() => setScreen("privacy")} style={{ color: "#999", fontSize: "12px", cursor: "pointer" }}>Privacy Policy</span>
              <span onClick={() => setScreen("terms")} style={{ color: "#999", fontSize: "12px", cursor: "pointer" }}>Terms</span>
              <span onClick={() => setScreen("refund")} style={{ color: "#999", fontSize: "12px", cursor: "pointer" }}>Refund Policy</span>
            </div>
          </div>
        </div>
      )}

      {screen === "form" && (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#4a00e0", fontSize: "16px", cursor: "pointer", marginBottom: "20px" }}>← Back</button>

          <div style={{ background: "white", borderRadius: "16px", padding: "32px", marginBottom: "20px" }}>
            <h2 style={{ color: "#4a00e0", marginBottom: "8px" }}>Tell Us About Your Product</h2>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>Just 5 fields — our AI does everything else!</p>

            <label style={{ fontWeight: "bold", color: "#333", fontSize: "14px" }}>Brand Name *</label>
            <input style={inp} placeholder="e.g. Jeevya, Himalaya, Wow" value={brand} onChange={e => setBrand(e.target.value)} />

            <label style={{ fontWeight: "bold", color: "#333", fontSize: "14px" }}>Product Name *</label>
            <input style={inp} placeholder="e.g. Bhringraj Hair Growth Oil 200ml" value={productName} onChange={e => setProductName(e.target.value)} />

            <label style={{ fontWeight: "bold", color: "#333", fontSize: "14px" }}>Category *</label>
            <select style={inp} value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <label style={{ fontWeight: "bold", color: "#333", fontSize: "14px" }}>Selling Platform *</label>
            <select style={inp} value={platform} onChange={e => setPlatform(e.target.value)}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <label style={{ fontWeight: "bold", color: "#333", fontSize: "14px" }}>Key Ingredients or Materials *</label>
            <textarea style={{ ...inp, height: "80px", resize: "vertical" }} placeholder="e.g. Bhringraj, Amla, Brahmi, Neem, Coconut Oil" value={material} onChange={e => setMaterial(e.target.value)} />
          </div>

          <div style={{ background: "white", borderRadius: "16px", padding: "32px", marginBottom: "20px" }}>
            <h2 style={{ color: "#4a00e0", marginBottom: "8px" }}>Upload Your Product Photo *</h2>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>Even a basic mobile photo works! Our AI creates 4 professional images.</p>
            <div style={{ border: "2px dashed #c4b5ff", borderRadius: "12px", padding: "30px", textAlign: "center", background: "#faf8ff", cursor: "pointer" }}
              onClick={() => document.getElementById('imageInput').click()}>
              {uploadedImageUrl ? (
                <div>
                  <img src={uploadedImageUrl} alt="Uploaded" style={{ maxWidth: "180px", maxHeight: "180px", borderRadius: "8px", marginBottom: "12px" }} />
                  <p style={{ color: "#4a00e0", fontSize: "14px", margin: "0" }}>✅ Image uploaded — click to change</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>📷</div>
                  <p style={{ color: "#4a00e0", fontWeight: "bold", margin: "0 0 8px" }}>Click to upload your product photo</p>
                  <p style={{ color: "#999", fontSize: "13px", margin: "0" }}>JPG or PNG — any quality works!</p>
                </div>
              )}
            </div>
            <input id="imageInput" type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </div>

          <div style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <input type="checkbox" id="disclaimer" checked={disclaimer} onChange={e => setDisclaimer(e.target.checked)} style={{ marginTop: "3px", width: "18px", height: "18px", cursor: "pointer", flexShrink: 0 }} />
              <label htmlFor="disclaimer" style={{ fontSize: "13px", color: "#555", lineHeight: "1.7", cursor: "pointer" }}>
                I confirm that the product image belongs to my product and I have full rights to use it. EcomImagined AI is not responsible for any intellectual property disputes or listing rejections.
              </label>
            </div>
          </div>

          {error && <div style={{ background: "#fff0f0", borderRadius: "10px", padding: "12px", marginBottom: "16px", color: "#cc0000", fontSize: "14px" }}>{error}</div>}

          <button onClick={handleGenerate} style={{ width: "100%", background: "#4a00e0", color: "white", border: "none", padding: "18px", fontSize: "17px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>
            ✨ Generate My Professional Listing Now
          </button>
        </div>
      )}

      {screen === "whatsapp" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "40px", maxWidth: "440px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📱</div>
            <h2 style={{ color: "#4a00e0", marginBottom: "8px" }}>Get Results On WhatsApp!</h2>
            <p style={{ color: "#666", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
              Enter your WhatsApp number to receive your AI generated listing content and demo images instantly!
            </p>
            <div style={{ background: "#f0f7ff", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
              <p style={{ color: "#0066cc", fontSize: "13px", margin: "0" }}>
                ✅ Free listing content delivered to WhatsApp<br/>
                ✅ Demo product images included<br/>
                ✅ Top keywords for your category<br/>
                ✅ No spam — only your results
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <div style={{ background: "#f0f0f0", borderRadius: "8px", padding: "12px", fontSize: "15px", fontWeight: "bold", color: "#333" }}>+91</div>
              <input
                style={{ flex: 1, padding: "12px", fontSize: "15px", border: "1.5px solid #e0d7ff", borderRadius: "8px", fontFamily: "Arial" }}
                type="tel"
                placeholder="WhatsApp number"
                maxLength="10"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            {whatsappError && <p style={{ color: "red", fontSize: "13px", marginBottom: "12px" }}>{whatsappError}</p>}
            <button
              onClick={async () => {
                await handleWhatsAppCapture()
                setWhatsappCaptured(true)
                if (!user) {
                  setScreen("auth")
                } else {
                  setScreen("form")
                }
              }}
              style={{ width: "100%", background: "#25D366", color: "white", border: "none", padding: "16px", fontSize: "17px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", marginBottom: "12px" }}>
              📱 Continue →
            </button>
            
          </div>
        </div>
      )}

      {screen === "result" && (
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 20px" }}>
          <button onClick={() => setScreen("form")} style={{ background: "none", border: "none", color: "#4a00e0", fontSize: "16px", cursor: "pointer", marginBottom: "20px" }}>← Generate Another</button>
          <h2 style={{ color: "#4a00e0", marginBottom: "24px" }}>✨ Your Professional Listing is Ready!</h2>

          {loading ? (
            <div style={{ background: "white", borderRadius: "16px", padding: "60px 40px", textAlign: "center" }}>
              <div style={{ 
                width: "60px", height: "60px", 
                border: "6px solid #f0ebff", 
                borderTop: "6px solid #4a00e0", 
                borderRadius: "50%", 
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px"
              }}></div>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ color: "#4a00e0", fontSize: "16px", fontWeight: "bold", marginTop: "8px" }}>✨ Crafting your professional listing — great things take time!</p>
              <p style={{ color: "#999", fontSize: "13px", marginTop: "8px" }}>🔒 Please do not close or refresh — your professional listing is being crafted! This may take 40-50 seconds.</p>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ color: "#4a00e0", fontWeight: "bold", fontSize: "18px", marginBottom: "8px" }}>{loadingMsg}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
                {["Uploading", "Analysing", "Creating", "Finalising"].map((step, i) => (
                  <div key={i} style={{ 
                    background: loadingStep >= i ? "#4a00e0" : "#e0d7ff",
                    width: "8px", height: "8px", borderRadius: "50%",
                    transition: "background 0.3s"
                  }}></div>
                ))}
              </div>
              <p style={{ color: "#4a00e0", fontSize: "16px", fontWeight: "bold", marginTop: "16px" }}>
                ✨ Magic takes 40-50 seconds — great things take time!
              </p>
              <p style={{ color: "#999", fontSize: "13px", marginTop: "8px" }}>
                🔒 Please do not close or refresh this page — your professional listing is being crafted!
              </p>
              {generatedImages.filter(img => img.success).length > 0 && (
                <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {generatedImages.filter(img => img.success).map((img, i) => (
                    <div key={i}>
                      <p style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>{img.label}</p>
                      <img src={img.imageUrl} alt={img.label} style={{ width: "100%", borderRadius: "8px" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {keywords.length > 0 && (
                <div style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                  <h3 style={{ color: "#4a00e0", marginBottom: "16px", fontSize: "18px" }}>🔥 Top Keywords For Your Product</h3>
                  <p style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>Based on Indian buyer search patterns on Amazon and Flipkart</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                    {keywords.map((kw, i) => (
                      <div key={i} style={{
                        background: kw.volume === 'VERY HIGH' ? '#fff0f0' : kw.volume === 'HIGH' ? '#fff8e6' : '#f0f7ff',
                        border: `1px solid ${kw.volume === 'VERY HIGH' ? '#ffcccc' : kw.volume === 'HIGH' ? '#ffd980' : '#c0d8ff'}`,
                        borderRadius: "20px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px"
                      }}>
                        <span>{kw.volume === 'VERY HIGH' ? '🔥' : kw.volume === 'HIGH' ? '📈' : '📊'}</span>
                        <span style={{ fontSize: "13px", color: "#333" }}>{kw.keyword}</span>
                        <span style={{ fontSize: "11px", color: kw.volume === 'VERY HIGH' ? '#cc0000' : kw.volume === 'HIGH' ? '#886000' : '#0066cc', fontWeight: "bold" }}>{kw.volume}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {credits < 10 && (
                <div style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                  <h3 style={{ color: "#4a00e0", marginBottom: "8px", fontSize: "18px" }}>🖼️ Your Professional Images Are Ready!</h3>
                  <p style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>Upgrade to see your product transformed into stunning professional images!</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                    {(DEMO_SETS[category] || DEMO_SETS["Hair Care"]).map((url, i) => (
                      <div key={i} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "1/1" }}>
                        <img src={url} alt="Demo" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(8px)", transform: "scale(1.1)" }} />
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(74,0,224,0.3)" }}>
                          <div style={{ textAlign: "center" }}>
                            <p style={{ color: "white", fontSize: "24px", margin: "0" }}>🔒</p>
                            <p style={{ color: "white", fontSize: "12px", fontWeight: "bold", margin: "4px 0 0" }}>Upgrade to unlock</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setPrevScreen("result"); setScreen("pricing") }}
                    style={{ width: "100%", background: "#4a00e0", color: "white", border: "none", padding: "14px", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: "bold" }}>
                    ✨ Upgrade to See Your Images — Starting ₹199
                  </button>
                </div>
              )}

              {credits < 10 && (
                <div style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                  <h3 style={{ color: "#4a00e0", marginBottom: "8px", fontSize: "18px" }}>✨ See What Our Tool Can Do!</h3>
                  <p style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>Real before and after examples from our platform</p>
                  {[
                    {
                      category: "Hair Care",
                      raw: "https://i.ibb.co/7NN4sSLJ/Raw-Photo.png",
                      images: [
                        { label: "What's Inside", url: "https://i.ibb.co/fd7b4Jhg/What-s-Inside-1.png" },
                        { label: "How To Use", url: "https://i.ibb.co/7tzfpkDy/How-To-Use-1.png" },
                        { label: "Key Benefits", url: "https://i.ibb.co/Y7NvMcbC/Key-Benefits.png" },
                        { label: "Main Product", url: "https://i.ibb.co/6R3y992g/Main-Product-Image.png" }
                      ]
                    },
                    {
                      category: "Personal Care",
                      raw: "https://i.ibb.co/ycQxS1h9/Chat-GPT-Image-Apr-30-2026-08-55-27-AM.png",
                      images: [
                        { label: "What's Inside", url: "https://i.ibb.co/MDXQLj27/What-s-Inside-1.png" },
                        { label: "How To Use", url: "https://i.ibb.co/4ZtHrBqp/How-To-Use-1.png" },
                        { label: "Key Benefits", url: "https://i.ibb.co/nqCHcv3H/Key-Benefits.png" },
                        { label: "Main Product", url: "https://i.ibb.co/1YqdbPsr/Main-Product-Image.png" }
                      ]
                    },
                    {
                      category: "Food and Nutrition",
                      raw: "https://i.ibb.co/SkfmrSV/Screenshot-2026-03-19-165503.png",
                      images: [
                        { label: "What's Inside", url: "https://i.ibb.co/mrDgcK2c/What-s-Inside-2.png" },
                        { label: "How To Use", url: "https://i.ibb.co/C34w76BS/How-To-Use-2.png" },
                        { label: "Key Benefits", url: "https://i.ibb.co/dzMCBGD/Key-Benefits-1.png" },
                        { label: "Main Product", url: "https://i.ibb.co/pvZw8vXS/Main-Product-Image-1.png" }
                      ]
                    },
                    {
                      category: "Home and Storage",
                      raw: "https://i.ibb.co/1JJ9913k/Blanket-Cover.png",
                      images: [
                        { label: "What's Inside", url: "https://i.ibb.co/qv0dtTg/What-s-Inside-3.png" },
                        { label: "How To Use", url: "https://i.ibb.co/twTkkN2M/How-To-Use-3.png" },
                        { label: "Key Benefits", url: "https://i.ibb.co/SFzvK9Q/Key-Benefits-2.png" },
                        { label: "Main Product", url: "https://i.ibb.co/xqzdDgJX/Main-Product-Image-2.png" }
                      ]
                    },
                    {
                      category: "Ayurvedic and Natural",
                      raw: "https://i.ibb.co/yF4pwyct/vitamin-b12-4.png",
                      images: [
                        { label: "What's Inside", url: "https://i.ibb.co/V0B1L8QQ/What-s-Inside-4.png" },
                        { label: "How To Use", url: "https://i.ibb.co/HL6HZ9h4/How-To-Use-4.png" },
                        { label: "Key Benefits", url: "https://i.ibb.co/7x84bxMz/Key-Benefits-3.png" },
                        { label: "Main Product", url: "https://i.ibb.co/6cWpjyYv/Main-Product-Image-3.png" }
                      ]
                    }
                  ].map((item, i) => (
                    <div key={i} style={{ marginBottom: "24px", background: "#f8f4ff", borderRadius: "12px", padding: "16px" }}>
                      <p style={{ color: "#4a00e0", fontSize: "14px", fontWeight: "bold", marginBottom: "12px" }}>✨ {item.category}</p>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ flexShrink: 0, width: "120px" }}>
                          <p style={{ color: "#999", fontSize: "10px", marginBottom: "4px", textAlign: "center" }}>📱 Raw</p>
                          <img src={item.raw} alt="Raw" referrerPolicy="no-referrer" style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover" }} />
                        </div>
                        <div style={{ fontSize: "20px", color: "#4a00e0", flexShrink: 0 }}>→</div>
                        <div style={{ display: "flex", gap: "6px", flex: 1, overflowX: "auto" }}>
                          {item.images.map((img, j) => (
                            <div key={j} style={{ flexShrink: 0, width: "120px" }}>
                              <p style={{ color: "#4a00e0", fontSize: "9px", marginBottom: "4px", textAlign: "center" }}>{img.label}</p>
                              <img src={img.url} alt={img.label} referrerPolicy="no-referrer" style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover" }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setPrevScreen("result"); setScreen("pricing") }}
                    style={{ width: "100%", background: "#4a00e0", color: "white", border: "none", padding: "12px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", marginTop: "8px" }}>
                    🚀 Get This For Your Product — Starting ₹199
                  </button>
                </div>
              )}

              {credits >= 10 && generatedImages.filter(img => img.success).length > 0 && (
                <div style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                  <h3 style={{ color: "#4a00e0", marginBottom: "20px", fontSize: "18px" }}>🖼️ Your AI Generated Product Images</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {generatedImages.filter(img => img.success).map((img, index) => (
                      <div key={index} style={{ textAlign: "center" }}>
                        <div style={{ background: "#f0ebff", padding: "5px 10px", borderRadius: "20px", marginBottom: "8px", display: "inline-block" }}>
                          <p style={{ color: "#4a00e0", fontSize: "11px", fontWeight: "bold", margin: "0" }}>{img.label}</p>
                        </div>
                        <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                          <img src={img.imageUrl} alt={img.label} style={{ width: "100%", borderRadius: "8px", border: "1px solid #e0d7ff" }} />
                          {(!user || credits < 10) && (
                            <div style={{
                              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              pointerEvents: "none"
                            }}>
                              <p style={{
                                color: "rgba(255,255,255,0.7)",
                                fontSize: "18px",
                                fontWeight: "bold",
                                transform: "rotate(-35deg)",
                                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                                userSelect: "none",
                                whiteSpace: "nowrap"
                              }}>EcomImagined AI</p>
                            </div>
                          )}
                        </div>
                        {user && credits > 6 ? (
                          <a href={img.imageUrl} download={`${img.label}.png`}
                            style={{ display: "block", marginTop: "8px", color: "#4a00e0", fontSize: "12px" }}>
                            ⬇️ Download
                          </a>
                        ) : (
                          <p style={{ color: "#886000", fontSize: "11px", marginTop: "6px" }}>🔒 Upgrade to download</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p style={{ color: "#886000", fontSize: "13px", marginTop: "16px", textAlign: "center" }}>
                    🔒 Download without watermark available on paid plans only
                  </p>
                </div>
              )}

              {result && (
                <>
                  <div style={{ background: "white", borderRadius: "16px", padding: "32px", lineHeight: "1.9", fontSize: "15px", color: "#333", marginBottom: "20px", whiteSpace: "pre-wrap" }}>
                    {result}
                  </div>
                  <div style={{ background: "#f0f7ff", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid #c0d8ff" }}>
                    <p style={{ color: "#0055aa", fontSize: "13px", margin: "0", fontWeight: "bold" }}>⚠️ Important Disclaimer</p>
                    <p style={{ color: "#0055aa", fontSize: "13px", margin: "8px 0 0", lineHeight: "1.7" }}>
                      This content is AI generated. Please review carefully before publishing. EcomImagined AI is not responsible for any listing rejections.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => { navigator.clipboard.writeText(result); alert("Content copied!") }}
                      style={{ flex: 1, background: "#4a00e0", color: "white", border: "none", padding: "14px", fontSize: "15px", borderRadius: "10px", cursor: "pointer" }}>
                      📋 Copy All Content
                    </button>
                    <button onClick={() => {
                      if (credits <= 6) {
                        alert("🔒 Upgrade to a paid plan to share on WhatsApp and download images!")
                        setPrevScreen("result")
                        setScreen("pricing")
                        return
                      }
                      const text = encodeURIComponent("Here is my professional listing from Imagined AI!\n\nGenerate yours at https://imaginedai.in")
                      window.open(`https://wa.me/?text=${text}`, '_blank')
                    }}
                      style={{ flex: 1, background: credits === 0 || credits <= 3 ? "#aaaaaa" : "#25D366", color: "white", border: "none", padding: "14px", fontSize: "15px", borderRadius: "10px", cursor: "pointer" }}>
                      📱 {credits === 0 || credits <= 3 ? "🔒 Share on WhatsApp" : "Share on WhatsApp"}
                    </button>
                    <button onClick={() => { setScreen("form"); setResult(""); setGeneratedImages([]); setUploadedImage(null); setUploadedImageUrl(null); setDisclaimer(false); setError("") }}
                      style={{ flex: 1, background: "white", color: "#4a00e0", border: "2px solid #4a00e0", padding: "14px", fontSize: "15px", borderRadius: "10px", cursor: "pointer" }}>
                      🔄 Generate Another
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default App