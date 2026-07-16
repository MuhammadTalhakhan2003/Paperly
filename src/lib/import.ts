import { marked } from "marked";
import mammoth from "mammoth";
import { sanitizeRichText } from "@/lib/sanitize";

// Supported upload types. Surfaced in the UI and README so the limits are clear.
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown", ".docx"] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Plain text → paragraphs, preserving blank lines. Output is HTML-safe. */
export function textToHtml(text: string): string {
  const html = text
    .split(/\r?\n/)
    .map((line) => `<p>${line.trim() ? escapeHtml(line) : "<br>"}</p>`)
    .join("");
  return sanitizeRichText(html);
}

/** Markdown → sanitized rich-text HTML. */
export function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string;
  return sanitizeRichText(html);
}

/** DOCX (as a Buffer) → sanitized rich-text HTML via mammoth. */
export async function docxToHtml(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.convertToHtml({ buffer });
  return sanitizeRichText(value);
}

/** Derives a friendly document title from an uploaded file name. */
export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^./\\]+$/, "").replace(/[_-]+/g, " ").trim();
  return base.length > 0 ? base.slice(0, 200) : "Imported document";
}

export function extensionOf(filename: string): string {
  const match = /\.[^./\\]+$/.exec(filename.toLowerCase());
  return match ? match[0] : "";
}

export function isSupportedExtension(filename: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(extensionOf(filename));
}

export type ImportedDocument = { title: string; content: string };

/**
 * Converts an uploaded file into a ready-to-persist document. Throws a plain
 * Error with a user-friendly message on unsupported input.
 */
export async function fileToDocument(
  filename: string,
  buffer: Buffer
): Promise<ImportedDocument> {
  const ext = extensionOf(filename);
  const title = titleFromFilename(filename);

  switch (ext) {
    case ".txt":
      return { title, content: textToHtml(buffer.toString("utf-8")) };
    case ".md":
    case ".markdown":
      return { title, content: markdownToHtml(buffer.toString("utf-8")) };
    case ".docx":
      return { title, content: await docxToHtml(buffer) };
    default:
      throw new Error(
        `Unsupported file type "${ext || filename}". Allowed: ${SUPPORTED_EXTENSIONS.join(", ")}.`
      );
  }
}
