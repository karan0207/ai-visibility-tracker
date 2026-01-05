# AI Visibility Tracker

> Know where your brand stands in AI-generated recommendations.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwindcss) ![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react)

## 🎯 What This Tool Does

**When people ask AI for recommendations, brands compete to be mentioned in the answer—not clicks or rankings.**

This tool helps you see:
- ✅ **Does your brand show up?** – Are you even in the conversation?
- 📊 **How strong is your presence?** – How much attention do you get compared to competitors?
- ❌ **Where are you invisible?** – Which prompts never mention you?

It's not about claiming "we're winning." It's about understanding **how AI perceives your brand** and where that perception falls short.

## ✨ What You Can Do

- 💬 **Chat with AI** – Ask questions naturally and see which brands get mentioned in real-time
- 📋 **Batch Analysis** – Run multiple prompts at once to get a complete picture
- 📊 **Track Metrics Live** – Watch the dashboard update as results come in
- 🏆 **Compare Competitors** – See who's winning the AI attention war
- 📜 **Review History** – Look back at past prompts and see what changed
- 🔗 **Follow Citations** – See which sources influence AI's recommendations
- 🤖 **Switch AI Models** – Use GPT-4o, Gemini, xAI (Grok), or Claude

## 🛠️ What's Under the Hood

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **UI**: Radix UI + Tailwind CSS 4
- **Database**: PostgreSQL (running in Docker)
- **AI**: OpenAI, Google, xAI (Grok), or Anthropic (Claude)
- **Testing**: Jest + Playwright

## 🚀 Quick Start

**Get up and running in 5 minutes.**

### What You'll Need

- Node.js 18 or higher
- Docker & Docker Compose
- An AI API key (we support OpenAI, Google, xAI, and Anthropic)

### Step-by-Step Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the database (PostgreSQL)
docker-compose up -d

# 3. Set up your environment
cp .env.example .env
# Edit .env and add your AI provider and API key
# We recommend Google Gemini for a good balance of speed and quality

# 4. Set up the database
npx prisma migrate dev

