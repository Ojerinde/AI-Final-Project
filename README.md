# AI-Based Fast Cislunar Trajectory Generation

<img height="700" alt="image" src="https://github.com/user-attachments/assets/e727ec0a-b153-4ec8-b401-cdbaab56cedf" />

> **Three-Body Problem (Solvers)** — Beihang University AI Practice Final Project
>
> **Team:** OJERINDE Joel Segun (LS2525253) · OGUNLADE Joshua Oluwaseun (LS2525237) · ABU-SAFIAN Fadlan (LS2525230)

End-to-end AI system for generating physics-compliant transfer trajectories from **LEO (Low Earth Orbit, 167 km)** to **LMO (Low Moon Orbit, 100 km)** using a hybrid GNN-PINN deep-learning architecture, grounded in NASA/AIAA safety standards via RAG (Retrieval-Augmented Generation), and orchestrated by a ReAct agent.

---

## Table of Contents

1. [What This Project Does (Layman's Explanation)](#what-this-project-does)
2. [Technical Overview](#technical-overview)
3. [Quick Start](#quick-start)
4. [Running the Full Application](#running-the-full-application)
5. [Application Pages & Features](#application-pages--features)
6. [Architecture](#architecture)
7. [LLM Providers & Models](#llm-providers--models)
8. [All Inputs & Configuration](#all-inputs--configuration)
9. [API Endpoints](#api-endpoints)
10. [Directory Structure](#directory-structure)
11. [Reference Documents](#reference-documents)

---

## What This Project Does

**In simple terms:** Imagine you want to send a spacecraft from Earth to the Moon. You need to figure out the best path — one that uses the least fuel, takes a reasonable amount of time, and doesn't create dangerous space debris. Normally, this requires rocket scientists running complex equations for hours or days.

Our system uses **Artificial Intelligence** to do this in seconds. It:

1. **Understands the physics** — The Circular Restricted Three-Body Problem (CR3BP) governs how objects move under the gravitational pull of both Earth and the Moon simultaneously.
2. **Learns from 1 million trajectories** — A deep-learning model (combining a Graph Neural Network and a Physics-Informed Neural Network) was trained on a massive dataset of pre-computed trajectories.
3. **Reads real NASA safety standards** — Using RAG (think of it as the AI "reading a textbook"), the system retrieves and follows actual NASA debris and safety regulations.
4. **Plans missions via conversation** — A ReAct agent (an AI that can think, act, and observe in a loop) takes your mission request in plain English and produces a complete trajectory plan.
5. **Checks safety automatically** — Every generated trajectory is checked against casualty risk limits and debris lifetime rules before approval.

**The result:** Type "Plan a transfer from LEO 167 km to LMO 100 km" and get back a complete trajectory with delta-v (fuel cost), time of flight, feasibility status, and a step-by-step reasoning trace — all in seconds.

---

## Technical Overview

| Concept                       | What It Means                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **CR3BP**                     | Circular Restricted Three-Body Problem — the gravitational model for Earth-Moon-spacecraft dynamics                               |
| **GNN**                       | Graph Neural Network — encodes trajectory waypoints as graph nodes for structural learning                                        |
| **PINN**                      | Physics-Informed Neural Network — embeds CR3BP differential equations directly into the loss function, ensuring physical validity |
| **Hybrid GNN-PINN**           | Our model combines both: GNN for structure, PINN for physics compliance                                                           |
| **INT8 Quantization**         | Compresses the model from 32-bit to 8-bit integers for 4× faster inference with minimal accuracy loss                             |
| **RAG**                       | Retrieval-Augmented Generation — the AI searches a vector database of NASA/AIAA documents before answering                        |
| **ReAct Agent**               | Reasoning + Acting loop — the AI thinks about what tool to use, uses it, observes the result, and repeats                         |
| **Constitutional Guardrails** | Hard-coded safety rules that cannot be overridden by any LLM output                                                               |
| **Jacobi Constant**           | A conserved quantity in CR3BP — if our trajectory preserves it, the physics is correct                                            |
| **Delta-v (Δv)**              | Total velocity change needed — directly maps to fuel consumption                                                                  |
| **ToF**                       | Time of Flight — how many days the transfer takes                                                                                 |

---

## Quick Start

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Ingest knowledge base (PDFs → vector store)
python scripts/ingest_knowledge.py
# Or use the UI: RAG Configuration → select model → "Re-ingest knowledge base"

# 3. Run data quality audit
python scripts/run_audit.py

# 4. Train the hybrid model
python scripts/train_model.py
```

---

## Running the Full Application

### 1. Backend API (FastAPI)

```bash
cd "new setup/server"
pip install -r requirements.txt
python main.py
```

API will be live at: `http://127.0.0.1:8000`

### 2. Frontend UI (Next.js)

```bash
cd "new setup/client"
npm install
npm run dev
```

UI will be live at: `http://localhost:3000`

### 3. Verify Connection

1. Open `http://127.0.0.1:8000/health` — should return `{"status": "ok"}`
2. Open `http://localhost:3000` — the landing overlay will appear
3. Click through team intro → system maps → LAUNCH to enter the dashboard

---

## Application Pages & Features

### Landing Overlay (First Screen)

When you open the app, a cinematic landing sequence plays:

1. **Team Members Stage** — Displays the three team members with photos, names, and student IDs. A "CONTINUE" button advances to the next stage.
2. **System Maps Stage** — Shows two architecture diagrams explaining the system design. A "LAUNCH" button (Beihang red) transitions into the main dashboard.

This is designed for a presentation flow — approximately 4 minutes of introduction before entering the application.

---

### Tab 1: Mission Planner 🚀

**What it does:** This is the main control panel. You describe a mission and the AI plans the trajectory.

**Sections & Inputs:**

| Element                    | Description                                                                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Transfer Presets**       | Three pre-configured mission profiles you can click to select: Standard Transfer (LEO 167→LMO 100 km), Fast Transfer (LEO 200→LMO 50 km), Low-Energy (LEO 300→LMO 100 km via WSB manifold)                                                                    |
| **Example Prompts**        | 6 clickable example mission prompts below the textarea: Hohmann transfer, low-energy WSB, fast 3-day, L1 halo orbit, return with aerobraking, bi-elliptic comparison                                                                                          |
| **Custom Mission Request** | A text area where you can type any mission in plain English, e.g. "Plan a low-energy transfer with delta-v under 3.5 km/s"                                                                                                                                    |
| **LLM Provider**           | Dropdown to select which AI provider to use: Groq (free), Gemini (free), OpenAI, Anthropic, or Ollama (local)                                                                                                                                                 |
| **Model**                  | Dynamically changes based on provider. For example, selecting Groq shows: llama-3.3-70b-versatile, llama-3.1-8b-instant, gemma2-9b-it, compound-beta, mixtral-8x7b-32768                                                                                      |
| **API Key**                | Password field for your provider API key. Free-tier providers (Groq, Gemini) work with env variables so this is optional                                                                                                                                      |
| **Resume Mission ID**      | If a previous mission was interrupted, enter its ID (e.g. "0a3420b4") to resume from the saved state                                                                                                                                                          |
| **RAG Configuration**      | Collapsible panel with: **Embedding Model** (MiniLM-L6, MPNet-Base, or RoBERTa-Large) and **Cross-Encoder / Reranker** (MiniLM-L6 or MiniLM-L12). Includes embedding mismatch warning and one-click **re-ingest** button when a non-default model is selected |
| **Pipeline Tracker**       | Visual 4-stage progress bar (RAG → Trajectory → Guardrail → Done) showing active, completed, and pending stages with animated indicators                                                                                                                      |
| **Launch Button**          | Starts the ReAct agent loop                                                                                                                                                                                                                                   |
| **Agent Log**              | Real-time terminal showing each step the agent takes                                                                                                                                                                                                          |
| **Mission Result**         | Displays: Δv (km/s), Time of Flight (days), Jacobi Constant, Feasibility status (Approved/Flagged), and step-by-step reasoning                                                                                                                                |
| **RAG Source Citations**   | Expandable panel showing the actual documents retrieved from the ChromaDB vector store — with document name, section, page estimate, and text excerpt. Sources vary by transfer type                                                                          |
| **View Orbit Simulation**  | Button that switches to the Orbit tab to visualize the computed trajectory                                                                                                                                                                                    |

**How the models work:**

- **Embedding Models** convert text into numerical vectors for similarity search. MiniLM-L6 is fastest (22 MB), MPNet-Base is balanced (438 MB), RoBERTa-Large is most precise (696 MB).
- **Rerankers (Cross-Encoders)** re-score retrieved documents for relevance after the initial vector search. L-12 is more accurate but slower than L-6.

---

### Tab 2: 3D Orbit View 🛰️

**What it does:** A real-time animated visualization of the Earth-Moon system in the CR3BP rotating reference frame.

**What you see:**

- **Earth** — Blue-green sphere at center with atmosphere glow and simulated city lights
- **Moon** — White sphere orbiting on an elliptical path (perspective-projected)
- **Spacecraft** — Cyan dot representing the transfer vehicle on its trajectory
- **LEO Satellite** — Orange dot orbiting close to Earth
- **Transfer Arc** — Golden dashed curve showing the Hohmann-like transfer path
- **Orbit Trails** — Each body leaves a fading trail showing its recent path
- **Mission History Ghosts** — Previous missions appear as faint colored trails, each with unique orbit radius (based on Δv) and angular speed (based on ToF). Labels show mission ID, Δv, ToF, and speed
- **Grid** — Subtle background grid for spatial reference

**Legend** (bottom-left):

- "Bodies" section: Color-coded labels for Earth, Moon, spacecraft, LEO satellite
- "Mission History" section: Each past mission shown with its palette color, Δv, and ToF

The entire visualization runs at 60 FPS on a canvas element.

**In layman's terms:** This is like a live map of the space highway between Earth and the Moon, showing where everything is and how the spacecraft travels. Each mission you run gets its own colored orbit trail, so you can visually compare different transfer strategies.

---

### Tab 3: Data Quality Audit 📊

**What it does:** Shows the health and quality of the 1-million-row trajectory dataset used to train the AI model.

**Sections:**

| Element                   | Description                                                                                                                                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q_total Score**         | Overall quality score (0–100%) computed as the geometric mean of 5 dimensions. Our dataset scores 94.80%                                                                                                                                                                            |
| **5 Quality Dimensions**  | Ring charts for: **Completeness** (88.8% — are all values present?), **Consistency** (95.8% — do values agree with each other?), **Accuracy** (100% — are values physically correct?), **Timeliness** (100% — is data current?), **Relevance** (90% — is data useful for our task?) |
| **Metric Cards**          | Total Records, Feature Columns, Vector Columns parsed, Missing Values %, Outliers Removed %                                                                                                                                                                                         |
| **Vector Columns Parsed** | r0 (initial position), v0 (initial velocity), r_vmin (periapsis position), r_vmax (apoapsis position) — these are 3D vectors that were parsed from string format                                                                                                                    |
| **Top-5 MI Features**     | The 5 most informative features ranked by Mutual Information score — shows which input variables have the strongest predictive power for trajectory outcomes                                                                                                                        |
| **Fleiss' κ Note**        | Accuracy was measured using inter-rater reliability (Fleiss' Kappa). κ = 1.0 means perfect agreement among multiple classification methods                                                                                                                                          |
| **Re-audit Button**       | Re-runs the quality audit against the backend API                                                                                                                                                                                                                                   |

**In layman's terms:** This page is like a health checkup report for our training data. It tells us: Is the data complete? Is it consistent? Is it accurate? Good data = good AI predictions.

---

### Tab 4: Safety & Red-Team 🛡️

**What it does:** Tests and verifies that the AI system properly rejects dangerous or non-compliant mission requests.

**Sections:**

| Element                      | Description                                                                                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pass Rate Ring**           | Shows what percentage of adversarial (red-team) tests passed. Target: 100%                                                                                                                                                        |
| **Red-Team Test Cases**      | 5 pre-built adversarial tests: RT-001 Intentional Breakup, RT-002 High Casualty Risk, RT-003 Long-Lived Debris, RT-004 Safe Nominal Mission, RT-005 Deliberate Fragmentation. Each shows Expected vs Actual outcome and Pass/Fail |
| **Expandable Details**       | Click any test to see the specific reason it was blocked or approved                                                                                                                                                              |
| **Safety Constraints Cards** | Casualty Risk Limit (1×10⁻⁴) and Debris Lifetime Limit (25 years) — these come from NASA-STD-8719.14A and IADC guidelines                                                                                                         |
| **Manual Compliance Check**  | Two input fields: **Casualty Risk** (e.g. "1e-5") and **Debris Lifetime (years)** (e.g. "10"). Click "Check Compliance" to verify if your values meet regulations                                                                 |
| **Compliance Presets**       | 6 one-click preset scenarios: Safe LEO disposal, Marginal pass, High risk (fail), Long debris (fail), Artemis nominal, Both fail — instantly fills inputs and shows result                                                        |
| **Compliance Result**        | Shows COMPLIANT (green) or NON-COMPLIANT (red) with detailed breakdown of which checks passed/failed                                                                                                                              |
| **Constitutional Warning**   | Explains that guardrails are non-bypassable — any mission mentioning intentional breakup, deliberate fragmentation, or weaponisation is immediately rejected                                                                      |
| **Run Tests Button**         | Re-runs the full red-team suite against the backend                                                                                                                                                                               |

**In layman's terms:** This is like a security audit. We deliberately try to trick the AI into approving dangerous missions, and verify it always says "no." The manual check lets you test specific risk numbers.

**What are the safety standards?**

- **NASA-STD-8719.14A**: Limits casualty risk from re-entering debris to less than 1 in 10,000 per event
- **IADC Guidelines (2002)**: Space debris in LEO must de-orbit within 25 years

---

### Tab 5: Token Economics 💰

**What it does:** Tracks and analyzes the cost of using various LLM (AI model) providers, helping optimize spending.

**Sections:**

| Element                      | Description                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Key Metrics**              | Total API Calls, Tokens Processed (K), Estimated Cost (USD)                                                                                                                    |
| **Cost per 1M Tokens Chart** | Bar chart comparing price across providers: Groq ($0), Gemini Flash ($0), Gemini Pro ($3.50), GPT-4o ($5.00), Claude 3.5 ($3.00), Ollama ($0)                                  |
| **Latency Chart**            | Bar chart showing average response time in milliseconds per provider                                                                                                           |
| **Monthly Token Usage**      | Line chart showing token consumption trends over 12 months, broken down by Groq, Gemini, and Total                                                                             |
| **Cost Estimator**           | Two interactive sliders: **Number of Missions** (1–100, default 10) and **Avg Tokens per Mission** (500–10,000, default 3,000). Instantly computes projected cost per provider |
| **Provider Summary Table**   | Tabular view with Provider name, Tier (Free/Paid), Cost per 1M tokens, and Latency                                                                                             |

**In layman's terms:** Running AI models costs money (or is free with some providers). This page shows you exactly how much each mission would cost with different AI providers, helping you pick the cheapest option. Groq, Gemini Flash, and Ollama are completely free.

---

## Architecture

| Layer          | Module              | Purpose                                                  |
| -------------- | ------------------- | -------------------------------------------------------- |
| Data Citadel   | `src/data/`         | Load, audit, and preprocess the 1M trajectory dataset    |
| Physics Engine | `src/physics/`      | CR3BP equations of motion & Lagrange point computation   |
| Hybrid Model   | `src/models/`       | GNN + PINN architecture with INT8 quantization           |
| Knowledge Hub  | `src/rag/`          | Chunking, embedding, vector store, and reranking for RAG |
| Agent          | `src/agents/`       | ReAct reasoning loop with tool-use and state persistence |
| Safety         | `src/evaluation/`   | Red-teaming, metrics, constitutional guardrails          |
| Frontend       | `new setup/client/` | Next.js 16 + Tailwind CSS v4 + framer-motion dashboard   |
| Backend API    | `new setup/server/` | FastAPI + Uvicorn serving all endpoints                  |

---

## LLM Providers & Models

The system supports **6 LLM providers** with automatic model catalogues:

| Provider          | Tier         | Models                                                                                            | Environment Variable |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------------- | -------------------- |
| **Groq**          | Free         | llama-3.3-70b-versatile, llama-3.1-8b-instant, gemma2-9b-it, compound-beta, mixtral-8x7b-32768    | `GROQ_API_KEY`       |
| **Google Gemini** | Free         | gemini-2.0-flash, gemini-2.0-flash-lite, gemini-2.5-pro-preview, gemini-1.5-flash, gemini-1.5-pro | `GOOGLE_API_KEY`     |
| **OpenAI**        | Paid         | gpt-4o, gpt-4o-mini, gpt-4-turbo                                                                  | `OPENAI_API_KEY`     |
| **Anthropic**     | Paid         | claude-sonnet-4-20250514, claude-3-5-haiku-20241022                                               | `ANTHROPIC_API_KEY`  |
| **Ollama**        | Free (local) | llama3, llama3.1, mistral, qwen2.5, phi3, gemma2                                                  | `OLLAMA_BASE_URL`    |

**Embedding Models** (for RAG vector search):

| Model                | Size   | Dimensions | Speed        |
| -------------------- | ------ | ---------- | ------------ |
| all-MiniLM-L6-v2     | 22 MB  | 384        | Fastest      |
| all-mpnet-base-v2    | 438 MB | 768        | Balanced     |
| all-roberta-large-v1 | 696 MB | 1024       | Most precise |

**Reranker Models** (cross-encoders for relevance scoring):

| Model                                 | Description                    |
| ------------------------------------- | ------------------------------ |
| cross-encoder/ms-marco-MiniLM-L-6-v2  | Fast, lightweight              |
| cross-encoder/ms-marco-MiniLM-L-12-v2 | More accurate, slightly slower |

Copy `.env.example` → `.env` and add your keys.

---

## All Inputs & Configuration

### Mission Planner Inputs

| Input             | Type          | Required | Default                   | Description                                                            |
| ----------------- | ------------- | -------- | ------------------------- | ---------------------------------------------------------------------- |
| Transfer Preset   | Button select | No       | Standard Transfer         | Click one of 3 preset mission profiles                                 |
| Custom Mission    | Textarea      | No       | (preset text)             | Free-text mission description in English                               |
| LLM Provider      | Dropdown      | Yes      | groq                      | Which AI service to call                                               |
| Model             | Dropdown      | Yes      | (first model of provider) | Specific model within the provider                                     |
| API Key           | Password      | No\*     | (env variable)            | Provider authentication. \*Required for OpenAI/Anthropic if no env var |
| Resume Mission ID | Text          | No       | (empty)                   | 8-character hex ID from a previous session                             |
| Embedding Model   | Dropdown      | No       | all-MiniLM-L6-v2          | Vector embedding model for RAG                                         |
| Reranker Model    | Dropdown      | No       | ms-marco-MiniLM-L-6-v2    | Cross-encoder for document reranking                                   |

### Safety Check Inputs

| Input           | Type                       | Range     | Description                                     |
| --------------- | -------------------------- | --------- | ----------------------------------------------- |
| Casualty Risk   | Text (scientific notation) | e.g. 1e-5 | Probability of casualty from re-entering debris |
| Debris Lifetime | Number (years)             | 0–100+    | How long debris will remain in orbit            |

### Cost Estimator Inputs

| Input                  | Type   | Range      | Default | Description                            |
| ---------------------- | ------ | ---------- | ------- | -------------------------------------- |
| Number of Missions     | Slider | 1–100      | 10      | How many missions to estimate for      |
| Avg Tokens per Mission | Slider | 500–10,000 | 3,000   | Expected token consumption per mission |

---

## API Endpoints

| Method | Endpoint                          | Description                                                    |
| ------ | --------------------------------- | -------------------------------------------------------------- |
| `GET`  | `/health`                         | Health check — returns `{"status": "ok"}`                      |
| `GET`  | `/api/providers`                  | Full provider catalogue with models                            |
| `GET`  | `/api/embedding-models`           | Available embedding model options                              |
| `GET`  | `/api/reranker-models`            | Available reranker model options                               |
| `GET`  | `/api/pricing`                    | Per-provider cost data for estimator                           |
| `GET`  | `/api/audit`                      | Run data quality audit, returns scores                         |
| `GET`  | `/api/safety/red-team`            | Run red-team adversarial test suite                            |
| `GET`  | `/api/stats/tokens`               | Token usage statistics                                         |
| `GET`  | `/api/visualization/orbits`       | Lagrange points + orbit data from CR3BP                        |
| `POST` | `/api/agent/run`                  | Execute a mission planning request                             |
| `POST` | `/api/safety/check-casualty-risk` | Manual compliance check                                        |
| `POST` | `/api/upload/mission-diagram`     | Upload mission diagram (png/jpg/csv/json)                      |
| `POST` | `/api/knowledge/reingest`         | Re-ingest knowledge base PDFs with a specified embedding model |

---

## Directory Structure

```
README.md                  — This file
CLAUDE.md                  — Project standards & conventions
SPEC.md                    — Full specification document
PRESENTATION_SCRIPT.md     — 4-minute video presentation script
requirements.txt           — Python dependencies
pyproject.toml             — Python project metadata

src/
  config.py                — Central constants, paths, column definitions
  data/
    loader.py              — CSV/Parquet data loading
    quality_audit.py       — 5-dimension quality framework
  physics/
    cr3bp.py               — CR3BP equations of motion, Lagrange points
    propagator.py          — Numerical orbit propagation
  models/
    gnn.py                 — Graph Neural Network
    pinn.py                — Physics-Informed Neural Network
    hybrid.py              — Combined GNN-PINN architecture
    quantization.py        — INT8 quantization for deployment
  llm/
    provider.py            — Multi-provider LLM abstraction
  rag/
    chunker.py             — Document chunking
    vectorstore.py         — ChromaDB vector store
    reranker.py            — Cross-encoder reranking
  agents/
    react_agent.py         — ReAct reasoning loop
    state.py               — Agent state persistence
  evaluation/
    metrics.py             — Trajectory evaluation metrics
    guardrails.py          — Constitutional AI guardrails
    red_team.py            — Adversarial test suite

new setup/
  client/                  — Next.js 16 frontend
    app/
      page.tsx             — Home/landing page
      layout.tsx           — Root layout with fonts
      dashboard/page.tsx   — Dashboard route
      globals.css          — Tailwind v4 + custom utilities
    components/
      LandingOverlay.tsx   — Team intro → system maps → launch
      Dashboard.tsx        — 5-tab dashboard shell
      MissionPlanner.tsx   — Mission configuration & agent runner
      OrbitCanvas.tsx      — Real-time CR3BP orbit animation
      DataQualityPanel.tsx — Quality audit visualization
      SafetyPanel.tsx      — Red-team tests & compliance check
      TokenEconomicsPanel.tsx — Cost analysis & estimator
      UIKit.tsx            — Shared UI components (Badge, MetricCard, etc.)
      StarField.tsx        — Background star animation
      Navigation.tsx       — Top nav bar
      ClientShell.tsx      — Client-side wrapper
  server/
    main.py                — FastAPI backend with all endpoints
    requirements.txt       — Server Python dependencies

scripts/
  ingest_knowledge.py      — PDF → chunks → vector store pipeline
  run_audit.py             — CLI data quality audit
  train_model.py           — Model training entry point

knowledge_base/            — PDFs, standards, theory documents
  vectorstore/             — ChromaDB persistent storage (gitignored)

data/
  raw/                     — Immutable source data (1M rows)
  processed/               — Cleaned artefacts & agent state

models_checkpoints/        — Saved model weights
  hybrid_gnn_pinn_fp32.pt  — Full-precision model
  hybrid_gnn_pinn_int8.pt  — Quantized model (4× smaller)

tests/                     — pytest test suite
  test_data.py
  test_physics.py
  test_evaluation.py
```

---

## Interview / Presentation Flow

The landing overlay is designed for a **4-minute demo**:

1. **Team Stage** (~1 min) — Team photo + individual member introductions
2. **System Maps Stage** (~2 min) — Two architecture diagrams for technical explanation
3. **LAUNCH** → Enters the dashboard for live demonstration

To customise images, replace files in `new setup/client/public/`:

- `System Map 1.png`, `System Map 2.png`
- `Member 1.jpg`, `Member 2.jpg`, `Member 3.jpg`
- `Group 1.jpg`

---

## Free-Tier Deployment

### Option A (Recommended): Vercel + Render

1. Push to GitHub
2. Deploy `new setup/client` on **Vercel** (Framework: Next.js, Root: `new setup/client`)
3. Deploy `new setup/server` on **Render** (Free Web Service, Python 3.10+)
4. Set `NEXT_PUBLIC_API_URL` in Vercel to your Render URL
5. Add provider API keys as Render secrets

### Option B: Local Only

Run both backend and frontend locally as described in [Running the Full Application](#running-the-full-application).

---

## Reference Documents

- Szebehely, _Theory of Orbits_ (1967) — CR3BP physics foundation
- NASA-STD-8719.14A — Orbital debris mitigation requirements
- AIAA-SP-115-2013 — LEO spacecraft charging standards
- NASA Artemis Plan (2020) — Lunar mission context
- IADC Space Debris Mitigation Guidelines (2002) — 25-year deorbit rule
