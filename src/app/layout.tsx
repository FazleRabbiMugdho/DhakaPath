import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { DhakaPathProvider } from "../store/useDhakaPathStore";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

const fontBangla = Hind_Siliguri({
  subsets: ["bengali"],
  variable: "--font-bangla",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DhakaPath — Multi-Objective Transit Engine & Route Verifier",
  description:
    "IAIT National IT Fest (INIF) 2026 Smart City Hackathon | Deterministic Multi-Modal Routing, Student Fare & Live Street Disruption Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} ${fontBangla.variable} dark`}
    >
      <body className="min-h-screen bg-[#070B14] text-[#F8FAFC] antialiased selection:bg-[#06B6D4]/30 selection:text-white">
        {/* 4-Layer Midnight Aurora Background Stack */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#070B14] via-[#0A101D] to-[#070B14]" />

          {/* Aurora Blob 1 (Electric Blue) */}
          <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-[#3B82F6]/15 blur-[128px]" />

          {/* Aurora Blob 2 (Electric Cyan) */}
          <div className="absolute top-1/3 -right-20 h-[600px] w-[600px] rounded-full bg-[#06B6D4]/15 blur-[140px]" />

          {/* Perspective Grid Layer */}
          <div className="absolute inset-0 bg-perspective-grid opacity-30" />
        </div>

        {/* Global Reactive Store Bridge */}
        <DhakaPathProvider>
          <div className="relative z-10 min-h-screen flex flex-col">
            <div
              role="note"
              className="sticky top-0 z-50 flex h-8 shrink-0 items-center justify-center whitespace-nowrap border-b border-cyan-400/30 bg-[#081725] px-3 text-center font-mono text-[10px] font-semibold tracking-wide text-cyan-100 sm:text-xs"
            >
              [SIMULATED DEMO TELEMETRY — BENCHMARK REPLAY]
            </div>
            {children}
          </div>
        </DhakaPathProvider>
      </body>
    </html>
  );
}
