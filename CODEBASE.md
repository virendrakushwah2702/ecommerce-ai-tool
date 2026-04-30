# EcomImagined AI — Codebase Reference

## What it does

A SaaS tool for Indian eCommerce sellers. User uploads a product photo and fills in 5 fields (brand, product name, category, platform, ingredients). The app generates:
- 4 professional AI product images (main shot, ingredients infographic, how-to-use, key benefits)
- Complete Amazon/Flipkart listing: title, 5 bullet points, 500-word description, 30 search keywords, short Meesho description

Costs 3 credits per generation. Free accounts get 6 credits (2 generations).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Hosting | Vercel (frontend + serverless API) |
| Auth + DB | Supabase |
| Content AI | Cerebras API (llama3.1-8b) |
| Image AI | fal.ai — OpenAI gpt-image-2 edit endpoint |
| Image hosting | ImgBB (used to get a stable URL for the AI edit call) |
| Payments | Instamojo (Indian payment gateway) |

---

## Project Structure

```
myapp/
├── src/
│   ├── App.jsx          # Entire frontend — all screens, state, logic
│   ├── supabase.js      # Supabase client (uses VITE_ env vars)
│   ├── main.jsx         # React entry point
│   └── App.css / index.css
├── api/                 # Vercel serverless functions
│   ├── generate-content.js   # Cerebras: generates image prompts + listing text
│   ├── generate-images.js    # fal.ai: edits uploaded image with AI prompts
│   ├── upload-image.js       # Uploads user photo to ImgBB, returns stable URL
│   ├── create-payment.js     # Creates Instamojo payment request
│   └── payment-webhook.js    # Instamojo webhook: adds credits on payment success
├── public/
│   └── favicon.svg / icons.svg
├── index.html
├── vite.config.js
└── package.json
```

---

## Environment Variables

### Frontend (Vite — must be prefixed `VITE_`)
| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

### Backend (Vercel serverless)
| Variable | Purpose |
|---|---|
| `CEREBRAS_KEY` | Cerebras API key for content generation |
| `FAL_KEY` | fal.ai API key for image generation |
| `IMGBB_KEY` | ImgBB API key for image hosting |
| `INSTAMOJO_API_KEY` | Instamojo API key |
| `INSTAMOJO_AUTH_TOKEN` | Instamojo auth token |
| `SUPABASE_URL` | Supabase URL (for webhook server-side) |
| `SUPABASE_ANON_KEY` | Supabase anon key (for webhook server-side) |

---

## Supabase Database Schema

### `users` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Supabase auth user ID |
| `credits` | integer | Current credit balance |
| `plan` | text | `free`, `starter`, `growth`, `pro`, `monthly`, `agency` |

### `payments` table
| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK to users.id |
| `email` | text | Used by webhook to look up user |
| `plan` | text | Plan key |
| `credits` | integer | Credits to add on success |
| `amount` | integer | Payment amount in INR |
| `payment_request_id` | text | Instamojo request ID |
| `payment_id` | text | Filled by webhook after payment |
| `status` | text | `pending` → `completed` |

---

## Pricing Plans

| Plan | Price | Credits | Generations |
|---|---|---|---|
| Free (on signup) | ₹0 | 6 | 2 |
| Starter | ₹199 | 15 | 5 |
| Growth | ₹499 | 40 | 13 |
| Pro | ₹1,099 | 100 | 33 |
| Monthly | ₹999 | 60 | 20 |
| Agency | ₹4,999 | 200 | 66 |

Each generation costs **3 credits**.

---

## App Screens (controlled by `screen` state in App.jsx)

| Screen | Description |
|---|---|
| `home` | Landing page — login CTA or user dashboard |
| `auth` | Email/password login and signup |
| `form` | Product input form + image upload |
| `result` | Loading state + final images + listing content |
| `pricing` | Plan cards + buy buttons |

---

## Generation Flow (handleGenerate)

```
1. Validate form fields (brand, productName, material, uploadedImage, disclaimer)
2. Check user is logged in (redirect to auth if not)
3. Check credits >= 3
4. Deduct 3 credits immediately (deductCredits)
5. Upload image → /api/upload-image → ImgBB URL
6. POST to /api/generate-content → Cerebras llama3.1-8b
   Returns: IMAGE_PROMPT_1..4 + LISTING_CONTENT block
7. Parse prompts with extractPrompts() — finds IMAGE_PROMPT_N: markers
8. Parse listing text with extractContent() — finds LISTING_CONTENT: marker, strips markdown
9. POST 4 parallel requests to /api/generate-images
   Each call: fal.ai gpt-image-2 edit with ImgBB URL + prompt
   Returns: base64 PNG (or fetches URL and converts to base64)
10. Display images + listing content
```

---

## API Endpoints

### `POST /api/upload-image`
- Body: raw binary image
- Header: `X-File-Type: image/jpeg`
- Converts to base64, posts to ImgBB
- Returns: `{ success: true, url: "https://i.ibb.co/..." }`

### `POST /api/generate-content`
- Body: `{ brand, productName, category, material, platform }`
- Calls Cerebras `llama3.1-8b` with a detailed system + user prompt
- Returns: `{ success: true, content: "IMAGE_PROMPT_1:...\nLISTING_CONTENT:..." }`

### `POST /api/generate-images`
- Body: `{ imageUrl, prompt, label }`
- Calls fal.ai `openai/gpt-image-2/edit` with the ImgBB URL and prompt
- `label === "Main Product Image"` gets a special prompt suffix (preserve label text, white background)
- Returns: `{ success: true, imageUrl: "data:image/png;base64,...", label }`

### `POST /api/create-payment`
- Body: `{ plan, email, name, phone }`
- Creates Instamojo payment request
- Returns: `{ success: true, payment_url, payment_id, plan, credits }`

### `POST /api/payment-webhook`
- Called by Instamojo after payment
- If `status === "Credit"`: looks up payment row by `payment_request_id`, adds credits to user, marks payment completed

---

## Image Generation Detail

The Cerebras prompt produces 4 structured image prompts:

| # | Label | Description |
|---|---|---|
| 1 | Main Product Image | Clean product shot. White background for Amazon/Flipkart, coloured for Meesho/own site |
| 2 | What's Inside | Ingredients infographic — 6 ingredient badges around product |
| 3 | How To Use | 3-step numbered cards infographic |
| 4 | Key Benefits | 4 benefit cards on rich gradient background |

All images are 1024×1024 PNG, returned as base64 data URIs.

---

## Watermark & Download Logic

- Free plan users (`user.plan === 'free'` or no plan): images shown with a CSS watermark overlay ("EcomImagined AI" text, `rotate(-35deg)`, semi-transparent). The overlay is CSS only — not burned into the image.
- Paid users: overlay hidden, download `<a>` tag shown.

---

## Known Issues / Notes

1. **Webhook uses mixed module syntax** — `payment-webhook.js` uses `require()` for Supabase but `export default` for the handler. May cause issues on Vercel depending on config.

2. **Monthly plan credit discrepancy** — UI shows "150 credits/month • 50 generations/month" but `create-payment.js` only gives 60 credits for the monthly plan. The webhook will credit 60.

3. **Watermark is CSS-only** — technically a user can right-click save or inspect the `src` attribute to get the unwatermarked base64 image.

4. **Origin check allows all subpaths of localhost** — the CORS/origin check `origin.includes('localhost')` will pass for any localhost port, which is fine for development.

5. **Credits deducted before generation completes** — if the API fails mid-way, credits are already spent and not refunded.
