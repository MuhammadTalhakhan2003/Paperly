import { describe, it, expect } from "vitest";
import {
  textToHtml,
  markdownToHtml,
  titleFromFilename,
  extensionOf,
  isSupportedExtension,
} from "@/lib/import";

describe("textToHtml", () => {
  it("wraps each line in a paragraph", () => {
    expect(textToHtml("hello\nworld")).toBe("<p>hello</p><p>world</p>");
  });

  it("escapes HTML so uploads cannot inject markup (stored XSS)", () => {
    const html = textToHtml("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("preserves blank lines as breaks", () => {
    expect(textToHtml("a\n\nb")).toContain("<br");
  });
});

describe("markdownToHtml", () => {
  it("converts headings and bold", () => {
    expect(markdownToHtml("# Title")).toContain("<h1>Title</h1>");
    expect(markdownToHtml("**bold**")).toContain("<strong>bold</strong>");
  });

  it("converts list items", () => {
    expect(markdownToHtml("- a\n- b")).toContain("<li>");
  });

  it("sanitizes dangerous inline HTML in markdown", () => {
    expect(markdownToHtml("<script>alert(1)</script>")).not.toContain("<script");
  });
});

describe("filename helpers", () => {
  it("derives a readable title from a filename", () => {
    expect(titleFromFilename("My_Report.docx")).toBe("My Report");
    expect(titleFromFilename("notes.txt")).toBe("notes");
    expect(titleFromFilename("weekly-standup.md")).toBe("weekly standup");
  });

  it("normalizes extensions case-insensitively", () => {
    expect(extensionOf("A.DOCX")).toBe(".docx");
    expect(extensionOf("noext")).toBe("");
  });

  it("recognizes supported extensions", () => {
    expect(isSupportedExtension("a.md")).toBe(true);
    expect(isSupportedExtension("a.txt")).toBe(true);
    expect(isSupportedExtension("a.docx")).toBe(true);
    expect(isSupportedExtension("a.pdf")).toBe(false);
    expect(isSupportedExtension("a.exe")).toBe(false);
  });
});
