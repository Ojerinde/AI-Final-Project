"use client";
import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  status?: "good" | "warning" | "danger";
  animate?: boolean;
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  status = "good",
  animate = true,
}: MetricProps) {
  const [displayed, setDisplayed] = useState(0);
  const targetNum =
    typeof value === "number" ? value : parseFloat(String(value));

  useEffect(() => {
    if (!animate || isNaN(targetNum)) return;
    let start: number;
    const duration = 1200;
    const step = (ts: number) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setDisplayed(eased * targetNum);
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [targetNum, animate]);

  const statusColor =
    status === "good"
      ? "#00FF88"
      : status === "warning"
        ? "#FFB347"
        : "#FF4444";
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const displayValue =
    typeof value === "number" && animate
      ? displayed.toFixed(value < 1 ? 4 : value < 100 ? 2 : 0)
      : value;

  return (
    <div className="glass-panel rounded-xl p-4 relative overflow-hidden group hover:border-[rgba(0,212,255,0.3)] transition-all duration-300">
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${statusColor}66, transparent)`,
        }}
      />
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] text-[#C0C8D8] tracking-widest uppercase font-mono">
          {label}
        </span>
        {trend && <TrendIcon size={12} style={{ color: statusColor }} />}
      </div>
      <div className="flex items-end gap-1">
        <span
          className="text-2xl font-bold font-mono"
          style={{ color: statusColor }}
        >
          {displayValue}
        </span>
        {unit && <span className="text-xs text-[#C0C8D8] mb-0.5">{unit}</span>}
      </div>
      {/* Bottom progress shimmer */}
      <div className="mt-3 h-0.5 rounded-full bg-[rgba(255,255,255,0.05)]">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.min((typeof value === "number" ? value / (value > 1 ? 100 : 1) : 0.5) * 100, 100)}%`,
            background: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── HUD Terminal log line ─────────────────────────────────────────────────── */
export function TerminalLine({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!visible) return null;
  return (
    <div className="terminal-text flex gap-2 items-start">
      <span className="text-[#C8102E]">▶</span>
      <span>{text}</span>
    </div>
  );
}

/* ─── Progress ring ─────────────────────────────────────────────────────────── */
export function ProgressRing({
  value,
  max = 1,
  size = 80,
  stroke = 6,
  color = "#00D4FF",
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  // Add extra space for stroke + glow
  const padding = stroke * 1.5;

  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);

  const [anim, setAnim] = useState(0);

  useEffect(() => {
    let start: number;
    const dur = 1400;

    const step = (ts: number) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / dur, 1);
      setAnim(1 - Math.pow(1 - prog, 3));
      if (prog < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size + padding * 2} ${size + padding * 2}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <g transform={`translate(${padding}, ${padding})`}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={stroke}
          />

          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct * anim)}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 4px ${color})`,
              transition: "stroke-dashoffset 0.05s",
            }}
          />
        </g>
      </svg>

      {label && (
        <span className="text-[10px] text-[#C0C8D8] font-mono tracking-wider text-center -mt-1">
          {label}
        </span>
      )}
    </div>
  );
}

/* ─── Section divider ────────────────────────────────────────────────────────── */
export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(0,212,255,0.3)]" />
      <span className="text-[10px] text-[#00D4FF] tracking-[0.3em] uppercase font-mono">
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(0,212,255,0.3)]" />
    </div>
  );
}

/* ─── Animated badge ─────────────────────────────────────────────────────────── */
export function Badge({
  label,
  color = "cyan",
}: {
  label: string;
  color?: "cyan" | "red" | "gold" | "green";
}) {
  const cfg = {
    cyan: {
      border: "rgba(0,212,255,0.4)",
      text: "#00D4FF",
      bg: "rgba(0,212,255,0.08)",
    },
    red: {
      border: "rgba(200,16,46,0.5)",
      text: "#FF4D6D",
      bg: "rgba(200,16,46,0.1)",
    },
    gold: {
      border: "rgba(232,184,75,0.4)",
      text: "#E8B84B",
      bg: "rgba(232,184,75,0.08)",
    },
    green: {
      border: "rgba(0,255,136,0.4)",
      text: "#00FF88",
      bg: "rgba(0,255,136,0.08)",
    },
  }[color];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest"
      style={{
        border: `1px solid ${cfg.border}`,
        color: cfg.text,
        background: cfg.bg,
      }}
    >
      {label}
    </span>
  );
}

/* ─── Animated counter ──────────────────────────────────────────────────────── */
export function AnimatedCounter({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const [cur, setCur] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const dur = 1000;
    let ts0: number;
    const step = (ts: number) => {
      if (!ts0) ts0 = ts;
      const prog = Math.min((ts - ts0) / dur, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setCur(start + diff * eased);
      if (prog < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
  }, [value]);

  return <>{cur.toFixed(decimals)}</>;
}
