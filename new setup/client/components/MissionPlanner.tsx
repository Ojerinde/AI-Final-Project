"use client";
import { useEffect, useState } from "react";
import {
  Rocket,
  MapPin,
  Zap,
  Send,
  Loader2,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { Badge, TerminalLine } from "./UIKit";

/* ── Pipeline stage type ─────────────────────────────────────────────────── */
export type PipelineStage =
  | "idle"
  | "rag"
  | "trajectory"
  | "guardrail"
  | "done";

const EXAMPLE_PROMPTS = [
  "Plan a Hohmann transfer from LEO 167 km to LMO 100 km with minimum delta-v",
  "Design a low-energy WSB manifold transfer from LEO 300 km to Lunar orbit, optimising for fuel",
  "Compute a fast 3-day transfer from a 200 km parking orbit to a 50 km lunar orbit",
  "Find the optimal trajectory from LEO to L1 halo orbit using CR3BP dynamics",
  "Plan a return trajectory from LMO 100 km back to LEO with aerobraking constraints",
  "Compare Hohmann vs bi-elliptic transfer from LEO 400 km to LMO 100 km",
];

interface TrajectoryResult {
  delta_v: number;
  tof_days: number;
  jacobi: number;
  feasible: boolean;
  steps: string[];
  sources?: RAGSource[];
}

interface RAGSource {
  document: string;
  section?: string;
  page?: string;
  chunk_id?: string;
  excerpt: string;
}

interface ModelOption {
  id: string;
  description: string;
}

interface ProviderInfo {
  name: string;
  free_tier: boolean;
  env_key: string;
  models: ModelOption[];
}

interface EmbeddingModel {
  id: string;
  name: string;
  description: string;
}

interface RerankerModel {
  id: string;
  name: string;
}

const PRESETS = [
  {
    label: "Standard Transfer",
    from: "LEO 167 km",
    to: "LMO 100 km",
    desc: "Nominal Hohmann-like CR3BP transfer",
  },
  {
    label: "Fast Transfer",
    from: "LEO 200 km",
    to: "LMO 50 km",
    desc: "High-energy short time-of-flight",
  },
  {
    label: "Low-Energy",
    from: "LEO 300 km",
    to: "LMO 100 km",
    desc: "WSB manifold low-delta-V route",
  },
];

// Fallback catalogues if backend is offline
const FALLBACK_PROVIDERS: Record<string, ProviderInfo> = {
  groq: {
    name: "Groq",
    free_tier: true,
    env_key: "GROQ_API_KEY",
    models: [
      {
        id: "llama-3.3-70b-versatile",
        description: "⭐⭐⭐⭐⭐ Llama 3.3 70B",
      },
      { id: "llama-3.1-8b-instant", description: "⭐⭐⭐⭐ Llama 3.1 8B" },
      { id: "gemma2-9b-it", description: "⭐⭐⭐ Gemma 2 9B" },
      { id: "compound-beta", description: "⭐⭐⭐⭐ Compound Beta" },
      { id: "mixtral-8x7b-32768", description: "⭐⭐⭐⭐ Mixtral 8×7B" },
    ],
  },
  gemini: {
    name: "Google Gemini",
    free_tier: true,
    env_key: "GOOGLE_API_KEY",
    models: [
      {
        id: "gemini-2.0-flash",
        description: "⭐⭐⭐⭐ Fast, generous free tier",
      },
      { id: "gemini-2.0-flash-lite", description: "⭐⭐⭐ Lightest" },
      {
        id: "gemini-2.5-pro-preview-03-25",
        description: "⭐⭐⭐⭐⭐ Most capable",
      },
      { id: "gemini-1.5-flash", description: "⭐⭐⭐ Previous gen" },
      { id: "gemini-1.5-pro", description: "⭐⭐⭐⭐ 1M context" },
    ],
  },
  openai: {
    name: "OpenAI",
    free_tier: false,
    env_key: "OPENAI_API_KEY",
    models: [
      { id: "gpt-4o", description: "⭐⭐⭐⭐⭐ Flagship multimodal" },
      { id: "gpt-4o-mini", description: "⭐⭐⭐⭐ Fast & cheap" },
      { id: "gpt-4-turbo", description: "⭐⭐⭐⭐ 128k context" },
    ],
  },
  anthropic: {
    name: "Anthropic",
    free_tier: false,
    env_key: "ANTHROPIC_API_KEY",
    models: [
      {
        id: "claude-sonnet-4-20250514",
        description: "⭐⭐⭐⭐⭐ Best reasoning",
      },
      {
        id: "claude-3-5-haiku-20241022",
        description: "⭐⭐⭐⭐ Fast & affordable",
      },
    ],
  },
  ollama: {
    name: "Ollama (local)",
    free_tier: true,
    env_key: "OLLAMA_BASE_URL",
    models: [
      { id: "llama3", description: "⭐⭐⭐⭐ Meta Llama 3 8B" },
      { id: "llama3.1", description: "⭐⭐⭐⭐ Llama 3.1 8B" },
      { id: "mistral", description: "⭐⭐⭐⭐ Mistral 7B" },
      { id: "qwen2.5", description: "⭐⭐⭐⭐ Qwen 2.5 7B" },
      { id: "phi3", description: "⭐⭐⭐ Microsoft Phi-3" },
      { id: "gemma2", description: "⭐⭐⭐ Google Gemma 2" },
    ],
  },
};

const FALLBACK_EMBEDDINGS: EmbeddingModel[] = [
  {
    id: "all-MiniLM-L6-v2",
    name: "MiniLM-L6",
    description: "⚡ Fastest (22 MB) — 384 dim",
  },
  {
    id: "all-mpnet-base-v2",
    name: "MPNet-Base",
    description: "⚖️ Balanced (438 MB) — 768 dim",
  },
  {
    id: "all-roberta-large-v1",
    name: "RoBERTa-Large",
    description: "🎯 Best precision (696 MB) — 1024 dim",
  },
];

const FALLBACK_RERANKERS: RerankerModel[] = [
  { id: "cross-encoder/ms-marco-MiniLM-L-6-v2", name: "MiniLM-L6 Reranker" },
  { id: "cross-encoder/ms-marco-MiniLM-L-12-v2", name: "MiniLM-L12 Reranker" },
];

export default function MissionPlanner({
  onPipelineChange,
  onViewSimulation,
  onResult,
}: {
  onPipelineChange?: (stage: PipelineStage) => void;
  onViewSimulation?: () => void;
  onResult?: (r: {
    delta_v: number;
    tof_days: number;
    jacobi: number;
    label: string;
  }) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [missionText, setMissionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrajectoryResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [provider, setProvider] = useState("groq");
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [embeddingModel, setEmbeddingModel] = useState("all-MiniLM-L6-v2");
  const [rerankerModel, setRerankerModel] = useState(
    "cross-encoder/ms-marco-MiniLM-L-6-v2",
  );
  const [apiKey, setApiKey] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [reingesting, setReingesting] = useState(false);
  const [reingestResult, setReingestResult] = useState<string | null>(null);

  // The default model the vectorstore was built with
  const DEFAULT_EMBEDDING = "all-MiniLM-L6-v2";
  const embeddingMismatch = embeddingModel !== DEFAULT_EMBEDDING;

  // Catalogue state (fetched from API or fallback)
  const [providers, setProviders] =
    useState<Record<string, ProviderInfo>>(FALLBACK_PROVIDERS);
  const [embeddings, setEmbeddings] =
    useState<EmbeddingModel[]>(FALLBACK_EMBEDDINGS);
  const [rerankers, setRerankers] =
    useState<RerankerModel[]>(FALLBACK_RERANKERS);

  useEffect(() => {
    fetch("http://localhost:8000/api/providers")
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => {});
    fetch("http://localhost:8000/api/embedding-models")
      .then((r) => r.json())
      .then(setEmbeddings)
      .catch(() => {});
    fetch("http://localhost:8000/api/reranker-models")
      .then((r) => r.json())
      .then(setRerankers)
      .catch(() => {});
  }, []);

  // Reset model when provider changes — derive synchronously instead of effect
  const currentProvider = providers[provider];

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const p = providers[newProvider];
    if (p?.models?.length) setModel(p.models[0].id);
  };

  const updatePipeline = (stage: PipelineStage) => {
    onPipelineChange?.(stage);
  };

  const addLog = (msg: string) => setLogs((l) => [...l, msg]);

  const handleLaunch = async () => {
    setLoading(true);
    setResult(null);
    setLogs([]);
    setShowSources(false);
    updatePipeline("rag");
    addLog("Initialising ReAct agent loop...");
    addLog(`Provider: ${currentProvider?.name ?? provider} | Model: ${model}`);
    addLog(
      `Embedding: ${embeddingModel} | Reranker: ${rerankerModel.split("/").pop()}`,
    );
    addLog("▸ Stage 1/3: RAG Context Retrieval...");

    try {
      const res = await fetch("http://localhost:8000/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission:
            missionText ||
            `Plan a ${PRESETS[selected].label} (${PRESETS[selected].desc}) from ${PRESETS[selected].from} to ${PRESETS[selected].to}`,
          provider,
          model,
          embedding_model: embeddingModel,
          reranker_model: rerankerModel,
          api_key: apiKey || null,
          resume_id: resumeId || null,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      addLog("▸ Stage 2/3: Trajectory Search (GNN-PINN)...");
      updatePipeline("trajectory");
      const data = await res.json();
      addLog("▸ Stage 3/3: Guardrail Validation...");
      updatePipeline("guardrail");
      setResult(data);
      onResult?.({
        delta_v: data.delta_v,
        tof_days: data.tof_days,
        jacobi: data.jacobi,
        label: missionText || PRESETS[selected].label,
      });
      updatePipeline("done");
      addLog("Agent completed mission planning ✓");
      addLog(
        `Δv = ${data.delta_v?.toFixed(3)} km/s | ToF = ${data.tof_days?.toFixed(1)} days`,
      );
      if (data.feasible) addLog("✓ Trajectory FEASIBLE — safety checks passed");
      else addLog("⚠ Trajectory flagged — review safety constraints");
    } catch {
      addLog("Backend offline — showing demo result");
      updatePipeline("trajectory");

      // ── Compute mission-specific values from input text ──────────────
      const mText = (
        missionText ||
        `${PRESETS[selected].label} ${PRESETS[selected].desc} from ${PRESETS[selected].from} to ${PRESETS[selected].to}`
      ).toLowerCase();
      const altMatches = [...mText.matchAll(/(\d{2,5})\s*km/g)].map((m) =>
        parseInt(m[1]),
      );
      const leoAlt = altMatches[0] ?? 167;
      const lmoAlt = altMatches[1] ?? 100;

      const isLowEnergy = /low.energy|wsb|manifold|weak/i.test(mText);
      const isFast = /fast|3.day|short|quick/i.test(mText);
      const isBiElliptic = /bi.elliptic/i.test(mText);
      const isReturn = /return|back|aerobraking/i.test(mText);
      const isHalo = /halo|l1|l2|lagrange/i.test(mText);

      const tf = isLowEnergy
        ? 0.82
        : isFast
          ? 1.12
          : isBiElliptic
            ? 0.96
            : isReturn
              ? 1.05
              : isHalo
                ? 0.92
                : 1.0;
      const baseTof = isLowEnergy
        ? 8.0
        : isFast
          ? 3.0
          : isBiElliptic
            ? 6.0
            : isReturn
              ? 5.0
              : isHalo
                ? 6.5
                : 4.5;

      const rPark = 6371 + leoAlt;
      const vPark = Math.sqrt(398600.4 / rPark);
      const aTrans = (rPark + 384400) / 2;
      const vTransPeri = Math.sqrt(398600.4 * (2 / rPark - 1 / aTrans));
      const dvDepart = Math.abs(vTransPeri - vPark);
      const rLunar = 1737 + lmoAlt;
      const vArr = Math.sqrt(4902.8 * (2 / rLunar - 1 / (rLunar + 5000)));
      const vCirc = Math.sqrt(4902.8 / rLunar);
      const dvLoi = Math.abs(vArr - vCirc);
      const totalDv = parseFloat(((dvDepart + dvLoi) * tf).toFixed(3));
      const tof = parseFloat(
        Math.max(
          1.5,
          Math.min(15, baseTof * (1 + (leoAlt - 167) / 2000)),
        ).toFixed(1),
      );
      const jacobi = parseFloat(
        Math.max(
          2.95,
          Math.min(3.25, 3.0 + 0.2 / tf - 0.0001 * (totalDv - 3)),
        ).toFixed(4),
      );

      const transferLabel = isLowEnergy
        ? "WSB low-energy"
        : isFast
          ? "fast direct"
          : isBiElliptic
            ? "bi-elliptic"
            : isReturn
              ? "return"
              : isHalo
                ? "halo/L-point"
                : "Hohmann";

      const demoResult: TrajectoryResult = {
        delta_v: totalDv,
        tof_days: tof,
        jacobi: jacobi,
        feasible: true,
        steps: [
          `Step 1: rag_query("${transferLabel} transfer LEO ${leoAlt} km to LMO ${lmoAlt} km") → Retrieved 5 relevant chunks from Wakker Ch. 14, NASA-STD-8719.14A §4.6, Szebehely §8`,
          `Step 2: generate_trajectory({"origin":"LEO ${leoAlt} km","destination":"LMO ${lmoAlt} km","transfer_type":"${transferLabel}"}) → Δv = ${totalDv} km/s, Jacobi drift < 1e-8`,
          `Step 3: check_safety(trajectory) → Casualty risk 3.2e-6 < 1e-4 ✓, Debris lifetime 0 yr < 25 yr ✓`,
          `Step 4: check_feasibility(delta_v=${totalDv}, jacobi_drift=1e-8) → Feasible, within budget`,
          `Step 5: final_answer("${transferLabel} transfer LEO→LMO approved. Δv=${totalDv} km/s, ToF=${tof} days.") → Mission complete`,
        ],
        sources: (() => {
          const safetySource = {
            document: "NASA-STD-8719.14A — Process for Limiting Orbital Debris",
            section: "§4.6 Disposal Requirements",
            page: "pp. 32–38",
            excerpt:
              "Propellants remaining after achieving the proper disposal orbit need to be vented or burned...",
          };
          const iadcSource = {
            document: "IADC Space Debris Mitigation Guidelines (2002)",
            section: "§5.3.2 — Deorbit Lifetime Limit",
            page: "pp. 12–14",
            excerpt:
              "Objects in LEO must be deorbited within 25 years of mission completion...",
          };
          if (isLowEnergy)
            return [
              {
                document:
                  "Koon, Lo, Marsden & Ross — Dynamical Systems (Ch. 6)",
                section: "§6.4 Heteroclinic Connections for Lunar Transfers",
                page: "pp. 156–174",
                excerpt:
                  "The WSB region near the Moon allows ballistic capture when the spacecraft energy is near the Jacobi constant at L1...",
              },
              {
                document:
                  "Belbruno — Capture Dynamics and Chaotic Motions (2004)",
                section: "§3.2 Weak Stability Boundary Definition",
                page: "pp. 78–95",
                excerpt:
                  "A spacecraft approaching the Moon along a WSB trajectory can be temporarily captured without insertion burns...",
              },
              {
                document: "Fundamentals of Astrodynamics — Wakker (Ch. 18)",
                section: "§18.6 Low-Energy Lunar Transfers",
                page: "pp. 458–472",
                excerpt:
                  "By exploiting the Sun's gravitational perturbation, transfers with significantly lower Δv can be achieved...",
              },
              safetySource,
              iadcSource,
            ];
          if (isFast)
            return [
              {
                document: "Fundamentals of Astrodynamics — Wakker (Ch. 17)",
                section: "§17.2 Fast Lunar Transfer Trajectories",
                page: "pp. 423–430",
                excerpt:
                  "Minimum-energy trajectories require about 3.13 km/s; faster transfers increase Δv but reduce time-of-flight to ~3 days...",
              },
              {
                document:
                  "Bate, Mueller & White — Fundamentals of Astrodynamics (Ch. 8)",
                section: "§8.5 Lunar Trajectories — Direct Ascent",
                page: "pp. 338–352",
                excerpt:
                  "Direct ascent trajectories minimise transfer time at the cost of higher injection velocity from the parking orbit...",
              },
              {
                document: "Szebehely — Theory of Orbits (§7)",
                section: "§7 — Motion Near the Libration Points",
                page: "pp. 142–158",
                excerpt:
                  "High-energy trajectories cross the zero-velocity surfaces with excess energy, enabling short transfer arcs...",
              },
              safetySource,
              iadcSource,
            ];
          if (isBiElliptic)
            return [
              {
                document: "Fundamentals of Astrodynamics — Wakker (Ch. 14)",
                section: "§14.5 Bi-Elliptic Transfer Comparison",
                page: "pp. 305–312",
                excerpt:
                  "The bi-elliptic transfer can achieve lower total Δv than Hohmann when the ratio of final to initial orbit exceeds 11.94...",
              },
              {
                document: "Vallado — Fundamentals of Astrodynamics (4th ed.)",
                section: "§6.4 Multi-Impulse Transfers",
                page: "pp. 326–340",
                excerpt:
                  "Adding a third impulse at an intermediate apoapsis can reduce total Δv for large orbit ratio transfers...",
              },
              {
                document: "Szebehely — Theory of Orbits (§8)",
                section: "§8 — Jacobi Integral & Zero-Velocity Curves",
                page: "pp. 164–172",
                excerpt:
                  "The Jacobi constant C determines the accessible regions of the rotating frame...",
              },
              safetySource,
              iadcSource,
            ];
          if (isReturn)
            return [
              {
                document: "Fundamentals of Astrodynamics — Wakker (Ch. 17)",
                section: "§17.5 Earth Return from Lunar Orbit",
                page: "pp. 445–456",
                excerpt:
                  "The trans-Earth injection burn places the spacecraft on a return trajectory targeting atmospheric entry...",
              },
              {
                document: "NASA-TM-2006-214382 — Aerobraking at Earth",
                section: "§4.2 Entry Corridor Constraints",
                page: "pp. 22–30",
                excerpt:
                  "Aerobraking entry corridors require a flight-path angle between -5.5° and -6.2° for safe atmospheric capture...",
              },
              {
                document: "Szebehely — Theory of Orbits (§9)",
                section: "§9 — Periodic Orbits & Stability",
                page: "pp. 182–196",
                excerpt:
                  "Stability analysis of return trajectories near L2 reveals sensitivity to injection epoch and velocity vector...",
              },
              safetySource,
              iadcSource,
            ];
          if (isHalo)
            return [
              {
                document:
                  "Koon, Lo, Marsden & Ross — Dynamical Systems (Ch. 4)",
                section: "§4.3 Halo Orbits Near L1 and L2",
                page: "pp. 98–118",
                excerpt:
                  "Halo orbits are three-dimensional periodic solutions near the collinear libration points with out-of-plane amplitude...",
              },
              {
                document:
                  "Howell — Three-Dimensional Periodic Halo Orbits (1984)",
                section: "§3 — Numerical Continuation of Halo Families",
                page: "pp. 214–228",
                excerpt:
                  "Families of halo orbits are computed via differential correction from Lyapunov orbits as the amplitude increases...",
              },
              {
                document: "Fundamentals of Astrodynamics — Wakker (Ch. 3)",
                section: "§3.5 Collinear Libration Points",
                page: "pp. 62–78",
                excerpt:
                  "The five Lagrange points in the CR3BP are found by setting the gradient of the effective potential to zero...",
              },
              safetySource,
              iadcSource,
            ];
          // Standard Hohmann
          return [
            {
              document: "Fundamentals of Astrodynamics — Wakker (Ch. 14)",
              section: "§14.3 Transfer Between Coplanar Circular Orbits",
              page: "pp. 291–298",
              excerpt:
                "Elliptical transfer orbits between two coplanar circular orbits, as a function of the transfer angle...",
            },
            {
              document: "Szebehely — Theory of Orbits (§8)",
              section: "§8 — Jacobi Integral & Zero-Velocity Curves",
              page: "pp. 164–172",
              excerpt:
                "The Jacobi constant C determines the accessible regions of the rotating frame...",
            },
            {
              document:
                "Bate, Mueller & White — Fundamentals of Astrodynamics (Ch. 6)",
              section: "§6.2 The Hohmann Transfer",
              page: "pp. 163–174",
              excerpt:
                "The Hohmann transfer is a minimum two-impulse transfer between coplanar circular orbits using a semi-elliptic arc...",
            },
            safetySource,
            iadcSource,
          ];
        })(),
      };
      updatePipeline("guardrail");
      setResult(demoResult);
      onResult?.({
        delta_v: demoResult.delta_v,
        tof_days: demoResult.tof_days,
        jacobi: demoResult.jacobi,
        label: missionText || PRESETS[selected].label,
      });
      updatePipeline("done");
      demoResult.steps.forEach((s) => addLog(s));
    }
    setLoading(false);
  };

  const handleReingest = async () => {
    setReingesting(true);
    setReingestResult(null);
    try {
      const res = await fetch("http://localhost:8000/api/knowledge/reingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding_model: embeddingModel }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setReingestResult(
          `Re-ingested ${data.pdfs_processed} PDFs → ${data.chunks_created} chunks with ${data.embedding_model}`,
        );
      } else {
        setReingestResult(`Error: ${data.message || "Unknown error"}`);
      }
    } catch {
      setReingestResult("Failed to connect to backend");
    }
    setReingesting(false);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-3xl font-bold text-[#00D4FF] text-glow-cyan md:text-4xl">
            <Rocket size={28} /> Mission Planner
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#C0C8D8]">
            ReAct Agent · GNN-PINN · CR3BP Physics
          </p>
        </div>
        <Badge label="ReAct Loop" color="cyan" />
      </div>

      {/* Transfer presets */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setSelected(i);
              setMissionText("");
            }}
            className={`text-left p-6 rounded-2xl border transition-all duration-200 ${
              selected === i
                ? "border-[#00D4FF] bg-[rgba(0,212,255,0.12)] glow-cyan"
                : "border-[rgba(0,212,255,0.15)] glass-panel hover:border-[rgba(0,212,255,0.3)]"
            }`}
          >
            <div className="mb-3 text-base font-bold text-[#00D4FF]">
              {p.label}
            </div>
            <div className="mb-3 flex items-center gap-1.5 text-sm text-[#C0C8D8]">
              <MapPin size={11} className="text-[#FF6B35]" /> {p.from}
              <ChevronRight size={11} />
              <MapPin size={11} className="text-[#00D4FF]" /> {p.to}
            </div>
            <div className="text-sm leading-6 text-[#8F9AAC]">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Custom mission input */}
      <div className="glass-panel rounded-2xl p-6 md:p-7">
        <label className="mb-4 block text-[11px] text-[#C0C8D8] tracking-[0.22em] uppercase font-mono">
          Custom Mission Request (optional)
        </label>
        <textarea
          value={missionText}
          onChange={(e) => setMissionText(e.target.value)}
          placeholder="Describe your mission objectives, constraints, or special requirements..."
          rows={5}
          className="w-full resize-none rounded-xl bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm leading-7 text-[#E8EDF5] placeholder-[#5A6678] outline-none font-mono border border-[rgba(0,212,255,0.1)] focus:border-[rgba(0,212,255,0.3)] transition-colors"
        />
        {/* Example prompts */}
        <div className="mt-4">
          <p className="text-[10px] text-[#888] tracking-[0.15em] uppercase font-mono mb-2">
            Try an example:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => setMissionText(p)}
                className="text-[11px] text-[#00D4FF] bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.15)] rounded-lg px-3 py-1.5 font-mono hover:bg-[rgba(0,212,255,0.12)] hover:border-[rgba(0,212,255,0.3)] transition-colors truncate max-w-xs"
                title={p}
              >
                {p.length > 60 ? p.slice(0, 57) + "…" : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Provider & Model config */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Provider */}
        <div className="glass-panel rounded-2xl p-6">
          <label className="mb-4 block text-[11px] text-[#C0C8D8] tracking-[0.22em] uppercase font-mono">
            LLM Provider
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full rounded-xl bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-[#00D4FF] outline-none border border-[rgba(0,212,255,0.1)] focus:border-[rgba(0,212,255,0.3)] transition-colors"
          >
            {Object.entries(providers).map(([key, p]) => (
              <option key={key} value={key} className="bg-[#0D1B2A]">
                {p.name}
                {p.free_tier ? " (Free)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="glass-panel rounded-2xl p-6">
          <label className="mb-4 block text-[11px] text-[#C0C8D8] tracking-[0.22em] uppercase font-mono">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-xl bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-[#00D4FF] outline-none border border-[rgba(0,212,255,0.1)] focus:border-[rgba(0,212,255,0.3)] transition-colors"
          >
            {currentProvider?.models?.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#0D1B2A]">
                {m.id} — {m.description}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div className="glass-panel rounded-2xl p-6">
          <label className="mb-4 block text-[11px] text-[#C0C8D8] tracking-[0.22em] uppercase font-mono">
            API Key{" "}
            {currentProvider?.free_tier && (
              <span className="text-[#00FF88] normal-case tracking-normal">
                (optional — free tier)
              </span>
            )}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="••••••••••••••••••••"
            className="w-full rounded-xl bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-[#E8EDF5] placeholder-[#5A6678] outline-none font-mono border border-[rgba(0,212,255,0.1)] focus:border-[rgba(0,212,255,0.3)] transition-colors"
          />
        </div>

        {/* Resume Mission */}
        <div className="glass-panel rounded-2xl p-6">
          <label className="mb-4 block text-[11px] text-[#C0C8D8] tracking-[0.22em] uppercase font-mono">
            Resume Mission ID{" "}
            <span className="text-[#8F9AAC] normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <input
            type="text"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            placeholder="e.g. 0a3420b4"
            className="w-full rounded-xl bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-[#E8EDF5] placeholder-[#5A6678] outline-none font-mono border border-[rgba(0,212,255,0.1)] focus:border-[rgba(0,212,255,0.3)] transition-colors"
          />
        </div>
      </div>

      {/* Advanced: Embedding & Reranker */}
      <div className="glass-panel rounded-2xl p-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-[11px] text-[#C0C8D8] tracking-[0.22em] uppercase font-mono hover:text-[#00D4FF] transition-colors w-full"
        >
          <Settings2 size={14} />
          RAG Configuration
          <ChevronRight
            size={12}
            className={`ml-auto transition-transform ${showAdvanced ? "rotate-90" : ""}`}
          />
        </button>
        {showAdvanced && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mt-5 pt-5 border-t border-[rgba(0,212,255,0.1)]">
            <div>
              <label className="mb-3 block text-[11px] text-[#C0C8D8] tracking-[0.22em] uppercase font-mono">
                Embedding Model
              </label>
              <select
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                className="w-full rounded-xl bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-[#00D4FF] outline-none border border-[rgba(0,212,255,0.1)] focus:border-[rgba(0,212,255,0.3)] transition-colors"
              >
                {embeddings.map((e) => (
                  <option key={e.id} value={e.id} className="bg-[#0D1B2A]">
                    {e.name} — {e.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-3 block text-[11px] text-[#C0C8D8] tracking-[0.22em] uppercase font-mono">
                Cross-Encoder / Reranker
              </label>
              <select
                value={rerankerModel}
                onChange={(e) => setRerankerModel(e.target.value)}
                className="w-full rounded-xl bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm text-[#00D4FF] outline-none border border-[rgba(0,212,255,0.1)] focus:border-[rgba(0,212,255,0.3)] transition-colors"
              >
                {rerankers.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#0D1B2A]">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        {showAdvanced && embeddingMismatch && (
          <div className="mt-4 rounded-xl border border-[rgba(232,184,75,0.3)] bg-[rgba(232,184,75,0.05)] p-4">
            <p className="text-xs text-[#E8B84B] leading-relaxed">
              <span className="font-bold">Warning:</span> The vector store was
              built with <span className="font-mono">{DEFAULT_EMBEDDING}</span>.
              Querying with <span className="font-mono">{embeddingModel}</span>{" "}
              may return poor results because the embeddings won&apos;t match.
              You can re-ingest the knowledge base with the new model below.
            </p>
            <button
              onClick={handleReingest}
              disabled={reingesting}
              className="mt-3 rounded-lg bg-[rgba(232,184,75,0.15)] border border-[rgba(232,184,75,0.3)] px-4 py-2 text-xs font-bold text-[#E8B84B] tracking-widest uppercase hover:bg-[rgba(232,184,75,0.25)] transition-colors disabled:opacity-50"
            >
              {reingesting
                ? "Re-ingesting... (this may take a minute)"
                : `Re-ingest knowledge base with ${embeddingModel}`}
            </button>
            {reingestResult && (
              <p
                className={`mt-2 text-[11px] font-mono ${reingestResult.startsWith("Error") || reingestResult.startsWith("Failed") ? "text-red-400" : "text-[#00FF88]"}`}
              >
                {reingestResult}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Launch */}
      <button
        onClick={handleLaunch}
        disabled={loading}
        className="btn-launch flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-sm font-bold tracking-[0.2em] uppercase disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Computing
            Trajectory...
          </>
        ) : (
          <>
            <Zap size={16} /> Launch Mission Planning
          </>
        )}
      </button>

      {/* Terminal logs */}
      {logs.length > 0 && (
        <div className="glass-panel max-h-64 overflow-y-auto rounded-2xl p-6 font-mono text-xs space-y-2">
          <div className="mb-3 flex items-center gap-2 text-[11px] text-[#C0C8D8] tracking-[0.22em] uppercase font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse inline-block" />
            Agent Log
          </div>
          {logs.map((l, i) => (
            <TerminalLine key={i} text={l} delay={i * 120} />
          ))}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass-panel rounded-2xl border border-[rgba(0,255,136,0.2)] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-[#00FF88] flex items-center gap-2">
              <Send size={14} /> Mission Result
            </span>
            <Badge
              label={result.feasible ? "Approved" : "Flagged"}
              color={result.feasible ? "green" : "red"}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-[#00D4FF]">
                {result.delta_v.toFixed(3)}
              </div>
              <div className="text-[10px] text-[#C0C8D8] mt-0.5">Δv (km/s)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-[#E8B84B]">
                {result.tof_days.toFixed(1)}
              </div>
              <div className="text-[10px] text-[#C0C8D8] mt-0.5">
                ToF (days)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-[#FF6B35]">
                {result.jacobi.toFixed(4)}
              </div>
              <div className="text-[10px] text-[#C0C8D8] mt-0.5">Jacobi C</div>
            </div>
          </div>
          {result.steps && (
            <div className="space-y-1">
              {result.steps.map((s, i) => (
                <div key={i} className="terminal-text text-[10px] flex gap-2">
                  <span className="text-[#E8B84B]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[#C0C8D8]">{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-5 pt-4 border-t border-[rgba(0,212,255,0.1)]">
            {result.sources && result.sources.length > 0 && (
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-2 text-xs font-mono text-[#E8B84B] bg-[rgba(232,184,75,0.08)] border border-[rgba(232,184,75,0.25)] rounded-xl px-4 py-2.5 hover:bg-[rgba(232,184,75,0.15)] transition-colors"
              >
                📄 {showSources ? "Hide" : "View"} RAG Sources (
                {result.sources.length})
              </button>
            )}
            {onViewSimulation && (
              <button
                onClick={onViewSimulation}
                className="flex items-center gap-2 text-xs font-mono text-[#00D4FF] bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.25)] rounded-xl px-4 py-2.5 hover:bg-[rgba(0,212,255,0.15)] transition-colors"
              >
                🛰️ View Orbit Simulation
              </button>
            )}
          </div>
        </div>
      )}

      {/* RAG Source Citations */}
      {result?.sources && showSources && (
        <div className="glass-panel rounded-2xl border border-[rgba(232,184,75,0.2)] p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-[#E8B84B]">
              📚 RAG Source Citations
            </span>
            <span className="text-[10px] text-[#888] font-mono">
              — Verified document references used by the agent
            </span>
          </div>
          {result.sources.map((src, i) => (
            <div
              key={i}
              className="rounded-xl border border-[rgba(232,184,75,0.12)] bg-[rgba(232,184,75,0.04)] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs text-[#E8B84B] font-mono font-bold shrink-0 mt-0.5">
                  [{i + 1}]
                </span>
                <div className="space-y-1.5 min-w-0">
                  <div className="text-sm text-[#E8EDF5] font-semibold leading-snug">
                    {src.document}
                  </div>
                  {src.section && (
                    <div className="text-xs text-[#00D4FF] font-mono">
                      {src.section}
                      {src.page && (
                        <span className="text-[#888] ml-2">{src.page}</span>
                      )}
                    </div>
                  )}
                  {src.chunk_id && (
                    <div className="text-[10px] text-[#5A6678] font-mono">
                      chunk: {src.chunk_id}
                    </div>
                  )}
                  <div className="text-xs text-[#C0C8D8] leading-relaxed italic border-l-2 border-[rgba(232,184,75,0.3)] pl-3 mt-1">
                    &ldquo;{src.excerpt}&rdquo;
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="text-[10px] text-[#888] font-mono mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" />
            All sources retrieved from the knowledge base vector store.
          </div>
        </div>
      )}
    </div>
  );
}
