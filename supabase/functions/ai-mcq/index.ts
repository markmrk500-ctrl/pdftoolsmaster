import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface McqRequest {
  text: string;
  count?: number;
  provider?: "openai" | "gemini";
  subject?: string;
}

const MODEL_MAP = {
  openai: "openai/gpt-5-mini",
  gemini: "google/gemini-3-flash-preview",
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, count = 10, provider = "gemini" } = (await req.json()) as McqRequest;

    if (!text || typeof text !== "string" || text.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: "Please provide at least 100 characters of source content." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const numQuestions = Math.min(Math.max(Math.floor(count), 5), 50);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const trimmed = text.slice(0, 60000);
    const model = MODEL_MAP[provider] ?? MODEL_MAP.gemini;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert exam writer. Given source content, write high-quality multiple-choice questions. Each question MUST have exactly 4 plausible options, exactly 1 correct answer, and a short explanation grounded in the source. Cover varied topics from the content. Never invent facts not present in the source.",
          },
          {
            role: "user",
            content: `Create ${numQuestions} diverse multiple-choice questions from the following content. Randomize the position of the correct option across questions.\n\nReturn ONLY valid JSON (no markdown, no commentary) shaped exactly as:\n{"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}\n\nSOURCE CONTENT:\n\n${trimmed}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable Cloud → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI request failed." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content: string = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: { questions?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    const rawQs = Array.isArray((parsed as any).questions) ? (parsed as any).questions : [];
    const questions = rawQs
      .filter(
        (q: any) =>
          q &&
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          Number.isInteger(q.correctIndex) &&
          q.correctIndex >= 0 &&
          q.correctIndex < 4
      )
      .map((q: any) => ({
        question: String(q.question),
        options: q.options.map((o: unknown) => String(o)),
        correctIndex: q.correctIndex,
        explanation: typeof q.explanation === "string" ? q.explanation : "",
      }));

    if (questions.length === 0) {
      return new Response(JSON.stringify({ error: "AI returned no valid questions. Try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-mcq error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
