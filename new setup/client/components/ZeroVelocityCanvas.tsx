"use client";
import { useEffect, useRef } from "react";

// CR3BP mass ratio Earth-Moon
const MU = 0.01215;

// CR3BP effective potential Ω(x,y) = ½(x²+y²) + (1-μ)/r1 + μ/r2
function omega(x: number, y: number): number {
  const r1 = Math.sqrt((x + MU) ** 2 + y * y);
  const r2 = Math.sqrt((x - 1 + MU) ** 2 + y * y);
  if (r1 < 0.08 || r2 < 0.04) return 999;
  return 0.5 * (x * x + y * y) + (1 - MU) / r1 + MU / r2;
}

// Lagrange point approximate positions
const LAGRANGE = [
  { name: "L1", x: 0.8369, y: 0, color: "#00D4FF", desc: "Earth↔Moon gate" },
  { name: "L2", x: 1.1557, y: 0, color: "#E8B84B", desc: "Escape gate" },
  { name: "L3", x: -1.0051, y: 0, color: "#FF6B35", desc: "Far-side gate" },
  {
    name: "L4",
    x: 0.5 - MU,
    y: Math.sqrt(3) / 2,
    color: "#00FF88",
    desc: "Stable (60°)",
  },
  {
    name: "L5",
    x: 0.5 - MU,
    y: -Math.sqrt(3) / 2,
    color: "#00FF88",
    desc: "Stable (60°)",
  },
];

// Critical Jacobi constants at each L point
const C_L = LAGRANGE.map((lp) => 2 * omega(lp.x, lp.y));

