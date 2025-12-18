import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  BookOpen, 
  Brain, 
  Settings, 
  FileText, 
  LogOut,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string;
  is_approved: boolean;
  language_level: string;
}

interface UserRole {
  role: "admin" | "student";
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<"admin" | "student" | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchUserData();
    }
  }, [user, authLoading, navigate]);

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (roleError) throw roleError;
      setRole((roleData as UserRole)?.role || "student");

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect admin to admin dashboard
  if (role === "admin") {
    navigate("/admin");
    return null;
  }

  // Student not approved
  if (!profile?.is_approved) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-display font-bold">
                  Learn<span className="text-secondary">English</span>
                </span>
              </div>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto text-center"
          >
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-4">
              Account Pending Approval
            </h1>
            <p className="text-muted-foreground mb-8">
              Welcome, <span className="font-semibold text-foreground">{profile?.full_name}</span>! 
              Your account is being reviewed by our admin team. Once approved, you'll have 
              full access to all courses and features.
            </p>
            
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start gap-4 text-left">
                <AlertCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">What happens next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Our admin will review your registration</li>
                    <li>• You'll receive access once approved</li>
                    <li>• Subscription fee: $7/month</li>
                    <li>• Contact WhatsApp: +252711983546</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Approved student dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold">
                Learn<span className="text-secondary">English</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:block">
                Welcome, {profile?.full_name?.split(" ")[0]}
              </span>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back, {profile?.full_name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Your current level: <span className="text-secondary font-medium capitalize">{profile?.language_level?.replace("_", " ")}</span>
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { icon: BookOpen, title: "My Courses", desc: "Continue learning", color: "bg-primary/10 text-primary", href: "/courses" },
            { icon: Brain, title: "AI Tutor", desc: "Practice with AI", color: "bg-secondary/10 text-secondary", href: "/ai-tutor" },
            { icon: FileText, title: "My Notes", desc: "View saved notes", color: "bg-success/10 text-success", href: "/notes" },
            { icon: Settings, title: "Settings", desc: "Profile settings", color: "bg-accent/10 text-accent", href: "/settings" },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className="w-full h-auto p-6 flex flex-col items-start gap-4 card-hover-glow group"
                onClick={() => navigate(item.href)}
              >
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Placeholder for courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-8 text-center"
        >
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold mb-2">Your Courses</h2>
          <p className="text-muted-foreground">
            Start exploring our video lessons and learning materials.
          </p>
          <Button variant="hero" className="mt-4" onClick={() => navigate("/courses")}>
            Browse Courses
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
