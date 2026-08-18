const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["http:", "https:"].includes(target.protocol)) {
      return new Response(JSON.stringify({ error: "Only http(s) URLs allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Block requests to private / loopback / link-local networks (SSRF guard).
    const host = target.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    const isBlockedHost =
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".internal") ||
      host.endsWith(".local") ||
      host === "::1" ||
      host === "0.0.0.0" ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^fc[0-9a-f]{2}:/.test(host) ||
      /^fd[0-9a-f]{2}:/.test(host) ||
      /^fe80:/.test(host);
    if (isBlockedHost) {
      return new Response(JSON.stringify({ error: "This URL points to a private network and can't be fetched." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MasterPdfTools/1.0; +https://pdftoolsmaster.lovable.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Upstream ${res.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MAX_BYTES = 5 * 1024 * 1024;
    const declared = Number(res.headers.get("content-length") || 0);
    if (declared > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "That page is too large to convert (over 5MB)." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const raw = new Uint8Array(await res.arrayBuffer());
    if (raw.byteLength > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "That page is too large to convert (over 5MB)." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let html = new TextDecoder("utf-8").decode(raw);
    const base = `${target.protocol}//${target.host}${target.pathname.replace(/[^/]*$/, "")}`;
    // Inject <base> so relative assets resolve
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
    } else {
      html = `<base href="${base}">` + html;
    }
    return new Response(JSON.stringify({ html, finalUrl: res.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
