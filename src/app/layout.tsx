import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import Notifications from "@/components/Notifications";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VideoX - Hollywood-Quality Video Enhancement",
    template: "%s | VideoX"
  },
  description: "Transform your videos into stunning 4K/8K masterpieces with AI-powered enhancement. Professional quality upscaling with cinematic results in minutes.",
  keywords: ["video enhancement", "AI upscaling", "4K video", "8K video", "video quality", "Hollywood quality"],
  authors: [{ name: "VideoX" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://videox.com",
    title: "VideoX - Hollywood-Quality Video Enhancement",
    description: "Transform your videos into stunning 4K/8K masterpieces with AI-powered enhancement.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VideoX - Professional Video Enhancement"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "VideoX - Hollywood-Quality Video Enhancement",
    description: "Transform your videos into stunning 4K/8K masterpieces with AI-powered enhancement.",
    images: ["/og-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  verification: {
    google: "your-google-verification-code"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <div className="min-h-screen bg-primary text-text-primary">
            {children}
            <Notifications />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
