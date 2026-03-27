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
  title: "Travel Helper - AI 旅遊助手",
  description: "AI 驅動的旅遊規劃助手，提供簽證查詢、法律禁忌、行程規劃等功能",
  keywords: ["旅遊", "行程規劃", "簽證", "AI", "旅遊助手"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">{children}</body>
    </html>
  );
}