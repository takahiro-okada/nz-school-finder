import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "NZ School Finder",
    template: "%s | NZ School Finder",
  },
  description: "Explore New Zealand schools, enrolment zones, school types, and roll data on an interactive map.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NZ School Finder",
    description: "Explore New Zealand schools, enrolment zones, school types, and roll data on an interactive map.",
    url: "/",
    siteName: "NZ School Finder",
    locale: "en_NZ",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "NZ School Finder",
    description: "Explore New Zealand schools, enrolment zones, school types, and roll data on an interactive map.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_ID} />
        {children}
      </body>
    </html>
  );
}
