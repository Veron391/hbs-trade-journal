import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { TradeProvider } from "./context/TradeContext";
import { TimePeriodProvider } from "./context/TimePeriodContext";
import { I18nProvider } from "./context/I18nContext";
import { UIProtectionProvider } from "./context/UIProtectionContext";
import { FormProvider } from "./context/FormContext";
import ConditionalFooter from "./components/ConditionalFooter";
import { SWRConfig } from 'swr';

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
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 2000,
            focusThrottleInterval: 5000,
            errorRetryCount: 3,
            errorRetryInterval: 1000,
          }}
        >
          <UIProtectionProvider>
            <AuthProvider>
              <I18nProvider>
              <FormProvider>
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
              </FormProvider>
              </I18nProvider>
            </AuthProvider>
          </UIProtectionProvider>
        </SWRConfig>
      </body>
    </html>
  );
}
