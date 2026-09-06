import { TooltipProvider } from "@/components/ui/tooltip";
import { PriceProvider } from "@/components/providers/price-provider";
import { BotEngineProvider } from "@/components/providers/bot-engine-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StatusBar } from "@/components/layout/status-bar";
import { ThemeToolbar } from "@/components/theme/theme-toolbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <PriceProvider>
        {/* Bot engine runs across the whole authenticated app so bots
            keep evaluating signals even when the user is on /bots,
            /signals, etc. — not just /dashboard. */}
        <BotEngineProvider>
          {/* Desktop sidebar - fixed position */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          <a href="#main-content" className="kx-skip-link">Skip to content</a>
          <div className="pl-0 lg:pl-52 min-h-screen flex flex-col">
            <Topbar />

            <main id="main-content" className="kx-workspace min-w-0 flex-1 p-4 sm:p-5 lg:p-7 pb-24 lg:pb-7">
              {children}
            </main>

            {/* Desktop status bar */}
            <div className="hidden lg:block shrink-0">
              <StatusBar />
            </div>

            {/* Mobile bottom nav */}
            <MobileNav />
          </div>

          {/* Floating theme customizer — live across the whole app */}
          <ThemeToolbar />
        </BotEngineProvider>
      </PriceProvider>
    </TooltipProvider>
  );
}
