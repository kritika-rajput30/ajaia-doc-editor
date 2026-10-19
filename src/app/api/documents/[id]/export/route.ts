import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId, getDocumentAccess } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getCurrentUserId(request);
    const access = getDocumentAccess(id, userId);

    if (!access.document || !access.permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const doc = access.document;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "md";

    const cleanTitle = doc.title.replace(/[^a-zA-Z0-9_-]/g, "_");

    if (format === "txt") {
      return new NextResponse(doc.plain_text || "", {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${cleanTitle}.txt"`,
        },
      });
    }

    if (format === "html") {
      const styledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escape(doc.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; }
    h1 { font-size: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; margin-top: 1.5rem; }
    h3 { font-size: 1.25rem; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; margin-left: 0; color: #475569; font-style: italic; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
  ${doc.content}
</body>
</html>`;
      return new NextResponse(styledHtml, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${cleanTitle}.html"`,
        },
      });
    }

    // Default to markdown
    // Convert HTML to simple markdown
    let md = doc.content
      .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i>(.*?)<\/i>/gi, "*$1*")
      .replace(/<code>(.*?)<\/code>/gi, "`$1`")
      .replace(/<blockquote><p>(.*?)<\/p><\/blockquote>/gi, "> $1\n\n")
      .replace(/<li><p>(.*?)<\/p><\/li>/gi, "- $1\n")
      .replace(/<li>(.*?)<\/li>/gi, "- $1\n")
      .replace(/<\/?(ul|ol)>/gi, "\n")
      .replace(/<p><br\/?><\/p>/gi, "\n")
      .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${cleanTitle}.md"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function escape(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
