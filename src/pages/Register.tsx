import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  Loader2,
  CheckCircle2
} from "lucide-react";
import { z } from "zod";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  whatsappNumber: z.string().min(6, "Please enter a valid WhatsApp number").max(20),
  country: z.string().min(2, "Please enter your country").max(100),
  city: z.string().min(2, "Please enter your city").max(100),
  languageLevel: z.enum(["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"]),
  learningDuration: z.number().min(0).max(600),
});

const languageLevels = [
  { value: "beginner", label: "Beginner - Just starting out" },
  { value: "elementary", label: "Elementary - Basic phrases" },
  { value: "intermediate", label: "Intermediate - Can hold conversations" },
  { value: "upper_intermediate", label: "Upper Intermediate - Good fluency" },
  { value: "advanced", label: "Advanced - Near fluent" },
];

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    whatsappNumber: "",
    country: "",
    city: "",
    languageLevel: "beginner" as const,
    learningDuration: 0,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Sign up with metadata
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional info
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.fullName,
            whatsapp_number: formData.whatsappNumber,
            country: formData.country,
            city: formData.city,
            language_level: formData.languageLevel,
            learning_duration_months: formData.learningDuration,
          })
          .eq("user_id", data.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }
      }

      setSuccess(true);
      toast({
        title: "Registration Successful!",
        description: "Your account is pending approval. You'll receive access once approved.",
      });

      setTimeout(() => {
        navigate("/auth");
      }, 3000);

    } catch (error: unknown) {
      const err = error as { message?: string };
      let message = "An error occurred during registration";
      if (err.message?.includes("already registered")) {
        message = "This email is already registered. Please sign in instead.";
      }
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-4">Registration Complete!</h1>
          <p className="text-muted-foreground mb-6">
            Your account has been created successfully. Please wait for admin approval 
            to access your courses. We'll notify you once approved.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to sign in...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Decoration */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-20" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-blob animation-delay-200" />
        
        <div className="relative z-10 text-center text-primary-foreground max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-4xl font-display font-bold mb-4">
              Start Your English Journey
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join thousands of learners mastering English with our AI-powered 
              platform and expert guidance.
            </p>
            
            <div className="bg-primary-foreground/10 backdrop-blur-lg rounded-2xl p-6 border border-primary-foreground/20">
              <p className="text-3xl font-display font-bold mb-2">$7/month</p>
              <p className="text-primary-foreground/70">Full access to all features</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg space-y-6"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 justify-center">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold">
              Learn<span className="text-secondary">English</span>
            </span>
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-display font-bold">Create Account</h1>
            <p className="text-muted-foreground mt-2">
              Fill in your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name (Three Names)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Mohamed Cabdiftaax Caagane"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="whatsapp"
                  placeholder="+252 626966559"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleChange("whatsappNumber", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Country & City */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="country"
                    placeholder="Somalia"
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Mogadishu"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Language Level */}
            <div className="space-y-2">
              <Label>Current English Level</Label>
              <Select
                value={formData.languageLevel}
                onValueChange={(value) => handleChange("languageLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your level" />
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
              <Label htmlFor="duration">How long have you been learning English? (months)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  placeholder="6"
                  value={formData.learningDuration || ""}
                  onChange={(e) => handleChange("learningDuration", parseInt(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
