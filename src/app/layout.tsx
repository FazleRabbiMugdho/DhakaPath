import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import type { Viewport } from "next";
import { DhakaPathProvider } from "../store/useDhakaPathStore";
import { LangProvider } from "../lib/i18n";
import { HonestyStrip } from "../ui/HonestyStrip";
import { PwaRegister } from "../ui/PwaRegister";

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
  subsets: ["bengali", "latin"],
  variable: "--font-bangla",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DhakaPath — ঢাকার পথ, এক অ্যাপেই সমাধান",
  description:
    "Multi-modal Dhaka trip planner: student half-fares, rickshaw surge, live crowd-verified street alerts, and offline route cards.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DhakaPath" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#1BA94B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${fontSans.variable} ${fontMono.variable} ${fontBangla.variable}`}>
      <body className="min-h-screen bg-brand-canvas text-ink antialiased">
        <LangProvider>
          <DhakaPathProvider>
            <HonestyStrip />
            {children}
          </DhakaPathProvider>
        </LangProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
