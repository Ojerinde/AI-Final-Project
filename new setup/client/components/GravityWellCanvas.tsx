"use client";
import { useEffect, useRef } from "react";

const MU = 0.01215;

// CR3BP effective potential, clamped near singularities
function omegaClamped(x: number, y: number, cap = 4.0): number {
  const r1 = Math.sqrt((x + MU) ** 2 + y * y);
  const r2 = Math.sqrt((x - 1 + MU) ** 2 + y * y);
  if (r1 < 0.07 || r2 < 0.04) return cap;
  return Math.min(0.5 * (x * x + y * y) + (1 - MU) / r1 + MU / r2, cap);
}

// Height: invert so gravity wells are depressions (negative z)
// Ω ≈ 1.5 in the flat far field → z ≈ 0
// Ω at L points ≈ 1.59 → z ≈ -0.04
// Ω → 4.0 at Earth/Moon cap → z ≈ -1.14
const BASE_OMEGA = 1.48;
const Z_INV_SCALE = 2.5;
function heightAt(x: number, y: number): number {
  return -(omegaClamped(x, y) - BASE_OMEGA) / Z_INV_SCALE;
}

// Color palette keyed to depth (0 = flat, 1 = deepest well)
function wellColor(depth: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, depth));
  if (t < 0.25) {
    const s = t / 0.25;
    return [
      Math.floor(8 + 20 * s),
      Math.floor(30 + 70 * s),
      Math.floor(60 + 100 * s),
    ];
  } else if (t < 0.55) {
    const s = (t - 0.25) / 0.3;
    return [
      Math.floor(28 + 12 * s),
      Math.floor(100 + 112 * s),
      Math.floor(160 + 95 * s),
    ];
  } else if (t < 0.8) {
    const s = (t - 0.55) / 0.25;
    return [
      Math.floor(40 + 160 * s),
      Math.floor(212 + 43 * s),
      Math.floor(255),
    ];
  } else {
    const s = (t - 0.8) / 0.2;
    return [Math.floor(200 + 55 * s), Math.floor(255), Math.floor(255)];
  }
}

const GRID_N = 42; // 42×42 = 1764 quads — fast enough at 60fps
const X_RANGE = 2.6; // from -1.3 to 1.3 CR3BP units
const Y_RANGE = 2.6;
const Z_DISPLAY = 0.9; // vertical exaggeration for visual impact

const LAGRANGE_PTS = [
  { name: "L1", wx: 0.8369, wy: 0 },
  { name: "L2", wx: 1.1557, wy: 0 },
  { name: "L3", wx: -1.0051, wy: 0 },
  { name: "L4", wx: 0.5 - MU, wy: Math.sqrt(3) / 2 },
  { name: "L5", wx: 0.5 - MU, wy: -Math.sqrt(3) / 2 },
];

