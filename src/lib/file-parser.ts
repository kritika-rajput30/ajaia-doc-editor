/**
 * Parser for importing files (.md, .txt, .json) into TipTap-compatible HTML and plain-text.
 */

export interface ParsedDocument {
  title: string;
  content: string; // HTML format for TipTap
  plainText: string;
  wordCount: number;
}

export function parseFileContent(
  rawContent: string,
  filename: string
): ParsedDocument {
  const extension = filename.split(".").pop()?.toLowerCase() || "txt";
  const baseName = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  const fallbackTitle = baseName.charAt(0).toUpperCase() + baseName.slice(1);

  if (extension === "md" || extension === "markdown") {
    return parseMarkdown(rawContent, fallbackTitle);
  }

  if (extension === "json") {
    try {
      const parsed = JSON.parse(rawContent);
      if (parsed.content) {
        return {
          title: parsed.title || fallbackTitle,
          content: parsed.content,
          plainText: extractPlainText(parsed.content),
          wordCount: countWords(extractPlainText(parsed.content)),
        };
      }
    } catch {
      // Fallback to text parsing if invalid json
    }
  }

  // Default to plain text
  return parsePlainText(rawContent, fallbackTitle);
}

export function parsePlainText(text: string, defaultTitle: string): ParsedDocument {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const nonBlankLines = lines.filter(Boolean);

  let title = defaultTitle;
  if (nonBlankLines.length > 0 && nonBlankLines[0].length < 80) {
    title = nonBlankLines[0];
  }

  const htmlParagraphs = lines
    .map((line) => {
      if (!line) return "<p><br></p>";
      const escaped = escapeHtml(line);
      return `<p>${escaped}</p>`;
    })
    .join("");

  return {
    title,
    content: htmlParagraphs || "<p></p>",
    plainText: text,
    wordCount: countWords(text),
  };
}

export function parseMarkdown(markdown: string, defaultTitle: string): ParsedDocument {
  const lines = markdown.split(/\r?\n/);
  let detectedTitle = defaultTitle;
  let titleFound = false;

  const htmlChunks: string[] = [];
  let inBulletList = false;
  let inNumberedList = false;
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code fence
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        htmlChunks.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer = [];
      } else {
        closeLists();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Empty lines
    if (!trimmed) {
      closeLists();
      continue;
    }

    // Headings
    if (trimmed.startsWith("#")) {
      closeLists();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = Math.min(match[1].length, 3);
        const headingText = formatInlineMarkdown(match[2]);
        if (!titleFound && level === 1) {
          detectedTitle = match[2].trim();
          titleFound = true;
        }
        htmlChunks.push(`<h${level}>${headingText}</h${level}>`);
        continue;
      }
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      closeLists();
      const quoteText = formatInlineMarkdown(trimmed.replace(/^>\s?/, ""));
      htmlChunks.push(`<blockquote><p>${quoteText}</p></blockquote>`);
      continue;
    }

    // Bullet lists (- or * or +)
    if (/^[-*+]\s+/.test(trimmed)) {
      if (inNumberedList) {
        htmlChunks.push("</ol>");
        inNumberedList = false;
      }
      if (!inBulletList) {
        htmlChunks.push("<ul>");
        inBulletList = true;
      }
      const itemText = formatInlineMarkdown(trimmed.replace(/^[-*+]\s+/, ""));
      htmlChunks.push(`<li><p>${itemText}</p></li>`);
      continue;
    }

    // Numbered lists (1. 2. etc.)
    if (/^\d+\.\s+/.test(trimmed)) {
      if (inBulletList) {
        htmlChunks.push("</ul>");
        inBulletList = false;
      }
      if (!inNumberedList) {
        htmlChunks.push("<ol>");
        inNumberedList = true;
      }
      const itemText = formatInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ""));
      htmlChunks.push(`<li><p>${itemText}</p></li>`);
      continue;
    }

    // Normal paragraph
    closeLists();
    htmlChunks.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
  }

  closeLists();

  if (inCodeBlock && codeBuffer.length > 0) {
    htmlChunks.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
  }

  function closeLists() {
    if (inBulletList) {
      htmlChunks.push("</ul>");
      inBulletList = false;
    }
    if (inNumberedList) {
      htmlChunks.push("</ol>");
      inNumberedList = false;
    }
  }

  const content = htmlChunks.join("") || "<p></p>";
  const plainText = extractPlainText(content);

  return {
    title: detectedTitle,
    content,
    plainText,
    wordCount: countWords(plainText),
  };
}

export function formatInlineMarkdown(text: string): string {
  let res = escapeHtml(text);
  // Bold & Italic: ***text*** or ___text___
  res = res.replace(/(\*\*\*|___)(.*?)\1/g, "<strong><em>$2</em></strong>");
  // Bold: **text** or __text__
  res = res.replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>");
  // Italic: *text* or _text_
  res = res.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");
  // Inline code: `text`
  res = res.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Strikethrough: ~~text~~
  res = res.replace(/~~(.*?)~~/g, "<s>$1</s>");
  return res;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function extractPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  if (!text || text.trim() === "") return 0;
  return text.trim().split(/\s+/).length;
}
