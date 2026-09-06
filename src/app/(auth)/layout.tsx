import Link from "next/link";
import { ArrowUpRight, CandlestickChart, ShieldCheck, Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="kx-auth min-h-svh">
      <header className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Kinetic home"><span className="flex size-8 items-center justify-center rounded-lg bg-cyan text-primary-foreground"><Zap size={19} fill="currentColor" /></span><span className="text-xl font-bold tracking-[-0.06em]">kinetic<span className="text-cyan">.</span></span></Link>
        <span className="text-[10px] tracking-[0.12em] text-on-surface-variant">TRADING WORKSPACE</span>
      </header>
      <div className="mx-auto grid min-h-[calc(100svh-81px)] max-w-[1500px] lg:grid-cols-2">
        <section className="kx-auth-story relative hidden flex-col justify-between overflow-hidden border-r border-border p-12 xl:p-20 lg:flex">
          <div className="relative z-10 kx-enter">
            <p className="kx-eyebrow mb-8 flex items-center gap-2"><span className="size-1.5 rounded-full bg-cyan" />THE KINETIC TERMINAL</p>
            <h2 className="max-w-lg text-5xl font-medium leading-[1.1] tracking-[-0.055em] xl:text-6xl">A clearer view.<br /><span className="text-cyan">A sharper move.</span></h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-on-surface-variant">Your markets, signals and strategies.<br />One focused workspace.</p>
          </div>
          <div className="kx-market-art relative my-12 h-48" aria-hidden="true">
            {Array.from({ length: 22 }, (_, i) => <span key={i} style={{ left: `${i * 4.5}%`, bottom: `${14 + i * 2.3 + Math.sin(i * 1.4) * 19}%`, height: `${20 + (i * 13) % 46}px`, opacity: 0.25 + i / 30 }} className={i % 4 === 0 ? "kx-candle kx-candle-down" : "kx-candle"} />)}
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-6 border-t border-border pt-7">
            <div><CandlestickChart size={19} className="mb-3 text-cyan" /><h3 className="text-xs font-medium">Built around the market</h3><p className="mt-2 text-xs leading-5 text-on-surface-variant">Live charts and multi-timeframe signals.</p></div>
            <div><ShieldCheck size={19} className="mb-3 text-cyan" /><h3 className="text-xs font-medium">Risk in perspective</h3><p className="mt-2 text-xs leading-5 text-on-surface-variant">Position sizing and portfolio exposure.</p></div>
          </div>
        </section>
        <section className="flex flex-col items-center justify-center px-6 py-12 sm:px-12">
          <div className="kx-auth-form kx-enter w-full max-w-[360px]">{children}</div>
          <Link href="/chart-demo" className="mt-8 flex items-center gap-2 text-xs text-on-surface-variant transition-colors hover:text-cyan">Explore the chart demo<ArrowUpRight size={14} /></Link>
        </section>
      </div>
    </main>
  );
}
