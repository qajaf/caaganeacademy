import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, LogOut, User, MapPin, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import caaganelogo from "@/assets/caagane-academy-logo.jpg";

interface Profile {
  full_name: string;
  email: string;
  language_level: string;
  learning_duration_months: number;
  country: string;
  city: string;
}

const languageLevels = [
  { value: "beginner", label: "Beginner - Bilow" },
  { value: "elementary", label: "Elementary - Aasaasi" },
  { value: "intermediate", label: "Intermediate - Dhexe" },
  { value: "upper_intermediate", label: "Upper Intermediate - Dhexe Sare" },
  { value: "advanced", label: "Advanced - Sare" },
];

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    full_name: string;
    language_level: string;
    learning_duration_months: number;
    country: string;
    city: string;
  }>({
    full_name: "",
    language_level: "beginner",
    learning_duration_months: 0,
    country: "",
    city: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          language_level: data.language_level || "beginner",
          learning_duration_months: data.learning_duration_months || 0,
          country: data.country || "",
          city: data.city || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          language_level: formData.language_level as "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced",
          learning_duration_months: formData.learning_duration_months,
          country: formData.country,
          city: formData.city,
        })
        .eq("user_id", user!.id);

      if (error) throw error;

      toast({
        title: "Waad ku guuleysatay!",
        description: "Macluumaadkaaga waa la kaydiyey",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Khalad",
        description: "Ma kaydin karin macluumaadka",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={caaganelogo} alt="Caagane Academy" className="w-10 h-10 rounded-xl object-cover" />
              <span className="text-xl font-display font-bold">
                <span className="text-primary">Caagane</span>
                <span className="text-secondary"> Academy</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">Wax ka badal macluumaadkaaga</p>

          <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
            {/* Email (Read Only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email-ka lama badali karo</p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Magaca Oo Buuxa</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Magacaaga"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Language Level */}
            <div className="space-y-2">
              <Label>Heerka Luuqada</Label>
              <Select
                value={formData.language_level}
                onValueChange={(value: string) => setFormData({ ...formData, language_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Dooro heerkaaga" />
                </SelectTrigger>
                <SelectContent>
                  {languageLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Learning Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Intee bil ayaad baranaysay English? (bil)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.learning_duration_months}
                onChange={(e) =>
                  setFormData({ ...formData, learning_duration_months: parseInt(e.target.value) || 0 })
                }
                placeholder="6"
              />
            </div>

            {/* Country & City */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Wadanka</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Somalia"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Magaalada</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Mogadishu"
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Kaydi Isbedelka
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
