import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Antics MD",
  description: "Competitive Multiplayer Hospital Operations Simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#f0f2f5]">{children}</body>
    </html>
  );
}
