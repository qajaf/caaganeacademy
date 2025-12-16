import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">
              Learn<span className="text-secondary">English</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors animated-underline">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors animated-underline">
              Pricing
            </a>
            <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors animated-underline">
              Sign In
            </Link>
            <Button variant="hero" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <a 
                href="#features" 
                onClick={() => setIsOpen(false)}
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                onClick={() => setIsOpen(false)}
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              <Link 
                to="/auth" 
                onClick={() => setIsOpen(false)}
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
