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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tien-len-ruby.vercel.app';

export const metadata: Metadata = {
  title: {
    default: 'Tien Len — Vietnamese Card Game',
    template: '%s | Tien Len',
  },
  description: 'Play Tien Len (Tiến Lên), the most popular Vietnamese card game. Solo vs AI or multiplayer with 2-8 friends. Twos are highest. Bombs beat twos. First to empty wins.',
  keywords: ['tien len', 'tiến lên', 'vietnamese card game', 'card game', 'multiplayer', 'online game'],
  authors: [{ name: 'vxcozy' }],
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Tien Len',
    title: 'Tien Len — Vietnamese Card Game',
    description: 'Play the most popular Vietnamese card game. Solo vs AI or multiplayer with 2-8 friends online.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tien Len — Vietnamese Card Game',
    description: 'Play the most popular Vietnamese card game. Solo vs AI or multiplayer with 2-8 friends online.',
  },
  robots: {
    index: true,
    follow: true,
  },
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
