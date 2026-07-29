import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.oneqrcode.site";
const SITE_NAME = "OneQRCode";
const TITLE = "OneQRCode — Dynamic QR codes you can update anytime";
const DESCRIPTION =
  "Print a QR code once and point it anywhere, forever. OneQRCode gives you long-lasting QR codes whose destination you can change any time — no reprint needed. Track scans, customize the design, and manage everything from one dashboard.";
const GOOGLE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ||
  "your-google-verification-code";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · oneqrcode",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "dynamic QR code",
    "editable QR code",
    "QR code generator",
    "changeable QR code",
    "permanent QR code",
    "QR code with analytics",
    "custom QR code",
    "trackable QR code",
    "QR code redirect",
    "oneqrcode",
  ],
  authors: [{ name: "oneqrcode" }],
  creator: "oneqrcode",
  publisher: "oneqrcode",
  referrer: "origin-when-cross-origin",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "OneQRCode — move the link, keep the code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  verification: {
    google: GOOGLE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1f15" },
  ],
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
      <Analytics />
    </html>
  );
}
