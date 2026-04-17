"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Rocket, ShieldCheck, Orbit, Database } from "lucide-react";
import StarField from "@/components/StarField";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.08,
      duration: 0.6,
      ease: "easeOut" as const,
    },
  }),
};

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-space-void">
      <StarField />
      <div className="star-field" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full flex-col px-8 pb-16 pt-10 md:px-14 md:pt-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#00D4FF66] bg-[#00D4FF11]">
              <Rocket size={17} className="text-[#00D4FF]" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#00D4FF] font-semibold">
                Cislunar Mission Control
              </p>
              <p className="text-lunar-silver text-[10px] uppercase tracking-[0.22em] mt-0.5">
                Beihang AI Systems Lab
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="btn-mission rounded-xl px-5 py-2.5 text-xs uppercase tracking-[0.18em]"
          >
            Open Dashboard
          </Link>
        </header>

        <section className="grid flex-1 grid-cols-1 items-center gap-14 py-14 md:grid-cols-2">
          <div className="space-y-8">
            <motion.p
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="inline-flex rounded-full border border-[#E8B84B66] bg-[#E8B84B22] px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[#E8B84B] font-mono"
            >
              LEO 167 km to LMO 100 km
            </motion.p>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-5xl font-black leading-[1.05] md:text-7xl"
            >
              <span className="gradient-text-mission">AI-Based Fast</span>
              <br />
              <span className="text-star-white">
                Cislunar Trajectory Generation
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-lunar-silver max-w-xl text-base leading-[1.85] md:text-lg"
            >
              Physics-informed trajectory intelligence combining CR3BP dynamics,
              Hybrid GNN-PINN prediction, safety guardrails, and
              retrieval-grounded mission reasoning. Streamlit stays intact in
              the root app; this Next.js interface is your showcase-grade
              command center.
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-3"
            >
              <Link
                href="/dashboard"
                className="btn-launch rounded-xl px-5 py-3 text-xs uppercase tracking-[0.2em]"
              >
                Launch Control Room
              </Link>
            </motion.div>

            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4"
            >
              <Feature
                icon={Orbit}
                title="CR3BP"
                subtitle="Rotating Frame Physics"
              />
              <Feature
                icon={Database}
                title="RAG"
                subtitle="NASA/AIAA Corpus"
              />
              <Feature
                icon={ShieldCheck}
                title="Safety"
                subtitle="Non-bypass Guardrails"
              />
              <Feature
                icon={Rocket}
                title="ReAct"
                subtitle="Mission Agent Loop"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative"
          >
            <div className="glass-panel scanlines relative overflow-hidden rounded-3xl border border-[#00D4FF33] p-8">
              <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[#00d4ff22] blur-3xl" />
              <div className="absolute -bottom-28 -right-16 h-56 w-56 rounded-full bg-[#c8102e22] blur-3xl" />

              <div className="relative space-y-4">
                <p className="text-orbit-cyan text-[11px] uppercase tracking-[0.22em] font-mono">
                  Live Mission Snapshot
                </p>
                <h2 className="text-star-white text-2xl font-bold mt-2">
                  Earth-Moon Transfer Session
                </h2>

                <div className="grid grid-cols-3 gap-3">
                  <Metric
                    label="Delta-v"
                    value="3.142"
                    unit="km/s"
                    color="#00D4FF"
                  />
                  <Metric
                    label="Time of Flight"
                    value="4.7"
                    unit="days"
                    color="#E8B84B"
                  />
                  <Metric
                    label="Jacobi C"
                    value="3.188"
                    unit=""
                    color="#FF6B35"
                  />
                </div>

                <div className="glass-panel rounded-xl p-3">
                  <p className="text-lunar-silver mb-2 text-[10px] uppercase tracking-[0.18em]">
                    Pipeline Status
                  </p>
                  {[
                    "Knowledge ingest complete (1245 chunks)",
                    "Data audit Q_total = 0.9480",
                    "Hybrid model quantized and exported",
                    "Safety checks passed against standards",
                  ].map((item) => (
                    <div
                      key={item}
                      className="text-star-white mb-1 flex items-center gap-2 text-xs"
                    >
                      <span className="h-2 w-2 rounded-full bg-[#00ff88]" />
                      {item}
                    </div>
                  ))}
                </div>

                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF]"
                >
                  Enter full mission console
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Orbit;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="glass-panel rounded-2xl border border-[#00D4FF22] p-4">
      <Icon size={16} className="mb-2 text-[#00D4FF]" />
      <p className="text-star-white text-sm font-bold uppercase tracking-[0.14em]">
        {title}
      </p>
      <p className="text-lunar-silver text-[11px] mt-1 leading-5">{subtitle}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[#ffffff14] bg-[#0b1522] p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#7f8da1] font-mono mb-2">
        {label}
      </p>
      <p className="text-2xl font-black" style={{ color }}>
        {value}
        <span className="ml-1 text-sm font-medium text-[#9fb2cb]">{unit}</span>
      </p>
    </div>
  );
}
