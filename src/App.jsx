import { useState, useRef } from "react"

const CATEGORIES = [
  "Hair Care", "Skin Care", "Personal Care",
  "Food and Nutrition", "Home and Kitchen",
  "Home and Storage", "Clothing and Fashion",
  "Cosmetics", "Ayurvedic and Natural"
]

const PLATFORMS = ["Amazon", "Flipkart", "Meesho", "Own Website"]

const LOADING_MESSAGES = [
  "Analysing your product...",
  "Crafting AI image prompts...",
  "Generating professional images...",
  "Writing listing content...",
  "Optimising for search keywords...",
  "Almost ready..."
]

export default function App() {
  const [screen, setScreen] = useState("home")
  const [brand, setBrand] = useState("")
  const [productName, setProductName] = useState("")
  const [category, setCategory] = useState("Hair Care")
  const [material, setMaterial] = useState("")
  const [platform, setPlatform] = useState("Amazon")
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null)
  const [disclaimer, setDisclaimer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState("")
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState("")
  const [generatedImages, setGeneratedImages] = useState([])
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef(null)

  // ── Upload image to fal.ai storage ──────────────────────────────
  const uploadToFal = async (file) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload-image", {
      method: "POST",
      body: formData
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || "Upload failed")
    return data.url
  }

  // ── Handle file selection ────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadedImage(file)
    setUploadedImageUrl(URL.createObjectURL(file))
  }

  // ── Extract image prompts from content ──────────────────────────
  const extractPrompts = (text) => {
    const prompts = []
    const labels = ["Main Product Image", "Ingredients Infographic", "How To Use", "Key Benefits"]
    for (let i = 1; i <= 4; i++) {
      const regex = new RegExp(`IMAGE_PROMPT_${i}:\\s*\\n([\\s\\S]*?)(?=IMAGE_PROMPT_${i + 1}:|LISTING_CONTENT:|$)`)
      const match = text.match(regex)
      if (match) prompts.push({ prompt: match[1].trim(), label: labels[i - 1] })
    }
    return prompts
  }

  // ── Generate images via fal.ai ───────────────────────────────────
  const generateImages = async (prompts, falImageUrl) => {
    const results = []
    for (const { prompt, label } of prompts) {
      try {
        const res = await fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: falImageUrl, prompt, label })
        })
        const data = await res.json()
        console.log("Image gen result:", data.success, label)
        results.push({ ...data, label })
      } catch (err) {
        console.error("Image gen error:", err)
        results.push({ success: false, error: err.message, label })
      }
    }
    return results
  }

  // ── Main generate handler ────────────────────────────────────────
  const handleGenerate = async () => {
    if (!brand || !productName || !material || !uploadedImage || !disclaimer) {
      setError("Please fill all fields, upload an image, and accept the disclaimer.")
      return
    }
    setError("")
    setLoading(true)
    setGeneratedImages([])
    setResult("")
    setScreen("loading")

    // Cycle loading messages
    let step = 0
    const msgInterval = setInterval(() => {
      step = (step + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[step])
      setLoadingStep(step)
    }, 2500)

    setLoadingMsg(LOADING_MESSAGES[0])

    try {
      // Step 1 — Upload image
      setLoadingMsg("Uploading your product image...")
      const falImageUrl = await uploadToFal(uploadedImage)
      setUploadedImageUrl(falImageUrl)

      // Step 2 — Generate content
      setLoadingMsg("Writing listing content with AI...")
      const contentRes = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, productName, category, material, platform })
      })
      const contentData = await contentRes.json()
      if (!contentData.success) throw new Error(contentData.error || "Content generation failed")

      const content = contentData.content
      setResult(content)

      // Step 3 — Extract prompts and generate images
      setLoadingMsg("Generating professional images...")
      const prompts = extractPrompts(content)
      console.log("Prompts extracted:", prompts.length)

      if (prompts.length > 0) {
        const images = await generateImages(prompts, falImageUrl)
        setGeneratedImages(images)
      }

      clearInterval(msgInterval)
      setLoading(false)
      setScreen("result")
    } catch (err) {
      clearInterval(msgInterval)
      setLoading(false)
      setError(err.message)
      setScreen("form")
    }
  }

  // ── Parse content sections ───────────────────────────────────────
  const parseSection = (text, sectionName) => {
    const regex = new RegExp(`${sectionName}:\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z ]+:|$)`)
    const match = text.match(regex)
    return match ? match[1].trim() : ""
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadImage = (imageUrl, label) => {
    const a = document.createElement("a")
    a.href = imageUrl
    a.download = `${brand}-${label.replace(/\s/g, "-")}.png`
    a.click()
  }

  const resetApp = () => {
    setBrand("")
    setProductName("")
    setCategory("Hair Care")
    setMaterial("")
    setPlatform("Amazon")
    setUploadedImage(null)
    setUploadedImageUrl(null)
    setDisclaimer(false)
    setResult("")
    setGeneratedImages([])
    setError("")
    setScreen("home")
  }

  // ════════════════════════════════════════════════════════════════
  // SCREENS
  // ════════════════════════════════════════════════════════════════

  // ── HOME SCREEN ──────────────────────────────────────────────────
  if (screen === "home") return (
    <div style={styles.page}>
      <div style={styles.homeWrap}>
        <div style={styles.badge}>AI-Powered • Made for India</div>
        <h1 style={styles.heroTitle}>
          <span style={styles.heroAccent}>EcomImagined</span> AI
        </h1>
        <p style={styles.heroSub}>
          Transform any product photo into professional Amazon-ready images and listing content in under 2 minutes.
        </p>
        <div style={styles.featureGrid}>
          {[
            { icon: "🖼️", title: "4 Pro Images", desc: "Main shot + 3 infographics in 1080×1080px" },
            { icon: "✍️", title: "Full Listing", desc: "Title, bullets, description, keywords" },
            { icon: "🛒", title: "Multi-Platform", desc: "Amazon, Flipkart, Meesho & more" },
            { icon: "⚡", title: "2 Minutes", desc: "From raw photo to ready-to-publish" }
          ].map((f, i) => (
            <div key={i} style={styles.featureCard}>
              <div style={styles.featureIcon}>{f.icon}</div>
              <div style={styles.featureTitle}>{f.title}</div>
              <div style={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
        <button style={styles.ctaBtn} onClick={() => setScreen("form")}>
          Start Generating →
        </button>
        <p style={styles.freeNote}>✨ Free plan includes 6 credits — no card required</p>
      </div>
    </div>
  )

  // ── FORM SCREEN ──────────────────────────────────────────────────
  if (screen === "form") return (
    <div style={styles.page}>
      <div style={styles.formWrap}>
        {/* Header */}
        <div style={styles.formHeader}>
          <button style={styles.backBtn} onClick={() => setScreen("home")}>← Back</button>
          <h2 style={styles.formTitle}>Product Details</h2>
          <div style={styles.creditBadge}>6 Credits</div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Upload */}
        <div style={styles.uploadBox} onClick={() => fileInputRef.current.click()}>
          {uploadedImageUrl
            ? <img src={uploadedImageUrl} alt="product" style={styles.uploadPreview} />
            : <>
              <div style={styles.uploadIcon}>📷</div>
              <div style={styles.uploadText}>Tap to upload product photo</div>
              <div style={styles.uploadSub}>JPG, PNG up to 10MB</div>
            </>
          }
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        {/* Form fields */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Brand Name *</label>
          <input style={styles.input} placeholder="e.g. Patanjali, Mamaearth" value={brand} onChange={e => setBrand(e.target.value)} />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Product Name *</label>
          <input style={styles.input} placeholder="e.g. Bhringraj Hair Oil 200ml" value={productName} onChange={e => setProductName(e.target.value)} />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Category *</label>
          <select style={styles.input} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Platform *</label>
          <div style={styles.platformRow}>
            {PLATFORMS.map(p => (
              <button
                key={p}
                style={{ ...styles.platformBtn, ...(platform === p ? styles.platformBtnActive : {}) }}
                onClick={() => setPlatform(p)}
              >{p}</button>
            ))}
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Key Ingredients / Materials *</label>
          <textarea
            style={{ ...styles.input, height: 90, resize: "vertical" }}
            placeholder="e.g. Bhringraj, Amla, Coconut Oil, Brahmi, Neem..."
            value={material}
            onChange={e => setMaterial(e.target.value)}
          />
        </div>

        {/* Disclaimer */}
        <div style={styles.disclaimerRow}>
          <input type="checkbox" id="disc" checked={disclaimer} onChange={e => setDisclaimer(e.target.checked)} style={{ marginRight: 8 }} />
          <label htmlFor="disc" style={styles.disclaimerText}>
            I confirm all product information is accurate and I have rights to use this image.
          </label>
        </div>

        <button
          style={{ ...styles.ctaBtn, opacity: (!brand || !productName || !material || !uploadedImage || !disclaimer) ? 0.5 : 1 }}
          onClick={handleGenerate}
          disabled={!brand || !productName || !material || !uploadedImage || !disclaimer}
        >
          ⚡ Generate (3 Credits)
        </button>
      </div>
    </div>
  )

  // ── LOADING SCREEN ───────────────────────────────────────────────
  if (screen === "loading") return (
    <div style={styles.page}>
      <div style={styles.loadingWrap}>
        <div style={styles.loadingOrb} />
        <h2 style={styles.loadingTitle}>Creating your content</h2>
        <p style={styles.loadingMsg}>{loadingMsg}</p>
        <div style={styles.loadingSteps}>
          {LOADING_MESSAGES.map((msg, i) => (
            <div key={i} style={{ ...styles.loadingDot, background: i <= loadingStep ? "#6c63ff" : "#e0e0e0" }} />
          ))}
        </div>
        <p style={styles.loadingNote}>This takes 60–90 seconds. Please don't close this tab.</p>
      </div>
    </div>
  )

  // ── RESULT SCREEN ────────────────────────────────────────────────
  if (screen === "result") {
    const title = parseSection(result, "PRODUCT TITLE")
    const bullets = []
    for (let i = 1; i <= 5; i++) {
      const b = parseSection(result, `BULLET POINT ${i}`)
      if (b) bullets.push(b)
    }
    const description = parseSection(result, "PRODUCT DESCRIPTION")
    const keywords = parseSection(result, "SEARCH TERMS AND KEYWORDS")
    const flipkart = parseSection(result, "FLIPKART AND MEESHO SHORT DESCRIPTION")

    return (
      <div style={styles.page}>
        <div style={styles.resultWrap}>
          {/* Top bar */}
          <div style={styles.resultHeader}>
            <h2 style={styles.resultTitle}>Your Content is Ready! 🎉</h2>
            <button style={styles.backBtn} onClick={resetApp}>← New Product</button>
          </div>

          {/* Images */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>🖼️ Generated Images</h3>
            <div style={styles.imageGrid}>
              {generatedImages.length === 0 && (
                <div style={styles.noImages}>Images could not be generated. Please try again.</div>
              )}
              {generatedImages.map((img, i) => (
                <div key={i} style={styles.imageCard}>
                  <div style={styles.imageLabel}>{img.label}</div>
                  {img.success && img.imageUrl
                    ? <>
                      <img src={img.imageUrl} alt={img.label} style={styles.generatedImg} />
                      <button style={styles.downloadBtn} onClick={() => downloadImage(img.imageUrl, img.label)}>
                        ⬇ Download
                      </button>
                    </>
                    : <div style={styles.imgError}>Generation failed: {img.error}</div>
                  }
                </div>
              ))}
            </div>
          </section>

          {/* Title */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>📝 Product Title</h3>
              <button style={styles.copyBtn} onClick={() => copyToClipboard(title)}>
                {copied ? "✅ Copied!" : "Copy"}
              </button>
            </div>
            <div style={styles.contentBox}>{title}</div>
          </section>

          {/* Bullets */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>• Bullet Points</h3>
              <button style={styles.copyBtn} onClick={() => copyToClipboard(bullets.join("\n\n"))}>Copy All</button>
            </div>
            {bullets.map((b, i) => (
              <div key={i} style={styles.bulletBox}>
                <span style={styles.bulletNum}>{i + 1}</span>
                <span>{b}</span>
              </div>
            ))}
          </section>

          {/* Description */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>📄 Product Description</h3>
              <button style={styles.copyBtn} onClick={() => copyToClipboard(description)}>Copy</button>
            </div>
            <div style={styles.contentBox}>{description}</div>
          </section>

          {/* Keywords */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>🔍 Search Terms & Keywords</h3>
              <button style={styles.copyBtn} onClick={() => copyToClipboard(keywords)}>Copy</button>
            </div>
            <div style={styles.contentBox}>{keywords}</div>
          </section>

          {/* Flipkart/Meesho */}
          {flipkart && (
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>🛒 Flipkart / Meesho Description</h3>
                <button style={styles.copyBtn} onClick={() => copyToClipboard(flipkart)}>Copy</button>
              </div>
              <div style={styles.contentBox}>{flipkart}</div>
            </section>
          )}

          <button style={{ ...styles.ctaBtn, marginTop: 32 }} onClick={resetApp}>
            ⚡ Generate Another Product
          </button>
        </div>
      </div>
    )
  }
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#fff",
    padding: "0 0 60px 0"
  },
  homeWrap: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "60px 24px 40px",
    textAlign: "center"
  },
  badge: {
    display: "inline-block",
    background: "rgba(108,99,255,0.2)",
    border: "1px solid rgba(108,99,255,0.5)",
    color: "#a89cff",
    borderRadius: 20,
    padding: "6px 18px",
    fontSize: 13,
    marginBottom: 24,
    letterSpacing: 1
  },
  heroTitle: {
    fontSize: "clamp(36px, 8vw, 64px)",
    fontWeight: 800,
    margin: "0 0 16px",
    lineHeight: 1.1,
    letterSpacing: -1
  },
  heroAccent: {
    background: "linear-gradient(90deg, #6c63ff, #f64f59)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  heroSub: {
    fontSize: 18,
    color: "#a0aec0",
    lineHeight: 1.6,
    marginBottom: 40,
    maxWidth: 500,
    margin: "0 auto 40px"
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
    marginBottom: 40
  },
  featureCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: "20px 16px",
    textAlign: "left"
  },
  featureIcon: { fontSize: 28, marginBottom: 8 },
  featureTitle: { fontWeight: 700, fontSize: 15, marginBottom: 4 },
  featureDesc: { fontSize: 13, color: "#718096" },
  ctaBtn: {
    background: "linear-gradient(90deg, #6c63ff, #f64f59)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "16px 40px",
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    maxWidth: 400,
    transition: "transform 0.2s",
    display: "block",
    margin: "0 auto"
  },
  freeNote: { color: "#718096", fontSize: 13, marginTop: 16 },

  // Form
  formWrap: { maxWidth: 560, margin: "0 auto", padding: "32px 20px" },
  formHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24
  },
  formTitle: { fontSize: 22, fontWeight: 700, margin: 0 },
  backBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13
  },
  creditBadge: {
    background: "rgba(108,99,255,0.3)",
    border: "1px solid #6c63ff",
    color: "#a89cff",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 13,
    fontWeight: 600
  },
  errorBox: {
    background: "rgba(246,79,89,0.15)",
    border: "1px solid rgba(246,79,89,0.4)",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 20,
    color: "#fc8181",
    fontSize: 14
  },
  uploadBox: {
    border: "2px dashed rgba(108,99,255,0.5)",
    borderRadius: 16,
    padding: 32,
    textAlign: "center",
    cursor: "pointer",
    marginBottom: 24,
    background: "rgba(108,99,255,0.05)",
    minHeight: 140,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 0.2s"
  },
  uploadPreview: { maxHeight: 180, maxWidth: "100%", borderRadius: 10, objectFit: "contain" },
  uploadIcon: { fontSize: 36, marginBottom: 8 },
  uploadText: { fontWeight: 600, fontSize: 15 },
  uploadSub: { color: "#718096", fontSize: 13, marginTop: 4 },
  fieldGroup: { marginBottom: 20 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#a0aec0", marginBottom: 8, letterSpacing: 0.5 },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#fff",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit"
  },
  platformRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  platformBtn: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#a0aec0",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600
  },
  platformBtnActive: {
    background: "rgba(108,99,255,0.3)",
    border: "1px solid #6c63ff",
    color: "#fff"
  },
  disclaimerRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 24,
    padding: "14px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 10
  },
  disclaimerText: { fontSize: 13, color: "#a0aec0", lineHeight: 1.5, cursor: "pointer" },

  // Loading
  loadingWrap: {
    maxWidth: 400,
    margin: "0 auto",
    padding: "100px 24px",
    textAlign: "center"
  },
  loadingOrb: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6c63ff, #f64f59)",
    margin: "0 auto 32px",
    animation: "pulse 2s ease-in-out infinite"
  },
  loadingTitle: { fontSize: 24, fontWeight: 700, marginBottom: 12 },
  loadingMsg: { color: "#a0aec0", fontSize: 16, marginBottom: 24, minHeight: 24 },
  loadingSteps: { display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 },
  loadingDot: { width: 8, height: 8, borderRadius: "50%", transition: "background 0.5s" },
  loadingNote: { color: "#4a5568", fontSize: 13 },

  // Result
  resultWrap: { maxWidth: 720, margin: "0 auto", padding: "32px 20px" },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32
  },
  resultTitle: { fontSize: 22, fontWeight: 700, margin: 0 },
  section: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20
  },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 700, margin: 0 },
  copyBtn: {
    background: "rgba(108,99,255,0.2)",
    border: "1px solid rgba(108,99,255,0.4)",
    color: "#a89cff",
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600
  },
  contentBox: {
    background: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#e2e8f0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  bulletBox: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#e2e8f0"
  },
  bulletNum: {
    background: "linear-gradient(135deg, #6c63ff, #f64f59)",
    color: "#fff",
    borderRadius: "50%",
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 2
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16
  },
  imageCard: {
    background: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  imageLabel: {
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "#a89cff",
    borderBottom: "1px solid rgba(255,255,255,0.06)"
  },
  generatedImg: { width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" },
  downloadBtn: {
    width: "100%",
    background: "rgba(108,99,255,0.2)",
    border: "none",
    color: "#a89cff",
    padding: "10px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600
  },
  imgError: { padding: 16, fontSize: 13, color: "#fc8181" },
  noImages: { gridColumn: "1/-1", textAlign: "center", padding: 32, color: "#718096" }
}