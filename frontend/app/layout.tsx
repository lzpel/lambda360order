import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lambda360 Order',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
