import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, userId } = await req.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleError || roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather database context for AI
    const [
      { data: profiles },
      { data: courses },
      { data: playlists },
      { data: lessons },
      { data: bookings },
      { data: dictionary },
      { data: progress },
      { data: courseAccess },
      { data: playlistAccess }
    ] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("courses").select("*"),
      supabase.from("playlists").select("*"),
      supabase.from("lessons").select("*"),
      supabase.from("bookings").select("*, available_slots(*)").order("created_at", { ascending: false }).limit(50),
      supabase.from("dictionary").select("*"),
      supabase.from("student_progress").select("*").order("last_watched_at", { ascending: false }).limit(100),
      supabase.from("student_course_access").select("*"),
      supabase.from("student_playlist_access").select("*")
    ]);

    const dbContext = `
Database Summary:
- Total Students: ${profiles?.length || 0}
- Total Courses: ${courses?.length || 0}
- Total Playlists: ${playlists?.length || 0}
- Total Lessons: ${lessons?.length || 0}
- Total Bookings: ${bookings?.length || 0}
- Dictionary Words: ${dictionary?.length || 0}

Recent Students (last 10):
${profiles?.slice(0, 10).map((p, i) => `${i + 1}. ${p.full_name} (${p.email}) - Joined: ${new Date(p.created_at).toLocaleDateString()} - Approved: ${p.is_approved}`).join('\n') || 'No students'}

All Courses:
${courses?.map((c, i) => `${i + 1}. ${c.title} - Published: ${c.is_published} - Price: $${c.price || 0}`).join('\n') || 'No courses'}

All Playlists:
${playlists?.map((p, i) => `${i + 1}. ${p.title} - Published: ${p.is_published}`).join('\n') || 'No playlists'}

Recent Bookings (last 10):
${bookings?.slice(0, 10).map((b, i) => {
  const slot = b.available_slots as any;
  return `${i + 1}. ${slot?.slot_date || 'N/A'} ${slot?.start_time || ''}-${slot?.end_time || ''} - Status: ${b.status}`;
}).join('\n') || 'No bookings'}

Course Access Requests:
${courseAccess?.slice(0, 20).map((ca) => {
  const course = courses?.find(c => c.id === ca.course_id);
  const student = profiles?.find(p => p.user_id === ca.user_id);
  return `- ${student?.full_name || 'Unknown'} -> ${course?.title || 'Unknown'}: ${ca.is_approved ? 'Approved' : 'Pending'}`;
}).join('\n') || 'No access requests'}

Student Progress Summary:
${(() => {
  const completedLessons = progress?.filter(p => p.is_completed).length || 0;
  const activeStudents = new Set(progress?.map(p => p.user_id)).size;
  return `- Active students learning: ${activeStudents}\n- Completed lessons: ${completedLessons}`;
})()}

Full Student Data (for queries):
${JSON.stringify(profiles?.slice(0, 50), null, 2)}
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Waxaad tahay AI caawiye aad u awood badan oo u shaqeeya Admin-ka Caagane Academy. 
Waxaad helaysaa xog buuxda oo ku saabsan database-ka.
Jawaab si Somali ah ama English - sida uu su'aasha u weydiiyo.
Haddii la waydiisto xog gaar ah (tusaale: "5 arday ee ugu dambeeya"), sii xogta si qurxoon.
Haddii la codsado wax aan jirin database-ka, sheeg in aanay jirin.
Ka jawaab su'aalaha si wax ku ool ah, gaar ah, oo cad.

${dbContext}`
          },
          {
            role: "user",
            content: query
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Ma heli karo jawaab. Fadlan isku day mar kale.";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
