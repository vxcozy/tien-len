import type { Metadata } from "next";
import { Geist, Ma_Shan_Zheng } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const maShanZheng = Ma_Shan_Zheng({
  weight: "400",
  variable: "--font-brush",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tien Len",
  description: "Vietnamese card game - play with friends online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${maShanZheng.variable} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
