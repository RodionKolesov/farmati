import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmoothConsult from "@/components/SmoothConsult";

export const metadata: Metadata = {
  title: "Farmati.cosmetics — сыворотки, кремы и курсы по уходу за лицом",
  description:
    "Farmati.cosmetics — уходовая косметика без парабенов и сульфатов, курсы по массажу лица, бонусная программа.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <SmoothConsult />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
