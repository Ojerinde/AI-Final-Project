# SPEC.md — Durable Capability Stack

## Mission Statement

Generate fast, physics-compliant cislunar transfer trajectories from **LEO (167 km)** to
**LMO (100 km)** using a hybrid AI system grounded in orbital mechanics and governed by
NASA/AIAA safety standards.

---

## Pipeline Map

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐
│  DATA       │───►│  MODELING     │───►│  TRAINING    │───►│ INFERENCE  │
│  Citadel    │    │  GNN + PINN   │    │  Physics     │    │ Trajectory │
│  (Audit)    │    │  Architecture │    │  Loss + Data │    │ Generation │
└─────────────┘    └──────────────┘    └──────────────┘    └────────────┘
       │                                                         │
       ▼                                                         ▼
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐
│  RAG        │───►│  AGENT       │───►│ EVALUATION   │───►│ DASHBOARD  │
│  Knowledge  │    │  ReAct Loop  │    │ Red-Team +   │    │ Streamlit  │
│  Hub        │    │  (Reason+Act)│    │ Guardrails   │    │ 3D Viz     │
└─────────────┘    └──────────────┘    └──────────────┘    └────────────┘
```

---

## Capability Layers

### Layer 1 — Data Citadel

| Dimension    | Metric                         | Target   |
| ------------ | ------------------------------ | -------- |
| Completeness | % non-null in r0, v0           | ≥ 99 %   |
| Consistency  | Pairwise correlation stability | σ < 0.05 |
| Accuracy     | Fleiss' κ on labels            | ≥ 0.75   |
| Timeliness   | Nyquist ratio (f_s / 2·f_max)  | ≥ 2.5    |
| Relevance    | Mutual Information ranking     | top-5 MI |
| **Overall**  | **Geometric mean Q_total**     | ≥ 0.80   |

### Layer 2 — Physics-Informed Modeling

- **GNN:** Earth–Moon–Sun gravity web (nodes = bodies, edges = gravitational links)
- **PINN loss:** CR3BP residual via automatic differentiation (Szebehely)
- **Compute budget:** FLOPs estimate, INT8 quantization (4× latency reduction, <1 % accuracy loss)

### Layer 3 — Knowledge Grounding (RAG)

- Source documents: `Theory of Orbit.pdf`, `nasa-std-8719.14__A.pdf`,
  `AIAA-SP-115-2013.pdf`, `artemis_plan-20200921.pdf`
- Chunking: 500 tokens, 10 % overlap (Recursive Character splitter)
- Vector DB: ChromaDB with `all-MiniLM-L6-v2` embeddings
- Reranker: Cross-encoder to mitigate lost-in-the-middle

### Layer 4 — Agentic Execution (ReAct)

- **Perceive → Reason → Act → Observe** loop
- Tools: RAG retrieval, GNN-PINN solver, safety checker
- State persistence via JSON checkpoints for human-in-the-loop review

### Layer 5 — Evaluation & Safety

- **Red-teaming:** adversarial prompts targeting debris-limit violations
- **Metrics:** Hit Rate @k, MRR for trajectory viability
- **Constitutional guardrail:** reject any plan with > 1:10 000 reentry casualty risk

### Layer 6 — Dashboard

- 3D Plotly cislunar manifold visualization
- Multimodal mission-diagram uploader (VLM coordinate extraction)
- Real-time token-economic analysis (cost per generation)
- NASA-grade dark theme

---

## Traceability Matrix

| Requirement                   | Module                         | Test                    |
| ----------------------------- | ------------------------------ | ----------------------- |
| CR3BP compliance              | `src/physics/cr3bp.py`         | `tests/test_physics.py` |
| Orbital debris limits         | `src/evaluation/guardrails.py` | `tests/test_rag.py`     |
| Spacecraft charging standards | `src/rag/vectorstore.py`       | `tests/test_rag.py`     |
| Data quality ≥ 0.80           | `src/data/quality_audit.py`    | `tests/test_data.py`    |
| Model latency (INT8)          | `src/models/quantization.py`   | `tests/test_models.py`  |
| Agent state persistence       | `src/agents/state.py`          | manual / integration    |
