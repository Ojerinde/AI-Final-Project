# CLAUDE.md — Project Standards & Conventions

## Project: AI-Based Fast Cislunar Trajectory Generation

### Language & Runtime

- **Python 3.10+** (strict)
- Type hints on all function signatures
- Docstrings (Google-style) for every public function and class

### Architecture Principles

- **Separation of Concerns (SoC):** Each module owns one responsibility
- **DRY:** Shared utilities live in `src/config.py`; no duplicated logic
- **Modular imports:** Every sub-package exposes a clean `__init__.py` API

### Directory Contract

```
src/config.py        — Central constants, paths, column definitions
src/data/            — Loading, preprocessing, quality audit
src/physics/         — CR3BP equations, orbital propagators
src/models/          — GNN, PINN, hybrid architecture, quantization
src/llm/             — LLM provider abstraction (Groq, Gemini, OpenAI, …)
src/rag/             — Chunking, embedding, vector store, reranker
src/agents/          — ReAct loop, tools, state persistence
src/evaluation/      — Metrics, red-teaming, guardrails
dashboard/           — Streamlit UI pages and components
knowledge_base/      — PDFs, standards, vector indices
data/raw/            — Immutable source data
data/processed/      — Cleaned / audited artefacts
scripts/             — CLI entry points (ingest, train, audit)
tests/               — pytest unit tests
```

### Coding Rules

1. Never mutate files under `data/raw/`.
2. All paths are resolved via `src/config.py:PATHS`.
3. LLM calls go through `src/llm/provider.py` — never call vendor SDKs directly.
4. Physics constraints (CR3BP residual) must be tested in `tests/test_physics.py`.
5. Every new module must have a corresponding test file.

### Dependencies

- Managed via `requirements.txt`; pin major versions.
- Free-tier LLMs (Groq, Gemini) are the default; paid providers require user API keys.

### Git

- Commit messages: `<phase>: <what changed>` (e.g., `phase2: add data quality audit`).
- Never commit `knowledge_base/vectorstore/`, `.env`, or model checkpoints.
