import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { ThemeProvider } from "@/components/themeProvider";
import Navbar from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import { SidebarWrapper } from "@/components/SidebarWrapper";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Toaster } from '@/components/ui/toast';
import { JetBrains_Mono } from 'next/font/google';
import { bootstrap } from "@/lib/bootstrap";
import { ScrollToTop } from "@/components/ScrollToTop";
import { RootMainWrapper } from "@/components/RootMainWrapper";
import { RealtimeProvider } from "@/shared/infrastructure/socket/RealtimeProvider";
import { generatePageMetadata, getOrganizationStructuredData } from "@/lib/seo";

bootstrap(); // Runs once on server startup

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

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

export const metadata: Metadata = generatePageMetadata();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getOrganizationStructuredData()),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${jetBrainsMono.variable} antialiased font-mono`} suppressHydrationWarning={true}>
        <SessionProvider>
          <RealtimeProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
              <div className="flex min-h-screen bg-background text-foreground">
                <SidebarProvider>
                  <SidebarWrapper>
                    <Sidebar />
                  </SidebarWrapper>
                  <div className="min-w-0 flex-1 transition-all duration-300">
                    <Navbar />
                    <RootMainWrapper>
                      {children}
                    </RootMainWrapper>
                  </div>
                  <MobileBottomBar />
                </SidebarProvider>
              </div>
              <ScrollToTop />
              <Toaster />
            </ThemeProvider>
          </RealtimeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
