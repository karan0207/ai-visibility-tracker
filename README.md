# AI Visibility Tracker

A competitive intelligence tool that measures brand presence in AI-generated responses.

![AI Visibility Tracker](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwindcss) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)

## Problem Statement

**When users ask AI systems for recommendations, brands compete for inclusion in a synthesized answer—not clicks or rankings.**

The core problem is measuring **brand presence**, **dominance**, and **absence** across representative AI prompts that reflect real user intent.

The metrics must answer three questions:
1. **Do we show up at all?**
2. **How strong is our presence compared to competitors?**
3. **Where are we invisible?**

Everything else is secondary.

This tool is not saying "We are winning." It is saying: **"Here is how AI currently perceives us, and where that perception breaks down."**

## Features

- **Interactive Chat Analysis**: Conversational interface to ask AI questions and track brand mentions in real-time
- **Session-Based Tracking**: Create analysis sessions for specific product categories with multiple competitor brands
- **Real-Time Metrics Dashboard**: 
  - **Prompts Analyzed**: Total AI queries tested
  - **Total Mentions**: Brand references found across all responses
  - **Average Visibility**: Percentage visibility across all tracked brands
  - **Leading Brand**: Top performer with mention count
- **Brand Leaderboard**: Compare visibility across competitors with metrics like mention count, visibility %, citation share, and first mentions
- **Prompt History**: See exactly which prompts mention your brand and which don't, with full AI responses
- **Citation Tracking**: Track URLs and sources cited by the AI to understand what influences responses
- **Persistent Sessions**: All analysis sessions saved to PostgreSQL for historical tracking

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **UI Components**: Radix UI + Tailwind CSS 4
- **Database**: PostgreSQL 16 (Docker)
- **ORM**: Prisma 6
- **AI**: OpenAI GPT-4o
- **Validation**: Zod
- **Charts**: Recharts

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- OpenAI API Key

### 1. Clone and Install

```bash
cd ai-visibility-tracker
npm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Set Up Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your OpenAI API key
# DATABASE_URL is already configured for local Docker
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Usage

1. **Create a Session**: Enter a product category (e.g., "CRM software") and add brands to track (e.g., "Salesforce, HubSpot, Pipedrive, Zoho")
2. **Start Chatting**: Use the chat interface to ask questions about the category
3. **View Results**: The dashboard updates in real-time showing:
   - Which brands were mentioned in each response
   - Visibility metrics and comparisons
   - Brand leaderboard rankings
4. **Analyze Patterns**: Review prompt history to understand what types of questions favor which brands

## Key Metrics

### Metric 1: Prompt Coverage (Presence Visibility) ✅ PRIMARY

| | |
|---|---|
| **Definition** | Percentage of prompts where a brand is mentioned at least once |
| **Formula** | `prompts_with_brand / total_prompts` |
| **Why it matters** | Binary reality check. If coverage is low, nothing else matters. Closest analog to "existence" in AI answers. |
| **Interpretation** | 100% = consistently top-of-mind · <30% = mostly invisible |

### Metric 2: Mention Share (Relative Dominance)

| | |
|---|---|
| **Definition** | Share of total brand mentions captured by a brand across all prompts |
| **Formula** | `brand_mentions / total_mentions_across_all_brands` |
| **Why it matters** | AI answers often mention multiple brands. Measures how much of the conversation you own. |
| **Caveat** | High mention share with low prompt coverage = noisy dominance. Must read alongside Prompt Coverage. |

### Metric 3: Mentions per Prompt (Depth of Presence)

| | |
|---|---|
| **Definition** | Average number of times a brand is mentioned within prompts where it appears |
| **Formula** | `brand_mentions / prompts_with_brand` |
| **Why it matters** | Distinguishes casual name-drop (~1.0) from reinforced/emphasized brand (>1.5). Quality-of-mention metric without sentiment analysis. |

### Metric 4: First-Mention Rate (AI Preference Signal)

| | |
|---|---|
| **Definition** | Percentage of prompts where the brand is mentioned first among competitors |
| **Formula** | `first_mentions / prompts_with_brand` |
| **Why it matters** | LLMs usually list the most salient or "default" option first. Approximates AI preference, not just inclusion. |
| **Caveat** | Directional, not definitive. Should never stand alone. |

### Metric 5: Missed Prompts (Invisibility Map)

| | |
|---|---|
| **Definition** | Number and percentage of prompts where the brand is NOT mentioned |
| **Formula** | `total_prompts - prompts_with_brand` |
| **Why it matters** | The actionable metric. Tells marketing and content teams where to focus. |
| **Example insight** | "Brand X is invisible in 'affordable tools' prompts but appears in 'enterprise' prompts." |

This metric flips the mindset from bragging to fixing.

### Sample-Size Confidence Rules

| Prompts | Confidence Level | Interpretation |
|---------|-----------------|----------------|
| < 5 | 🔴 Low | Metrics are exploratory |
| 5-29 | 🟡 Directional | Metrics indicate trends |
| ≥ 30 | 🟢 High | Metrics are comparable |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/          # POST: Send chat message, get AI response with brand tracking
│   │   ├── session/       # POST: Create session, GET: Fetch session data
│   │   ├── history/       # GET: Fetch past analyses
│   │   └── analyze/       # Legacy batch analysis endpoint
│   ├── dashboard/         # Dashboard page with metrics and chat
│   └── page.tsx           # Session setup page
├── components/
│   ├── ui/                # UI primitives (button, card, input, etc.)
│   ├── chat/              # ChatInterface, SessionSetup
│   ├── dashboard/         # MetricsPanel, Leaderboard, PromptList, CitedPages
│   ├── forms/             # AnalysisForm
│   ├── layout/            # Header, Footer
│   └── shared/            # LoadingState, ErrorAlert
├── services/              # OpenAI client, analyzer logic
├── db/                    # Prisma client, queries
├── lib/                   # Constants, utilities
└── types/                 # TypeScript definitions
```

