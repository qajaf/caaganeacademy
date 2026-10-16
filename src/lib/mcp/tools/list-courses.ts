import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_courses",
  title: "List courses",
  description: "List published Caagane Academy courses with price, instructor and free status.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, description, instructor_name, price, is_free")
      .eq("is_published", true)
      .order("order_index")
      .limit(100);
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    const courses = (data ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      instructor: c.instructor_name,
      price: c.price,
      is_free: c.is_free ?? false,
    }));
    return { content: [{ type: "text", text: JSON.stringify(courses) }], structuredContent: { courses } };
  },
});
