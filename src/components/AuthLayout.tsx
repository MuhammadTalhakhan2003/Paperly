import { BrandMark } from "@/components/AppHeader";
import ThemeToggle from "@/components/ThemeToggle";

// Split-screen auth shell: a branded panel on the left, the form on the right.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1">
      <aside
        className="relative hidden w-1/2 flex-col justify-between p-12 text-white lg:flex"
        style={{
          background:
            "linear-gradient(150deg, var(--accent-hover) 0%, var(--accent) 60%, #0b8f83 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 font-bold" style={{ fontFamily: "Georgia, serif" }}>
            P
          </span>
          <span className="text-lg font-semibold tracking-tight">Paperly</span>
        </div>

        <div>
          <h1 className="max-w-sm text-3xl font-semibold leading-tight">
            Write, organize, and share documents — together.
          </h1>
          <ul className="mt-6 space-y-2 text-white/90">
            <li>✍️ Rich-text editing with autosave</li>
            <li>📥 Import .txt, .md, and .docx files</li>
            <li>⭐ Star &amp; duplicate documents</li>
            <li>🤝 Share as editor or viewer</li>
            <li>📤 Export to Markdown or PDF</li>
          </ul>
        </div>

        <p className="text-sm text-white/70">A lightweight collaborative doc editor.</p>
      </aside>

      <div className="auth-shell relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <span className="lg:hidden">
            <BrandMark size={28} />
          </span>
          <ThemeToggle />
        </div>
        {children}
      </div>
    </main>
  );
}
