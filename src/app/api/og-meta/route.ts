import { NextRequest, NextResponse } from "next/server";

function extractMeta(html: string): { title?: string; imageUrl?: string } {
  const result: { title?: string; imageUrl?: string } = {};

  // og:image
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogImage) result.imageUrl = ogImage[1];

  // twitter:image fallback
  if (!result.imageUrl) {
    const twitterImage = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twitterImage) result.imageUrl = twitterImage[1];
  }

  // og:title
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitle) result.title = ogTitle[1];

  // <title> fallback
  if (!result.title) {
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleTag) result.title = titleTag[1].trim();
  }

  return result;
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  // Проверяем что это валидный http(s) URL
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.href, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; stufftxt-bot/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "fetch failed" }, { status: 502 });
    }

    // Читаем только первые 50KB — мета теги всегда в <head>
    const reader = res.body?.getReader();
    if (!reader) return NextResponse.json({});

    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 50000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      // Останавливаемся как только увидели </head>
      if (html.includes("</head>")) break;
    }
    reader.cancel();

    const meta = extractMeta(html);
    return NextResponse.json(meta);
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
