import { useState } from "react"

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
  const [generatedImages, setGeneratedImages] = useState([])
  const [error, setError] = useState("")

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadedImage(file)
    setUploadedImageUrl(URL.createObjectURL(file))
  }

  const uploadToImgBB = async (file) => {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      body: file,
      headers: { 'X-File-Type': file.type }
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

      setLoadingMsg("Generating professional images...")
      const prompts = extractPrompts(content)
      console.log("Prompts extracted:", prompts.length)

      if (prompts.length > 0) {
        const images = await generateImages(prompts, imgbbUrl)
        setGeneratedImages(images)
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

      {screen === "home" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "48px 40px", maxWidth: "540px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛍️</div>
            <h1 style={{ fontSize: "32px", color: "#4a00e0", marginBottom: "12px" }}>EcomImagined AI</h1>
            <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6", marginBottom: "24px" }}>
              Upload your product photo — get 4 professional AI images and complete Amazon listing in minutes
            </p>
            <div style={{ background: "#f0ebff", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <p style={{ color: "#4a00e0", fontWeight: "bold", margin: "0", fontSize: "14px" }}>🎁 Free Account — 6 Credits Included</p>
              <p style={{ color: "#666", fontSize: "13px", margin: "8px 0 0" }}>1 complete product listing — absolutely free</p>
            </div>
            <div style={{ background: "#f0f7ff", borderRadius: "12px", padding: "12px 16px", marginBottom: "28px" }}>
              <p style={{ color: "#0066cc", fontSize: "13px", margin: "0" }}>
                ✅ AI Enhances Your Photo — ✅ 4 Professional Images — ✅ Amazon Compliant Content
              </p>
            </div>
            <button onClick={() => setScreen("form")} style={{ background: "#4a00e0", color: "white", border: "none", padding: "16px", fontSize: "17px", borderRadius: "10px", cursor: "pointer", width: "100%" }}>
              Get Started — It is Free →
            </button>
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
            ✨ Generate My Amazon Listing Now
          </button>
        </div>
      )}

      {screen === "result" && (
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 20px" }}>
          <button onClick={() => setScreen("form")} style={{ background: "none", border: "none", color: "#4a00e0", fontSize: "16px", cursor: "pointer", marginBottom: "20px" }}>← Back to Form</button>
          <h2 style={{ color: "#4a00e0", marginBottom: "24px" }}>✨ Your Amazon Listing is Ready!</h2>

          {loading ? (
            <div style={{ background: "white", borderRadius: "16px", padding: "60px 40px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
              <p style={{ color: "#4a00e0", fontWeight: "bold", fontSize: "18px", marginBottom: "8px" }}>Please wait...</p>
              <p style={{ color: "#666", fontSize: "15px", lineHeight: "1.8" }}>{loadingMsg}</p>
              <p style={{ color: "#999", fontSize: "13px", marginTop: "16px" }}>Do not close or refresh this page</p>
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
              {generatedImages.filter(img => img.success).length > 0 && (
                <div style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                  <h3 style={{ color: "#4a00e0", marginBottom: "20px", fontSize: "18px" }}>🖼️ Your AI Generated Product Images</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    {generatedImages.filter(img => img.success).map((img, index) => (
                      <div key={index} style={{ textAlign: "center" }}>
                        <div style={{ background: "#f0ebff", padding: "5px 10px", borderRadius: "20px", marginBottom: "8px", display: "inline-block" }}>
                          <p style={{ color: "#4a00e0", fontSize: "11px", fontWeight: "bold", margin: "0" }}>{img.label}</p>
                        </div>
                        <img src={img.imageUrl} alt={img.label} style={{ width: "100%", borderRadius: "8px", border: "1px solid #e0d7ff" }} />
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