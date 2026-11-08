import type { Metadata, Viewport } from "next";

import { getSiteContent } from "@/lib/content";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { club } = await getSiteContent();

  return {
    title: {
      default: `${club.name} | Hành trình khám phá CLB`,
      template: `%s | ${club.name}`,
    },
    description: club.description,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8ec",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
