import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import AgeGate from "@/components/layout/AgeGate";
import { AuthProvider } from "@/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://getubiza.com"),

  title: "Ubiza",
  description: "Découvrez des profils près de vous",

  openGraph: {
    title: "Ubiza",
    description: "Découvrez des profils près de vous",
    url: "https://getubiza.com",
    siteName: "Ubiza",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/ubiza-og.png",
        width: 1200,
        height: 630,
        alt: "Ubiza",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Ubiza",
    description: "Découvrez des profils près de vous",
    images: ["/ubiza-og.png"],
  },

  icons: {
    icon: [
      {
        url: "/ubiza-icon.png",
        type: "image/png",
      },
    ],
    apple: "/ubiza-apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <AgeGate />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
