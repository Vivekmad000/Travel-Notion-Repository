import type { Metadata } from "next";
import { Nunito, Fredoka } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const oceanTrace = localFont({
  src: "../public/fonts/OceanTrace.ttf",
  variable: "--font-ocean-trace",
});

export const metadata: Metadata = {
  title: "TravelVerse - Plan Your Travels",
  description: "A Notion-like app for organizing travel notes and collaborating with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${nunito.variable} ${fredoka.variable} ${oceanTrace.variable} antialiased`}
          suppressHydrationWarning
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
