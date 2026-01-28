import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Car Wash Manager',
  description: 'Track car wash entries, payments, and generate reports',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen bg-gray-50`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
