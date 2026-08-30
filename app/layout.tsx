import type { Metadata } from "next";

// Self-hosted variable fonts (no runtime or build-time request to Google
// Fonts — the woff2 files ship inside the npm package). See globals.css
// for how --font-sans/--font-display map to these family names.
import "@fontsource-variable/inter";
import "@fontsource-variable/lexend";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
