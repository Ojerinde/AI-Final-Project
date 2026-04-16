# AI-Based Fast Cislunar Trajectory Generation

End-to-end AI system for generating physics-compliant transfer trajectories from
**LEO (167 km)** to **LMO (100 km)** using a hybrid GNN-PINN architecture, grounded
in NASA/AIAA safety standards via RAG, and orchestrated by a ReAct agent.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Ingest knowledge base (PDFs → vector store)
python scripts/ingest_knowledge.py

# 3. Run data quality audit
python scripts/run_audit.py

# 4. Train the hybrid model
python scripts/train_model.py

# 5. Launch the dashboard
streamlit run dashboard/app.py
```

## Architecture

| Layer          | Module            | Purpose                                 |
| -------------- | ----------------- | --------------------------------------- |
| Data Citadel   | `src/data/`       | Load, audit, preprocess trajectory data |
| Physics Engine | `src/physics/`    | CR3BP equations & orbital propagation   |
| Hybrid Model   | `src/models/`     | GNN + PINN with INT8 quantization       |
| Knowledge Hub  | `src/rag/`        | RAG over NASA/AIAA standards            |
| Agent          | `src/agents/`     | ReAct loop for mission planning         |
| Safety         | `src/evaluation/` | Red-teaming, metrics, guardrails        |
| Dashboard      | `dashboard/`      | Streamlit 3D visualization & UI         |

## LLM Providers

The system supports multiple LLM backends. Free-tier defaults:

- **Groq** (Llama 3.3 70B) — set `GROQ_API_KEY`
- **Google Gemini** — set `GOOGLE_API_KEY`

Optional paid providers (bring your own key):

- OpenAI, Anthropic, Ollama (local)

Copy `.env.example` → `.env` and add your keys.

## Reference Documents

- Szebehely, _Theory of Orbits_ (1967) — CR3BP physics
- NASA-STD-8719.14A — Orbital debris compliance
- AIAA-SP-115-2013 — LEO spacecraft charging
- NASA Artemis Plan (2020) — Lunar mission context
