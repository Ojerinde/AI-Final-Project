# 4-MINUTE VIDEO PRESENTATION SCRIPT

## AI-Based Fast Cislunar Trajectory Generation

### Team: Joel (LS2525253) · Joshua (LS2525237) · Fadlan (LS2525230)

---

## PRESENTER 1 — Joshua (~40s)

### Landing Page & Team Introduction

> **[Screen: App loads → landing overlay appears with starfield background]**

**SPEAKER:**
"Welcome! Today we're presenting our AI-based cislunar trajectory generation system — built for the Three-Body Problem."

> **[Screen: Team members stage with photos and student IDs]**

"Our team — Joel, Joshua, and Fadlan — built an end-to-end system that can plan a spacecraft trajectory from Earth to the Moon in _seconds_, not days."

"But before I show you how — let me ask you something."

> **[Pause, look at camera]**

"How long do you think it takes a traditional mission planner to compute a single Earth-to-Moon transfer trajectory? …The answer is often _hours to days_ of computation. Our system does it in under 10 seconds."

> **[Click CONTINUE → System Maps stage appears]**

"Let me hand it over to Fadlan to walk you through how this actually works under the hood."

---

## PRESENTER 2 — Fadlan (~55s)

### System Architecture & How It Works

> **[Screen: System Map 1 — Architecture diagram]**

**SPEAKER:**
"Here's our architecture. The system has six layers."

"At the bottom, we have a **1-million-row trajectory dataset** that went through a 5-dimension quality audit — completeness, consistency, accuracy, timeliness, and relevance."

"In the middle, our **Hybrid GNN-PINN model** — that's a Graph Neural Network combined with a Physics-Informed Neural Network. The GNN learns trajectory _structure_, and the PINN enforces the actual _physics_ — the Circular Restricted Three-Body Problem equations are baked directly into the loss function."

> **[Point to System Map 2 if shown]**

"On top, we have a **RAG pipeline** — Retrieval-Augmented Generation. The AI doesn't just hallucinate answers — it actually _reads_ NASA standards and astrodynamics textbooks stored in a vector database before generating any trajectory."

"Everything is orchestrated by a **ReAct agent** — it thinks, acts, observes, and repeats until the mission is complete."

"Before we go live, Joshua will add one final technical point that connects this architecture to the results you'll see on the dashboard."

---

## PRESENTER 3 — Joshua (~20s)

### Technical Bridge Before Demo

> **[Screen: Keep System Map visible for a moment before launching]**

**SPEAKER:**
"One important technical detail is that our system does not treat trajectory generation as just text generation. The LLM handles planning and tool selection, but the final outputs are constrained by physics, checked by guardrails, and grounded with retrieved documents from the vector store."

"So when Joel runs the live demo, the numbers you see for Δv, time of flight, and Jacobi constant are not decorative values — they are part of a constrained pipeline designed to stay physically and operationally meaningful."

"Now Joel will show the system live."

> **[Click LAUNCH → Dashboard appears]**

---

## PRESENTER 4 — Joel (~2 min)

### Live Dashboard Demo

> **[Screen: Dashboard — Mission Planner tab is active]**

**SPEAKER:**
"Alright, now let's see this in action. I want to ask you — if you were sending a spacecraft from Earth to the Moon, what type of transfer would you choose? A fast 3-day transfer? A fuel-efficient low-energy path? Let's try both and see the difference."

### Demo 1: Standard Hohmann Transfer (~30s)

> **[Click the first example prompt: "Plan a Hohmann transfer from LEO 167 km to LMO 100 km"]**

"I'll start with the classic — a Hohmann transfer. Watch the agent log on the right."

> **[Click Launch Mission Planning. Wait for result.]**

"Done. Look at the results: **Δv is about 3.9 km/s**, time of flight around **4.5 days**, and the **Jacobi constant is 3.19** — that confirms our trajectory respects the Three-Body Problem physics."

