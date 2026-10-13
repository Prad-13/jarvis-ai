import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { CanvasGlow } from "@/components/layout/canvas-glow";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jarvis AI",
  description: "Your Google Workspace, intelligently connected. Manage Gmail, Calendar, Drive, Tasks and Sheets through natural conversation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-cyber-bg text-slate-100 overflow-x-hidden`}
      >
        <Providers>
          <CanvasGlow />
          {children}
        </Providers>
      </body>
    </html>
  );
}
