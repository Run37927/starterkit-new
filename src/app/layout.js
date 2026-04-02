import { Inter, Nunito } from 'next/font/google'
import "./globals.css";
import Navbar from '@/components/Navbar';
import { Toaster } from "@/components/ui/sonner"
import Providers from '@/components/Providers';
import { cn, constructMetadata } from '@/lib/utils';
import NextTopLoader from 'nextjs-toploader';

// To add more fonts, go to https://fonts.google.com/variablefonts
const inter = Inter({
  subsets: ['latin'],
  variable: "--font-inter",
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: "--font-nunito",
})

export const metadata = constructMetadata();

export default function RootLayout({ children }) {
  return (
    <html lang="en" className='!scroll-smooth'>
      <body className={cn('min-h-screen font-inter antialiased', inter.variable, nunito.variable)}>
        <NextTopLoader color="black" showSpinner={false} />
        <Providers>
          <Toaster />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
