import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dawns Embrace",
  description: "Dawns Embrace — A new day, a new you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
