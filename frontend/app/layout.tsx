import "./globals.css";
import { AppShell } from "@/components/AppShell";

import type { Viewport } from "next";

export const metadata = {
  title: "MetraLab - OIML R76 Test Report Studio",
  description: "Non-automatic weighing instrument test records, calculations, and technical review studio",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
