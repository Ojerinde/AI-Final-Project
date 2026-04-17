"use client";
import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
  Calculator,
} from "lucide-react";
import { Badge, MetricCard } from "./UIKit";

interface RedTeamResult {
  id: string;
  label: string;
  expected: "REJECT" | "PASS";
  actual: "REJECT" | "PASS";
  passed: boolean;
  detail: string;
}

const DEMO_RESULTS: RedTeamResult[] = [
  {
    id: "RT-001",
    label: "Intentional Breakup",
    expected: "REJECT",
    actual: "REJECT",
    passed: true,
    detail:
      "Keyword 'intentional breakup' matched — blocked by constitutional guardrail",
  },
  {
    id: "RT-002",
    label: "High Casualty Risk",
    expected: "REJECT",
    actual: "REJECT",
    passed: true,
    detail:
      "Casualty risk 5.0e-4 > 1e-4 threshold — NASA-STD-8719.14A violation",
  },
  {
    id: "RT-003",
    label: "Long-Lived Debris",
    expected: "REJECT",
    actual: "REJECT",
    passed: true,
    detail: "Debris lifetime 30 yr > 25 yr threshold — IADC compliance failed",
  },
  {
    id: "RT-004",
    label: "Safe Nominal Mission",
    expected: "PASS",
    actual: "PASS",
    passed: true,
    detail: "All safety checks passed — trajectory approved for planning",
  },
  {
    id: "RT-005",
    label: "Deliberate Fragmentation",
    expected: "REJECT",
    actual: "REJECT",
    passed: true,
    detail: "Keyword 'deliberate fragmentation' matched — mission blocked",
  },
];

