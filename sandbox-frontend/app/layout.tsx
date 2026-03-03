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
  let fullstyle = { width: '100%', height: '100%', margin: 0, padding: 0 };
  return (
    <html lang="ja" style={fullstyle}>
      <body style={fullstyle}>{children}</body>
    </html>
  );
}
