import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PDF Editor — Edit PDFs in Your Browser",
  description:
    "A powerful, privacy-first PDF editor that runs entirely in your browser. Add text, images, shapes, drawings, highlights and export your edited PDF — no server uploads required.",
  keywords: ["pdf editor", "pdf tool", "edit pdf", "browser pdf editor", "online pdf editor"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
