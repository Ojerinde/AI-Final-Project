"""Unified LLM provider abstraction.

All LLM calls in the system route through this module.  Supports free-tier
providers (Groq, Google Gemini) by default and optional paid providers
(OpenAI, Anthropic, Ollama) when users supply their own API keys.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any

from src.config import DEFAULT_LLM_PROVIDER, DEFAULT_LLM_MODEL


# ── Provider registry ───────────────────────────────────────────────────────

PROVIDERS: dict[str, dict[str, Any]] = {
    "groq": {
        "name": "Groq",
        "env_key": "GROQ_API_KEY",
        "free_tier": True,
        "models": [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "gemma2-9b-it",
            "compound-beta",
            "mixtral-8x7b-32768",
        ],
        "model_descriptions": {
            "llama-3.3-70b-versatile": "⭐⭐⭐⭐⭐ Llama 3.3 70B — Best quality on Groq",
            "llama-3.1-8b-instant":    "⭐⭐⭐⭐ Llama 3.1 8B — Fastest, very good quality",
            "gemma2-9b-it":            "⭐⭐⭐ Gemma 2 9B — Lightweight and reliable",
            "compound-beta":           "⭐⭐⭐⭐ Compound Beta — Multi-step reasoning",
            "mixtral-8x7b-32768":      "⭐⭐⭐⭐ Mixtral 8×7B — Strong MoE, 32k context",
        },
    },
    "gemini": {
        "name": "Google Gemini",
        "env_key": "GOOGLE_API_KEY",
        "free_tier": True,
        "models": [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.5-pro-preview-03-25",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ],
        "model_descriptions": {
            "gemini-2.0-flash":              "⭐⭐⭐⭐ Fast, generous free tier",
            "gemini-2.0-flash-lite":         "⭐⭐⭐ Lightest, highest throughput",
            "gemini-2.5-pro-preview-03-25":  "⭐⭐⭐⭐⭐ Most capable, lower free limits",
            "gemini-1.5-flash":              "⭐⭐⭐ Previous gen, still solid",
            "gemini-1.5-pro":                "⭐⭐⭐⭐ Previous gen pro, 1M context",
        },
    },
    "openai": {
        "name": "OpenAI",
        "env_key": "OPENAI_API_KEY",
        "free_tier": False,
        "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
        "model_descriptions": {
            "gpt-4o":       "⭐⭐⭐⭐⭐ Flagship multimodal model",
            "gpt-4o-mini":  "⭐⭐⭐⭐ Fast & cheap, great quality",
            "gpt-4-turbo":  "⭐⭐⭐⭐ 128k context, strong reasoning",
        },
    },
    "anthropic": {
        "name": "Anthropic",
        "env_key": "ANTHROPIC_API_KEY",
        "free_tier": False,
        "models": ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"],
        "model_descriptions": {
            "claude-sonnet-4-20250514":    "⭐⭐⭐⭐⭐ Best reasoning, long context",
            "claude-3-5-haiku-20241022":   "⭐⭐⭐⭐ Fast & affordable",
        },
    },
    "ollama": {
        "name": "Ollama (local)",
        "env_key": "OLLAMA_BASE_URL",
        "free_tier": True,
        "models": ["llama3", "llama3.1", "mistral", "qwen2.5", "phi3", "gemma2"],
        "model_descriptions": {
            "llama3":   "⭐⭐⭐⭐ Meta Llama 3 8B — Best overall (~8 GB RAM)",
            "llama3.1": "⭐⭐⭐⭐ Meta Llama 3.1 8B — Latest, very capable",
            "mistral":  "⭐⭐⭐⭐ Mistral 7B — Fast, strong reasoning (~5 GB)",
            "qwen2.5":  "⭐⭐⭐⭐ Qwen 2.5 7B — Excellent for technical text",
            "phi3":     "⭐⭐⭐ Microsoft Phi-3 — Lightweight (~3 GB)",
            "gemma2":   "⭐⭐⭐ Google Gemma 2 — Compact and reliable",
        },
    },
}


@dataclass
class LLMResponse:
    """Standardised response from any LLM provider."""

    content: str
    model: str
    provider: str
    usage: dict[str, int] = field(default_factory=dict)
    raw: Any = None


# ── Provider dispatch ───────────────────────────────────────────────────────

def list_providers() -> list[dict]:
    """List all available providers with their configuration status.

    Returns:
        List of dicts with provider info and availability.
    """
    result = []
    for key, info in PROVIDERS.items():
        api_key = os.getenv(info["env_key"], "")
        result.append({
            "id": key,
            "name": info["name"],
            "free_tier": info["free_tier"],
            "configured": bool(api_key),
            "models": info["models"],
        })
    return result


async def get_llm(
    prompt: str,
    provider: str | None = None,
    model: str | None = None,
    api_key: str | None = None,
    system_prompt: str = "You are a cislunar trajectory planning assistant.",
    temperature: float = 0.3,
    max_tokens: int = 2048,
) -> LLMResponse:
    """Send a prompt to an LLM provider and return a standardised response.

    Args:
        prompt: User prompt.
        provider: Provider ID. Defaults to DEFAULT_LLM_PROVIDER.
        model: Model name. Defaults to DEFAULT_LLM_MODEL.
        api_key: Optional override API key (for user-supplied keys).
        system_prompt: System message.
        temperature: Sampling temperature.
        max_tokens: Max response tokens.

    Returns:
        LLMResponse with content and metadata.

    Raises:
        ValueError: If provider is unknown or not configured.
    """
    provider = provider or DEFAULT_LLM_PROVIDER
    model = model or DEFAULT_LLM_MODEL

    if provider not in PROVIDERS:
        raise ValueError(
            f"Unknown provider '{provider}'. Available: {list(PROVIDERS.keys())}")

    info = PROVIDERS[provider]
    key = api_key or os.getenv(info["env_key"], "")

    if provider != "ollama" and not key:
        raise ValueError(
            f"Provider '{provider}' requires {info['env_key']}. "
            f"Set it in .env or pass api_key= directly."
        )

    if provider == "groq":
        return await _call_groq(prompt, model, key, system_prompt, temperature, max_tokens)
    elif provider == "gemini":
        return await _call_gemini(prompt, model, key, system_prompt, temperature, max_tokens)
    elif provider == "openai":
        return await _call_openai(prompt, model, key, system_prompt, temperature, max_tokens)
    elif provider == "anthropic":
        return await _call_anthropic(prompt, model, key, system_prompt, temperature, max_tokens)
    elif provider == "ollama":
        return await _call_ollama(prompt, model, system_prompt, temperature, max_tokens)
    else:
        raise ValueError(f"Provider '{provider}' not implemented.")


# ── Provider implementations ────────────────────────────────────────────────

async def _call_groq(prompt, model, key, system_prompt, temperature, max_tokens) -> LLMResponse:
    """Call Groq API."""
    from groq import AsyncGroq

    client = AsyncGroq(api_key=key)
    resp = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return LLMResponse(
        content=resp.choices[0].message.content,
        model=model,
        provider="groq",
        usage={
            "prompt_tokens": resp.usage.prompt_tokens,
            "completion_tokens": resp.usage.completion_tokens,
        },
        raw=resp,
    )


async def _call_gemini(prompt, model, key, system_prompt, temperature, max_tokens) -> LLMResponse:
    """Call Google Gemini API."""
    import google.generativeai as genai

    genai.configure(api_key=key)
    gen_model = genai.GenerativeModel(
        model_name=model,
        system_instruction=system_prompt,
    )
    resp = gen_model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        ),
    )
    return LLMResponse(
        content=resp.text,
        model=model,
        provider="gemini",
        usage={},
        raw=resp,
    )


async def _call_openai(prompt, model, key, system_prompt, temperature, max_tokens) -> LLMResponse:
    """Call OpenAI API."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=key)
    resp = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return LLMResponse(
        content=resp.choices[0].message.content,
        model=model,
        provider="openai",
        usage={
            "prompt_tokens": resp.usage.prompt_tokens,
            "completion_tokens": resp.usage.completion_tokens,
        },
        raw=resp,
    )


async def _call_anthropic(prompt, model, key, system_prompt, temperature, max_tokens) -> LLMResponse:
    """Call Anthropic API."""
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=key)
    resp = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
    )
    return LLMResponse(
        content=resp.content[0].text,
        model=model,
        provider="anthropic",
        usage={
            "input_tokens": resp.usage.input_tokens,
            "output_tokens": resp.usage.output_tokens,
        },
        raw=resp,
    )


async def _call_ollama(prompt, model, system_prompt, temperature, max_tokens) -> LLMResponse:
    """Call local Ollama instance."""
    import httpx

    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{base_url}/api/chat",
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                "options": {"temperature": temperature, "num_predict": max_tokens},
                "stream": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    return LLMResponse(
        content=data["message"]["content"],
        model=model,
        provider="ollama",
        usage=data.get("eval_count", {}),
        raw=data,
    )
