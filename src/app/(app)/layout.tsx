import { TooltipProvider } from "@/components/ui/tooltip";
import { PriceProvider } from "@/components/providers/price-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StatusBar } from "@/components/layout/status-bar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <PriceProvider>
        {/* Desktop sidebar - fixed position */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="pl-0 lg:pl-20 min-h-screen flex flex-col">
          <Topbar />

          <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
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
  );
}
