import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODE_PROMPTS: Record<string, string> = {
  standard:
    "Rewrite in a natural, conversational tone that sounds like a real human wrote it. Vary sentence length, use contractions where natural, and avoid robotic phrasing.",
  advanced:
    "Aggressively humanize the text: heavily vary sentence rhythm, introduce idiomatic phrasing, occasional rhetorical questions, and subtle personal voice. Remove every AI tell (no 'in conclusion', 'it is important to note', 'delve', 'tapestry', 'navigate', 'realm', overly balanced bullet structures).",
  academic:
    "Rewrite in a formal academic register suitable for essays and research. Use precise vocabulary, hedged claims, varied transitions, and complex but readable sentence structure. No first-person fluff. No AI clichés.",
  professional:
    "Rewrite in a polished business / professional tone — clear, confident, and concise. Sound like an experienced human professional, not a chatbot. Avoid filler and corporate buzzwords.",
  seo:
    "Rewrite for SEO while sounding human: keep keywords naturally, use short scannable sentences, mix paragraph lengths, add subtle transitions, and avoid AI patterns. Preserve all factual content.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, mode } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Please provide at least 20 characters of text." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service is not configured");

    const trimmed = text.slice(0, 30000);
    const styleInstruction = MODE_PROMPTS[mode as string] || MODE_PROMPTS.standard;

    const system = `You are an expert human writer and editor. Your job is to take AI-generated text and rewrite it so it reads as if a thoughtful human wrote it from scratch.

Rules:
- Preserve the original meaning, facts, and intent exactly.
- Maintain perfect grammar and spelling.
- Vary sentence structure and length naturally.
- Remove repetitive AI patterns, hedge words, and overused phrases.
- Do NOT add new facts, opinions, or disclaimers.
- Do NOT explain what you changed. Output ONLY the rewritten text.

Style for this rewrite: ${styleInstruction}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Humanize the following text and return only the rewritten version:\n\n${trimmed}` },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage is temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI humanizer is temporarily unavailable. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const output = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ output }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-humanize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
