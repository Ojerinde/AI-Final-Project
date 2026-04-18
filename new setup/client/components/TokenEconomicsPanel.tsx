"use client";
import { useEffect, useState, useMemo } from "react";
import { Coins, TrendingUp, Zap, BarChart2, Calculator } from "lucide-react";
import { MetricCard, Badge } from "./UIKit";
import { apiUrl } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

const PROVIDERS_DATA = [
  { name: "Groq", cost: 0, tokens_m: 0.05, latency: 180, free: true },
  { name: "Gemini Flash", cost: 0, tokens_m: 0.075, latency: 320, free: true },
  { name: "Gemini Pro", cost: 3.5, tokens_m: 3.5, latency: 520, free: false },
  { name: "GPT-4o", cost: 5, tokens_m: 5, latency: 650, free: false },
  { name: "Claude 3.5", cost: 3, tokens_m: 3, latency: 480, free: false },
  { name: "Ollama Local", cost: 0, tokens_m: 0, latency: 900, free: true },
];

const TOKEN_HISTORY = [
  { month: "Jan", groq: 28, gemini: 14, total: 42 },
  { month: "Feb", groq: 31, gemini: 16, total: 47 },
  { month: "Mar", groq: 36, gemini: 19, total: 55 },
  { month: "Apr", groq: 34, gemini: 21, total: 55 },
  { month: "May", groq: 41, gemini: 24, total: 65 },
  { month: "Jun", groq: 45, gemini: 27, total: 72 },
  { month: "Jul", groq: 48, gemini: 29, total: 77 },
  { month: "Aug", groq: 52, gemini: 31, total: 83 },
  { month: "Sep", groq: 56, gemini: 33, total: 89 },
  { month: "Oct", groq: 61, gemini: 36, total: 97 },
  { month: "Nov", groq: 64, gemini: 39, total: 103 },
  { month: "Dec", groq: 68, gemini: 42, total: 110 },
];

const TOOLTIP_STYLE = {
  backgroundColor: "#0D1B2A",
  border: "1px solid rgba(0,212,255,0.2)",
  borderRadius: 8,
  color: "#E8EDF5",
  fontSize: 11,
};

