import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch courses data for AI context
    let coursesContext = "";
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Fetch courses with their details
        const { data: courses } = await supabase
          .from("courses")
          .select(`
            id,
            title,
            description,
            price,
            features,
            playlists (
              id,
              title,
              lessons (
                id,
                title,
                duration_minutes
              )
            )
          `)
          .eq("is_published", true);

        if (courses && courses.length > 0) {
          coursesContext = `\n\nCAGAANE ACADEMY COURSE INFORMATION:\n`;
          courses.forEach((course: any) => {
            coursesContext += `\n📚 Course: ${course.title}\n`;
            coursesContext += `   Description: ${course.description || 'No description'}\n`;
            coursesContext += `   Price: $${course.price || 7}/month\n`;
            if (course.features && course.features.length > 0) {
              coursesContext += `   Features: ${course.features.join(', ')}\n`;
            }
            if (course.playlists && course.playlists.length > 0) {
              const totalLessons = course.playlists.reduce((acc: number, p: any) => 
                acc + (p.lessons?.length || 0), 0);
              const totalMinutes = course.playlists.reduce((acc: number, p: any) => 
                acc + (p.lessons?.reduce((a: number, l: any) => a + (l.duration_minutes || 0), 0) || 0), 0);
              coursesContext += `   Total Playlists: ${course.playlists.length}\n`;
              coursesContext += `   Total Lessons: ${totalLessons}\n`;
              coursesContext += `   Total Duration: ${totalMinutes} minutes\n`;
              coursesContext += `   Playlists:\n`;
              course.playlists.forEach((playlist: any) => {
                coursesContext += `     - ${playlist.title} (${playlist.lessons?.length || 0} lessons)\n`;
              });
            }
          });
          coursesContext += `\nTeacher: Macalin Caagane (Caagane Academy founder)\n`;
          coursesContext += `Contact WhatsApp: +252711983546\n`;
          coursesContext += `Website: Caagane Academy - Online learning platform for Somali students\n`;
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    }

    const systemPrompt = `You are an expert AI assistant for Caagane Academy, a Somali online learning platform. Your student's English level is: ${languageLevel || 'beginner'}.

Your responsibilities:

1. COURSE INFORMATION: You can answer questions about Caagane Academy courses, prices, lessons, and what students will learn. Use the course information provided below.

2. VOCABULARY TEACHING: Teach vocabulary appropriate for the student's level. For beginners, use simple everyday words. For advanced, use more sophisticated vocabulary.

3. EXAMPLE SENTENCES: Always provide 2-3 example sentences when teaching new vocabulary to show how words are used in context.

4. GRAMMAR CORRECTION: If the student makes grammar mistakes, gently correct them and explain the rule.

5. ARABIC TRANSLATIONS: When asked, provide Arabic translations (use Arabic script: العربية) for any English word or phrase.

6. ENCOURAGEMENT: Be encouraging and supportive. Celebrate progress.

7. LEVEL ADAPTATION: 
   - Beginner: Use simple words, short sentences, basic grammar
   - Elementary: Introduce more vocabulary, simple past tense
   - Intermediate: Complex sentences, idioms, phrasal verbs
   - Upper Intermediate: Advanced grammar, nuances, formal/informal register
   - Advanced: Sophisticated vocabulary, idiomatic expressions, academic language

8. TEACHER RECOMMENDATION: When students ask about courses or the teacher, mention Macalin Caagane, the founder and main instructor at Caagane Academy.

Always respond in a friendly, encouraging manner. If the student writes in Somali, understand it but respond primarily in English with explanations. You can mix Somali for clarifications when helpful.

Format your responses clearly with sections when appropriate. Use bullet points for lists.
${coursesContext}`;

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