# 5. Start the development server
npm run dev
```

🎉 **Open [http://localhost:3000](http://localhost:3000) to start tracking!**

### Run Tests

```bash
npm test        # Unit tests
npm run test:e2e  # End-to-end tests
```

## 🎮 How to Use

1. **Create a Session** – Pick a category (like "CRM software") and list your competitors (Salesforce, HubSpot, Pipedrive, Zoho)
2. **Start Analyzing** – Choose your style:
   - **Chat Mode** – Ask questions one by one and see results instantly
   - **Batch Mode** – Run multiple prompts at once for a comprehensive view
3. **Explore Results** – Watch as the dashboard fills up with insights
4. **Find Patterns** – Look at which questions mention you and which don't

## 📈 Understanding Your Metrics

## Key Metrics

### 1️⃣ Prompt Coverage – **Are you even in the game?**

| | |
|---|---|
| **What it means** | How often your brand gets mentioned, period |
| **How it's calculated** | Prompts with your brand ÷ Total prompts |
| **Why you care** | This is your reality check. If it's low, nothing else matters. |
| **What to aim for** | 100% = always remembered · <30% = mostly invisible |

### 2️⃣ Mention Share – **How much of the conversation do you own?**

| | |
|---|---|
| **What it means** | Your share of all brand mentions across every prompt |
| **How it's calculated** | Your mentions ÷ Total mentions from all brands |
| **Why you care** | AI often mentions multiple brands. This shows how much attention you capture. |
| **Watch out for** | High share + low coverage = noisy dominance. Always check coverage first. |

### 3️⃣ Mentions per Prompt – **Are you a one-time mention or a recurring star?**

| | |
|---|---|
| **What it means** | How many times you're mentioned in prompts where you appear |
| **How it's calculated** | Your total mentions ÷ Prompts where you appear |
| **Why you care** | ~1.0 = casual mention · >1.5 = reinforced presence |
| **Quick insight** | Distinguishes a quick name-drop from a brand that gets emphasized |

### 4️⃣ First-Mention Rate – **Does AI think of you first?**

| | |
|---|---|
| **What it means** | How often your brand appears first among competitors |
| **How it's calculated** | First mentions ÷ Prompts where you appear |
| **Why you care** | LLMs tend to list the "default" option first. This is a preference signal. |
| **Important** | Directional only. Use this alongside other metrics, not alone. |

### 5️⃣ Missed Prompts – **Where are you invisible?**

| | |
|---|---|
| **What it means** | How many prompts don't mention you at all |
| **How it's calculated** | Total prompts - Prompts where you appear |
| **Why you care** | **This is your action plan.** Tells you exactly where to improve. |
| **Example insight** | "Invisible in 'affordable tools' prompts, but strong in 'enterprise' prompts." |

> 💡 **Pro tip**: This metric flips your mindset from bragging to fixing.

---

### 🎯 Sample Size Matters

| Prompts | Confidence | What it means |
|---------|------------|---------------|
| < 5 | 🔴 Low | Just exploring |
| 5-29 | 🟡 Directional | See some trends |
| 30+ | 🟢 High | Solid comparison |

**Golden rule**: More prompts = more confidence. Don't make big decisions based on 3 queries.

## 📁 Project Structure

```
src/
├── app/           # Next.js pages and API routes
├── components/    # React components (UI, chat, dashboard, forms)
├── services/      # AI client and analysis logic
├── db/            # Database client and queries
├── lib/           # Utilities and constants
└── types/         # TypeScript definitions
```

## 💡 Design Philosophy

We made a few key choices to keep things simple and useful:

- **Chat first** – Natural exploration beats rigid forms
- **Sessions stay focused** – Each session tracks one category and specific competitors
- **Real-time updates** – Watch metrics change as you run queries
- **Accurate detection** – Exact matching prevents false positives (no fuzzy matching drama)
- **Secure by default** – API keys live on the server, never in the browser
- **Save everything** – PostgreSQL keeps your data for future analysis and trends

## 🤝 Contributing

**Help us make AI visibility tracking clearer and more useful.**

When adding features or metrics, ask yourself:

- Does this answer a real business question? (Presence, dominance, or absence)
- Can anyone understand it without a statistics degree?
- Are we being honest about confidence levels at small sample sizes?

**Guidelines for new metrics:**

- ✅ Prefer normalized values (per prompt) over raw counts
- ✅ Separate presence from share – they tell different stories
- ✅ Keep the raw data accessible – prompt-to-response mapping matters
- ❌ Avoid "magic numbers" or composite scores without showing the math

> **Rule of thumb**: Optimize for decision-making, not vanity numbers.

We welcome pull requests, issues, and ideas! 🎉

## 🚀 What's Coming Next

We have big plans for AI Visibility Tracker. Here's what we're working on:

- 🎭 **Sentiment Analysis** – Are mentions positive, negative, or neutral?
- 📈 **Trend Charts** – See how your visibility changes over time
- 📄 **Export Options** – Download reports as PDF or CSV
- 🔄 **Brand Aliases** – Handle variations like "SFDC" → "Salesforce"
- ⏰ **Scheduled Checks** – Automated periodic analysis
- 🔔 **Smart Alerts** – Get notified when visibility shifts

Have ideas? We'd love to hear them!

## 🔌 API Endpoints

All endpoints are REST APIs. Here's what's available:

**Sessions & History**
- `POST /api/session` – Create a new analysis session
- `GET /api/session?id={sessionId}` – Get session data
- `GET /api/history` – List all analyses
- `GET /api/history/[id]` – Get a specific analysis

**Analysis**
- `POST /api/chat` – Single prompt analysis
- `POST /api/analyze` – Batch analysis (auto-generated prompts)
- `POST /api/analyze-multi` – Batch with custom prompts
- `POST /api/analyze-stream` – Streaming batch with real-time updates

See the source code in `src/app/api/` for full details and examples.

## License

MIT

## Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables (DATABASE_URL, OPENAI_API_KEY)
4. Deploy!

For database, use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Neon](https://neon.tech/) for a managed PostgreSQL instance.
