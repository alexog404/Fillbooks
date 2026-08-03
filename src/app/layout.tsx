import type { Metadata } from "next";
import { ThemeScript } from "@/lib/theme-script";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "FillBooks",
  description: "Personal equities day-trading journal",
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
