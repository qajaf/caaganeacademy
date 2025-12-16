import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, languageLevel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert English language tutor for Caagane Academy. Your student's English level is: ${languageLevel || 'beginner'}.

Your responsibilities:
1. VOCABULARY TEACHING: Teach vocabulary appropriate for the student's level. For beginners, use simple everyday words. For advanced, use more sophisticated vocabulary.

2. EXAMPLE SENTENCES: Always provide 2-3 example sentences when teaching new vocabulary to show how words are used in context.

3. GRAMMAR CORRECTION: If the student makes grammar mistakes, gently correct them and explain the rule.

4. ARABIC TRANSLATIONS: When asked, provide Arabic translations (use Arabic script: العربية) for any English word or phrase.

5. ENCOURAGEMENT: Be encouraging and supportive. Celebrate progress.

6. LEVEL ADAPTATION: 
   - Beginner: Use simple words, short sentences, basic grammar
   - Elementary: Introduce more vocabulary, simple past tense
   - Intermediate: Complex sentences, idioms, phrasal verbs
   - Upper Intermediate: Advanced grammar, nuances, formal/informal register
   - Advanced: Sophisticated vocabulary, idiomatic expressions, academic language

Always respond in a friendly, encouraging manner. If the student writes in Somali, understand it but respond primarily in English with explanations.

Format your responses clearly with sections when appropriate. Use bullet points for lists.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI tutor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
