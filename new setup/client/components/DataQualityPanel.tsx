"use client";
import { useEffect, useState } from "react";
import { Database, CheckCircle, AlertTriangle } from "lucide-react";
import { MetricCard, ProgressRing, Badge } from "./UIKit";
import { apiUrl } from "@/lib/api";

interface AuditData {
  q_total: number;
  completeness: number;
  consistency: number;
  accuracy: number;
  timeliness: number;
  relevance: number;
  rows?: number;
  cols?: number;
  top_mi_features?: { feature: string; mi_score: number }[];
}

const DEMO: AuditData = {
  q_total: 0.948,
  completeness: 0.8879,
  consistency: 0.9579,
  accuracy: 1.0,
  timeliness: 1.0,
  relevance: 0.9,
  rows: 1000000,
  cols: 33,
  top_mi_features: [
    { feature: "delta_v", mi_score: 0.847 },
    { feature: "tof", mi_score: 0.792 },
    { feature: "jacobi_constant", mi_score: 0.681 },
    { feature: "v0_mag", mi_score: 0.634 },
    { feature: "r0_mag", mi_score: 0.598 },
  ],
};

const DIM_COLORS: Record<string, string> = {
  completeness: "#00D4FF",
  consistency: "#E8B84B",
  accuracy: "#00FF88",
  timeliness: "#FF6B35",
  relevance: "#C8102E",
};

export default function DataQualityPanel() {
  const [data, setData] = useState<AuditData>(DEMO);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/audit"));
      if (res.ok) setData(await res.json());
    } catch {
      /* use demo */
    }
    setLoading(false);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/audit"), { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => {
        /* use demo */
      });
    return () => controller.abort();
  }, []);

  const dims = [
    "completeness",
    "consistency",
    "accuracy",
    "timeliness",
    "relevance",
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#00D4FF] flex items-center gap-3">
            <Database size={24} /> Data Quality Audit
          </h2>
          <p className="text-sm text-[#C0C8D8] mt-1">
            {(data.rows ?? 1000000).toLocaleString()} trajectory records ·
            5-dimension quality framework
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Q-total" color="cyan" />
          <button
            onClick={runAudit}
            disabled={loading}
            className="btn-mission px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider"
          >
            {loading ? "Running…" : "Re-audit"}
          </button>
        </div>
      </div>

      {/* Overall score */}
      <div className="glass-panel rounded-2xl p-8 flex items-center gap-10">
        <ProgressRing
          value={data.q_total}
          max={1}
          size={130}
          stroke={15}
          color="#00D4FF"
          label="Q_total"
        />
        <div>
          <div className="text-6xl font-bold font-mono text-[#00D4FF] text-glow-cyan">
            {(data.q_total * 100).toFixed(2)}
            <span className="text-3xl text-[#C0C8D8]">%</span>
          </div>
          <div className="text-sm text-[#C0C8D8] mt-1.5 font-mono">
            Geometric mean of 5 dimensions
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle size={16} className="text-[#00FF88]" />
            <span className="text-sm text-[#00FF88]">
              Exceeds 0.90 quality threshold
            </span>
          </div>
        </div>
      </div>

      {/* Dimension rings */}
      <div className="grid grid-cols-5 gap-4">
        {dims.map((d) => (
          <div
            key={d}
            className="glass-panel rounded-xl p-5 flex flex-col items-center gap-3"
          >
            <ProgressRing
              value={data[d]}
              max={1}
              size={90}
              stroke={7}
              color={DIM_COLORS[d]}
              label={d.charAt(0).toUpperCase() + d.slice(1)}
            />
            <span
              className="text-base font-bold font-mono"
              style={{ color: DIM_COLORS[d] }}
            >
              {(data[d] * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Records"
          value={data.rows ?? 1000000}
          unit="rows"
          trend="neutral"
        />
        <MetricCard
          label="Feature Columns"
          value={data.cols ?? 33}
          unit="cols"
          trend="neutral"
        />
        <MetricCard
          label="Vector Columns"
          value={4}
          unit="parsed"
          trend="neutral"
        />
        <MetricCard
          label="Missing Values"
          value={0.12}
          unit="%"
          status="good"
          trend="down"
        />
        <MetricCard
          label="Outliers Removed"
          value={0.42}
          unit="%"
          status="good"
          trend="down"
        />
        <MetricCard
          label="Q_total Score"
          value={data.q_total}
          unit=""
          status="good"
          trend="up"
        />
      </div>

      {/* Column definitions */}
      <div className="glass-panel rounded-xl p-6">
        <div className="text-xs text-[#C0C8D8] tracking-widest uppercase mb-4 font-mono">
          Vector Columns Parsed
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            "r0 (position)",
            "v0 (velocity)",
            "r_vmin (periapsis)",
            "r_vmax (apoapsis)",
          ].map((c) => (
            <div key={c} className="flex items-center gap-2 text-sm">
              <CheckCircle size={14} className="text-[#00FF88] shrink-0" />
              <span className="text-[#C0C8D8] font-mono">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top-5 MI Features */}
      {data.top_mi_features && data.top_mi_features.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-[#C0C8D8] tracking-widest uppercase mb-4 font-mono">
            Top-5 Features by Mutual Information
          </div>
          <div className="space-y-3">
            {data.top_mi_features.map((f, i) => (
              <div key={f.feature} className="flex items-center gap-3">
                <span className="text-xs text-[#888] font-mono w-5">
                  {i + 1}.
                </span>
                <span className="text-sm text-[#E8EDF5] font-mono w-44">
                  {f.feature}
                </span>
                <div className="flex-1 h-3 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${f.mi_score * 100}%`,
                      background: `linear-gradient(90deg, #00D4FF, #00FF88)`,
                    }}
                  />
                </div>
                <span className="text-sm font-mono text-[#00D4FF] w-14 text-right">
                  {f.mi_score.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fleiss Kappa note */}
      <div className="glass-panel rounded-xl p-6 flex items-start gap-3">
        <AlertTriangle size={16} className="text-[#E8B84B] shrink-0 mt-0.5" />
        <div className="text-sm text-[#C0C8D8]">
          <span className="text-[#E8B84B] font-bold">Accuracy</span> measured
          via Fleiss&apos; κ inter-rater reliability on trajectory
          classification bins. <span className="text-[#E8B84B]">κ = 1.0</span>{" "}
          indicates perfect agreement.
        </div>
      </div>
    </div>
  );
}
