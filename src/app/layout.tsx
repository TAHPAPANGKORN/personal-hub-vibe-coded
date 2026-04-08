import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: "Desk Setup | Showcase Your Workspace",
  description: "A premium showcase of the best desk setups, gear, and tools for productivity and gaming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white selection:bg-purple-500/30 selection:text-purple-200 min-h-screen font-sans`}
      >
        <Toaster position="top-right" richColors closeButton theme="dark" />
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_50%_50%,#18181b_0%,#000_100%)]" />
        {children}
      </body>
    </html>
  );
}
