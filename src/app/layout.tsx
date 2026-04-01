import type { Metadata } from "next";
import { Inter, Space_Grotesk, Roboto_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PriceProvider } from "@/components/providers/price-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StatusBar } from "@/components/layout/status-bar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KINETIC // Trading Terminal",
  description:
    "High-fidelity trading terminal for signal analysis and risk management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-[#0e0e0f] text-white">
        <TooltipProvider>
          <PriceProvider>
            {/* Desktop sidebar - fixed position */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>

            <div className="pl-0 lg:pl-20 min-h-screen flex flex-col">
              <Topbar />

              <main className="flex-1 p-6 pb-16 lg:pb-6">
                {children}
              </main>

              {/* Desktop status bar */}
              <div className="hidden lg:block shrink-0">
                <StatusBar />
              </div>

              {/* Mobile bottom nav */}
              <MobileNav />
            </div>
          </PriceProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
