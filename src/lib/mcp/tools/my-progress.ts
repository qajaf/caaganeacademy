import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_progress",
  title: "My lesson progress",
  description: "Show the signed-in student's lesson progress and completed lessons.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("student_progress")
      .select("lesson_id, is_completed, completed_at, last_watched_at, lessons(title)")
      .eq("user_id", userId)
      .order("last_watched_at", { ascending: false })
      .limit(200);
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    const progress = (data ?? []).map((p) => {
      const lesson = p.lessons as { title: string } | { title: string }[] | null;
      const title = Array.isArray(lesson) ? lesson[0]?.title ?? null : lesson?.title ?? null;
      return {
        lesson_id: p.lesson_id,
        lesson_title: title,
        is_completed: p.is_completed ?? false,
        completed_at: p.completed_at,
        last_watched_at: p.last_watched_at,
      };
    });
    return { content: [{ type: "text", text: JSON.stringify(progress) }], structuredContent: { progress } };
  },
});
