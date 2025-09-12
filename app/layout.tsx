import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { TradeProvider } from "./context/TradeContext";
import { TimePeriodProvider } from "./context/TimePeriodContext";
import ConditionalFooter from "./components/ConditionalFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trade Journal App",
  description: "Track and analyze your stock and crypto trades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: '#110D0F' }}
      >
        <AuthProvider>
          <TimePeriodProvider>
            <TradeProvider>
              <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#110D0F' }}>
                <main role="main" className="flex-1">
                  {children}
                </main>
                <ConditionalFooter />
              </div>
            </TradeProvider>
          </TimePeriodProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
