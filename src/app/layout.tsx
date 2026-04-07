import type { Metadata } from "next";

import { QueryProvider } from "@/components/providers/query-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "AA to NT",
  description: "Protected AA→NT codon design workbench",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
