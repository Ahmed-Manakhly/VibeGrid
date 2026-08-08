import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/themeProvider";
import Navbar from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
//---------------
import {Toaster} from 'react-hot-toast'
import { JetBrains_Mono } from 'next/font/google'

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "VibeGrid",
  description: "Real-time Tech Newsfeed / Developer Pulse. Drop a Vibe and Tune In.",
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode;}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning >
        <head />
        <body className={`${geistSans.variable} ${geistMono.variable} ${jetBrainsMono.variable} antialiased`} suppressHydrationWarning={true}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange >
              <div className="flex min-h-screen">
                <Sidebar />
                <div className="min-w-0 flex-1">
                  <Navbar />
                  <main className="mx-auto max-w-7xl px-5 py-8 lg:px-9">
                    {children}
                  </main>
                </div>
              </div>
              <Toaster/>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
