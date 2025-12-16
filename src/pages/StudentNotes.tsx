import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, FileText } from "lucide-react";

const StudentNotes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-display font-bold mb-4">My Notes</h1>
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <FileText className="w-12 h-12 text-success mx-auto mb-4" />
        <p className="text-muted-foreground">Personal notes feature coming soon!</p>
      </div>
    </div>
  );
};

export default StudentNotes;
