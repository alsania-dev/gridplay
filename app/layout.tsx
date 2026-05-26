import type { Metadata, Viewport } from "next";
import "./globals.css";
import React from 'react';
import Layout from '@/components/Layout';

export const metadata: Metadata = {
  title: {
    default: "GridPlay - Sports Squares Betting Platform",
    template: "%s | GridPlay",
  },
  description: "The ultimate sports squares betting platform for Super Bowl parties, March Madness, and game nights. Create boards, claim squares, and win big!",
  keywords: [
    "sports betting",
    "squares game",
    "Super Bowl squares",
    "March Madness",
    "game night",
    "betting pool",
    "football squares",
    "basketball squares",
  ],
  authors: [{ name: "GridPlay Team" }],
  creator: "GridPlay",
  publisher: "GridPlay",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gridplay.app",
    siteName: "GridPlay",
    title: "GridPlay - Sports Squares Betting Platform",
    description: "The ultimate sports squares betting platform for Super Bowl parties, March Madness, and game nights.",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "GridPlay Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GridPlay - Sports Squares Betting Platform",
    description: "The ultimate sports squares betting platform for Super Bowl parties, March Madness, and game nights.",
    images: ["/logo.svg"],
  },
  icons: {
    icon: [
      { url: "/logo-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/logo-icon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10B981" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-text antialiased">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
