"use client";

import { useState } from "react";
import {
  Plug,
  Check,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import {
  useExchangeCredentials,
  type TestConnectionResult,
} from "@/hooks/use-exchange-credentials";
import { useToast } from "@/components/providers/toast-provider";

export function OkxConnection() {
  const { credentials, loading, save, remove, test, setTradeEnabled } =
    useExchangeCredentials();
  const toast = useToast();

  const okx = credentials.find((c) => c.exchange === "okx");

  const [showForm, setShowForm] = useState(false);

  return (
    <section className="bg-surface-container-low p-5 space-y-4 border border-outline-variant/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plug className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            OKX Live Trading
          </h2>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-[10px] font-bold uppercase tracking-wider text-cyan hover:opacity-80 transition-opacity"
          >
            {okx ? "Replace key" : "Connect"}
          </button>
        )}
      </div>

      <p className="text-[10px] text-on-surface-variant leading-relaxed">
        เชื่อมต่อ OKX API key เพื่อให้ bot เทรด Perpetual จริงได้ key ถูก
        encrypt ด้วย AES-256-GCM ก่อนเก็บลง DB และจะไม่ถูกส่งกลับมาให้ client
        อีกเลย — ควรปิดสิทธิ์ <code className="text-cyan">Withdraw</code>
        ที่ฝั่ง OKX
      </p>

      {showForm && (
        <CredentialForm
          replacing={Boolean(okx)}
          onCancel={() => setShowForm(false)}
          onSubmit={async ({ apiKey, secret, passphrase, label, runTest }) => {
            // Optionally pre-test before saving so the user gets quick
            // feedback if the key is wrong.
            if (runTest) {
              try {
                const result = await test({
                  exchange: "okx",
                  apiKey,
                  secret,
                  passphrase,
                });
                showTestResult(result, toast);
              } catch (e) {
                toast.error(
                  "OKX test failed",
                  e instanceof Error ? e.message : "Unknown error"
                );
                return; // don't save bad credentials
              }
            }
            try {
              await save({
                exchange: "okx",
                apiKey,
                secret,
                passphrase,
                label,
              });
              toast.success("OKX credential saved");
              setShowForm(false);
            } catch (e) {
              toast.error(
                "Failed to save",
                e instanceof Error ? e.message : "Unknown error"
              );
            }
          }}
        />
      )}

      {!showForm && (
        <div className="space-y-2">
          {loading && (
            <p className="text-[11px] text-on-surface-variant italic">
              Loading credentials…
            </p>
          )}

          {!loading && !okx && (
            <p className="text-[11px] text-on-surface-variant italic">
              ยังไม่ได้เชื่อมต่อ OKX — กด Connect เพื่อใส่ key
            </p>
          )}

          {okx && (
            <div className="bg-surface-container p-3 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-1 h-8 ${
                    okx.lastTestOk === false
                      ? "bg-crimson"
                      : okx.lastTestOk === true
                      ? "bg-emerald-accent"
                      : "bg-on-surface-variant/30"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">
                      OKX
                    </span>
                    {okx.label && (
                      <span className="text-[10px] text-on-surface-variant">
                        ({okx.label})
                      </span>
                    )}
                    {okx.lastTestOk === true && (
                      <Check className="w-3 h-3 text-emerald-accent" />
                    )}
                    {okx.lastTestOk === false && (
                      <AlertTriangle className="w-3 h-3 text-crimson" />
                    )}
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-mono tabular-nums">
                    Key: {okx.apiKeyHint || "—"}
                  </p>
                  {okx.lastTestedAt && (
                    <p className="text-[10px] text-on-surface-variant">
                      Last tested:{" "}
                      {new Date(okx.lastTestedAt).toLocaleString()}{" "}
                      {okx.lastTestOk === false && okx.lastTestError && (
                        <span className="text-crimson">
                          — {okx.lastTestError}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TestButton
                  onClick={async () => {
                    try {
                      const result = await test({ exchange: "okx" });
                      showTestResult(result, toast);
                    } catch (e) {
                      toast.error(
                        "OKX test failed",
                        e instanceof Error ? e.message : "Unknown error"
                      );
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    if (
                      !confirm(
                        "Remove OKX credentials? Any live bots will fall back to paper mode."
                      )
                    )
                      return;
                    try {
                      await remove("okx");
                      toast.success("OKX credential removed");
                    } catch (e) {
                      toast.error(
                        "Failed to remove",
                        e instanceof Error ? e.message : "Unknown error"
                      );
                    }
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-crimson transition-colors px-2 py-1"
                >
                  <Trash2 size={11} />
                  Remove
                </button>
              </div>

              {/* Trade lock toggle — the explicit opt-in gate. Live
                  orders (manual or bot) are rejected server-side
                  unless this is ENABLED. */}
              <div className="pt-2 border-t border-outline-variant/10 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle
                      className={`w-3 h-3 shrink-0 ${
                        okx.tradeEnabled ? "text-emerald-accent" : "text-orange"
                      }`}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
                      Trade lock:{" "}
                      <span
                        className={
                          okx.tradeEnabled
                            ? "text-emerald-accent"
                            : "text-orange"
                        }
                      >
                        {okx.tradeEnabled ? "ENABLED" : "DISABLED"}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      const next = !okx.tradeEnabled;
                      if (
                        next &&
                        !confirm(
                          "Enable LIVE trading on OKX? Manual trades and bots set to Live mode will place REAL orders with REAL funds."
                        )
                      )
                        return;
                      try {
                        await setTradeEnabled("okx", next);
                        toast.success(
                          next ? "Live trading ENABLED" : "Live trading disabled"
                        );
                      } catch (e) {
                        toast.error(
                          "Failed to update trade lock",
                          e instanceof Error ? e.message : "Unknown error"
                        );
                      }
                    }}
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-colors ${
                      okx.tradeEnabled
                        ? "bg-crimson/15 text-crimson hover:bg-crimson/25"
                        : "bg-emerald-accent/15 text-emerald-accent hover:bg-emerald-accent/25"
                    }`}
                  >
                    {okx.tradeEnabled ? "Disable" : "Enable live"}
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  เมื่อ ENABLED การเทรด Live (manual หรือ bot) จะส่ง order
                  จริงเข้า OKX ด้วยเงินจริง — ปิดไว้เมื่อไม่ใช้
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function CredentialForm({
  replacing,
  onSubmit,
  onCancel,
}: {
  replacing: boolean;
  onSubmit: (input: {
    apiKey: string;
    secret: string;
    passphrase: string;
    label: string;
    runTest: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [label, setLabel] = useState("");
  const [showSecrets, setShowSecrets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(runTest: boolean) {
    setError(null);
    if (!apiKey.trim() || !secret.trim() || !passphrase.trim()) {
      setError("API Key, Secret และ Passphrase ต้องกรอกครบ");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        apiKey: apiKey.trim(),
        secret: secret.trim(),
        passphrase: passphrase.trim(),
        label: label.trim(),
        runTest,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  const inputType = showSecrets ? "text" : "password";

  return (
    <div className="bg-surface-container p-3 space-y-3">
      {replacing && (
        <p className="text-[10px] text-orange leading-relaxed">
          การบันทึกใหม่จะ overwrite key เดิม และ trade lock จะถูก reset เป็น
          DISABLED — ต้องเปิดใหม่ในหน้า bot
        </p>
      )}

      <Field label="API Key">
        <input
          type={inputType}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="OKX-API-KEY-…"
          className="w-full bg-surface-container-high text-xs text-on-surface px-2 py-1.5 outline-none focus:ring-1 focus:ring-cyan font-mono"
          autoComplete="off"
        />
      </Field>

      <Field label="Secret">
        <input
          type={inputType}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full bg-surface-container-high text-xs text-on-surface px-2 py-1.5 outline-none focus:ring-1 focus:ring-cyan font-mono"
          autoComplete="off"
        />
      </Field>

      <Field label="Passphrase">
        <input
          type={inputType}
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="w-full bg-surface-container-high text-xs text-on-surface px-2 py-1.5 outline-none focus:ring-1 focus:ring-cyan font-mono"
          autoComplete="off"
        />
      </Field>

      <Field label="Label (optional)">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Main account"
          className="w-full bg-surface-container-high text-xs text-on-surface px-2 py-1.5 outline-none focus:ring-1 focus:ring-cyan"
          maxLength={60}
        />
      </Field>

      <button
        type="button"
        onClick={() => setShowSecrets((v) => !v)}
        className="flex items-center gap-1 text-[10px] text-on-surface-variant hover:text-on-surface transition-colors"
      >
        {showSecrets ? <EyeOff size={11} /> : <Eye size={11} />}
        {showSecrets ? "Hide values" : "Show values"}
      </button>

      {error && <p className="text-[10px] text-crimson font-mono">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => handle(true)}
          disabled={submitting}
          className="bg-cyan text-primary-foreground font-bold text-[10px] uppercase tracking-wider px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
        >
          {submitting && <Loader2 size={11} className="animate-spin" />}
          Test &amp; Save
        </button>
        <button
          type="button"
          onClick={() => handle(false)}
          disabled={submitting}
          className="bg-surface-container-high text-on-surface font-bold text-[10px] uppercase tracking-wider px-3 py-2 hover:bg-surface-container-highest transition-colors disabled:opacity-50"
        >
          Save without test
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="text-on-surface-variant hover:text-on-surface text-[10px] font-bold uppercase tracking-wider px-3 py-2 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function TestButton({ onClick }: { onClick: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan hover:opacity-80 transition-opacity px-2 py-1 disabled:opacity-50"
    >
      {busy && <Loader2 size={11} className="animate-spin" />}
      Test connection
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  );
}

function showTestResult(
  result: TestConnectionResult,
  toast: ReturnType<typeof useToast>
) {
  const desc = `UID ${result.uid} • Equity ${result.totalEqUsdt.toFixed(
    2
  )} USDT • Perms: ${result.perms.join(", ") || "(none)"}`;

  if (result.warnings.length > 0) {
    toast.warning("Connected with warnings", `${desc} — ${result.warnings.join("; ")}`);
  } else {
    toast.success("OKX connection OK", desc);
  }
}