export default function TokenEconomicsPanel() {
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [numMissions, setNumMissions] = useState(10);
  const [avgTokens, setAvgTokens] = useState(3000);
  const [pricing, setPricing] = useState<
    Record<string, { name: string; cost_per_1m: number; free: boolean }>
  >({});

  const normalizePricing = (
    payload: unknown,
  ): Record<string, { name: string; cost_per_1m: number; free: boolean }> => {
    if (Array.isArray(payload)) {
      const out: Record<
        string,
        { name: string; cost_per_1m: number; free: boolean }
      > = {};
      payload.forEach((p, idx) => {
        if (typeof p !== "object" || p === null) return;
        const row = p as {
          provider?: string;
          input_per_m?: number;
          output_per_m?: number;
          free?: boolean;
        };
        const key = (row.provider || `provider_${idx}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_");
        const input = Number(row.input_per_m ?? 0);
        const output = Number(row.output_per_m ?? 0);
        out[key] = {
          name: row.provider || `Provider ${idx + 1}`,
          // Average blended rate for quick estimator card
          cost_per_1m: Number.isFinite((input + output) / 2)
            ? (input + output) / 2
            : 0,
          free: Boolean(row.free),
        };
      });
      return out;
    }

    if (payload && typeof payload === "object") {
      return payload as Record<
        string,
        { name: string; cost_per_1m: number; free: boolean }
      >;
    }
    return {};
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(apiUrl("/api/stats/tokens"));
        if (res.ok) {
          const d = await res.json();
          setTotalCalls(d.total_calls);
          setTotalTokens(d.total_tokens);
          setEstimatedCost(d.estimated_cost_usd);
        }
      } catch {
        setTotalCalls(1247);
        setTotalTokens(2834500);
        setEstimatedCost(0.0);
      }
    };
    const fetchPricing = async () => {
      try {
        const res = await fetch(apiUrl("/api/pricing"));
        if (res.ok) {
          const payload = await res.json();
          setPricing(normalizePricing(payload));
        }
      } catch {
        setPricing({
          groq: { name: "Groq", cost_per_1m: 0, free: true },
          gemini_flash: { name: "Gemini Flash", cost_per_1m: 0, free: true },
          gemini_pro: { name: "Gemini Pro", cost_per_1m: 3.5, free: false },
          gpt4o: { name: "GPT-4o", cost_per_1m: 5.0, free: false },
          claude: { name: "Claude 3.5", cost_per_1m: 3.0, free: false },
          ollama: { name: "Ollama", cost_per_1m: 0, free: true },
        });
      }
    };
    fetchStats();
    fetchPricing();
  }, []);

  const costEstimates = useMemo(() => {
    const totalTok = numMissions * avgTokens;
    return Object.entries(pricing).map(([key, p]) => ({
      key,
      name: p.name,
      free: p.free,
      cost: (totalTok / 1_000_000) * p.cost_per_1m,
    }));
  }, [numMissions, avgTokens, pricing]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#00D4FF] flex items-center gap-3">
            <Coins size={24} /> Token Economics
          </h2>
          <p className="text-sm text-[#C0C8D8] mt-1">
            LLM cost analysis · Free-tier optimisation · Provider comparison
          </p>
        </div>
        <Badge label="Free-first Strategy" color="gold" />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total API Calls" value={totalCalls} trend="up" />
        <MetricCard
          label="Tokens Processed"
          value={Math.round(totalTokens / 1000)}
          unit="K"
          trend="up"
        />
        <MetricCard
          label="Estimated Cost"
          value={estimatedCost.toFixed(4)}
          unit="USD"
          status="good"
          trend="neutral"
        />
      </div>

      {/* Provider cost comparison bar chart */}
      <div className="glass-panel rounded-xl p-7">
        <div className="text-sm text-[#C0C8D8] tracking-widest uppercase font-mono mb-5">
          Cost per 1M Tokens (USD)
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={PROVIDERS_DATA} barSize={36}>
            <XAxis
              dataKey="name"
              tick={{ fill: "#C0C8D8", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#C0C8D8", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "rgba(0,212,255,0.05)" }}
            />
            <Bar
              dataKey="tokens_m"
              fill="#00D4FF"
              radius={[4, 4, 0, 0]}
              label={{ fill: "#C0C8D8", fontSize: 12, position: "top" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Latency comparison */}
      <div className="glass-panel rounded-xl p-7">
        <div className="text-sm text-[#C0C8D8] tracking-widest uppercase font-mono mb-5">
          Avg Response Latency (ms)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={PROVIDERS_DATA} barSize={36}>
            <XAxis
              dataKey="name"
              tick={{ fill: "#C0C8D8", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#C0C8D8", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "rgba(255,107,53,0.05)" }}
            />
            <Bar dataKey="latency" fill="#FF6B35" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly token usage trend */}
      <div className="glass-panel rounded-xl p-7">
        <div className="text-sm text-[#C0C8D8] tracking-widest uppercase font-mono mb-5">
          Monthly Token Usage (K tokens)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={TOKEN_HISTORY}>
            <CartesianGrid
              stroke="rgba(0,212,255,0.06)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "#C0C8D8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#C0C8D8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 13, color: "#C0C8D8" }} />
            <Line
              type="monotone"
              dataKey="groq"
              stroke="#00D4FF"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="gemini"
              stroke="#E8B84B"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#FF6B35"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Estimator */}
      <div className="glass-panel rounded-xl p-7 space-y-5">
        <div className="flex items-center gap-2 text-base text-[#E8B84B] font-bold">
          <Calculator size={18} /> Cost Estimator
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] text-[#C0C8D8] tracking-[0.2em] uppercase font-mono">
              Number of Missions:{" "}
              <span className="text-[#00D4FF]">{numMissions}</span>
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={numMissions}
              onChange={(e) => setNumMissions(Number(e.target.value))}
              className="w-full accent-[#00D4FF] h-1.5 rounded-full bg-[rgba(255,255,255,0.06)]"
            />
            <div className="flex justify-between text-[9px] text-[#5A6678] font-mono mt-1">
              <span>1</span>
              <span>100</span>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[10px] text-[#C0C8D8] tracking-[0.2em] uppercase font-mono">
              Avg Tokens/Mission:{" "}
              <span className="text-[#00D4FF]">
                {avgTokens.toLocaleString()}
              </span>
            </label>
            <input
              type="range"
              min={500}
              max={10000}
              step={100}
              value={avgTokens}
              onChange={(e) => setAvgTokens(Number(e.target.value))}
              className="w-full accent-[#00D4FF] h-1.5 rounded-full bg-[rgba(255,255,255,0.06)]"
            />
            <div className="flex justify-between text-[9px] text-[#5A6678] font-mono mt-1">
              <span>500</span>
              <span>10,000</span>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-[#888] font-mono">
          Total tokens: {(numMissions * avgTokens).toLocaleString()}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {costEstimates.map((c) => (
            <div
              key={c.key}
              className="rounded-lg border border-[rgba(0,212,255,0.1)] bg-[rgba(0,212,255,0.03)] p-3 text-center"
            >
              <div className="text-[10px] text-[#C0C8D8] font-mono mb-1">
                {c.name}
              </div>
              <div className="text-sm font-bold font-mono text-[#00D4FF]">
                {c.cost === 0 ? "$0.00" : `$${c.cost.toFixed(4)}`}
              </div>
              {c.free && (
                <span className="text-[8px] text-[#00FF88] font-mono">
                  FREE TIER
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Provider table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(0,212,255,0.1)] text-xs text-[#C0C8D8] tracking-widest uppercase font-mono">
          Provider Summary
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,212,255,0.06)]">
              {["Provider", "Tier", "Cost/1M tok", "Latency"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-[#888] font-normal font-mono"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROVIDERS_DATA.map((p) => (
              <tr
                key={p.name}
                className="border-b border-[rgba(0,212,255,0.04)] hover:bg-[rgba(0,212,255,0.03)] transition-colors"
              >
                <td className="px-4 py-2.5 text-[#E8EDF5] font-medium">
                  {p.name}
                </td>
                <td className="px-4 py-2.5">
                  <Badge
                    label={p.free ? "Free" : "Paid"}
                    color={p.free ? "green" : "gold"}
                  />
                </td>
                <td className="px-4 py-2.5 font-mono text-[#00D4FF]">
                  {p.tokens_m === 0 ? "$0" : `$${p.tokens_m.toFixed(3)}`}
                </td>
                <td className="px-4 py-2.5 font-mono text-[#C0C8D8]">
                  {p.latency}ms
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
