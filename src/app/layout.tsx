import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body className="min-h-full flex flex-col">{children}<a href="/api/auth/logout" className="fixed bottom-5 left-5 z-[60] rounded-full border border-[#d9dbd4] bg-white/90 px-3 py-2 text-[10px] font-semibold text-[#666c63] shadow-sm backdrop-blur transition hover:text-[#e85d24]">Logout</a></body>
    </html>
  );
}