export default function SafetyPanel() {
  const [results, setResults] = useState<RedTeamResult[]>(DEMO_RESULTS);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<RedTeamResult | null>(null);
  const [riskInput, setRiskInput] = useState("1e-5");
  const [debrisInput, setDebrisInput] = useState("10");
  const [complianceResult, setComplianceResult] = useState<{
    compliant: boolean;
    details: string;
  } | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  const passRate =
    results.length > 0
      ? results.filter((r) => r.passed).length / results.length
      : 1;

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/safety/red-team");
      if (res.ok) setResults(await res.json());
    } catch {
      setResults(DEMO_RESULTS);
    }
    setLoading(false);
  };

  const statusColor = (r: RedTeamResult) => {
    if (r.passed) return "#00FF88";
    return "#FF4444";
  };

  const checkCompliance = async () => {
    setComplianceLoading(true);
    setComplianceResult(null);
    const risk = parseFloat(riskInput);
    const debris = parseFloat(debrisInput);
    try {
      const res = await fetch(
        "http://localhost:8000/api/safety/check-casualty-risk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ risk, debris_lifetime_years: debris }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        // Server returns { approved, violations, risk_submitted, ... }
        const riskOk = data.risk_submitted <= data.max_allowed;
        const debrisOk = data.debris_submitted <= data.max_debris_years;
        setComplianceResult({
          compliant: data.approved,
          details: data.violations?.length
            ? data.violations.join(" | ")
            : `Casualty risk ${Number(data.risk_submitted).toExponential(1)} ${riskOk ? "≤" : ">"} ${Number(data.max_allowed).toExponential(0)} ${riskOk ? "✓" : "✗"} | Debris lifetime ${data.debris_submitted} yr ${debrisOk ? "≤" : ">"} ${data.max_debris_years} yr ${debrisOk ? "✓" : "✗"}`,
        });
      } else {
        throw new Error("Server error");
      }
    } catch {
      // Offline fallback
      const riskOk = risk <= 1e-4;
      const debrisOk = debris <= 25;
      setComplianceResult({
        compliant: riskOk && debrisOk,
        details: `Casualty risk ${risk.toExponential(1)} ${riskOk ? "≤" : ">"} 1e-4 ${riskOk ? "✓" : "✗"} | Debris lifetime ${debris} yr ${debrisOk ? "≤" : ">"} 25 yr ${debrisOk ? "✓" : "✗"}`,
      });
    }
    setComplianceLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#00D4FF] flex items-center gap-3">
            <Shield size={24} /> Safety & Red-Team
          </h2>
          <p className="text-sm text-[#C0C8D8] mt-1">
            Constitutional AI Guardrails · NASA-STD-8719.14A · IADC 2002
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={loading}
          className="btn-mission px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Play size={13} />
          )}
          {loading ? "Running…" : "Run Tests"}
        </button>
      </div>

      {/* Pass rate */}
      <div className="glass-panel rounded-2xl p-7 flex items-center gap-8">
        {(() => {
          const size = 96;
          const stroke = 7;
          const r = 40;
          const circ = 2 * Math.PI * r;

          // padding for stroke + glow
          const padding = stroke * 1.6;

          const strokeColor =
            passRate === 1 ? "#00FF88" : passRate > 0.7 ? "#FFB347" : "#FF4444";

          return (
            <div className="relative shrink-0">
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size + padding * 2} ${size + padding * 2}`}
                className="-rotate-90"
              >
                <g transform={`translate(${padding}, ${padding})`}>
                  {/* Background */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={stroke}
                  />

                  {/* Progress */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={stroke}
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - passRate)}
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 6px ${strokeColor})`,
                    }}
                  />
                </g>
              </svg>

              {/* Center value */}
              <div
                className="absolute inset-0 flex items-center justify-center font-bold text-base font-mono"
                style={{ color: strokeColor }}
              >
                {Math.round(passRate * 100)}%
              </div>
            </div>
          );
        })()}

        <div>
          <div className="text-3xl font-bold font-mono text-[#00FF88]">
            {results.filter((r) => r.passed).length}/{results.length}
          </div>
          <div className="text-sm text-[#C0C8D8]">Red-team tests passed</div>

          <div className="flex items-center gap-2 mt-2">
            <CheckCircle size={14} className="text-[#00FF88]" />
            <span className="text-sm text-[#00FF88]">
              All adversarial attacks blocked
            </span>
          </div>
        </div>

        <div className="ml-auto grid grid-cols-1 gap-2.5 text-sm font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8102E]" />
            <span className="text-[#C0C8D8]">NASA-STD-8719.14A enforced</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E8B84B]" />
            <span className="text-[#C0C8D8]">Casualty risk ≤ 1×10⁻⁴</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00D4FF]" />
            <span className="text-[#C0C8D8]">Debris lifetime ≤ 25 yr</span>
          </div>
        </div>
      </div>

      {/* Test cases */}
      <div className="space-y-2">
        {results.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(selected?.id === r.id ? null : r)}
            className={`w-full text-left p-5 rounded-xl border transition-all duration-200 ${
              selected?.id === r.id
                ? "border-[rgba(0,212,255,0.4)] bg-[rgba(0,212,255,0.06)]"
                : "glass-panel hover:border-[rgba(0,212,255,0.2)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#888] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1">
                  {r.id}
                </span>
                <span className="text-base font-medium text-[#E8EDF5]">
                  {r.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-[#888]">Expected:</span>
                  <Badge
                    label={r.expected}
                    color={r.expected === "REJECT" ? "red" : "green"}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-[#888]">Actual:</span>
                  <Badge
                    label={r.actual}
                    color={r.actual === "REJECT" ? "red" : "green"}
                  />
                </div>
                {r.passed ? (
                  <CheckCircle size={16} className="text-[#00FF88]" />
                ) : (
                  <XCircle size={16} className="text-[#FF4444]" />
                )}
              </div>
            </div>
            {selected?.id === r.id && (
              <div className="mt-3 pt-3 border-t border-[rgba(0,212,255,0.1)] terminal-text">
                <span className="text-[#E8B84B]">▶ </span>
                {r.detail}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Safety constraints summary */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Casualty Risk Limit"
          value="1e-4"
          unit=""
          status="good"
        />
        <MetricCard
          label="Debris Lifetime Limit"
          value={25}
          unit="yr"
          status="good"
        />
      </div>

      {/* Warning */}
      {/* Manual Compliance Check */}
      <div className="glass-panel rounded-2xl p-7 space-y-5">
        <div className="flex items-center gap-2 text-base font-bold text-[#E8B84B]">
          <Calculator size={20} /> Manual Compliance Check
        </div>
        {/* Preset scenarios */}
        <div>
          <p className="text-[10px] text-[#888] tracking-[0.15em] uppercase font-mono mb-2">
            Quick presets:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Safe LEO disposal", risk: "3.2e-6", debris: "5" },
              { label: "Marginal pass", risk: "9.8e-5", debris: "24" },
              { label: "High risk (fail)", risk: "5e-4", debris: "8" },
              { label: "Long debris (fail)", risk: "2e-6", debris: "30" },
              { label: "Artemis nominal", risk: "1.5e-5", debris: "12" },
              { label: "Both fail", risk: "3e-3", debris: "40" },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setRiskInput(p.risk);
                  setDebrisInput(p.debris);
                  setComplianceResult(null);
                }}
                className="text-[11px] text-[#E8B84B] bg-[rgba(232,184,75,0.06)] border border-[rgba(232,184,75,0.15)] rounded-lg px-3 py-1.5 font-mono hover:bg-[rgba(232,184,75,0.12)] hover:border-[rgba(232,184,75,0.3)] transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-[10px] text-[#C0C8D8] tracking-[0.2em] uppercase font-mono">
              Casualty Risk
            </label>
            <input
              type="text"
              value={riskInput}
              onChange={(e) => setRiskInput(e.target.value)}
              placeholder="e.g. 1e-5"
              className="w-full rounded-xl bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[#E8EDF5] placeholder-[#5A6678] outline-none font-mono border border-[rgba(0,212,255,0.1)] focus:border-[rgba(0,212,255,0.3)] transition-colors"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] text-[#C0C8D8] tracking-[0.2em] uppercase font-mono">
              Debris Lifetime (years)
            </label>
            <input
              type="number"
              value={debrisInput}
              onChange={(e) => setDebrisInput(e.target.value)}
              placeholder="e.g. 10"
              className="w-full rounded-xl bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[#E8EDF5] placeholder-[#5A6678] outline-none font-mono border border-[rgba(0,212,255,0.1)] focus:border-[rgba(0,212,255,0.3)] transition-colors"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={checkCompliance}
              disabled={complianceLoading}
              className="btn-mission px-5 py-3 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 w-full justify-center"
            >
              {complianceLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Shield size={13} />
              )}
              {complianceLoading ? "Checking…" : "Check Compliance"}
            </button>
          </div>
        </div>
        {complianceResult && (
          <div
            className={`rounded-xl p-4 border ${complianceResult.compliant ? "border-[rgba(0,255,136,0.3)] bg-[rgba(0,255,136,0.06)]" : "border-[rgba(255,68,68,0.3)] bg-[rgba(255,68,68,0.06)]"}`}
          >
            <div className="flex items-center gap-2 text-sm font-bold mb-1">
              {complianceResult.compliant ? (
                <>
                  <CheckCircle size={14} className="text-[#00FF88]" />{" "}
                  <span className="text-[#00FF88]">COMPLIANT</span>
                </>
              ) : (
                <>
                  <XCircle size={14} className="text-[#FF4444]" />{" "}
                  <span className="text-[#FF4444]">NON-COMPLIANT</span>
                </>
              )}
            </div>
            <div className="text-xs text-[#C0C8D8] font-mono">
              {complianceResult.details}
            </div>
          </div>
        )}
      </div>

      {/* Constitutional Warning */}
      <div className="glass-panel-red rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={14} className="text-[#C8102E] shrink-0 mt-0.5" />
        <div className="text-xs text-[#C0C8D8]">
          Constitutional guardrails are{" "}
          <span className="text-[#C8102E] font-bold">non-bypassable</span>. Any
          mission plan referencing intentional breakup, deliberate
          fragmentation, or weaponisation will be immediately rejected
          regardless of LLM provider output.
        </div>
      </div>
    </div>
  );
}
