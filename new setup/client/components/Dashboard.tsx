"use client";
import { useState } from "react";
import {
  Rocket,
  Satellite,
  Database,
  Shield,
  Coins,
  ChevronLeft,
  ChevronRight,
  Activity,
  Cpu,
  Radar,
  CheckCircle,
  Atom,
} from "lucide-react";
import MissionPlanner, { type PipelineStage } from "./MissionPlanner";
import DataQualityPanel from "./DataQualityPanel";
import SafetyPanel from "./SafetyPanel";
import TokenEconomicsPanel from "./TokenEconomicsPanel";
import OrbitCanvas, { type MissionSnapshot } from "./OrbitCanvas";
import ZeroVelocityCanvas from "./ZeroVelocityCanvas";
import GravityWellCanvas from "./GravityWellCanvas";
import { Badge } from "./UIKit";

const MISSION_PALETTE = [
  "#00D4FF",
  "#FF6B35",
  "#E8B84B",
  "#00FF88",
  "#C8102E",
  "#A855F7",
  "#F472B6",
  "#22D3EE",
  "#FACC15",
  "#4ADE80",
];

const TABS = [
  { id: "mission", label: "Mission Planner", icon: Rocket, color: "#C8102E" },
  { id: "orbit", label: "3D Orbit View", icon: Satellite, color: "#00D4FF" },
  { id: "physics", label: "CR3BP Physics", icon: Atom, color: "#A855F7" },
  { id: "data", label: "Data Audit", icon: Database, color: "#E8B84B" },
  { id: "safety", label: "Safety & Red-Team", icon: Shield, color: "#00FF88" },
  { id: "token", label: "Token Economics", icon: Coins, color: "#FF6B35" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("mission");
  const [collapsed, setCollapsed] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [missionHistory, setMissionHistory] = useState<MissionSnapshot[]>([]);

  const handleNewResult = (r: {
    delta_v: number;
    tof_days: number;
    jacobi: number;
    label: string;
  }) => {
    setMissionHistory((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        label: r.label,
        delta_v: r.delta_v,
        tof_days: r.tof_days,
        jacobi: r.jacobi,
        color: MISSION_PALETTE[prev.length % MISSION_PALETTE.length],
      },
    ]);
  };

  const current = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="flex h-screen w-full overflow-hidden text-[#E8EDF5]">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`relative flex flex-col glass-panel border-r border-[rgba(0,212,255,0.1)] transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo area */}
        {!collapsed && (
          <div className="p-6 border-b border-[rgba(0,212,255,0.08)]">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#00D4FF] bg-[rgba(0,212,255,0.08)]">
                <Rocket size={13} className="text-[#00D4FF]" />
              </div>
              <span className="text-sm font-bold text-[#00D4FF] tracking-[0.22em] uppercase">
                Cislunar
              </span>
            </div>
            <div className="pl-10 text-[10px] text-[#7A8797] tracking-[0.22em] uppercase font-mono">
              Mission Control
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                activeTab === id
                  ? "text-[#E8EDF5] border"
                  : "text-[#8F9AAC] hover:text-[#E8EDF5] hover:bg-[rgba(255,255,255,0.04)]"
              }`}
              style={
                activeTab === id
                  ? {
                      background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                      borderColor: `${color}40`,
                      boxShadow: `0 0 12px ${color}20`,
                    }
                  : {}
              }
            >
              <Icon
                size={16}
                style={{
                  color: activeTab === id ? color : undefined,
                  flexShrink: 0,
                }}
              />
              {!collapsed && (
                <span className="truncate text-sm tracking-wide">{label}</span>
              )}
              {!collapsed && activeTab === id && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: color }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* System status */}
        {!collapsed && (
          <div className="p-4 border-t border-[rgba(0,212,255,0.08)] space-y-3">
            <div className="text-[10px] text-[#657285] tracking-[0.2em] uppercase font-mono mb-2">
              System Status
            </div>
            {[
              { label: "FastAPI", ok: true },
              { label: "Vector DB", ok: true },
              { label: "GNN-PINN", ok: true },
            ].map(({ label, ok }) => (
              <div
                key={label}
                className="flex items-center justify-between text-[11px]"
              >
                <span className="text-[#8F9AAC] font-mono">{label}</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-[#00FF88]" : "bg-[#FF4444]"}`}
                  />
                  <span className={ok ? "text-[#00FF88]" : "text-[#FF4444]"}>
                    {ok ? "online" : "offline"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass-panel border border-[rgba(0,212,255,0.2)] flex items-center justify-center text-[#00D4FF] hover:border-[#00D4FF] transition-all z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="glass-panel border-b border-[rgba(0,212,255,0.08)] px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <current.icon size={20} style={{ color: current.color }} />
            <span className="text-lg font-semibold text-[#E8EDF5] tracking-wide">
              {current.label}
            </span>
            <Badge label="Live" color="green" />
          </div>
          <div className="hidden xl:flex items-center gap-3 text-xs font-mono text-[#8F9AAC]">
            <div className="flex items-center gap-1.5 rounded-full border border-[rgba(0,212,255,0.12)] bg-[rgba(255,255,255,0.02)] px-3 py-1.5">
              <Activity size={11} className="text-[#00FF88]" />
              <span>μ = 0.01215 (CR3BP)</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-1.5">
              <span className="text-[#C8102E]">▲</span>
              <span>LEO 167km → LMO 100km</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-1.5">
              <span className="text-[#E8B84B]">BHU</span>
              <span>AI Systems Lab · 2025</span>
            </div>
          </div>
        </div>

        {/* Panel */}
        <div className="relative flex-1 overflow-y-auto p-7 md:p-10">
          {/* Grid overlay */}
          <div className="absolute inset-0 grid-overlay pointer-events-none opacity-40" />
          <div className="relative z-10 mx-auto w-full max-w-400">
            {activeTab === "mission" && (
              <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(380px,0.75fr)]">
                <div className="glass-panel rounded-[28px] border border-[rgba(0,212,255,0.16)] p-8 md:p-10 shadow-[0_0_45px_rgba(0,212,255,0.08)]">
                  <MissionPlanner
                    onPipelineChange={setPipelineStage}
                    onViewSimulation={() => setActiveTab("orbit")}
                    onResult={handleNewResult}
                  />
                </div>
                <div className="space-y-5">
                  <div className="glass-panel rounded-[28px] p-6 border border-[rgba(0,212,255,0.14)]">
                    <p className="text-[11px] tracking-widest uppercase text-[#C0C8D8] font-mono mb-5">
                      Live Telemetry
                    </p>
                    <div className="mt-1 grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-[rgba(0,212,255,0.06)] p-3 border border-[rgba(0,212,255,0.2)]">
                        <p className="text-[10px] text-[#888] font-mono uppercase">
                          Solver
                        </p>
                        <p className="mt-1 text-sm text-[#00D4FF] font-semibold">
                          Hybrid GNN-PINN
                        </p>
                      </div>
                      <div className="rounded-xl bg-[rgba(0,255,136,0.06)] p-3 border border-[rgba(0,255,136,0.2)]">
                        <p className="text-[10px] text-[#888] font-mono uppercase">
                          Status
                        </p>
                        <p className="mt-1 text-sm text-[#00FF88] font-semibold">
                          Ready
                        </p>
                      </div>
                      <div className="rounded-xl bg-[rgba(232,184,75,0.08)] p-3 border border-[rgba(232,184,75,0.25)]">
                        <p className="text-[10px] text-[#888] font-mono uppercase">
                          CR3BP μ
                        </p>
                        <p className="mt-1 text-sm text-[#E8B84B] font-semibold">
                          0.01215
                        </p>
                      </div>
                      <div className="rounded-xl bg-[rgba(200,16,46,0.08)] p-3 border border-[rgba(200,16,46,0.25)]">
                        <p className="text-[10px] text-[#888] font-mono uppercase">
                          Constraint
                        </p>
                        <p className="mt-1 text-sm text-[#FFD3D3] font-semibold">
                          Safety-first
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-[28px] p-6 border border-[rgba(0,212,255,0.14)]">
                    <p className="text-[11px] tracking-widest uppercase text-[#C0C8D8] font-mono mb-5">
                      Mission Pipeline
                    </p>
                    <div className="space-y-3">
                      {[
                        {
                          icon: Cpu,
                          label: "RAG Context Retrieval",
                          stageKey: "rag" as const,
                        },
                        {
                          icon: Radar,
                          label: "Trajectory Search",
                          stageKey: "trajectory" as const,
                        },
                        {
                          icon: CheckCircle,
                          label: "Guardrail Validation",
                          stageKey: "guardrail" as const,
                        },
                      ].map(({ icon: Icon, label, stageKey }) => {
                        const stages: PipelineStage[] = [
                          "idle",
                          "rag",
                          "trajectory",
                          "guardrail",
                          "done",
                        ];
                        const currentIdx = stages.indexOf(pipelineStage);
                        const itemIdx = stages.indexOf(stageKey);
                        const isActive = pipelineStage === stageKey;
                        const isDone = currentIdx > itemIdx;
                        const state = isDone
                          ? "Done"
                          : isActive
                            ? "Active"
                            : "Pending";
                        return (
                          <div
                            key={label}
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                              isActive
                                ? "border-[rgba(0,212,255,0.4)] bg-[rgba(0,212,255,0.12)]"
                                : isDone
                                  ? "border-[rgba(0,255,136,0.3)] bg-[rgba(0,255,136,0.06)]"
                                  : "border-[rgba(0,212,255,0.15)] bg-[rgba(0,212,255,0.05)]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon
                                size={14}
                                className={
                                  isDone
                                    ? "text-[#00FF88]"
                                    : isActive
                                      ? "text-[#00D4FF]"
                                      : "text-[#657285]"
                                }
                              />
                              <span
                                className={`text-sm ${isDone ? "text-[#00FF88]" : isActive ? "text-[#E8EDF5]" : "text-[#8F9AAC]"}`}
                              >
                                {label}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-mono uppercase tracking-wider ${
                                isDone
                                  ? "text-[#00FF88]"
                                  : isActive
                                    ? "text-[#00D4FF]"
                                    : "text-[#657285]"
                              }`}
                            >
                              {isActive && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse mr-1.5" />
                              )}
                              {isDone && "✓ "}
                              {state}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="glass-panel rounded-[28px] border border-[rgba(0,212,255,0.14)] p-6">
                    <p className="text-[11px] tracking-widest uppercase text-[#C0C8D8] font-mono mb-4">
                      Operator Notes
                    </p>
                    <div className="space-y-4 text-sm text-[#C0C8D8] leading-7">
                      <p>
                        Select a transfer profile, provide mission intent, and
                        launch planning to retrieve a feasible candidate
                        trajectory.
                      </p>
                      <p>
                        The live demo uses the same project physics, safety,
                        RAG, and agent layers as the legacy Streamlit workflow.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "orbit" && (
              <div
                className="glass-panel rounded-2xl overflow-hidden"
                style={{ height: "85vh" }}
              >
                <div className="px-6 py-4 border-b border-[rgba(0,212,255,0.1)] flex items-center gap-3">
                  <Satellite size={20} className="text-[#00D4FF]" />
                  <span className="text-sm font-mono text-[#C0C8D8] tracking-widest uppercase">
                    CR3BP Cislunar Manifold — Real-time Simulation
                  </span>
                  <span className="ml-auto text-xs font-mono text-[#888]">
                    Earth-Moon rotating frame
                  </span>
                </div>
                <div
                  className="relative"
                  style={{ height: "calc(85vh - 56px)" }}
                >
                  <OrbitCanvas missions={missionHistory} />
                  {/* Legend */}
                  <div className="absolute bottom-6 left-6 glass-panel rounded-xl p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                    <p className="text-[10px] text-[#888] tracking-widest uppercase font-mono mb-1">
                      Bodies
                    </p>
                    {[
                      { color: "#C0C8D8", label: "Moon (LMO target)" },
                      { color: "#FF6B35", label: "LEO satellite" },
                      { color: "#E8B84B", label: "Transfer arc (baseline)" },
                    ].map(({ color, label }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 text-sm font-mono"
                      >
                        <div
                          className="w-5 h-1 rounded-full shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-[#C0C8D8]">{label}</span>
                      </div>
                    ))}
                    {missionHistory.length > 0 && (
                      <>
                        <div className="border-t border-[rgba(0,212,255,0.1)] mt-2 pt-2" />
                        <p className="text-[10px] text-[#888] tracking-widest uppercase font-mono">
                          Mission History
                        </p>
                        {missionHistory.map((m, i) => (
                          <div
                            key={m.id}
                            className={`flex items-center gap-3 text-sm font-mono ${
                              i === missionHistory.length - 1
                                ? "text-[#E8EDF5]"
                                : "text-[#657285]"
                            }`}
                          >
                            <div
                              className={`w-5 h-1 rounded-full shrink-0 ${i === missionHistory.length - 1 ? "" : "opacity-40"}`}
                              style={{ background: m.color }}
                            />
                            <span className="truncate max-w-40">
                              #{m.id} Δv {m.delta_v.toFixed(2)} ·{" "}
                              {m.tof_days.toFixed(1)}d
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === "data" && <DataQualityPanel />}
            {activeTab === "safety" && <SafetyPanel />}
            {activeTab === "token" && <TokenEconomicsPanel />}

            {/* ── CR3BP Physics Visualisations ───────────────────────── */}
            {activeTab === "physics" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <Atom size={24} className="text-[#A855F7]" />
                  <h2 className="text-2xl font-bold text-[#A855F7]">
                    CR3BP Physics Visualiser
                  </h2>
                  <span className="ml-auto text-xs font-mono text-[#888]">
                    μ = 0.01215 · Earth-Moon rotating frame · real-time
                  </span>
                </div>

                {/* Jacobi / Zero-Velocity Curves */}
                <div className="glass-panel rounded-3xl border border-[rgba(168,85,247,0.2)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[rgba(168,85,247,0.12)] flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold text-[#A855F7] font-mono tracking-widest uppercase">
                      Zero-Velocity Curves — Jacobi Forbidden Zones
                    </span>
                    <span className="text-xs text-[#8F9AAC] font-mono">
                      Animated · C oscillates between C(L4/5) and C(L1)+margin
                    </span>
                  </div>
                  <div style={{ height: "52vh" }}>
                    <ZeroVelocityCanvas />
                  </div>
                  <div className="px-6 py-4 border-t border-[rgba(168,85,247,0.1)] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono text-[#8F9AAC]">
                    <div>
                      <span className="text-[#A855F7] font-bold">
                        Purple region
                      </span>{" "}
                      — spacecraft with the current Jacobi constant C cannot
                      physically reach this zone (kinetic energy would go
                      negative).
                    </div>
                    <div>
                      <span className="text-[#00D4FF] font-bold">
                        Glowing cyan boundary
                      </span>{" "}
                      — the zero-velocity curve. As C decreases (more energy),
                      the gates at L1 and L2 open and the spacecraft gains
                      access to the Moon or escape.
                    </div>
                    <div>
                      <span className="text-[#00FF88] font-bold">
                        Green dots
                      </span>{" "}
                      = open Lagrange point gates.{" "}
                      <span className="text-[#FF6B35] font-bold">Orange</span> =
                      still closed. Watch L1 open first, then L2, then L3, then
                      L4/L5.
                    </div>
                  </div>
                </div>

                {/* 3D Gravity Well */}
                <div className="glass-panel rounded-3xl border border-[rgba(255,107,53,0.2)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[rgba(255,107,53,0.12)] flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold text-[#FF6B35] font-mono tracking-widest uppercase">
                      3-D Effective Potential Ω(x,y) — Gravity Well Surface
                    </span>
                    <span className="text-xs text-[#8F9AAC] font-mono">
                      Slowly rotating · Painter&apos;s algorithm · 42×42 mesh
                    </span>
                  </div>
                  <div style={{ height: "56vh" }}>
                    <GravityWellCanvas />
                  </div>
                  <div className="px-6 py-4 border-t border-[rgba(255,107,53,0.1)] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono text-[#8F9AAC]">
                    <div>
                      <span className="text-[#FF6B35] font-bold">
                        Deep blue-cyan pits
                      </span>{" "}
                      — Earth and Moon gravity wells. The spacecraft falls in as
                      it approaches; escaping requires the insertion burn (Δv).
                    </div>
                    <div>
                      <span className="text-[#E8B84B] font-bold">
                        Gold spires
                      </span>{" "}
                      — the 5 Lagrange points. L1, L2, L3 sit at unstable saddle
                      points between the wells. L4, L5 sit at stable local
                      maxima (equilateral triangle).
                    </div>
                    <div>
                      <span className="text-[#00D4FF] font-bold">
                        Bright cyan ridge
                      </span>{" "}
                      — peak depth at Earth/Moon cores (clamped singularities).
                      The flat cyan plateau is the far-field low-energy region.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
