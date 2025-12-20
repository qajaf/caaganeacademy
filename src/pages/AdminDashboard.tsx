import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminStudents from "@/components/admin/AdminStudents";
import AdminCourses from "@/components/admin/AdminCourses";
import AdminCourseAccess from "@/components/admin/AdminCourseAccess";
import AdminPlaylistAccess from "@/components/admin/AdminPlaylistAccess";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminStudentProgress from "@/components/admin/AdminStudentProgress";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminDictionary from "@/components/admin/AdminDictionary";
import AdminRoles from "@/components/admin/AdminRoles";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      checkAdminRole();
    }
  }, [user, authLoading, navigate]);

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin role:", error);
      navigate("/dashboard");
    }
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />;
      case "courses":
        return <AdminCourses />;
      case "students":
        return <AdminStudents />;
      case "progress":
        return <AdminStudentProgress />;
      case "access":
        return <AdminCourseAccess />;
      case "playlist-access":
        return <AdminPlaylistAccess />;
      case "dictionary":
        return <AdminDictionary />;
      case "roles":
        return <AdminRoles />;
      case "notifications":
        return <AdminNotifications />;
      case "bookings":
        return <AdminBookings />;
      case "settings":
        return (
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      default:
        return <AdminOverview />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminDashboard;
