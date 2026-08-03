import type { Metadata } from "next";
import { ThemeScript } from "@/lib/theme-script";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "FillBooks",
  description: "Personal equities day-trading journal",
  // Safari's Data Detectors otherwise paints a native weekday-name overlay
  // on top of any grid of small numbers under a month/year heading (the
  // calendar/date-range pickers) -- it's not in the DOM at all, just a
  // WebKit rendering-layer artifact, confirmed by diffing actual page HTML
  // against what Safari visually shows.
  formatDetection: {
    date: false,
    telephone: false,
    address: false,
    email: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </body>
    </html>
  );
}
