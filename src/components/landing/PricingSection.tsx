import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Crown, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const allCourseBenefits = [
  "Dhammaan casharada oo dhan",
  "AI tutor 24/7",
  "PDF iyo files download",
  "Notes personal ah",
  "Progress tracking",
  "Grammar correction",
  "Waligaa la furanyahay",
];

const monthlyBenefits = [
  "Dhammaan casharada oo dhan",
  "AI tutor 24/7",
  "PDF iyo files download",
  "Notes personal ah",
  "Progress tracking",
  "Bil walba lagu bixin karaa",
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
            <span className="text-sm font-medium text-secondary">Qiimaha Fudud</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Maalgeli <span className="text-secondary">Mustaqbalkaaga</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Hel dhammaan casharada oo qiimo fudud ah. 
            Wax qarsoodi ah majiraan.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* All Courses - $33 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative h-full">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-accent blur-3xl opacity-20 rounded-3xl" />
              
              <div className="relative bg-card rounded-3xl border-2 border-accent/30 p-8 shadow-lg h-full flex flex-col">
                {/* Popular badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-accent-foreground rounded-full text-sm font-semibold shadow-accent">
                    <Star className="w-4 h-4 fill-current" />
                    Ugu Fiican
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">Dhammaan Courses</h3>
                  <p className="text-muted-foreground mb-6">Wax kasta waligaa</p>
                  
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl md:text-6xl font-display font-bold">$33</span>
                    <span className="text-xl text-muted-foreground">/waligaa</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8 flex-1">
                  {allCourseBenefits.map((benefit, index) => (
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
                    Bilow Hadda
                  </Link>
                </Button>
                
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Waligaa lagama xiro
                </p>
              </div>
            </div>
          </motion.div>

          {/* Monthly - $16 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative h-full">
              <div className="relative bg-card rounded-3xl border border-border p-8 shadow-lg h-full flex flex-col">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">Bil Walba</h3>
                  <p className="text-muted-foreground mb-6">Bil kastahoorteeda</p>
                  
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl md:text-6xl font-display font-bold">$16</span>
                    <span className="text-xl text-muted-foreground">/bil</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8 flex-1">
                  {monthlyBenefits.map((benefit, index) => (
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
                
                <Button variant="outline" size="xl" className="w-full" asChild>
                  <Link to="/register">
                    Bilow Hadda
                  </Link>
                </Button>
                
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Bil kasta lagu cusboonaysiin karaa
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
