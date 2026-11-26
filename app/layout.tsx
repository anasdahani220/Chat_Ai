import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
});


export const metadata: Metadata = {
  title: "Nova Store Assistant",
  description: "Assistant de service client basé sur le RAG pour la boutique en ligne Nova Store",
  icons: {
    icon: "https://api.dicebear.com/9.x/bottts/svg?seed=NovaAI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={inter.variable}
    >
      <body style={{fontFamily: "var(--font-inter), system-ui, sans-serif "}}>{children}</body>
    </html>
  );
}
