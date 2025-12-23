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

    console.log("Admin AI query received:", query);

    // Gather database context for AI
    const [
      { data: profiles },
      { data: courses },
      { data: playlists },
      { data: lessons },
      { data: bookings },
      { data: progress },
      { data: courseAccess },
      { data: playlistAccess },
      { data: userRoles }
    ] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("*"),
      supabase.from("playlists").select("*"),
      supabase.from("lessons").select("*"),
      supabase.from("bookings").select("*, available_slots(*)").order("created_at", { ascending: false }).limit(50),
      supabase.from("student_progress").select("*").order("last_watched_at", { ascending: false }),
      supabase.from("student_course_access").select("*"),
      supabase.from("student_playlist_access").select("*"),
      supabase.from("user_roles").select("*")
    ]);

    console.log(`Database context loaded - ${profiles?.length || 0} profiles, ${courses?.length || 0} courses`);

    // Build comprehensive context
    const dbContext = `
CAAGANE ACADEMY DATABASE - FULL ACCESS

📊 SUMMARY STATISTICS:
- Total Registered Students: ${profiles?.length || 0}
- Approved Students: ${profiles?.filter(p => p.is_approved).length || 0}
- Pending Approval: ${profiles?.filter(p => !p.is_approved).length || 0}
- Total Courses: ${courses?.length || 0}
- Published Courses: ${courses?.filter(c => c.is_published).length || 0}
- Total Playlists: ${playlists?.length || 0}
- Total Lessons: ${lessons?.length || 0}
- Published Lessons: ${lessons?.filter(l => l.is_published).length || 0}
- Total Bookings: ${bookings?.length || 0}
- Admin Users: ${userRoles?.filter(r => r.role === 'admin').length || 0}

👥 ALL STUDENTS (${profiles?.length || 0} total):
${profiles?.map((p, i) => {
  const courseAccessCount = courseAccess?.filter(ca => ca.user_id === p.user_id && ca.is_approved).length || 0;
  const playlistAccessCount = playlistAccess?.filter(pa => pa.user_id === p.user_id && pa.is_approved).length || 0;
  const completedLessons = progress?.filter(pr => pr.user_id === p.user_id && pr.is_completed).length || 0;
  const lastActive = progress?.filter(pr => pr.user_id === p.user_id).sort((a, b) => new Date(b.last_watched_at || 0).getTime() - new Date(a.last_watched_at || 0).getTime())[0];
  
  return `${i + 1}. ${p.full_name}
   - Email: ${p.email}
   - Phone/WhatsApp: ${p.whatsapp_number || 'Not provided'}
   - Country: ${p.country || 'Not set'}, City: ${p.city || 'Not set'}
   - Level: ${p.language_level || 'beginner'}
   - Status: ${p.is_approved ? '✅ Approved' : '⏳ Pending'}
   - Subscription: ${p.subscription_status || 'pending'}
   - Joined: ${new Date(p.created_at).toLocaleDateString()}
   - Course Access: ${courseAccessCount} courses, ${playlistAccessCount} playlists
   - Progress: ${completedLessons} lessons completed
   - Last Active: ${lastActive?.last_watched_at ? new Date(lastActive.last_watched_at).toLocaleDateString() : 'Never'}`;
}).join('\n\n') || 'No students'}

📚 ALL COURSES:
${courses?.map((c, i) => {
  const coursePlaylists = playlists?.filter(p => p.course_id === c.id);
  const courseLessons = coursePlaylists?.flatMap(p => lessons?.filter(l => l.playlist_id === p.id) || []);
  const studentsWithAccess = courseAccess?.filter(ca => ca.course_id === c.id && ca.is_approved).length || 0;
  
  return `${i + 1}. ${c.title}
   - Description: ${c.description || 'No description'}
   - Price: $${c.price || 0}
   - Status: ${c.is_published ? '✅ Published' : '📝 Draft'}
   - Playlists: ${coursePlaylists?.length || 0}
   - Lessons: ${courseLessons?.length || 0}
   - Students Enrolled: ${studentsWithAccess}`;
}).join('\n\n') || 'No courses'}

📺 ALL PLAYLISTS:
${playlists?.map((p, i) => {
  const course = courses?.find(c => c.id === p.course_id);
  const playlistLessons = lessons?.filter(l => l.playlist_id === p.id);
  const studentsWithAccess = playlistAccess?.filter(pa => pa.playlist_id === p.id && pa.is_approved).length || 0;
  
  return `${i + 1}. ${p.title}
   - Course: ${course?.title || 'Standalone'}
   - Lessons: ${playlistLessons?.length || 0} (${playlistLessons?.filter(l => l.is_published).length || 0} published)
   - Status: ${p.is_published ? '✅ Published' : '📝 Draft'}
   - Students: ${studentsWithAccess}`;
}).join('\n') || 'No playlists'}

🎬 LESSONS OVERVIEW:
${courses?.map(course => {
  const coursePlaylists = playlists?.filter(p => p.course_id === course.id);
  return coursePlaylists?.map(playlist => {
    const playlistLessons = lessons?.filter(l => l.playlist_id === playlist.id);
    return `
