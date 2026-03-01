import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CyePro AI Notification Engine",
  description: "Advanced prioritization and routing engine for notifications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-950 text-gray-100 flex h-screen overflow-hidden`} suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-950/50 p-8 shadow-inner">
          {children}
        </main>
      </body>
    </html>
  );
}
