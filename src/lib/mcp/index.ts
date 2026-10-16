import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCourses from "./tools/list-courses";
import listPlaylists from "./tools/list-playlists";
import listLessons from "./tools/list-lessons";
import myProgress from "./tools/my-progress";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "fluent-hub",
  title: "Fluent Hub",
  version: "0.1.0",
  instructions:
    "Tools for Caagane Academy. Browse courses, playlists and lessons, and read the signed-in student's progress.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCourses, listPlaylists, listLessons, myProgress],
});
