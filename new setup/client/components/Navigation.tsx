"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Rocket,
  Activity,
  Shield,
  Brain,
  BarChart3,
  Menu,
  X,
  Satellite,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Mission", href: "#mission", icon: Rocket },
  { label: "3D Orbit", href: "#orbit", icon: Satellite },
  { label: "Data Audit", href: "#data", icon: Activity },
  { label: "Safety", href: "#safety", icon: Shield },
  { label: "AI Agent", href: "#agent", icon: Brain },
  { label: "Economics", href: "#token", icon: BarChart3 },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-panel border-b border-[rgba(0,212,255,0.15)] py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9">
            <div
              className="absolute inset-0 rounded-full border-2 border-[#00D4FF] animate-spin"
              style={{ animationDuration: "8s", borderTopColor: "transparent" }}
            />
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#C8102E] to-[#8B0000] flex items-center justify-center">
              <Rocket size={14} className="text-white" />
            </div>
          </div>
          <div>
            <span className="font-bold text-sm tracking-widest text-[#00D4FF] text-glow-cyan uppercase">
              Cislunar
            </span>
            <span className="block text-[10px] text-[#C0C8D8] tracking-[0.2em] uppercase">
              Mission Control
            </span>
          </div>
        </Link>

        {/* Beihang Badge */}
        <div className="hidden md:flex items-center gap-1 text-xs border border-[rgba(200,16,46,0.3)] rounded px-3 py-1">
          <span className="text-[#C8102E] font-bold">BHU</span>
          <span className="text-[#C0C8D8]">· AI Systems Lab</span>
        </div>

        {/* Desktop Links */}
        <ul className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a
                href={href}
                onClick={() => setActive(label)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium tracking-wider uppercase transition-all duration-200 ${
                  active === label
                    ? "bg-[rgba(0,212,255,0.15)] text-[#00D4FF] border border-[rgba(0,212,255,0.3)]"
                    : "text-[#C0C8D8] hover:text-[#00D4FF] hover:bg-[rgba(0,212,255,0.08)]"
                }`}
              >
                <Icon size={13} />
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Status indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]" />
          </span>
          <span className="status-online font-mono">SYSTEM ONLINE</span>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-[#00D4FF] p-2"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden glass-panel border-t border-[rgba(0,212,255,0.1)] mt-1 px-6 py-4 flex flex-col gap-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#C0C8D8] hover:text-[#00D4FF] hover:bg-[rgba(0,212,255,0.08)] transition-all"
            >
              <Icon size={16} />
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