## Key Design Decisions

1. **Chat-Based Interface**: Interactive chat allows natural exploration of AI responses vs. batch processing
2. **Session-Based Analysis**: Each session tracks a specific category and brand set for focused comparison
3. **Real-Time Updates**: Dashboard metrics update immediately as new prompts are analyzed
4. **Strict Exact Match**: Brand detection uses case-insensitive exact word matching to avoid false positives
5. **Server-Side API Key**: OpenAI key stored server-side with option to configure via environment
6. **PostgreSQL Persistence**: All sessions and analyses saved for historical tracking and trend analysis

## Contribution Guidelines

**Improve the AI Visibility Tracker by prioritizing clarity of measurement over metric count.**

Each metric must:
- Answer a specific product question (presence, dominance, or absence)
- Be interpretable without statistical knowledge
- Avoid overstating confidence at low sample sizes

When adding new metrics:
- Prefer normalized, per-prompt values over raw counts
- Separate presence metrics from share metrics
- Always preserve the raw prompt-to-response mapping

**Do not introduce ranking-style scores or composite indexes unless their components are fully visible and explainable.**

Optimize for decision-making, not vanity numbers.

## Future Improvements

- **Sentiment Analysis**: Detect if brand mentions are positive, negative, or neutral
- **Trend Charts**: Show visibility changes over time with interactive charts
- **Export**: PDF/CSV export of analysis results
- **Multi-Model Support**: Compare results across GPT-4, Claude, Gemini, and other AI models
- **Brand Aliases**: Support fuzzy matching (e.g., "SFDC" → "Salesforce")
- **Scheduled Analysis**: Automated periodic checks to track visibility trends
- **Webhook Notifications**: Alert when brand visibility changes significantly

## API Reference

### POST /api/session

Create a new analysis session.

```json
{
  "category": "CRM software",
  "brands": ["Salesforce", "HubSpot", "Pipedrive", "Zoho"]
}
```

### GET /api/session?id={sessionId}

Get session data including brands, prompts, and metrics.

### POST /api/chat

Send a prompt and get AI response with brand tracking.

```json
{
  "prompt": "What is the best CRM for small businesses?",
  "brands": ["Salesforce", "HubSpot", "Pipedrive", "Zoho"],
  "sessionId": "session-id"
}
```

### GET /api/history

List recent analyses.

### GET /api/history/[id]

Get a specific analysis by ID.

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_visibility_tracker?schema=public"
OPENAI_API_KEY="sk-..."
```

## License

MIT

## Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables (DATABASE_URL, OPENAI_API_KEY)
4. Deploy!

For database, use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Neon](https://neon.tech/) for a managed PostgreSQL instance.
