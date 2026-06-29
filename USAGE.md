# How to Use Schumpeter

## Quick Start

1. **Get API Keys**
   - OpenRouter (required): https://openrouter.ai/
   - SerpAPI (optional, improves results): https://serpapi.com/

2. **Configure**
   - Visit https://1111philo.github.io/schumpeter
   - Enter your OpenRouter API key
   - Optionally add SerpAPI key for real-time Google job searches
   - Keys are stored in your browser session only (not sent anywhere except the APIs)

3. **Upload CV**
   - Drag and drop your CV (TXT format recommended)
   - Or click to select file
   - Currently supports TXT files directly

4. **Review Matches**
   - AI analyzes your CV and extracts search terms
   - Finds job opportunities from multiple sources
   - Ranks jobs by relevance to your profile
   - Shows 5-8 best matches with explanations

## Tips

- **TXT format works best** — For PDF/DOC files, copy-paste content into a TXT file first
- **Keep CV focused** — Clear job titles and skills help AI find better matches
- **SerpAPI is optional** — App works without it but real-time Google results improve quality
- **Privacy** — All data stays in your browser session; refresh to clear

## API Costs

- **OpenRouter**: ~$0.01-0.05 per CV analysis (depends on CV length)
- **SerpAPI**: Free tier includes 100 searches/month

## Keyboard Shortcuts

- **Enter** in API key fields saves configuration
- **Escape** dismisses error messages

## Troubleshooting

**"OpenRouter API key is required"**
→ Make sure you've entered a valid key starting with `sk-or-v1-`

**"PDF parsing requires additional libraries"**
→ Convert PDF to TXT or copy-paste CV content into a text file

**"API request failed"**
→ Check your OpenRouter key is valid and has credits

**No jobs found**
→ Try simplifying your CV or adding more specific skills/job titles

## Privacy & Data

- Keys stored in `sessionStorage` (cleared when you close the browser)
- CV content sent only to OpenRouter API (not stored on any server)
- Job searches via SerpAPI (if configured) or LLM suggestions
- No tracking, analytics, or telemetry

## Support

Open an issue at https://github.com/1111philo/schumpeter/issues
