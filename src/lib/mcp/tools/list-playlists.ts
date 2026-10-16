import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_playlists",
  title: "List playlists in a course",
  description: "List the playlists of a course.",
  inputSchema: { course_id: z.string().uuid().describe("Course ID.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ course_id }, ctx) => {
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("playlists")
      .select("id, title, description")
      .eq("course_id", course_id)
      .order("order_index")
      .limit(100);
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    const playlists = (data ?? []).map((p) => ({ id: p.id, title: p.title, description: p.description }));
    return { content: [{ type: "text", text: JSON.stringify(playlists) }], structuredContent: { playlists } };
  },
});
