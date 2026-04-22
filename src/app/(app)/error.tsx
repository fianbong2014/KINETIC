"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-surface-container-low border-l-2 border-crimson p-6 flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-crimson shrink-0" />
        <h2 className="text-base font-black font-heading tracking-tighter uppercase text-on-surface">
          Panel Failed to Load
        </h2>
      </div>

      <p className="text-sm text-on-surface-variant leading-relaxed">
        A component on this page encountered an error. The rest of the
        application is still running — you can retry or navigate away.
      </p>

      {error.digest && (
        <p className="text-[10px] font-mono text-on-surface-variant/60 break-all">
          Digest: {error.digest}
        </p>
      )}

      <button
        onClick={reset}
        className="self-start flex items-center gap-2 bg-primary text-[#004343] font-heading font-bold text-xs uppercase tracking-wider px-4 py-2 hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    </div>
  );
}
