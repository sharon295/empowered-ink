import type { Metadata } from "next";
import { Bodoni_Moda, Work_Sans } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Empowered Ink — Possible Woman Magazine",
  description:
    "Browse and submit books to Empowered Ink, the Possible Woman Magazine directory of women entrepreneurs and authors.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodoni.variable} ${workSans.variable}`}>
      <body className="flex min-h-full flex-col bg-ivory text-ink">{children}</body>
    </html>
  );
}
