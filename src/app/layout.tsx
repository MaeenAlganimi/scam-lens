import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scam Lens",
  description: "On-device scam risk check for a pasted message or a screenshot. Nothing you paste is uploaded.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plex.variable} ${plexArabic.variable} h-full antialiased`}>
      <body className="min-h-full">
        <noscript>
          <p style={{ padding: "1rem", fontFamily: "sans-serif" }}>
            Scam Lens needs JavaScript. The check runs in your browser, so there is no server copy of the message.
          </p>
        </noscript>
        {children}
      </body>
    </html>
  );
}
