import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BackofficeNav } from "@/components/backoffice/backoffice-nav";

// Standalone admin shell — intentionally outside the (app) group so it
// carries none of the trading providers (Price/BotEngine) or the Sidebar.
// Styled as an iOS liquid-glass workspace via the `ios-glass` scope in
// globals.css (opt-out of the global zero-radius rule).
export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/backoffice");

  // Role lives in the DB, not the JWT — always check fresh.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, disabled: true },
  });
  if (!user || user.disabled || user.role !== "ADMIN") redirect("/");

  return (
    <div className="ios-glass min-h-screen bg-background flex flex-col">
      <div className="ig-ambient" aria-hidden />

      {/* Floating glass header */}
      <header className="sticky top-3 z-40 px-3 sm:px-4 lg:px-6 pt-3">
        <div className="ig-panel max-w-[1400px] mx-auto px-4 lg:px-5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="ig-tile w-9 h-9 bg-cyan flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-sm font-black font-heading uppercase tracking-tighter text-on-surface">
                Kinetic <span className="text-cyan">{"//"}</span> Backoffice
              </span>
              <p className="text-[10px] text-on-surface-variant tracking-wider">
                Admin console
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="ig-pill ig-inset flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-on-surface px-3.5 py-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to terminal
          </Link>
        </div>
      </header>

      {/* Section nav */}
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 pt-4">
        <BackofficeNav />
      </div>

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-3 sm:p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}