"Now look below — these are **real RAG source citations**, pulled from our knowledge base. These come from Wakker's Fundamentals of Astrodynamics, NASA debris standards — actual documents, not hallucinations."

> **[Click 'Show RAG Sources' to expand]**

### Demo 2: Low-Energy WSB Transfer (~30s)

> **[Click the example prompt: "Design a low-energy WSB manifold transfer from LEO 300 km..."]**

"Now watch what happens when I pick a completely different mission type."

> **[Click Launch. Wait for result.]**

"See the difference? **Δv dropped** — less fuel needed. But **time of flight increased** — that's the trade-off with low-energy transfers. And the **Jacobi constant changed** too — different energy regime."

"The RAG sources are also different now — the system pulled references about Weak Stability Boundary theory and ballistic capture instead of Hohmann transfers."

> **[Click 'View Orbit Simulation' → switches to Orbit tab]**

### Orbit Visualization (~15s)

"Here's our 3D orbit visualization. You can see Earth, Moon, and the transfer arcs. Each mission I ran shows as a different color — you can visually compare the two trajectories."

### Data Quality & Safety (~30s)

> **[Switch to Data Quality tab]**

"Quick look at data quality — our dataset scored **94.8% overall quality** across all five dimensions. One million rows, fully audited."

> **[Switch to Safety tab]**

"And here's the safety layer. We ran 5 adversarial red-team tests — things like 'plan an intentional breakup' or 'ignore debris limits.' The system **blocked all of them**. 100% pass rate."

"We can also manually check compliance — let me enter a high-risk scenario..."

> **[Click a preset like 'High risk (fail)' → show NON-COMPLIANT result]**

"Rejected. The guardrails are constitutional — no LLM can override them."

### Closing (~35s)

> **[Switch to Token Economics tab briefly]**

"Finally — cost. We use free-tier LLMs — Groq and Gemini — so the entire system runs at **zero cost**. No paid API keys needed."

> **[Look at camera — slow down, speak personally]**

"Before we go — I want to say something honest. When we started this project, none of us fully knew what we were building. We had a idea, a dataset, and a deadline. But along the way, we learned more than any lecture could have taught us — about physics, about AI, about what it means to build something real."

"And what we walked away believing is this: **there really is no limit to what AI can do** — especially when you pair it with real science and real constraints. We've only scratched the surface here."

"We'll keep improving this system. And if you're curious, want to collaborate, or just want to talk about cislunar trajectories at 2am — you're welcome to reach out to **Joshua, Joel, or Fadlan**."

> **[Pause. Smile. Let the quote land.]**

"We'll leave you with a quote from Konstantin Tsiolkovsky — the father of astronautics — who said:"

> **[Read slowly, clearly]**

_"The Earth is the cradle of humanity — but mankind cannot stay in the cradle forever."_

"We built a tool to help us take the next step. Thank you."

---

## TIMING SUMMARY

| Segment   | Presenter | Duration     | Content                                                               |
| --------- | --------- | ------------ | --------------------------------------------------------------------- |
| 1         | Joshua    | ~40s         | Landing page, team intro, hook question                               |
| 2         | Fadlan    | ~55s         | System architecture, GNN-PINN, RAG, ReAct                             |
| 3         | Joshua    | ~20s         | Technical bridge: physics-constrained outputs and grounding           |
| 4         | Joel      | ~150s        | Live demo: 2 missions, orbit viz, data quality, safety, cost, closing |
| **Total** |           | **~4.5 min** |                                                                       |

## TIPS FOR RECORDING

- **Pre-launch the app** before recording — have both backend and frontend running
- **Pre-load the landing page** so it starts immediately
- Run one mission beforehand to warm up the model cache (first query downloads embeddings)
- Speak clearly and point at specific numbers on screen
- The "guess" questions create engagement even in a video format
- If the LLM gives a rate limit error, the system falls back gracefully — that's fine, mention it as "robust fallback"
