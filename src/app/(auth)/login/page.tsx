"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, LogIn } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-primary flex items-center justify-center mb-3">
          <Zap className="w-6 h-6 text-[#004343]" />
        </div>
        <h1 className="text-2xl font-black font-heading tracking-tighter uppercase text-on-surface">
          Kinetic
        </h1>
        <p className="text-xs text-on-surface-variant tracking-widest uppercase mt-1">
          Sign in to Terminal
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 text-sm text-crimson-accent">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-surface-container-lowest border border-outline-variant/10 px-4 py-3 text-sm text-on-surface font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
            placeholder="trader@kinetic.io"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-surface-container-lowest border border-outline-variant/10 px-4 py-3 text-sm text-on-surface font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-[#004343] font-heading font-bold text-sm uppercase tracking-wider py-3 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
        >
          <LogIn className="w-4 h-4" />
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Register link */}
      <p className="text-sm text-on-surface-variant mt-6">
        No account?{" "}
        <Link
          href="/register"
          className="text-primary hover:underline font-semibold"
        >
          Register
        </Link>
      </p>

      {/* Version */}
      <span className="text-[10px] text-on-surface-variant/30 font-mono mt-8 tracking-wider">
        KINETIC v0.1.1
      </span>
    </div>
  );
}
