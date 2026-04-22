import Link from "next/link";
import { Home, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0e0e0f]">
      <div className="max-w-md w-full flex flex-col items-center text-center gap-6">
        <div className="w-14 h-14 bg-primary flex items-center justify-center">
          <Zap className="w-7 h-7 text-[#004343]" />
        </div>

        <div>
          <h1 className="text-5xl font-black font-heading tracking-tighter uppercase text-on-surface">
            404
          </h1>
          <p className="text-xs text-on-surface-variant tracking-widest uppercase mt-2">
            Route Not Found
          </p>
        </div>

        <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm">
          The page you're looking for doesn't exist, or it may have moved.
        </p>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 bg-primary text-[#004343] font-heading font-bold text-sm uppercase tracking-wider px-6 py-3 hover:opacity-90 transition-opacity"
        >
          <Home className="w-4 h-4" />
          Return Home
        </Link>

        <span className="text-[10px] text-on-surface-variant/30 font-mono tracking-wider">
          KINETIC v0.1.1
        </span>
      </div>
    </div>
  );
}
