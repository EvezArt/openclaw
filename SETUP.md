# EVEZ OpenClaw — One-Liner Setup

## Status: All API Keys Configured ✅

### Your instances on Fly.io:
- **Instance 1**: https://openclaws-qol4-a.fly.dev (currently suspended)
- **Instance 2**: https://openclaw-pfncdg.fly.dev (currently suspended)

## To start them in 30 seconds:

```bash
# Option 1: flyctl CLI
fly auth login  
fly machine start --app openclaws-qol4-a
fly secrets set GROQ_API_KEY="gsk_..." OPENROUTER_API_KEY="sk-or-..." CEREBRAS_API_KEY="cfut_..." --app openclaws-qol4-a
fly machine start --app openclaw-pfncdg
fly secrets set GROQ_API_KEY="gsk_..." OPENROUTER_API_KEY="sk-or-..." CEREBRAS_API_KEY="cfut_..." --app openclaw-pfncdg
```

## 30+ Models Pre-Configured:
- **Groq**: 8 models (Llama 4 Scout, Llama 3.3 70B, Qwen3 32B, Compound, GPT-OSS 120B...)
- **OpenRouter Free**: 16 models (Nemotron 253B, Kimi K2, GLM 4.5, DeepSeek R1, Dolphin Mistral...)
- **Cerebras**: 4 models (Qwen3 32B, Llama 4 Scout, Llama 3.3 70B...)

## GitHub Actions (needs FLY_API_TOKEN secret):
Go to: **github.com/EvezArt/openclaw-fork → Settings → Secrets → Actions**
Add: `FLY_API_TOKEN` = your Fly.io API token from fly.io/user/personal_access_tokens
Then: Actions → "OpenClaw Fly Start + Configure" → Run workflow
