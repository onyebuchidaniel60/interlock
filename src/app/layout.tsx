import type { Metadata, Viewport } from "next";

import { readRuntimeConfig } from "@/lib/config";

import "./globals.css";

readRuntimeConfig();

export const metadata: Metadata = {
  title: {
    default: "Interlock — verified memory execution gate",
    template: "%s · Interlock",
  },
  description:
    "Interlock prevents a policy-violating agent action unless verified shared memory supports it. Verified memory execution gate; simulation only.",
  applicationName: "Interlock",
  icons: [{ rel: "icon", url: "/icon.svg", type: "image/svg+xml" }],
};

export const viewport: Viewport = {
  themeColor: "#06080a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
