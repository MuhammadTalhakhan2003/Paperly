import TurndownService from "turndown";

/** Converts document HTML to Markdown (client-side). */
export function htmlToMarkdown(html: string): string {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  return td.turndown(html || "");
}

/** Makes a filename safe across operating systems. */
export function safeFilename(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]+/g, "").trim();
  return cleaned || "document";
}

/** Triggers a browser download of a text file. */
export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Opens a print-ready window so the user can "Save as PDF". */
export function printDocument(title: string, html: string) {
  const win = window.open("", "_blank", "width=820,height=1000");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, system-ui, Arial, sans-serif; color:#1f2328;
         max-width: 720px; margin: 40px auto; padding: 0 24px; line-height: 1.7; }
  h1 { font-size: 1.9rem; margin: 1.2rem 0 .6rem; }
  h2 { font-size: 1.5rem; margin: 1.1rem 0 .5rem; }
  h3 { font-size: 1.2rem; margin: 1rem 0 .4rem; }
  ul, ol { padding-left: 1.6rem; }
  blockquote { border-left: 3px solid #ddd; padding-left: 1rem; color: #666; }
  pre { background:#0f172a; color:#e2e8f0; padding:1rem; border-radius:8px; overflow:auto; }
  code { background:#f0f1f3; padding:.1rem .3rem; border-radius:4px; }
  pre code { background: transparent; padding: 0; }
</style></head>
<body><h1 style="border:0">${escapeHtml(title)}</h1>${html}</body></html>`);
  win.document.close();
  win.focus();
  // Give the new window a tick to render before invoking print.
  setTimeout(() => win.print(), 250);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
