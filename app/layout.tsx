import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChatGPTrouxa | A IA que não ajuda',
  description: 'Um chat absurdo, nonsense e totalmente inútil.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