${course.title} > ${playlist.title}:
${playlistLessons?.map((l, i) => `  ${i + 1}. ${l.title} - ${l.is_published ? 'Published' : 'Draft'} - ${l.is_locked ? '🔒 Locked' : '🔓 Unlocked'} - ${l.duration_minutes || 0} min`).join('\n') || '  No lessons'}`;
  }).join('');
}).join('\n')}

📈 STUDENT PROGRESS ANALYTICS:
- Students who completed at least 1 lesson: ${new Set(progress?.filter(p => p.is_completed).map(p => p.user_id)).size}
- Total lessons completed by all students: ${progress?.filter(p => p.is_completed).length || 0}
- Most Active Students:
${(() => {
  const studentCompletions = profiles?.map(profile => ({
    name: profile.full_name,
    email: profile.email,
    completed: progress?.filter(p => p.user_id === profile.user_id && p.is_completed).length || 0,
    lastActive: progress?.filter(p => p.user_id === profile.user_id).sort((a, b) => new Date(b.last_watched_at || 0).getTime() - new Date(a.last_watched_at || 0).getTime())[0]?.last_watched_at
  })).sort((a, b) => b.completed - a.completed).slice(0, 10);
  return studentCompletions?.map((s, i) => `  ${i + 1}. ${s.name} (${s.email}) - ${s.completed} lessons - Last: ${s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'N/A'}`).join('\n');
})()}

📅 RECENT BOOKINGS:
${bookings?.slice(0, 15).map((b, i) => {
  const slot = b.available_slots as any;
  const student = profiles?.find(p => p.user_id === b.user_id);
  return `${i + 1}. ${student?.full_name || 'Unknown'} - ${slot?.slot_date || 'N/A'} ${slot?.start_time || ''}-${slot?.end_time || ''} - Status: ${b.status}`;
}).join('\n') || 'No bookings'}

🔐 ACCESS REQUESTS:
Pending Course Access:
${courseAccess?.filter(ca => !ca.is_approved).map((ca) => {
  const course = courses?.find(c => c.id === ca.course_id);
  const student = profiles?.find(p => p.user_id === ca.user_id);
  return `- ${student?.full_name || 'Unknown'} wants access to "${course?.title || 'Unknown'}"`;
}).join('\n') || 'No pending requests'}

Pending Playlist Access:
${playlistAccess?.filter(pa => !pa.is_approved).map((pa) => {
  const playlist = playlists?.find(p => p.id === pa.playlist_id);
  const student = profiles?.find(p => p.user_id === pa.user_id);
  return `- ${student?.full_name || 'Unknown'} wants access to "${playlist?.title || 'Unknown'}"`;
}).join('\n') || 'No pending requests'}

👑 ADMIN USERS:
${userRoles?.filter(r => r.role === 'admin').map((r) => {
  const admin = profiles?.find(p => p.user_id === r.user_id);
  return `- ${admin?.full_name || 'Unknown'} (${admin?.email || r.user_id})`;
}).join('\n') || 'No admins configured'}

RECENT SIGNUPS (Last 10):
${profiles?.slice(0, 10).map((p, i) => `${i + 1}. ${p.full_name} (${p.email}) - ${new Date(p.created_at).toLocaleDateString()} - ${p.is_approved ? 'Approved' : 'Pending'}`).join('\n')}
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Waxaad tahay AI Caawiye aad u AWOOD BADAN oo loogu talagalay ADMIN-ka Caagane Academy - Platform waxbarasho Ingiriisi ah.

AWOODAHAAGA:
✅ Waxaad helaysaa DATABASE-ka OO DHAN - ardayda, courses, progress, bookings, iwm
✅ Waxaad ka jawaabi kartaa SU'AAL KASTA oo ku saabsan data-ga
✅ Waxaad bixin kartaa statistics, analytics, iyo reports
✅ Waxaad heli kartaa xog gaar ah (tusaale: "Show me students from Somalia")

QAABKA JAWAABAHA:
1. Jawaab luqadda uu isticmaaluhu ku hadlay (Somali ama English)
2. Haddii data la codsado, sii si qurxoon oo list ah
3. Haddii statistics la rabo, sii numbers-ka iyo insights
4. Haddii wax aan database-ka ku jirin la waydiisto, sheeg in aanay jirin
5. Mar walba jawaab si wax ku ool ah oo faahfaahsan

TUSAALOOYINKA SU'AALAHA:
- "Show me the 5 latest students" → List the 5 most recent signups with details
- "How many students from Ethiopia?" → Count and list them
- "Which students completed the most lessons?" → Show top performers
- "List pending access requests" → Show all pending approvals
- "Give me course analytics" → Provide detailed statistics
- "Find student named Ahmed" → Search and show matching students

DATA-GA HADDA:
${dbContext}`;

    console.log("Sending request to AI gateway...");

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
            content: systemPrompt
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

    console.log("AI response received successfully");

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
