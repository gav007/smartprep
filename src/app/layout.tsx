
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/Header'; // Import the Header component
import Footer from '@/components/layout/Footer'; // Import the Footer component

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SmartPrep - Networking & Electronics Quiz Platform',
  description: 'An interactive quiz and learning platform for networking and electronics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <Header /> {/* Header is now sticky */}
         {/* Apply container and padding only to non-full-width pages within their own layouts/components */}
        <main className="flex-grow">
          {children}
        </main>
        {/* Footer is rendered conditionally or on specific pages */}
        {/* <Footer /> Footer moved inside HomePage or other page layouts if needed globally */}
        <Toaster />
      </body>
    </html>
  );
}
