import type { Metadata } from "next";
import { Playfair_Display, Jost, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "Empowered Ink — Possible Woman Magazine",
  description:
    "Browse and submit books to Empowered Ink, the Possible Woman Magazine directory of women entrepreneurs and authors.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jost.variable} ${cormorant.variable}`}
    >
      <body className="min-h-full flex flex-col bg-warm-white text-midnight-plum">
        {children}
      </body>
    </html>
  );
}
