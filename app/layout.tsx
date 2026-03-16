import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pidate - Your date, hidden in π",
  description: "Discover where any date appears in the infinite digits of pi. Experience π as a continuous mathematical landscape.",
  keywords: ["pi", "date", "mathematics", "visualization", "infinite", "digits"],
  openGraph: {
    title: "Pidate - Your date, hidden in π",
    description: "Discover where any date appears in the infinite digits of pi.",
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
