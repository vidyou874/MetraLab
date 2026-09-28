import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "MetraLab - OIML R76 Test Report Studio",
  description: "Non-automatic weighing instrument test records, calculations, and technical review studio",
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
