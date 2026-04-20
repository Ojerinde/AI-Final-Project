
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import StarField from "./StarField";

type LandingOverlayProps = {
  onClose: () => void;
};

const groupMembers = [
  {
    name: "OJERINDE Joel Segun",
    id: "LS2525253",
    img: "/Member%201.jpg",
  },
  {
    name: "OGUNLADE Joshua Oluwaseun",
    id: "LS2525237",
    img: "/Member%202.jpg",
  },
  {
    name: "ABU-SAFIAN Fadlan",
    id: "LS2525230",
    img: "/Member%203.jpg",
  },
];

const systemMaps = [
  {
    src: "/System Map 1.png",
    title: "System Architecture",
    caption:
      "End-to-end pipeline — from raw trajectory ingestion through GNN-PINN inference to mission-planning output.",
  },
  {
    src: "/System Map 2.png",
    title: "Validation & Safety Layer",
    caption:
      "Physics constraint checks, red-team guardrails, and standards-grounded deployment data flow.",
  },
];

export default function LandingOverlay({ onClose }: LandingOverlayProps) {
  const [stage, setStage] = useState<"members" | "maps">("members");
  const [activeMap, setActiveMap] = useState(0);
  const [activeShowcasePhoto, setActiveShowcasePhoto] = useState(0);

  const showcasePhotos = [
    { src: "/Group%201.jpg", alt: "Team group photo 1" },
    { src: "/Group%202.jpg", alt: "Team group photo 2" },
    { src: "/Group%203.jpg", alt: "Team group photo 3" },
    { src: "/Group%204.jpg", alt: "Team group photo 4" },
    ...groupMembers.map((m) => ({ src: m.img, alt: `${m.name} portrait` })),
  ];

  // Auto-switch between group photos and member portraits every 4s
  const groupInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    groupInterval.current = setInterval(() => {
      setActiveShowcasePhoto((p) => (p + 1) % showcasePhotos.length);
    }, 4000);
    return () => {
      if (groupInterval.current) clearInterval(groupInterval.current);
    };
  }, [showcasePhotos.length]);

  // Staggered entrance directions for member cards (left, top, right)
  const memberEntrance = [
    { x: -120, y: 40, rotate: -12 }, // Joel — from left
    { x: 0, y: -120, rotate: 8 }, // Joshua — from top
    { x: 120, y: 40, rotate: 12 }, // Fadlan — from right
  ];

  const map = useMemo(() => systemMaps[activeMap], [activeMap]);
  const nextMap = () => setActiveMap((m) => (m + 1) % systemMaps.length);
  const prevMap = () =>
    setActiveMap((m) => (m - 1 + systemMaps.length) % systemMaps.length);

  return (
    <div className="">
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #020713 0%, #06131f 50%, #031a2b 100%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, transition: { duration: 0.8 } }}
        >
          <StarField />

          {/* Background texture */}
          <div className="pointer-events-none absolute inset-0">
            <Image
              src="/deep-space.jpeg"
              alt="Deep space backdrop"
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
            />
          </div>

          {/* Subtle grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,212,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,212,255,0.07) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* Ambient glow blobs */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 15% 25%, rgba(0,212,255,0.14) 0%, transparent 40%), radial-gradient(circle at 88% 78%, rgba(200,16,46,0.12) 0%, transparent 40%)",
            }}
          />

          <div className="relative z-10 flex h-full w-full flex-col px-4 py-8 md:px-14 md:py-10">
            <AnimatePresence mode="wait">
              {stage === "members" ? (
                /* ── MEMBERS STAGE ───────────────────────────────────────── */
                <motion.div
                  key="members"
                  className="flex h-full w-full flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="grid w-full grow grid-cols-1 items-stretch gap-10 lg:grid-cols-[0.85fr_1.4fr] lg:gap-14">
                    {/* LEFT — Showcase: two group photos, then member portraits */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="relative overflow-hidden rounded-3xl mt-10"
                      style={{ minHeight: "700px", perspective: "1200px" }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeShowcasePhoto}
                          className="absolute inset-0"
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: -90, opacity: 0 }}
                          transition={{ duration: 0.6, ease: "easeInOut" }}
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <Image
                            src={showcasePhotos[activeShowcasePhoto].src}
                            alt={showcasePhotos[activeShowcasePhoto].alt}
                            fill
                            priority
                            sizes="(max-width: 1200px) 100vw, 48vw"
                            className="object-contain"
                          />
                        </motion.div>
                      </AnimatePresence>
                      {/* Strong gradient for text legibility */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(2,7,19,0.96) 0%, rgba(2,7,19,0.65) 38%, rgba(2,7,19,0.15) 65%, transparent 100%)",
                        }}
                      />
                      {/* Overlay text — well spaced, legible */}
                      <div className="absolute inset-x-0 bottom-0 px-8 pb-10 pt-20">
                        <p
                          style={{
                            fontSize: "clamp(26px, 3.2vw, 40px)",
                            fontWeight: 800,
                            color: "#e8edf5",
                            lineHeight: 1.18,
                            marginBottom: "8px",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          Three-Body
                        </p>
                        <p
                          style={{
                            fontSize: "clamp(26px, 3.2vw, 40px)",
                            fontWeight: 800,
                            color: "#00d4ff",
                            lineHeight: 1.18,
                            marginBottom: "20px",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          Problem (Solvers)
                        </p>
                        <p
                          style={{
                            fontSize: "18px",
                            lineHeight: 1.75,
                            color: "rgba(192, 200, 216, 0.88)",
                            fontWeight: 400,
                            maxWidth: "600px",
                          }}
                        >
                          Engineering AI-powered cislunar trajectories — from
                          LEO to lunar orbit in milliseconds.
                        </p>
                      </div>
                    </motion.div>

                    {/* RIGHT — Title above cards + 3 members */}
                    <div className="flex flex-col justify-center gap-10">
                      {/* Title block — sits directly above the member photos */}
                      <motion.div
                        initial={{ opacity: 0, y: -14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                      >
                        <p
                          style={{
                            fontFamily: "var(--font-geist-mono, monospace)",
                            fontSize: "15px",
                            letterSpacing: "0.34em",
                            color: "#00d4ff",
                            textTransform: "uppercase",
                            marginBottom: "14px",
                            opacity: 0.85,
                          }}
                        >
                          Presentation Team
                        </p>
                        <h1
                          style={{
                            fontSize: "clamp(32px, 4.5vw, 62px)",
                            fontWeight: 900,
                            color: "#e8edf5",
                            lineHeight: 1.08,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          Cislunar AI{" "}
                          <span style={{ color: "#00d4ff" }}>Systems Lab</span>
                        </h1>
                      </motion.div>

                      {/* Member cards — floating, no box background */}
                      <div className="grid grid-cols-3 gap-6">
                        {groupMembers.map((m, i) => (
                          <motion.div
                            key={m.id}
                            className="flex flex-col items-center text-center"
                            initial={{
                              opacity: 0,
                              x: memberEntrance[i].x,
                              y: memberEntrance[i].y,
                              rotate: memberEntrance[i].rotate,
                              scale: 0.3,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              y: 0,
                              rotate: 0,
                              scale: 1,
                            }}
                            transition={{
                              delay: 0.45 + 0.35 * i,
                              duration: 1.2,
                              type: "spring",
                              stiffness: 115,
                              damping: 19,
                            }}
                            whileHover={{ y: -6, scale: 1.02 }}
                          >
                            <div
                              className="relative overflow-hidden rounded-full"
                              style={{
                                width: "clamp(120px, 13vw, 185px)",
                                height: "clamp(120px, 13vw, 185px)",
                                border: "2.5px solid rgba(0, 212, 255, 0.7)",
                                boxShadow:
                                  "0 0 30px rgba(0, 212, 255, 0.22), 0 0 64px rgba(0, 212, 255, 0.08)",
                                flexShrink: 0,
                              }}
                            >
                              <Image
                                src={m.img}
                                alt={m.name}
                                fill
                                sizes="185px"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                            {/* Name */}
                            <p
                              style={{
                                marginTop: "20px",
                                fontSize: "clamp(14px, 1.5vw, 18px)",
                                fontWeight: 700,
                                color: "#e8edf5",
                                lineHeight: 1.4,
                                letterSpacing: "0.01em",
                              }}
                            >
                              {m.name}
                            </p>
                            {/* Student ID */}
                            <p
                              style={{
                                marginTop: "8px",
                                fontFamily: "var(--font-geist-mono, monospace)",
                                fontSize: "18px",
                                letterSpacing: "0.25em",
                                color: "#00d4ff",
                                opacity: 0.8,
                              }}
                            >
                              {m.id}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CONTINUE button — generous padding */}
                  <div className="mt-6 flex justify-end">
                    <motion.button
                      className="inline-flex items-center gap-3 rounded-full border border-cyan-300/50 text-cyan-100"
                      style={{
                        padding: "16px 40px",
                        fontSize: "12px",
                        fontWeight: 700,
                        letterSpacing: "0.25em",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        background: "rgba(0, 212, 255, 0.08)",
                        backdropFilter: "blur(8px)",
                      }}
                      animate={{
                        boxShadow: [
                          "0 0 16px rgba(0,212,255,0.22)",
                          "0 0 38px rgba(0,212,255,0.52)",
                          "0 0 16px rgba(0,212,255,0.22)",
                        ],
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 1.7,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setStage("maps")}
                    >
                      CONTINUE
                      <ArrowRight size={15} />
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                /* ── MAPS STAGE ──────────────────────────────────────────── */
                <motion.div
                  key="maps"
                  className="flex h-full w-full flex-col gap-5"
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-200/35 text-cyan-200"
                        style={{
                          padding: "7px 14px",
                          fontSize: "10px",
                          letterSpacing: "0.28em",
                          fontFamily: "var(--font-geist-mono, monospace)",
                          background: "rgba(0,0,0,0.4)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <Sparkles size={11} />
                        SYSTEM MAP BRIEFING
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-geist-mono, monospace)",
                          fontSize: "10px",
                          color: "rgba(0,212,255,0.6)",
                          letterSpacing: "0.2em",
                        }}
                      >
                        {activeMap + 1} / {systemMaps.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStage("members")}
                      style={{
                        padding: "9px 22px",
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        color: "rgba(192,200,216,0.85)",
                        border: "1px solid rgba(192,200,216,0.25)",
                        borderRadius: "99px",
                        background: "rgba(0,0,0,0.35)",
                        cursor: "pointer",
                      }}
                    >
                      ← BACK
                    </button>
                  </div>

                  {/* Map viewer */}
                  <div className="relative grow overflow-hidden rounded-2xl border border-cyan-300/25 shadow-[0_0_60px_rgba(0,220,255,0.18)]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={map.src}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={map.src}
                          alt={map.title}
                          fill
                          priority
                          sizes="100vw"
                          className="object-contain"
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Left nav */}
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 md:left-8">
                      <motion.button
                        type="button"
                        onClick={prevMap}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.93 }}
                        style={{
                          padding: "12px",
                          borderRadius: "99px",
                          border: "1px solid rgba(192,200,216,0.5)",
                          background: "rgba(0,212,255,0.14)",
                          color: "#e8edf5",
                          boxShadow: "0 0 28px rgba(0,212,255,0.35)",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        <ChevronLeft size={22} />
                      </motion.button>
                    </div>

                    {/* Right nav */}
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 md:right-8">
                      <motion.button
                        type="button"
                        onClick={nextMap}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.93 }}
                        style={{
                          padding: "12px",
                          borderRadius: "99px",
                          border: "1px solid rgba(192,200,216,0.5)",
                          background: "rgba(0,212,255,0.14)",
                          color: "#e8edf5",
                          boxShadow: "0 0 28px rgba(0,212,255,0.35)",
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        <ChevronRight size={22} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Caption + launch row */}
                  <div className="flex items-end justify-between gap-4">
                    {/* Caption */}
                    <div
                      className="rounded-2xl border border-cyan-200/20"
                      style={{
                        padding: "18px 24px",
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(10px)",
                        maxWidth: "640px",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-geist-mono, monospace)",
                          fontSize: "10px",
                          letterSpacing: "0.26em",
                          color: "#00d4ff",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        {map.title}
                      </p>
                      <p
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.65,
                          color: "rgba(232,237,245,0.85)",
                          fontWeight: 400,
                        }}
                      >
                        {map.caption}
                      </p>
                    </div>

                    {/* Launch button */}
                    <motion.button
                      style={{
                        padding: "16px 36px",
                        borderRadius: "99px",
                        background: "#c8102e",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 800,
                        letterSpacing: "0.24em",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        border: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                        boxShadow: "0 0 30px rgba(200,16,46,0.5)",
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      animate={{
                        boxShadow: [
                          "0 0 18px rgba(200,16,46,0.42)",
                          "0 0 40px rgba(200,16,46,0.72)",
                          "0 0 18px rgba(200,16,46,0.42)",
                        ],
                      }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      onClick={onClose}
                    >
                      LAUNCH MAIN APPLICATION
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
