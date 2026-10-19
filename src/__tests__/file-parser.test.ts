import { describe, it, expect } from "vitest";
import {
  parseMarkdown,
  parsePlainText,
  parseFileContent,
  formatInlineMarkdown,
  countWords,
  extractPlainText,
} from "../lib/file-parser";

describe("File Parser & Markdown Engine", () => {
  it("should extract word count accurately", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
    expect(countWords("Hello world this is a test")).toBe(6);
  });

  it("should parse inline markdown formatting correctly", () => {
    expect(formatInlineMarkdown("**bold text**")).toContain("<strong>bold text</strong>");
    expect(formatInlineMarkdown("*italic text*")).toContain("<em>italic text</em>");
    expect(formatInlineMarkdown("`code snippet`")).toContain("<code>code snippet</code>");
    expect(formatInlineMarkdown("~~strikethrough~~")).toContain("<s>strikethrough</s>");
  });

  it("should parse multi-level markdown headings and detect title", () => {
    const md = `# Engineering Architecture Specs\n\n## Section 1: Overview\n\n### Detailed Specs`;
    const parsed = parseMarkdown(md, "Default Title");

    expect(parsed.title).toBe("Engineering Architecture Specs");
    expect(parsed.content).toContain("<h1>Engineering Architecture Specs</h1>");
    expect(parsed.content).toContain("<h2>Section 1: Overview</h2>");
    expect(parsed.content).toContain("<h3>Detailed Specs</h3>");
  });

  it("should parse bulleted and numbered lists", () => {
    const md = `
# List Demo
- First bullet item
- Second bullet item

1. First numbered step
2. Second numbered step
    `;
    const parsed = parseMarkdown(md, "List Demo");

    expect(parsed.content).toContain("<ul>");
    expect(parsed.content).toContain("<li><p>First bullet item</p></li>");
    expect(parsed.content).toContain("<ol>");
    expect(parsed.content).toContain("<li><p>First numbered step</p></li>");
  });

  it("should parse plain text into structured paragraphs", () => {
    const txt = `My Simple Note\nLine 1 of content\n\nLine 2 of content`;
    const parsed = parsePlainText(txt, "Note Title");

    expect(parsed.title).toBe("My Simple Note");
    expect(parsed.content).toContain("<p>My Simple Note</p>");
    expect(parsed.content).toContain("<p>Line 1 of content</p>");
  });

  it("should route file by extension via parseFileContent", () => {
    const mdFile = parseFileContent("# Title from MD\nContent", "spec.md");
    expect(mdFile.content).toContain("<h1>Title from MD</h1>");

    const txtFile = parseFileContent("Plain note line", "note.txt");
    expect(txtFile.content).toContain("<p>Plain note line</p>");
  });
});
