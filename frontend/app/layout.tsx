import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lambda360Form',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let fullstyle = { width: '100%', height: '100%', margin: 0, padding: 0 };
  return (
    <html lang="ja" style={fullstyle}>
      <body style={fullstyle}>{children}</body>
    </html>
  );
}
