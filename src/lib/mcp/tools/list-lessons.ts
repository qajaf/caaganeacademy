import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_lessons",
  title: "List lessons in a playlist",
  description: "List published lesson titles in a playlist that the signed-in user can see.",
  inputSchema: { playlist_id: z.string().uuid().describe("Playlist ID.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ playlist_id }, ctx) => {
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("lessons")
      .select("id, title, description, duration_minutes, is_locked, unlock_date")
      .eq("playlist_id", playlist_id)
      .eq("is_published", true)
      .order("order_index")
      .limit(200);
    if (error) throw new ToolError(error.message);
    const lessons = (data ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      duration_minutes: l.duration_minutes,
      is_locked: l.is_locked ?? false,
      unlock_date: l.unlock_date,
    }));
    return { content: [{ type: "text", text: JSON.stringify(lessons) }], structuredContent: { lessons } };
  },
});
