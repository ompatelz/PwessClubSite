import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

// Absolute base for canonical and share URLs. NEXT_PUBLIC_SITE_URL wins when the
// club moves to its own domain; otherwise Vercel's production URL is used.
const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  openGraph: {
    siteName: "The Press Club at DAU",
    locale: "en_IN",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  title: {
    default: "The Press Club · DAU",
    template: "%s · The Press Club",
  },
  description:
    "The Press Club at DAU — Entelechy, NNN, signed blog writing, and moderated anonymous Tea.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${bricolage.variable}`}
    >
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
