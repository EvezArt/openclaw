#!/bin/bash
# EVEZ OpenClaw Auto-Setup Script
# Runs once when the container starts - sets up all providers

set -e

echo "=== EVEZ OpenClaw Auto-Setup ==="

# Create providers config directory
mkdir -p /data/.openclaw

# Write providers config if not exists
if [ ! -f /data/.openclaw/providers.json ]; then
  cat > /data/.openclaw/providers.json << 'PROVIDERS'
{
  "providers": {
    "groq": {
      "enabled": true,
      "api_key": "${GROQ_API_KEY}",
      "base_url": "https://api.groq.com/openai/v1",
      "models": [
        {"id": "meta-llama/llama-4-scout-17b-16e-instruct", "name": "Llama 4 Scout"},
        {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B"},
        {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B"},
        {"id": "qwen/qwen3-32b", "name": "Qwen3 32B"},
        {"id": "groq/compound", "name": "Groq Compound"},
        {"id": "groq/compound-beta", "name": "Groq Compound Beta"},
        {"id": "openai/gpt-oss-120b", "name": "GPT-OSS 120B"},
        {"id": "openai/gpt-oss-20b", "name": "GPT-OSS 20B"}
      ]
    },
    "openrouter": {
      "enabled": true,
      "api_key": "${OPENROUTER_API_KEY}",
      "base_url": "https://openrouter.ai/api/v1",
      "models": [
        {"id": "meta-llama/llama-3.3-70b-instruct:free", "name": "Llama 3.3 70B Free"},
        {"id": "qwen/qwen3-coder:free", "name": "Qwen3 Coder Free"},
        {"id": "nvidia/llama-3.1-nemotron-ultra-253b-v1:free", "name": "Nemotron 253B Free"},
        {"id": "nvidia/llama-3.3-nemotron-super-49b-v1:free", "name": "Nemotron 49B Free"},
        {"id": "microsoft/mai-ds-r1:free", "name": "MAI DS R1 Free"},
        {"id": "google/gemma-3-27b-it:free", "name": "Gemma 3 27B Free"},
        {"id": "moonshot/kimi-k2:free", "name": "Kimi K2 Free"},
        {"id": "thudm/glm-4-32b:free", "name": "GLM 4.5 32B Free"},
        {"id": "cognitivecomputations/dolphin3.5-mistral-24b:free", "name": "Dolphin Mistral 24B Free"},
        {"id": "deepseek/deepseek-r1-0528:free", "name": "DeepSeek R1 Free"},
        {"id": "deepseek/deepseek-v3-0324:free", "name": "DeepSeek V3 Free"},
        {"id": "deepseek/deepseek-chat:free", "name": "DeepSeek Chat Free"},
        {"id": "sophosympatheia/rogue-rose-103b-v0.6:free", "name": "Rogue Rose 103B Free"},
        {"id": "mistralai/devstral-small:free", "name": "Devstral Small Free"},
        {"id": "open-r1/olympiccoder-32b:free", "name": "OlympicCoder 32B Free"},
        {"id": "google/gemma-3n-e4b-it:free", "name": "Gemma 3N Free"}
      ]
    },
    "cerebras": {
      "enabled": true,
      "api_key": "${CEREBRAS_API_KEY}",
      "base_url": "https://api.cerebras.ai/v1",
      "models": [
        {"id": "qwen-3-32b", "name": "Qwen3 32B"},
        {"id": "llama-4-scout-17b-16e-instruct", "name": "Llama 4 Scout"},
        {"id": "llama3.3-70b", "name": "Llama 3.3 70B"},
        {"id": "llama3.1-8b", "name": "Llama 3.1 8B"}
      ]
    }
  },
  "routing": {
    "default_provider": "groq",
    "fallback_order": ["groq", "openrouter", "cerebras"],
    "auto_route": true,
    "load_balance": true
  },
  "total_models": 30
}
PROVIDERS
  echo "✅ Providers config written (30 models: 8 Groq + 16 OpenRouter free + 4 Cerebras)"
fi

echo "✅ OpenClaw setup complete"
