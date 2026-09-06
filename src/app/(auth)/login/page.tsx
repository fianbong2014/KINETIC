"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";

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
      <div className="flex w-full flex-col items-start mb-8">
        <h1 className="text-3xl font-medium tracking-[-0.04em] text-on-surface">
          Welcome back.
        </h1>
        <p className="text-sm text-on-surface-variant mt-3">
          Sign in to your trading workspace.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {error && (
          <div role="alert" className="bg-destructive/10 border border-destructive/20 p-3 text-sm text-crimson">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-xs text-on-surface-variant font-medium">Email</label>
          <input
            type="email"
            id="login-email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-surface-container-lowest border border-border px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            placeholder="trader@kinetic.io"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className="text-xs text-on-surface-variant font-medium">Password</label>
          <input
            type="password"
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-surface-container-lowest border border-border px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground font-heading font-bold text-sm uppercase tracking-wider py-3 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
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
