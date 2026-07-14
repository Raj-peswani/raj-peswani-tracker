import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raj Peswani's Tracker",
  description: "Global markets, business news, technology, and Pune real estate in one live dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head><script dangerouslySetInnerHTML={{ __html: `let saved='';try{saved=localStorage.getItem('raj-tracker-theme')||''}catch{}if(!saved){saved=(document.cookie.match(/(?:^|; )raj-tracker-theme=(dark|light)/)||[])[1]||''}const dark=saved?saved==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',dark)` }} /></head>
      <body className="min-h-full flex flex-col">{children}<a href="/api/auth/logout" className="fixed bottom-5 left-5 z-[60] rounded-full border border-[#d9dbd4] bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#666c63] shadow-sm backdrop-blur transition hover:text-[#e85d24] dark:border-[#394037] dark:bg-[#1b1f19]/90">Logout</a><ThemeToggle /></body>
    </html>
  );
}
