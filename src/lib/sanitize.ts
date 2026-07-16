import sanitizeHtml from "sanitize-html";

// Allowlist tuned to what the TipTap editor and our importers can produce.
// Everything stored or rendered as HTML passes through here, which prevents
// stored XSS from both pasted editor content and uploaded files.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "h1",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "ul",
    "ol",
    "li",
    "code",
    "pre",
    "hr",
    "a",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    // Ensure external links can never be used for tab-nabbing.
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer nofollow",
      target: "_blank",
    }),
  },
};

export function sanitizeRichText(dirty: string): string {
  return sanitizeHtml(dirty, OPTIONS);
}
