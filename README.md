# AI Visibility Tracker

> Track your brand's presence in AI-generated recommendations.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwindcss) ![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react)

## Overview

When users ask AI for recommendations, brands compete for mentions within the response rather than traditional search rankings. This tool provides insights into:

-   **Brand Presence**: Verification of your brand's inclusion in AI-generated responses.
-   **Competitive Analysis**: Assessment of your brand's visibility relative to competitors.
-   **Gap Analysis**: Identification of prompts where your brand is omitted.

The objective is to objectively measure AI perception of your brand to inform strategic improvements.

## Capabilities

-   **Real-time Analysis**: Interact with AI models directly to observe brand mentions in real-time.
-   **Batch Processing**: Execute multiple prompts simultaneously for comprehensive data collection.
-   **Live Metrics**: Monitor dashboard updates as analysis results are processed.
-   **Competitor Benchmarking**: Compare your brand's performance against key competitors.
-   **Historical Data**: Review past analysis sessions and track changes over time.
-   **Citation Tracking**: Identify sources influencing AI recommendations.
-   **Multi-Model Support**: Support for GPT-4o, Gemini, xAI (Grok), and Claude.

## Technical Architecture

-   **Frontend**: Next.js 16, React 19, TypeScript
-   **UI Framework**: Radix UI, Tailwind CSS 4
-   **Database**: PostgreSQL (containerized)
-   **AI Providers**: OpenAI, Google, xAI, Anthropic
-   **Testing**: Jest, Playwright

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

-   Node.js 18 or higher
-   Docker & Docker Compose
-   Valid API key for supported AI providers (OpenAI, Google, xAI, or Anthropic)

### Installation

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Initialize Database**
    Start the PostgreSQL container:
    ```bash
    docker-compose up -d
    ```

3.  **Environment Configuration**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` to include your API keys. We recommend using Google Gemini for an optimal balance of performance and cost during development.

4.  **Database Setup**
    Generate the client and run migrations:
    ```bash
    npm run db:generate
    npm run db:migrate
    ```

5.  **Start Application**
    Launch the development server:
    ```bash
    npm run dev
    ```

    The application will be accessible at [http://localhost:3000](http://localhost:3000).

### Running Tests

Execute unit tests with the following command:
```bash
npm test
```

## Usage Guide

1.  **Create a Session**: Define a category (e.g., "CRM software") and list competitors (e.g., Salesforce, HubSpot).
2.  **Select Analysis Mode**:
    -   **Chat Mode**: Sequential interaction for immediate feedback.
    -   **Batch Mode**: Parallel processing of multiple prompts for broad data collection.
3.  **Analyze Results**: Review real-time updates on the dashboard.
4.  **Interpret Data**: Identify patterns in mentions and omissions.

## Metrics Documentation

### Prompt Coverage
**Definition**: The frequency of your brand's appearance across all prompts.
**Calculation**: (Prompts with Brand Mention / Total Prompts)
**Significance**: Indicates fundamental visibility. Low coverage suggests the brand is not being retrieved by the model for the given context.

### Mention Share
**Definition**: Your brand's share of total mentions compared to all brands.
**Calculation**: (Brand Mentions / Total Mentions of All Brands)
**Significance**: Measures relative attention within the conversation.

### Mentions per Prompt
**Definition**: The average number of times your brand is mentioned when it appears.
**Calculation**: (Total Brand Mentions / Prompts where Brand Appears)
**Significance**: Values > 1.0 indicate reinforced presence or detailed discussion.

### First-Mention Rate
**Definition**: Frequency of your brand appearing first in the list of recommendations.
**Calculation**: (First Position Mentions / Prompts where Brand Appears)
**Significance**: High placement positions often correlate with "default" or "top" recommendations.

### Missed Prompts
**Definition**: The count of prompts where your brand was not mentioned.
**Calculation**: (Total Prompts - Prompts where Brand Appears)
**Significance**: Highlights specific areas for content or SEO improvement.

> **Note**: Sample size affects confidence. We recommend 30+ prompts for reliable comparative analysis.

## Project Structure

```
src/
├── app/           # Next.js pages and API routes
├── components/    # React components (UI, chat, dashboard, forms)
├── services/      # AI client integration and analysis logic
├── db/            # Database configuration and queries
├── lib/           # Utility functions and constants
└── types/         # TypeScript type definitions
```

## Design Philosophy

-   **Interaction-Centric**: Prioritizing chat-based exploration.
-   **Session Isolation**: Compartmentalizing analysis by category and competitor set.
-   **Real-Time Feedback**: Immediate visualization of data as it generates.
-   **Precision**: Exact matching logic to ensure data accuracy.
-   **Security**: Server-side key management.
-   **Data Persistence**: Comprehensive storage for historical tracking.

## Contributing

Contributions are welcome to enhance the tool's utility and clarity.

**When proposing new metrics:**
-   Ensure they address a tangible business question.
-   Maintain interpretability for non-technical stakeholders.
-   Transparently communicate confidence levels.

**Guidelines:**
-   Prioritize normalized values.
-   Distinguish between presence and share.
-   Maintain access to raw data.

## Roadmap

Future development focuses include:

-   **Sentiment Analysis**: Categorization of mentions (Positive/Negative/Neutral).
-   **Trend Visualization**: Longitudinal analysis of visibility.
-   **Export Functionality**: PDF and CSV report generation.
-   **Brand Aliases**: Support for acronyms and alternative naming.
-   **Scheduled Analysis**: Automated periodic reporting.
-   **Alerting**: Notifications for significant visibility shifts.

## API Reference

The application provides a RESTful API for integration.

**Sessions & History**
-   `POST /api/session`: Create a new analysis session
-   `GET /api/session?id={sessionId}`: Retrieve session data
-   `GET /api/history`: List all historical analyses
-   `GET /api/history/[id]`: Retrieve a specific analysis record

**Analysis**
-   `POST /api/chat`: Single prompt analysis
-   `POST /api/analyze`: Batch analysis (auto-generated prompts)
-   `POST /api/analyze-multi`: Batch analysis (custom prompts)
-   `POST /api/analyze-stream`: Streaming batch analysis
