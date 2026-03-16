import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pidate - Find your date in π",
  description: "Because π is infinite, every date appears somewhere inside it. Discover where your date lives in the digits of pi.",
  keywords: ["pi", "date", "mathematics", "visualization"],
  openGraph: {
    title: "Pidate - Find your date in π",
    description: "Because π is infinite, every date appears somewhere inside it.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
