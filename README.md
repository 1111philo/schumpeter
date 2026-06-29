# schumpeter

> Most of us just need a job.

A minimalistic CV-to-job search tool that helps you find relevant opportunities. Drag your CV, let AI digest it, and get matched job listings.

## Philosophy

Named after Joseph Schumpeter, who recognized that while innovation drives economies, most people simply need stable employment. This tool aims to make job searching more efficient and less overwhelming.

## Features

- **Drag-and-drop CV upload** — PDF, DOC, DOCX, or TXT
- **AI-powered analysis** — Extracts relevant search terms from your CV
- **Multi-source job search** — Uses Google search (via SerpAPI) and LLM suggestions
- **Smart filtering** — AI ranks jobs by fit and explains why they match
- **Privacy-first** — All data stored in browser session only
- **Static app** — No server, no database, runs on GitHub Pages

## Setup

1. Choose your AI provider:
   - **OpenRouter**: Get an [OpenRouter API key](https://openrouter.ai/) (free models available!)
   - **Amazon Bedrock**: Get a short-term API key from AWS Console → Bedrock (expires in 12 hours)
2. (Optional) Get a [SerpAPI key](https://serpapi.com/) for Google job searches
3. Visit [https://1111philo.github.io/schumpeter](https://1111philo.github.io/schumpeter)
4. Select provider, choose model (defaults to free Gemini 2.0 Flash), and enter your API key
5. Upload your CV and find opportunities

**Free Models Available:**
- Gemini 2.0 Flash (Google) — Default, fast and capable
- Llama 3.2 3B (Meta)
- Qwen 2 7B (Alibaba)

## Design

Minimalistic Scandinavian aesthetic — clean, functional, accessible. Respects your time and attention.

## Tech Stack

- Vanilla JavaScript (no frameworks)
- AI providers: OpenRouter or Amazon Bedrock (Claude 3.5 Sonnet)
- SerpAPI (optional, for real-time Google job searches)
- PDF.js for client-side PDF parsing
- Session storage for privacy

## Local Development

```bash
# Serve locally
python3 -m http.server 8000
# or
npx serve
```

Visit `http://localhost:8000`

## License

MIT
