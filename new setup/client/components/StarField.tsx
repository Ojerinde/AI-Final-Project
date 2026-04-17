"use client";
import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  speed: number;
  color: string;
}

const STAR_COLORS = [
  "#E8EDF5",
  "#B0C4DE",
  "#87CEEB",
  "#00D4FF",
  "#FFD700",
  "#FFA0A0",
];

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const resize = () => {
      canvas.width = W();
      canvas.height = H();
    };
    resize();
    window.addEventListener("resize", resize);

    // Init 300 stars
    starsRef.current = Array.from({ length: 300 }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      z: Math.random() * W(),
      size: Math.random() * 2 + 0.2,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.3 + 0.05,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));

    // 12 shooting stars
    const shootingStars: {
      x: number;
      y: number;
      len: number;
      speed: number;
      angle: number;
      opacity: number;
      active: boolean;
      timer: number;
    }[] = Array.from({ length: 6 }, () => ({
      x: 0,
      y: 0,
      len: 0,
      speed: 0,
      angle: 0,
      opacity: 0,
      active: false,
      timer: Math.random() * 300,
    }));

    const spawnShooting = (s: (typeof shootingStars)[0]) => {
      s.x = Math.random() * W();
      s.y = Math.random() * H() * 0.5;
      s.len = Math.random() * 180 + 60;
      s.speed = Math.random() * 8 + 6;
      s.angle = Math.PI / 5 + Math.random() * 0.3;
      s.opacity = 1;
      s.active = true;
    };

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;

      // Twinkle & draw stars
      starsRef.current.forEach((s) => {
        const tw = Math.sin(t * s.speed + s.x) * 0.25 + 0.75;
        ctx.globalAlpha = s.opacity * tw;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Shooting stars
      shootingStars.forEach((s) => {
        if (!s.active) {
          s.timer--;
          if (s.timer <= 0) {
            spawnShooting(s);
            s.timer = Math.random() * 400 + 200;
          }
          return;
        }
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.012;
        if (s.opacity <= 0 || s.x > W() || s.y > H()) {
          s.active = false;
          return;
        }

        const grad = ctx.createLinearGradient(
          s.x,
          s.y,
          s.x - Math.cos(s.angle) * s.len,
          s.y - Math.sin(s.angle) * s.len,
        );
        grad.addColorStop(0, `rgba(200,212,255,${s.opacity})`);
        grad.addColorStop(1, "rgba(200,212,255,0)");
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(
          s.x - Math.cos(s.angle) * s.len,
          s.y - Math.sin(s.angle) * s.len,
        );
        ctx.stroke();
      });

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
}
