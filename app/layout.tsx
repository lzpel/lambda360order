import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Torus STL Generator",
  description: "Generate torus STL files using OpenCascade.js in the browser",
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
