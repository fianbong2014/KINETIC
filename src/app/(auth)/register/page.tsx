"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();

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
        toast.success("Welcome to KINETIC", "Paper account funded with $10,000");
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
      <div className="flex w-full flex-col items-start mb-8">
        <h1 className="text-3xl font-medium tracking-[-0.04em] text-on-surface">
          Get started.
        </h1>
        <p className="text-sm text-on-surface-variant mt-3">
          Create your Kinetic account.
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
          <label htmlFor="register-name" className="text-xs text-on-surface-variant font-medium">Name</label>
          <input
            type="text"
            id="register-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-surface-container-lowest border border-border px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            placeholder="Trader"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-email" className="text-xs text-on-surface-variant font-medium">Email</label>
          <input
            type="email"
            id="register-email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-surface-container-lowest border border-border px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            placeholder="trader@kinetic.io"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-password" className="text-xs text-on-surface-variant font-medium">Password</label>
          <input
            type="password"
            id="register-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-surface-container-lowest border border-border px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
            placeholder="••••••••"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-confirmPassword" className="text-xs text-on-surface-variant font-medium">Confirm Password</label>
          <input
            type="password"
            id="register-confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
