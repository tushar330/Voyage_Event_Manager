import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EventProvider } from "@/context/EventContext";
import { AuthProvider } from "@/context/AuthContext";
import QueryProvider from "@/components/providers/QueryProvider";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Group Inventory Management Platform",
  description: "Enterprise-grade platform for MICE events and destination weddings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
<<<<<<< Updated upstream
        <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
          <AuthProvider>
            <EventProvider>
              {children}
            </EventProvider>
          </AuthProvider>
=======
        <body className={`${inter.variable} font-sans`}>
          <QueryProvider>
            <AuthProvider>
              <EventProvider>
                {children}
              </EventProvider>
            </AuthProvider>
          </QueryProvider>
>>>>>>> Stashed changes
        </body>
      </html>
  );
}
