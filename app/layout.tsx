import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

// Self-hosted variable fonts (no runtime or build-time request to Google
// Fonts — the woff2 files ship inside the npm package). See globals.css
// for how --font-sans/--font-display map to these family names.
import "@fontsource-variable/inter";
import "@fontsource-variable/lexend";
// Arabic variable font for correct RTL rendering.
import "@fontsource-variable/noto-sans-arabic";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { dirFor, isLocale } from "@/i18n/config";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rentflow.ma"),
  title: {
    default: "RentFlow — Car & Motorcycle Rental Management SaaS",
    template: "%s · RentFlow",
  },
  description:
    "RentFlow is the all-in-one rental management platform for car and motorcycle agencies — bookings, fleet, customers, and analytics in one place.",
  keywords: [
    "car rental software",
    "motorcycle rental",
    "rental management SaaS",
    "car rental Morocco",
    "fleet management",
  ],
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    siteName: "RentFlow",
    title: "RentFlow — Car & Motorcycle Rental Management SaaS",
    description:
      "The all-in-one rental management platform for car and motorcycle agencies.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RentFlow — Car & Motorcycle Rental Management SaaS",
    description:
      "The all-in-one rental management platform for car and motorcycle agencies.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : "fr";
  const messages = await getMessages();
  const dir = dirFor(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
