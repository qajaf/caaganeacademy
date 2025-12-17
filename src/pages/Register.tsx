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
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Loader2,
  CheckCircle2
} from "lucide-react";
import { z } from "zod";
import caaganelogo from "@/assets/caagane-academy-logo.jpg";
import ThemeToggle from "@/components/ThemeToggle";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  whatsappNumber: z.string().min(6, "Please enter a valid WhatsApp number").max(20),
  country: z.string().min(2, "Please select your country").max(100),
  city: z.string().min(2, "Please enter your city").max(100),
});

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominican Republic",
  "DR Congo", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea",
  "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
  "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    whatsappNumber: "",
    country: "",
    city: "",
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
          })
          .eq("user_id", data.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }
      }

      setSuccess(true);
      toast({
        title: "Waad ku guuleysatay!",
        description: "Akoonkaaga waa la sameeyay. Fadlan sug ansixinta.",
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
          <h1 className="text-3xl font-display font-bold mb-4">Waad ku guuleysatay!</h1>
          <p className="text-muted-foreground mb-6">
            Akoonkaaga waa la sameeyay. Fadlan sug ansixinta admin-ka 
            si aad u hesho casharada. Waad ku soo dhawowdahay Caagane Academy!
          </p>
          <p className="text-sm text-muted-foreground">
            Dib ugu noqosho bogga login-ka...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
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
              Ku soo biir Caagane Academy
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Baro subjects kala duwan. Waxaad heli doontaa 
              casharado, AI tutor, iyo macalin gaar ah.
            </p>
            
            <div className="bg-primary-foreground/10 backdrop-blur-lg rounded-2xl p-6 border border-primary-foreground/20">
              <p className="text-2xl font-display font-bold mb-2">Caagane Academy</p>
              <p className="text-primary-foreground/70">Waxbarasho tayo leh</p>
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
            <img src={caaganelogo} alt="Caagane Academy" className="w-12 h-12 rounded-xl object-cover" />
            <span className="text-2xl font-display font-bold">
              <span className="text-primary">Caagane</span>
              <span className="text-secondary"> Academy</span>
            </span>
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-display font-bold">Samee Akoon</h1>
            <p className="text-muted-foreground mt-2">
              Buuxi macluumaadkaaga si aad u bilaawato
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Magaca Oo Buuxa (Saddex Magac)</Label>
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
              <Label htmlFor="email">Email</Label>
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
                  placeholder="+252 711983546"
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
                <Label htmlFor="country">Wadanka</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleChange("country", value)}
                >
                  <SelectTrigger>
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Dooro wadanka" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Magaalada</Label>
                <Input
                  id="city"
                  placeholder="Mogadishu"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
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
                  Waa la sameynayaa...
                </>
              ) : (
                "Samee Akoon"
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            Akoon ma leedahay?{" "}
            <Link to="/auth" className="text-primary hover:underline font-medium">
              Soo Gal
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
