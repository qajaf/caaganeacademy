import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  "Access to all video lessons",
  "AI-powered chatbot tutor",
  "Downloadable PDF resources",
  "Personal notes & vocabulary tracker",
  "Progress tracking dashboard",
  "Book live sessions with teacher",
  "Grammar correction & translation",
  "New vocabulary lessons daily",
];

const PricingSection = () => {
  return (
    <section className="py-24 relative" id="pricing">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full border border-secondary/20 mb-6">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">Simple, Affordable Pricing</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Invest in Your <span className="text-secondary">Future</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Get full access to everything for one simple monthly price. 
            No hidden fees, cancel anytime.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-accent blur-3xl opacity-20 rounded-3xl" />
            
            <div className="relative bg-card rounded-3xl border-2 border-accent/30 p-8 md:p-10 shadow-lg">
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-accent-foreground rounded-full text-sm font-semibold shadow-accent">
                  <Star className="w-4 h-4 fill-current" />
                  Most Popular
                </div>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-display font-bold mb-2">Full Access</h3>
                <p className="text-muted-foreground mb-6">Everything you need to succeed</p>
                
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl md:text-6xl font-display font-bold">$7</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>
              
              <Button variant="hero" size="xl" className="w-full" asChild>
                <Link to="/register">
                  Get Started Now
                </Link>
              </Button>
              
              <p className="text-center text-sm text-muted-foreground mt-4">
                Cancel anytime • No commitment
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
