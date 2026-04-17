"use client";
import { useEffect, useRef } from "react";

export interface MissionSnapshot {
  id: number;
  label: string;
  delta_v: number;
  tof_days: number;
  jacobi: number;
  color: string;
}

interface OrbitalBody {
  name: string;
  radius: number;
  color: string;
  glowColor: string;
  orbitRadius: number;
  speed: number;
  angle: number;
  size: number;
  trail: { x: number; y: number }[];
}

/* Map Δv to a normalised orbit radius factor (higher Δv → larger transfer orbit) */
function dvToOrbitFactor(dv: number): number {
  // Typical cislunar Δv range: ~3.0–4.5 km/s → map to 0.20–0.35 factor
  const clamped = Math.max(2.5, Math.min(5.0, dv));
  return 0.15 + ((clamped - 2.5) / 2.5) * 0.25;
}

/* Map ToF to angular speed (shorter ToF → faster) */
function tofToSpeed(tof: number): number {
  const clamped = Math.max(1, Math.min(10, tof));
  return 0.025 - ((clamped - 1) / 9) * 0.015; // 0.025 (fast) to 0.010 (slow)
}

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

export default function OrbitCanvas({
  missions = [],
}: {
  missions?: MissionSnapshot[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const missionsRef = useRef<MissionSnapshot[]>(missions);
  missionsRef.current = missions;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cx = () => canvas.width / 2;
    const cy = () => canvas.height / 2;

    // Fixed bodies
    const bodies: OrbitalBody[] = [
      {
        name: "Moon",
        radius: 24,
        color: "#C0C8D8",
        glowColor: "rgba(192,200,216,0.5)",
        orbitRadius: Math.min(canvas.width, canvas.height) * 0.4,
        speed: 0.004,
        angle: 0,
        size: 24,
        trail: [],
      },
      {
        name: "Spacecraft",
        radius: 8,
        color: "#00D4FF",
        glowColor: "rgba(0,212,255,0.8)",
        orbitRadius: Math.min(canvas.width, canvas.height) * 0.24,
        speed: 0.018,
        angle: 1.2,
        size: 8,
        trail: [],
      },
      {
        name: "LEO-SAT",
        radius: 7,
        color: "#FF6B35",
        glowColor: "rgba(255,107,53,0.7)",
        orbitRadius: Math.min(canvas.width, canvas.height) * 0.15,
        speed: 0.03,
        angle: 2.5,
        size: 7,
        trail: [],
      },
    ];

    /* Mission-specific transfer orbit ghosts */
    interface GhostTrail {
      missionId: number;
      color: string;
      label: string;
      orbitFactor: number;
      speed: number;
      angle: number;
      trail: { x: number; y: number }[];
      isCurrent: boolean;
      dv: number;
      tof: number;
    }
    let ghosts: GhostTrail[] = [];
    const buildGhosts = () => {
      const ms = missionsRef.current;
      ghosts = ms.map((m, i) => ({
        missionId: m.id,
        color: m.color,
        label: m.label,
        orbitFactor: dvToOrbitFactor(m.delta_v),
        speed: tofToSpeed(m.tof_days),
        angle: 0.8 + i * 1.1,
        trail: [],
        isCurrent: i === ms.length - 1,
        dv: m.delta_v,
        tof: m.tof_days,
      }));
    };
    buildGhosts();

    const TRAIL_LEN = 80;
    let t = 0;

    const drawBody = (b: OrbitalBody) => {
      const bx = cx() + Math.cos(b.angle) * b.orbitRadius;
      const by = cy() + Math.sin(b.angle) * (b.orbitRadius * 0.42); // flatten for 3D perspective

      // Trail
      b.trail.push({ x: bx, y: by });
      if (b.trail.length > TRAIL_LEN) b.trail.shift();

      if (b.trail.length > 2) {
        for (let i = 1; i < b.trail.length; i++) {
          const prog = i / b.trail.length;
          ctx.globalAlpha = prog * 0.6;
          ctx.strokeStyle = b.color;
          ctx.lineWidth = b.name === "Moon" ? 2 : 1.5;
          ctx.beginPath();
          ctx.moveTo(b.trail[i - 1].x, b.trail[i - 1].y);
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
          ctx.stroke();
        }
      }

      // Glow
      ctx.globalAlpha = 0.25;
      const grd = ctx.createRadialGradient(bx, by, 0, bx, by, b.size * 4);
      grd.addColorStop(0, b.glowColor);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(bx, by, b.size * 4, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.globalAlpha = 1;
      const grad = ctx.createRadialGradient(
        bx - b.size * 0.3,
        by - b.size * 0.3,
        0,
        bx,
        by,
        b.size,
      );
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, b.color);
      grad.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, b.size, 0, Math.PI * 2);
      ctx.fill();

      // Label
      if (b.name !== "LEO-SAT") {
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = b.color;
        ctx.font = "bold 16px monospace";
        ctx.fillText(b.name, bx + b.size + 8, by - b.size - 4);
      }
    };

    const drawEarth = () => {
      const r = Math.min(canvas.width, canvas.height) * 0.095;
      // Atmosphere glow
      const atm = ctx.createRadialGradient(
        cx(),
        cy(),
        r * 0.9,
        cx(),
        cy(),
        r * 1.6,
      );
      atm.addColorStop(0, "rgba(0,120,255,0.15)");
      atm.addColorStop(0.5, "rgba(0,80,200,0.08)");
      atm.addColorStop(1, "transparent");
      ctx.globalAlpha = 1;
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx(), cy(), r * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Earth body
      const eg = ctx.createRadialGradient(
        cx() - r * 0.3,
        cy() - r * 0.3,
        0,
        cx(),
        cy(),
        r,
      );
      eg.addColorStop(0, "#1A6EDD");
      eg.addColorStop(0.4, "#0D4A9E");
      eg.addColorStop(0.7, "#1C7C3A");
      eg.addColorStop(1, "#0A3820");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
      ctx.fill();

      // City lights shimmer on night side
      ctx.globalAlpha = 0.12 + 0.05 * Math.sin(t * 0.01);
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 7px sans-serif";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.002;
        const lx = cx() + Math.cos(a) * r * 0.75;
        const ly = cy() + Math.sin(a) * r * 0.75;
        ctx.fillRect(lx, ly, 2, 2);
      }
      ctx.globalAlpha = 1;

      // "EARTH" label
      ctx.fillStyle = "rgba(192,200,216,0.5)";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("EARTH", cx(), cy() + r + 20);
      ctx.textAlign = "left";
    };

    const drawOrbits = () => {
      bodies.forEach((b) => {
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.ellipse(
          cx(),
          cy(),
          b.orbitRadius,
          b.orbitRadius * 0.42,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.setLineDash([]);
      });
      ctx.globalAlpha = 1;
    };

    const drawGrid = () => {
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = "#00D4FF";
      ctx.lineWidth = 0.5;
      const step = 50;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    // Transfer arc from LEO to Moon
    const drawTransferArc = () => {
      const leo = bodies[2]; // LEO-SAT
      const moon = bodies[0];
      const leoX = cx() + Math.cos(leo.angle) * leo.orbitRadius;
      const leoY = cy() + Math.sin(leo.angle) * leo.orbitRadius * 0.42;
      const moonX = cx() + Math.cos(moon.angle) * moon.orbitRadius;
      const moonY = cy() + Math.sin(moon.angle) * moon.orbitRadius * 0.42;

      const pulse = (Math.sin(t * 0.06) + 1) / 2;
      ctx.globalAlpha = 0.15 + 0.15 * pulse;
      ctx.strokeStyle = "#E8B84B";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 10]);
      ctx.beginPath();
      ctx.moveTo(leoX, leoY);
      ctx.quadraticCurveTo(cx() + 40, cy() - 80, moonX, moonY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };

    /* Draw mission-specific ghost transfer orbits */
    const drawGhosts = () => {
      // Rebuild if mission count changed
      if (ghosts.length !== missionsRef.current.length) buildGhosts();

      const scale = Math.min(canvas.width, canvas.height);
      ghosts.forEach((g) => {
        const orbitR = scale * g.orbitFactor;
        const bx = cx() + Math.cos(g.angle) * orbitR;
        const by = cy() + Math.sin(g.angle) * (orbitR * 0.42);

        g.trail.push({ x: bx, y: by });
        if (g.trail.length > TRAIL_LEN) g.trail.shift();

        // Orbit path (dashed ellipse)
        ctx.globalAlpha = g.isCurrent ? 0.25 : 0.08;
        ctx.strokeStyle = g.color;
        ctx.lineWidth = g.isCurrent ? 2 : 1;
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.ellipse(cx(), cy(), orbitR, orbitR * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Trail
        if (g.trail.length > 2) {
          for (let i = 1; i < g.trail.length; i++) {
            const prog = i / g.trail.length;
            ctx.globalAlpha = prog * (g.isCurrent ? 0.7 : 0.25);
            ctx.strokeStyle = g.color;
            ctx.lineWidth = g.isCurrent ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(g.trail[i - 1].x, g.trail[i - 1].y);
            ctx.lineTo(g.trail[i].x, g.trail[i].y);
            ctx.stroke();
          }
        }

        // Craft dot
        const dotSize = g.isCurrent ? 6 : 4;
        ctx.globalAlpha = g.isCurrent ? 1 : 0.4;
        const dotGrad = ctx.createRadialGradient(bx, by, 0, bx, by, dotSize);
        dotGrad.addColorStop(0, "#fff");
        dotGrad.addColorStop(0.5, g.color);
        dotGrad.addColorStop(1, "rgba(0,0,0,0.3)");
        ctx.fillStyle = dotGrad;
        ctx.beginPath();
        ctx.arc(bx, by, dotSize, 0, Math.PI * 2);
        ctx.fill();

        // Label — show on all missions, brighter for current
        ctx.globalAlpha = g.isCurrent ? 0.9 : 0.5;
        ctx.fillStyle = g.color;
        ctx.font = g.isCurrent ? "bold 12px monospace" : "11px monospace";
        ctx.fillText(
          `#${g.missionId} Δv ${g.dv.toFixed(2)}`,
          bx + dotSize + 6,
          by - 4,
        );
        ctx.font = "11px monospace";
        ctx.fillStyle = g.isCurrent ? "#ccc" : "#666";
        ctx.fillText(
          `${g.tof.toFixed(1)}d · ${(g.speed * 1000).toFixed(1)} rad/s`,
          bx + dotSize + 6,
          by + 12,
        );

        g.angle += g.speed;
        ctx.globalAlpha = 1;
      });
    };

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;

      drawGrid();
      drawOrbits();
      drawTransferArc();
      drawGhosts();
      drawEarth();

      bodies.forEach((b) => {
        b.angle += b.speed;
        drawBody(b);
      });

      animRef.current = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
