import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pidate - Every date lives in π",
  description: "Experience π as a continuous page. Watch as today's date appears naturally within the infinite digits of pi.",
  keywords: ["pi", "date", "mathematics", "visualization", "interactive"],
  openGraph: {
    title: "Pidate - Every date lives in π",
    description: "Experience π as a continuous page. Watch as today's date appears naturally within the infinite digits of pi.",
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
