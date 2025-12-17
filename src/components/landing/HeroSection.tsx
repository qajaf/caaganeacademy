import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-learning.jpg";
import caaganelogo from "@/assets/caagane-academy-logo.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pattern-dots opacity-50" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-blob animation-delay-200" />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Ku soo dhawoow Caagane Academy</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
              Baro <span className="gradient-text">Xirfadaha</span> Cusub
              <span className="text-secondary"> Online</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl">
              Baro English, Xisaab, Computer Skills, Graphic Design iyo wax badan. 
              Macallin takhasus leh, cashar fiican, iyo AI tutor oo ku caawiya barashada.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/register">
                  <GraduationCap className="w-5 h-5" />
                  Bilow Hadda - $7/bilaha
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/auth">
                  Haddii aad xubin tahay? Soo gal
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-border">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1"
              >
                <p className="text-3xl font-display font-bold text-primary">4+</p>
                <p className="text-sm text-muted-foreground">Courses</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-1"
              >
                <p className="text-3xl font-display font-bold text-secondary">500+</p>
                <p className="text-sm text-muted-foreground">Casharood</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-1"
              >
                <p className="text-3xl font-display font-bold text-accent">AI</p>
                <p className="text-sm text-muted-foreground">Tutor</p>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-accent rounded-2xl rotate-12 opacity-80" />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-primary rounded-2xl -rotate-12 opacity-80" />
              
              {/* Main image */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={heroImage}
                  alt="Students learning at Caagane Academy"
                  className="w-full h-auto object-cover"
                />
              </div>
              
              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -left-8 top-1/4 glass rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Courses</p>
                    <p className="text-xs text-muted-foreground">English, Xisaab...</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute -right-8 bottom-1/4 glass rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Live Support</p>
                    <p className="text-xs text-muted-foreground">WhatsApp: +252711983546</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
