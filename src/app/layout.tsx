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
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <div className="flex min-h-screen bg-background text-foreground">
              <Sidebar />
              <div className="flex-1 lg:pl-[280px]">
                <Navbar />
                <main className="px-4 py-8 lg:px-8 xl:px-12 w-full max-w-[1600px]">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
