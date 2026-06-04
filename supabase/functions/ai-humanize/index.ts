import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODE_STYLE: Record<string, string> = {
  light:
    "Gentle polish only. Keep the original wording and structure mostly intact. Smooth obvious AI tells, vary a handful of sentence openings, and remove the most robotic transitions. Do not rewrite aggressively.",
  standard:
    "Balanced, naturally human tone. Conversational where it fits, polished where it matters. Default register.",
  advanced:
    "Maximum humanization. Heavily vary rhythm and structure. Aggressively remove every AI tell, predictable opener, and formulaic transition. Add subtle voice and natural imperfection.",
  academic:
    "Formal academic register suitable for essays and research. Precise vocabulary, hedged claims, varied transitions, complex but readable sentences. No filler. No AI clichés.",
  professional:
    "Polished business / professional voice — clear, confident, concise. Sounds like an experienced human professional, not a chatbot. No corporate buzzwords.",
  seo:
    "SEO-friendly humanization. Preserve target keywords, keyword density, search intent, and heading hierarchy exactly. Improve readability with varied sentence lengths and natural transitions while keeping ranking signals intact.",
};

const TYPO_INSTRUCTION: Record<string, string> = {
  off: "Do not introduce any typos or grammatical mistakes.",
  light:
    "You may add at most 1–2 very subtle imperfections across the whole text — a casual contraction, a dropped comma, an informal interjection. Nothing that hurts readability.",
  natural:
    "Allow a few natural imperfections sprinkled in: occasional sentence fragments, casual fillers ('you know', 'honestly', 'I mean'), an informal contraction, or a missing Oxford comma. Keep meaning and grammar broadly correct.",
};

const MASTER_SYSTEM = `You are an advanced AI Humanizer and writing enhancement engine.

Your task is NOT to simply paraphrase. Your goal is to transform content so it reads as if it were written naturally by an experienced human, while preserving all original meaning, facts, intent, SEO value, and technical accuracy.

HUMANIZATION TARGET
- Target humanization score: 95–99%.
- Sound naturally human-written, avoid obvious AI patterns, preserve meaning and facts, improve readability and engagement, create natural rhythm.

CONTENT PROTECTION RULES — NEVER MODIFY
Facts, statistics, dates, names, quotes, technical information, product specs, legal language, medical information, user intent, SEO keywords. Only improve style, flow, readability, and naturalness.

NATURAL VARIATION
Mix short, medium, and long sentences. Vary sentence openings. Allow occasional fragments. Use natural pacing.

PUNCTUATION
Minimize em dashes (—). Reduce semicolon and colon overuse. Use commas naturally.

TRANSITIONS
Reduce overuse of: Furthermore, Moreover, Additionally, Consequently, Therefore, In conclusion, Overall, Thus, Hence.
Prefer: "That said,", "At the same time,", "In practice,", "For example,", "One reason is…", or drop the transition entirely.

AI PATTERN REMOVAL
Rewrite repeated sentence openings. Break repeated paragraph structures. Remove predictable phrasing: "It is important to note", "In today's world", "delve", "navigate the landscape", "tapestry", "realm", "In conclusion", "To summarize".

TONE PRESERVATION
Maintain the original tone exactly.

OUTPUT RULES
- Return ONLY the rewritten content.
- Do NOT explain what you changed.
- Do NOT add headers, preambles, sign-offs, or commentary.
- Preserve original formatting (paragraphs, lists, line breaks) unless it conflicts with natural human structure.`;

// --- Post-processing heuristics ---
function normalizePunctuation(text: string): string {
  return text
    .replace(/\s*—\s*/g, ", ") // em dash -> comma
    .replace(/\s*–\s*/g, ", ") // en dash -> comma
    .replace(/;\s+/g, ". ") // chained semicolons -> period
    .replace(/\.{4,}/g, "...") // collapse long ellipses
    .replace(/ {2,}/g, " ")
    .replace(/ \./g, ".")
    .replace(/ ,/g, ",");
}

// Compute a humanizer score (0–100) based on sentence variety, vocab diversity,
// and reduction of common AI tells.
function computeHumanScore(text: string): number {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  if (sentences.length < 2) return 70;

  // Burstiness — stdev of sentence lengths normalized
  const lens = sentences.map((s) => s.split(/\s+/).length);
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length;
  const stdev = Math.sqrt(variance);
  const burstiness = Math.min(1, stdev / 8); // 0..1

  // Vocabulary diversity (type-token ratio over capped sample)
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const sample = words.slice(0, 400);
  const unique = new Set(sample).size;
  const ttr = sample.length > 0 ? unique / sample.length : 0.5; // 0..1

  // AI-cliché penalty
  const cliches = [
    "in conclusion",
    "it is important to note",
    "in today's world",
    "delve into",
    "navigate the landscape",
    "tapestry",
    "furthermore",
    "moreover",
    "additionally",
  ];
  const low = text.toLowerCase();
  const hits = cliches.reduce((n, c) => n + (low.includes(c) ? 1 : 0), 0);
  const clichePenalty = Math.min(20, hits * 4);

  // Sentence-opener repetition penalty
  const openers = sentences.map((s) => (s.trim().split(/\s+/)[0] || "").toLowerCase());
  const openerCounts: Record<string, number> = {};
  openers.forEach((o) => (openerCounts[o] = (openerCounts[o] || 0) + 1));
  const repeats = Object.values(openerCounts).filter((n) => n > 2).length;
  const openerPenalty = Math.min(10, repeats * 3);

  const base = 55 + burstiness * 25 + ttr * 25; // up to ~105
  const score = Math.round(base - clichePenalty - openerPenalty);
  return Math.max(40, Math.min(99, score));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, mode, typoMode } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Please provide at least 20 characters of text." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service is not configured");

    const trimmed = text.slice(0, 30000);
    const styleInstruction = MODE_STYLE[mode as string] || MODE_STYLE.standard;
    const typoInstruction = TYPO_INSTRUCTION[typoMode as string] || TYPO_INSTRUCTION.off;

    const system = `${MASTER_SYSTEM}\n\nACTIVE MODE STYLE: ${styleInstruction}\n\nTYPO MODE: ${typoInstruction}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Humanize the following text. Preserve all facts, names, numbers, quotes, and technical details exactly. Return ONLY the rewritten text — no preface, no notes.\n\n---\n${trimmed}\n---`,
          },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage is temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(
        JSON.stringify({ error: "AI humanizer is temporarily unavailable. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();
    let output: string = data.choices?.[0]?.message?.content ?? "";
    output = normalizePunctuation(output);
    const score = computeHumanScore(output);

    return new Response(JSON.stringify({ output, score }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-humanize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
