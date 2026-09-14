import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PELITA - LMS Mobile SMKN 1 Kemangkon",
  description: "Pusat Ekselensi, Literasi, Iman, Teknologi dan Akademik",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PELITA LMS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${plusJakarta.className} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
