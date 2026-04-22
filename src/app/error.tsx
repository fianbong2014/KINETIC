"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to console so the actual trace is debuggable in dev
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0e0e0f]">
      <div className="max-w-md w-full bg-surface-container-low border-l-2 border-crimson p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-crimson shrink-0" />
          <h1 className="text-lg font-black font-heading tracking-tighter uppercase text-on-surface">
            System Error
          </h1>
        </div>

        <p className="text-sm text-on-surface-variant leading-relaxed">
          Something broke while rendering this view. The error has been logged.
        </p>

        {error.digest && (
          <p className="text-[10px] font-mono text-on-surface-variant/60 break-all">
            Digest: {error.digest}
          </p>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-[#004343] font-heading font-bold text-xs uppercase tracking-wider py-3 hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-wider py-3 hover:bg-surface-container-high transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
