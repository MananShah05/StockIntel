import type { Metadata } from "next";
import localFont from 'next/font/local'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { SmoothScrolling } from "@/components/providers/SmoothScrolling";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { MainContentWrapper } from "@/components/shared/MainContentWrapper";

// Cabinet Grotesk for display headings
const cabinet = localFont({
  src: '../public/fonts/CabinetGrotesk-Variable.woff2',
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "StockIntel — Stock Decision Support & Market Intelligence Hub",
  description: "StockIntel provides reason-based decision support, combining official SEC filings, financial news sentiment, social indicators, technical trend triggers, and macroeconomic regimes into a transparent rating.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${cabinet.variable} min-h-screen flex flex-col antialiased`}
        style={{
          fontFamily: 'var(--font-body)',
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <SmoothScrolling>
              <Navbar />
              <MainContentWrapper>
                {children}
              </MainContentWrapper>
            </SmoothScrolling>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