export default function GravityWellCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

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

    // Pre-compute height grid (only changes on resize, not per-frame)
    // We recompute each frame anyway since GRID_N is small
    let t = 0;

    const frame = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Slowly rotating view
      const phi = t * 0.0035; // rotation around vertical axis
      const thetaX = 0.5; // fixed tilt ~28°
      const scale = Math.min(W, H) * 0.4;

      // Project world (wx, wy, wz) → screen (sx, sy) with perspective
      const project = (wx: number, wy: number, wz: number) => {
        // Rotate around z-axis
        const rx = wx * Math.cos(phi) - wy * Math.sin(phi);
        const ry = wx * Math.sin(phi) + wy * Math.cos(phi);
        // Tilt around x-axis
        const tx = rx;
        const ty = ry * Math.cos(thetaX) - wz * Math.sin(thetaX);
        const tz = ry * Math.sin(thetaX) + wz * Math.cos(thetaX);
        // Perspective divide
        const fov = 5.0;
        const d = fov / (fov + tz + 4.0);
        return {
          sx: W / 2 + tx * d * scale,
          sy: H / 2 + ty * d * scale,
          depth: tz,
        };
      };

      // ── Build and sort quads ─────────────────────────────────────────────
      interface Quad {
        pts: [number, number][];
        avgDepth: number;
        r: number;
        g: number;
        b: number;
        brightness: number;
      }

      const quads: Quad[] = [];

      for (let yi = 0; yi < GRID_N; yi++) {
        for (let xi = 0; xi < GRID_N; xi++) {
          const wx0 = (xi / GRID_N - 0.5) * X_RANGE;
          const wy0 = (yi / GRID_N - 0.5) * Y_RANGE;
          const wx1 = ((xi + 1) / GRID_N - 0.5) * X_RANGE;
          const wy1 = ((yi + 1) / GRID_N - 0.5) * Y_RANGE;

          const h00 = heightAt(wx0, wy0) * Z_DISPLAY;
          const h10 = heightAt(wx1, wy0) * Z_DISPLAY;
          const h01 = heightAt(wx0, wy1) * Z_DISPLAY;
          const h11 = heightAt(wx1, wy1) * Z_DISPLAY;
          const hAvg = (h00 + h10 + h01 + h11) / 4;

          const p00 = project(wx0, wy0, h00);
          const p10 = project(wx1, wy0, h10);
          const p11 = project(wx1, wy1, h11);
          const p01 = project(wx0, wy1, h01);

          const avgDepth = (p00.depth + p10.depth + p11.depth + p01.depth) / 4;

          // Approximate surface normal → brightness
          const dzdx = (h10 - h00) / (X_RANGE / GRID_N);
          const dzdy = (h01 - h00) / (Y_RANGE / GRID_N);
          // Light comes from upper-left in rotated frame
          const lx = Math.cos(phi + 0.8),
            ly = Math.sin(phi + 0.8),
            lz = 0.6;
          const len = Math.sqrt(lx * lx + ly * ly + lz * lz);
          const nx = -dzdx,
            ny = -dzdy,
            nz = 1.0;
          const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
          const diffuse = (nx * lx + ny * ly + nz * lz) / (len * nLen);
          const brightness = Math.max(
            0.28,
            Math.min(1.0, 0.45 + 0.55 * diffuse),
          );

          // Depth for color (0 = flat, 1 = deepest)
          const depthNorm = Math.max(0, Math.min(1, -hAvg / Z_DISPLAY));
          const [r, g, b] = wellColor(depthNorm);

          quads.push({
            pts: [
              [p00.sx, p00.sy],
              [p10.sx, p10.sy],
              [p11.sx, p11.sy],
              [p01.sx, p01.sy],
            ],
            avgDepth,
            r,
            g,
            b,
            brightness,
          });
        }
      }

      // Painter's algorithm: back to front
      quads.sort((a, b) => b.avgDepth - a.avgDepth);

      // ── Draw quads ──────────────────────────────────────────────────────
      quads.forEach((q) => {
        const rb = Math.floor(q.r * q.brightness);
        const gb = Math.floor(q.g * q.brightness);
        const bb = Math.floor(q.b * q.brightness);
        ctx.fillStyle = `rgb(${rb},${gb},${bb})`;
        ctx.strokeStyle = `rgba(${Math.min(255, rb + 15)},${Math.min(255, gb + 15)},${Math.min(255, bb + 15)},0.35)`;
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(q.pts[0][0], q.pts[0][1]);
        for (let i = 1; i < q.pts.length; i++)
          ctx.lineTo(q.pts[i][0], q.pts[i][1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // ── Lagrange point spires ───────────────────────────────────────────
      const pulse = (Math.sin(t * 0.06) + 1) / 2;
      LAGRANGE_PTS.forEach((lp) => {
        const hz = heightAt(lp.wx, lp.wy) * Z_DISPLAY;
        const tip = project(lp.wx, lp.wy, hz + 0.1 + 0.04 * pulse);
        const base = project(lp.wx, lp.wy, hz);

        // Vertical spike
        ctx.strokeStyle = "rgba(232,184,75,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(base.sx, base.sy);
        ctx.lineTo(tip.sx, tip.sy);
        ctx.stroke();

        // Glowing tip
        const g = ctx.createRadialGradient(
          tip.sx,
          tip.sy,
          0,
          tip.sx,
          tip.sy,
          10,
        );
        g.addColorStop(0, `rgba(232,184,75,${0.9 + 0.1 * pulse})`);
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(tip.sx, tip.sy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#E8B84B";
        ctx.beginPath();
        ctx.arc(tip.sx, tip.sy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#E8B84B";
        ctx.font = "bold 11px monospace";
        ctx.fillText(lp.name, tip.sx + 6, tip.sy - 4);
      });

      // ── Earth & Moon markers ────────────────────────────────────────────
      const ep = project(-MU, 0, heightAt(-MU, 0) * Z_DISPLAY + 0.12);
      const mop = project(1 - MU, 0, heightAt(1 - MU, 0) * Z_DISPLAY + 0.08);

      // Earth
      const eg = ctx.createRadialGradient(
        ep.sx - 6,
        ep.sy - 6,
        0,
        ep.sx,
        ep.sy,
        14,
      );
      eg.addColorStop(0, "#4A9EFF");
      eg.addColorStop(0.5, "#0D4A9E");
      eg.addColorStop(1, "#1C7C3A");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(ep.sx, ep.sy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(200,215,245,0.85)";
      ctx.font = "bold 11px monospace";
      ctx.fillText("EARTH", ep.sx + 16, ep.sy + 4);

      // Moon
      const mg2 = ctx.createRadialGradient(
        mop.sx - 4,
        mop.sy - 4,
        0,
        mop.sx,
        mop.sy,
        9,
      );
      mg2.addColorStop(0, "#D8E0EC");
      mg2.addColorStop(1, "#7080A0");
      ctx.fillStyle = mg2;
      ctx.beginPath();
      ctx.arc(mop.sx, mop.sy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(192,200,216,0.85)";
      ctx.font = "bold 11px monospace";
      ctx.fillText("MOON", mop.sx + 11, mop.sy + 4);

      // ── HUD ──────────────────────────────────────────────────────────────
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(13,27,42,0.78)";
      ctx.fillRect(14, 14, 290, 66);
      ctx.strokeStyle = "rgba(255,107,53,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, 290, 66);

      ctx.fillStyle = "#FF6B35";
      ctx.font = "bold 13px monospace";
      ctx.fillText("CR3BP Effective Potential  Ω(x,y)", 24, 36);
      ctx.fillStyle = "#8F9AAC";
      ctx.font = "10px monospace";
      ctx.fillText(`Rotating reference frame  ·  μ = ${MU}`, 24, 52);
      ctx.fillText(`⚠ Earth/Moon gravity wells shown as depressions`, 24, 66);

      t++;
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
      className="w-full h-full rounded-2xl"
      style={{ display: "block" }}
    />
  );
}
