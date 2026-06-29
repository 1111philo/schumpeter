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

1. Get an [OpenRouter API key](https://openrouter.ai/) (free models available!)
2. Visit [https://1111philo.github.io/schumpeter](https://1111philo.github.io/schumpeter)
3. Enter your API key, choose a free model, and upload your CV
4. Get job opportunities with clickable search links

**Free Models Available:**
- Llama 3.2 3B (Meta) — Default, fast and capable
- Qwen 2 7B (Alibaba)
- Phi-3 Mini (Microsoft)

## Design

Minimalistic Scandinavian aesthetic — clean, functional, accessible. Respects your time and attention.

## Tech Stack

- Vanilla JavaScript (no frameworks)
- OpenRouter API with free LLM models (Llama 3.2, Qwen 2, Phi-3)
- PDF.js for client-side PDF parsing
- Session storage for privacy
- 100% free with free models

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
