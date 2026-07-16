"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/AppHeader";

type Mode = "login" | "signup";

export default function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignup ? { name, email, password } : { email, password }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function fillDemo() {
    setEmail("alice@paperly.app");
    setPassword("password123");
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <div className="mb-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <BrandMark size={38} />
          <span className="text-xl font-semibold tracking-tight">Paperly</span>
        </div>
        <h1 className="text-lg font-semibold">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {isSignup
            ? "Start creating and sharing documents."
            : "Sign in to your documents."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <Field
            label="Name"
            type="text"
            value={name}
            onChange={setName}
            placeholder="Your name"
            autoComplete="name"
          />
        )}
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={isSignup ? "At least 6 characters" : "Your password"}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />

        {error && (
          <p
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Please wait…" : isSignup ? "Sign up" : "Sign in"}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-[var(--muted)]">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--accent)]">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-[var(--accent)]">
              Create an account
            </Link>
          </>
        )}
      </div>

      {!isSignup && (
        <button
          type="button"
          onClick={fillDemo}
          className="mt-4 w-full rounded-lg border border-dashed px-3 py-2 text-xs text-[var(--muted)] transition hover:bg-[var(--surface-2)]"
          style={{ borderColor: "var(--border)" }}
        >
          Use demo account — alice@paperly.app / password123
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="input"
      />
    </label>
  );
}
