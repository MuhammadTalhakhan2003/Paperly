"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function AppHeader({
  user,
}: {
  user: { name: string; email: string };
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--surface) 85%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrandMark />
          <span className="font-semibold tracking-tight">Paperly</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium leading-tight">{user.name}</div>
            <div className="text-xs text-[var(--muted)]">{user.email}</div>
          </div>
          <span
            title={user.name}
            className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold badge-accent"
          >
            {initials}
          </span>
          <ThemeToggle />
          <button
            onClick={logout}
            disabled={loggingOut}
            className="btn btn-secondary"
          >
            {loggingOut ? "…" : "Log out"}
          </button>
        </div>
      </div>
    </header>
  );
}

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-xl font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.52,
        fontFamily: "Georgia, 'Times New Roman', serif",
        background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
      }}
    >
      P
    </span>
  );
}
