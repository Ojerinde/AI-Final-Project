import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientShell from "../components/ClientShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cislunar Mission Control | AI Trajectory Generation",
  description:
    "AI-Based Fast Cislunar Trajectory Generation — LEO to LMO using Hybrid GNN-PINN architecture, grounded in NASA/AIAA safety standards.",
  keywords: [
    "cislunar",
    "trajectory",
    "GNN",
    "PINN",
    "NASA",
    "CR3BP",
    "Beihang University",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-space-void text-star-white antialiased`}
      >
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
