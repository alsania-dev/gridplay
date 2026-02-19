import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GridPlay - Sports Squares Reinvented",
    template: "%s | GridPlay",
  },
  description: "Create and join sports square boards with friends. Track scores, manage boards, and enjoy the game! The ultimate digital platform for Super Bowl squares, March Madness, and more.",
  keywords: ["sports", "betting", "squares", "football", "super bowl", "march madness", "NFL", "NBA", "grid", "board game"],
  authors: [{ name: "GridPlay Team" }],
  creator: "GridPlay",
  publisher: "GridPlay",
  metadataBase: new URL("https://gridplay.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gridplay.app",
    siteName: "GridPlay",
    title: "GridPlay - Sports Squares Reinvented",
    description: "Create and join sports square boards with friends. Track scores, manage boards, and enjoy the game!",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "GridPlay - Sports Squares Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GridPlay - Sports Squares Reinvented",
    description: "Create and join sports square boards with friends. Track scores, manage boards, and enjoy the game!",
    images: ["/images/og-image.png"],
    creator: "@gridplay",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-navy-900 text-white min-h-screen`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