export default function ZeroVelocityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Offscreen canvas for low-res field so we don't recompute per-pixel at 60fps
    const off = document.createElement("canvas");
    const SCALE = 4; // compute at ¼ resolution, upscale with smooth interpolation

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      off.width = Math.max(1, Math.floor(canvas.width / SCALE));
      off.height = Math.max(1, Math.floor(canvas.height / SCALE));
    };
    resize();
    window.addEventListener("resize", resize);

    const offCtx = off.getContext("2d")!;

    // Spatial range displayed (CR3BP non-dimensional units)
    const X_RANGE = 3.0;
    const Y_RANGE = 2.2;

    // Map CR3BP coords → screen pixels
    const toScreen = (cx: number, cy: number) => ({
      px: (cx / X_RANGE + 0.5) * canvas.width,
      py: (-cy / Y_RANGE + 0.5) * canvas.height, // y flipped (screen y down)
    });

    // Jacobi constant animation range (2.88 → 3.25 → 2.88, ~22s period)
    const C_MIN = 2.85;
    const C_MAX = 3.27;

    let t = 0;

    const frame = () => {
      const W = canvas.width;
      const H = canvas.height;
      const oW = off.width;
      const oH = off.height;

      // Smooth oscillation
      const cAnim = C_MIN + ((Math.sin(t * 0.005) + 1) / 2) * (C_MAX - C_MIN);

      // ── Build low-res ImageData ──────────────────────────────────────────
      const imgData = offCtx.createImageData(oW, oH);
      const d = imgData.data;

      for (let py = 0; py < oH; py++) {
        for (let px = 0; px < oW; px++) {
          const cx = (px / oW - 0.5) * X_RANGE;
          const cy = -(py / oH - 0.5) * Y_RANGE; // flip y
          const om2 = 2 * omega(cx, cy);
          const idx = (py * oW + px) * 4;

          if (om2 > 900) {
            // Singularity (right at Earth/Moon core) — bright white
            d[idx] = 255;
            d[idx + 1] = 255;
            d[idx + 2] = 255;
            d[idx + 3] = 255;
          } else if (om2 < cAnim) {
            // ── Forbidden zone ── deep indigo/violet
            const depth = Math.min(1, (cAnim - om2) / 0.65);
            d[idx] = Math.floor(50 + 60 * depth);
            d[idx + 1] = 0;
            d[idx + 2] = Math.floor(90 + 100 * depth);
            d[idx + 3] = Math.floor(170 + 85 * depth);
          } else {
            // ── Accessible zone ── cyan glow near zero-velocity boundary
            const margin = Math.min(1, (om2 - cAnim) / 0.28);
            d[idx] = 0;
            d[idx + 1] = Math.floor(40 + 172 * (1 - margin));
            d[idx + 2] = Math.floor(60 + 195 * (1 - margin));
            d[idx + 3] = Math.floor(20 + 90 * (1 - margin));
          }
        }
      }

      offCtx.putImageData(imgData, 0, 0);

      // ── Draw to main canvas (smooth upscale) ────────────────────────────
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, 0, 0, W, H);

      // ── Lagrange point overlays ─────────────────────────────────────────
      LAGRANGE.forEach((lp, i) => {
        const { px, py } = toScreen(lp.x, lp.y);
        // A Lagrange point "opens" when the current C drops below its critical C
        const isOpen = cAnim <= C_L[i] + 0.002;
        const pulse = (Math.sin(t * 0.07 + i * 1.3) + 1) / 2;

        // Outer glow ring
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 24);
        grd.addColorStop(
          0,
          isOpen
            ? `rgba(0,255,136,${0.65 + 0.35 * pulse})`
            : `rgba(255,107,53,${0.35 + 0.25 * pulse})`,
        );
        grd.addColorStop(1, "transparent");
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, 24, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.globalAlpha = 1;
        ctx.fillStyle = isOpen ? "#00FF88" : "#FF6B35";
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = lp.color;
        ctx.font = "bold 13px monospace";
        ctx.fillText(lp.name, px + 9, py - 7);
        ctx.fillStyle = "#8F9AAC";
        ctx.font = "10px monospace";
        ctx.fillText(`C=${C_L[i].toFixed(3)}`, px + 9, py + 8);
        ctx.fillText(lp.desc, px + 9, py + 20);
      });

      // ── Earth ────────────────────────────────────────────────────────────
      const ep = toScreen(-MU, 0);
      const er = W * 0.038;
      const eg = ctx.createRadialGradient(
        ep.px - er * 0.3,
        ep.py - er * 0.3,
        0,
        ep.px,
        ep.py,
        er,
      );
      eg.addColorStop(0, "#1A6EDD");
      eg.addColorStop(0.5, "#0D4A9E");
      eg.addColorStop(1, "#1C7C3A");
      ctx.globalAlpha = 1;
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(ep.px, ep.py, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(200,210,240,0.85)";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("EARTH", ep.px, ep.py + er + 15);
      ctx.textAlign = "left";

      // ── Moon ─────────────────────────────────────────────────────────────
      const mp = toScreen(1 - MU, 0);
      const mr = W * 0.02;
      const mg = ctx.createRadialGradient(
        mp.px - mr * 0.3,
        mp.py - mr * 0.3,
        0,
        mp.px,
        mp.py,
        mr,
      );
      mg.addColorStop(0, "#E0E6F0");
      mg.addColorStop(1, "#8090A0");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mp.px, mp.py, mr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(192,200,216,0.85)";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("MOON", mp.px, mp.py + mr + 15);
      ctx.textAlign = "left";

      // ── HUD box ───────────────────────────────────────────────────────────
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(13,27,42,0.78)";
      ctx.fillRect(14, 14, 330, 78);
      ctx.strokeStyle = "rgba(0,212,255,0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, 330, 78);

      ctx.fillStyle = "#00D4FF";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`Jacobi C  =  ${cAnim.toFixed(4)}`, 24, 36);

      ctx.fillStyle = "#8F9AAC";
      ctx.font = "10px monospace";
      ctx.fillText(
        `C(L1)=${C_L[0].toFixed(3)}  C(L2)=${C_L[1].toFixed(3)}  C(L3)=${C_L[2].toFixed(3)}  C(L4/5)=${C_L[3].toFixed(3)}`,
        24,
        54,
      );

      // Legend pills
      ctx.fillStyle = "rgba(80,0,140,0.8)";
      ctx.fillRect(24, 64, 12, 12);
      ctx.fillStyle = "#C0C8D8";
      ctx.fillText("Forbidden zone", 40, 74);
      ctx.fillStyle = "rgba(0,172,212,0.6)";
      ctx.fillRect(155, 64, 12, 12);
      ctx.fillStyle = "#C0C8D8";
      ctx.fillText("Accessible  (glow = boundary)", 171, 74);

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
