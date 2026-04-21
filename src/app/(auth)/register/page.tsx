"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please login manually.");
      } else {
        router.push("/dashboard");
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
          Create Account
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
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/10 px-4 py-3 text-sm text-on-surface font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
            placeholder="Trader"
          />
        </div>

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

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          <UserPlus className="w-4 h-4" />
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      {/* Login link */}
      <p className="text-sm text-on-surface-variant mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary hover:underline font-semibold"
        >
          Sign In
        </Link>
      </p>

      {/* Version */}
      <span className="text-[10px] text-on-surface-variant/30 font-mono mt-8 tracking-wider">
        KINETIC v0.1.1
      </span>
    </div>
  );
}
